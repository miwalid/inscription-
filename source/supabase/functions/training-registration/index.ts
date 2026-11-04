import {handleBadgePhoto} from './badge-photo.ts';
import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
const publishable='sb_publishable_LnRL8UGGU1pu_i46odcGQg_4qnRte3W';
const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey, authorization, content-type, x-client-info','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store'};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
const isPortraitLabel=(name:string)=>/(?:صورة\s*(?:حديثة|شخصية|فوتوغرافية)|الصورة\s*(?:الحديثة|الشخصية)|^صورة$|^photo(?:\s|$)|portrait)/i.test(name.normalize('NFKC'));
const isUuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
async function sha256(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(n=>n.toString(16).padStart(2,'0')).join('')}
async function validFile(file:File){const b=new Uint8Array(await file.slice(0,16).arrayBuffer());if(file.type==='application/pdf')return new TextDecoder().decode(b.slice(0,5))==='%PDF-';if(file.type==='image/png')return [137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v);if(file.type==='image/jpeg')return b[0]===255&&b[1]===216&&b[2]===255;if(file.type==='image/webp')return new TextDecoder().decode(b.slice(0,4))==='RIFF'&&new TextDecoder().decode(b.slice(8,12))==='WEBP';return false}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.headers.get('apikey')!==publishable)return json({error:'مفتاح التطبيق غير صالح'},401);
 try{
 const url=new URL(req.url);
 if(req.method==='GET'){
 const id=url.searchParams.get('stage')||'';if(!isUuid(id))return json({error:'رابط التربص غير صالح'},400);
 const {data,error}=await client.from('training_stages').select('id,title,description,place,start,end,closed,docs').eq('id',id).maybeSingle();if(error)throw error;if(!data)return json({error:'التربص غير موجود'},404);return json(data);
 }
 if(req.method!=='POST')return json({error:'طلب غير صالح'},405);
 if(url.searchParams.get('mode')==='badge-photo')return await handleBadgePhoto(req,client,json,validFile);
 if(url.searchParams.get('mode')==='bootstrap'){
 const body=await req.json();const hash=await sha256(String(body.token||''));
 const {data:setup,error:err}=await client.from('training_bootstrap').update({used_at:new Date().toISOString()}).eq('id',true).eq('token_hash',hash).is('used_at',null).gt('expires_at',new Date().toISOString()).select('email').maybeSingle();
 if(err)throw err;if(!setup)return json({error:'الرابط غير صالح أو تم استعماله'},403);
 const {data,error}=await client.auth.admin.generateLink({type:'invite',email:setup.email});
 if(error){await client.from('training_bootstrap').update({used_at:null}).eq('id',true).eq('token_hash',hash);throw error}
 const {error:adminError}=await client.from('training_admins').insert({singleton:true,user_id:data.user.id});if(adminError)throw adminError;
 return json({token_hash:data.properties.hashed_token,type:'invite',user_id:data.user.id,email:setup.email});
 }
 const declared=Number(req.headers.get('content-length')||0);if(declared>27*1024*1024)return json({error:'الحجم الإجمالي الأقصى 25 MB'},413);
 const f=await req.formData();const stageId=String(f.get('stageId')||'');if(!isUuid(stageId))return json({error:'التربص غير صالح'},400);
 const {data:stage,error:stageError}=await client.from('training_stages').select('id,closed,docs,fee').eq('id',stageId).maybeSingle();if(stageError)throw stageError;if(!stage)return json({error:'التربص غير موجود'},404);if(stage.closed)return json({error:'التسجيل مغلق لهذا التربص'},400);
 const firstName=String(f.get('firstName')||'').normalize('NFKC').trim().replace(/\s+/g,' '),lastName=String(f.get('lastName')||'').normalize('NFKC').trim().replace(/\s+/g,' '),phone=String(f.get('phone')||'').replace(/[\s-]/g,''),birth=String(f.get('birth')||'');
 if(!firstName||firstName.length>80||!lastName||lastName.length>80||!/^\+?[0-9]{8,15}$/.test(phone)||!/^\d{4}-\d{2}-\d{2}$/.test(birth)||Number.isNaN(Date.parse(birth))||birth<'1900-01-01'||birth>new Date().toISOString().slice(0,10))return json({error:'تحقق من الاسم ورقم الهاتف وتاريخ الولادة'},400);
 const gender=String(f.get('gender')||'');if(!['male','female'].includes(gender))return json({error:'اختر الجنس: ذكر أو أنثى، ثم أرسل الترشح.'},400);
 const id=crypto.randomUUID(),files:Array<{key:string,name:string,filename:string,type:string,role?:string,file:File}>=[];let total=0;
 for(const [i,d] of stage.docs.entries()){
 const file=f.get('doc'+i);if(!(file instanceof File)||!file.size){if(d.required)return json({error:'الوثيقة مطلوبة: '+d.name},400);continue}
 if(file.size>5*1024*1024||!await validFile(file))return json({error:'الوثيقة غير صالحة: '+d.name+'. المقبول PDF أو JPG أو PNG أو WEBP، حتى 5 MB.'},400);
 if(isPortraitLabel(d.name)&&!file.type.startsWith('image/'))return json({error:'يجب أن تكون الصورة الشخصية بصيغة JPG أو PNG أو WEBP.'},400);
 total+=file.size;if(total>25*1024*1024)return json({error:'الحجم الإجمالي الأقصى 25 MB'},400);
 files.push({key:id+'/'+crypto.randomUUID(),name:d.name,filename:file.name.slice(0,200),type:file.type,role:isPortraitLabel(d.name)?'portrait':undefined,file});
 }
 const photo=f.get('badgePhoto');if(photo instanceof File&&photo.size){
 if(photo.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(photo.type)||!await validFile(photo))return json({error:'اختر صورة JPG أو PNG أو WEBP لا تتجاوز 5 MB.'},400);
 total+=photo.size;if(total>25*1024*1024||files.length>=15)return json({error:'تجاوز الملف الحد الأقصى للوثائق أو الحجم الإجمالي 25 MB.'},400);
 // Prefer the explicitly supplied badge portrait over a named proof document.
 files.forEach(file=>{delete file.role});files.push({key:id+'/'+crypto.randomUUID(),name:'صورة البطاقة',filename:photo.name.slice(0,200),type:photo.type,role:'portrait',file:photo});
 }
 const uploaded:string[]=[];
 try{
 for(const x of files){const {error}=await client.storage.from('training-documents').upload(x.key,x.file,{contentType:x.type,upsert:false});if(error)throw error;uploaded.push(x.key)}
 const record={id,stage_id:stageId,firstName,lastName,phone,birth,gender,fee:stage.fee,decision:'pending',paid:false,present:false,files:files.map(({file,...x})=>x)};
 const {data:registered,error}=await client.from('training_applicants').insert(record).select('personal_code').single();if(error){if(error.code==='23505')throw Error('تم تسجيل هذا المترشح سابقاً في هذا التربص');throw error}
 return json({ok:true,personal_code:registered!.personal_code});
 }catch(e){if(uploaded.length)await client.storage.from('training-documents').remove(uploaded);throw e}
 }catch(e:any){const known=String(e.message||'');if(/[\u0600-\u06ff]/.test(known))return json({error:known},400);console.error('registration failure',e.code||e.name||'error');return json({error:'تعذر إتمام العملية. حاول مرة أخرى.'},500)}
});
