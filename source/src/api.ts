import {loadAllRows} from './pagination';
import {normalizeRegistrationCode} from './registrationCode';
import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured=!!url&&!!key;
export const supabase=createClient(url||'https://unconfigured.supabase.co',key||'unconfigured');
const endpoint=()=>url+'/functions/v1/training-registration';
const response=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
export async function request(path:string,init?:RequestInit):Promise<Response>{
try{if(!configured)throw Error('لم يتم ربط التطبيق بمشروع Supabase بعد.');
if(path.startsWith('/api/register')){
 const session=(await supabase.auth.getSession()).data.session;
 const headers:Record<string,string>={apikey:key};if(session)headers.Authorization='Bearer '+session.access_token;
 const query=path.includes('?')?path.slice(path.indexOf('?')):'';
 return fetch(endpoint()+query,{...init,headers:{...headers,...init?.headers},credentials:'omit'});
}
if(path.startsWith('/api/lookup?')&&!init){
 const code=normalizeRegistrationCode(new URLSearchParams(path.split('?')[1]).get('code')||'');
 if(!/^[A-F0-9]{12}$/.test(code))return response({error:'تحقق من الرمز الشخصي: 12 حرفاً أو رقماً.'},400);
 const {data,error}=await supabase.from('training_applicants').select('*,training_stages!inner()').eq('personal_code',code).is('deleted_at',null).is('training_stages.deleted_at',null).maybeSingle();
 if(error)throw error;if(!data)return response({error:'لا يوجد ملف متاح بهذا الرمز ضمن تربصاتك.'},404);
 const {stage_id,created_at,...a}=data;return response({...a,stageId:stage_id,created:created_at});
}
if(path==='/api/manage'&&!init){
 const read=(table:string)=>loadAllRows<any>((from,to)=>supabase.from(table).select('*',{count:'exact'}).order('created_at',{ascending:false}).order('id',{ascending:false}).range(from,to));
 const [stages,people]=await Promise.all([read('training_stages'),read('training_applicants')]);
 return response({stages,applicants:people.map(({stage_id,created_at,...a}:any)=>({...a,stageId:stage_id,created:created_at}))});
}
if(path==='/api/manage'&&init){
 const {type,data}=JSON.parse(String(init.body));
 if(type==='stage'){
 const stage={id:data.id||crypto.randomUUID(),title:data.title.trim(),description:data.description||'',place:data.place,start:data.start,end:data.end,fee:Number(data.fee),closed:!!data.closed,docs:data.docs};
 const {error}=await supabase.from('training_stages').upsert(stage).select('id').single();if(error)throw error;
 }else if(type==='delete_stage'||type==='restore_stage'){
 const deleting=type==='delete_stage';
 const update=supabase.from('training_stages').update({deleted_at:deleting?new Date().toISOString():null}).eq('id',data.id);
 const {data:stage,error}=await (deleting?update.is('deleted_at',null):update.not('deleted_at','is',null)).select('id').maybeSingle();
 if(error)throw error;
 if(!stage)throw Error('التربص غير متاح أو تغيّرت حالته. أعد تحميل الصفحة.');
 }else if(type==='applicant'){
 if(data.gender!=null&&!['male','female'].includes(data.gender))throw Error('اختر الجنس: ذكر أو أنثى.');
 const {error}=await supabase.from('training_applicants').update({gender:data.gender??null,decision:data.decision,paid:!!data.paid}).eq('id',data.id).is('deleted_at',null).select('id').single();if(error)throw error;
 }else if(type==='delete_applicant'||type==='restore_applicant'){
 let q=supabase.from('training_applicants').update({deleted_at:type==='delete_applicant'?new Date().toISOString():null}).eq('id',data.id);
 q=type==='delete_applicant'?q.is('deleted_at',null):q.not('deleted_at','is',null);
 const {error}=await q.select('id').single();if(error)throw error;
 }else throw Error('طلب غير صالح');return response({ok:true});
}throw Error('طلب غير صالح');
}catch(e:any){const code=e?.code;const message=code==='23505'?'تم تسجيل هذا المترشح سابقاً.':code==='PGRST116'?'الملف غير موجود أو لا تملك صلاحية تعديله.':code==='42501'?'غير مسموح لهذا الحساب بالدخول إلى الإدارة.':e.message||'تعذر الاتصال. حاول مرة أخرى.';return response({error:message},400)}
}
export async function signOut(){await supabase.auth.signOut();location.href=location.pathname+'?admin=1'}
export async function openDocument(path:string){const {data,error}=await supabase.storage.from('training-documents').createSignedUrl(path,120);if(error)throw error;const a=document.createElement('a');a.href=data.signedUrl;a.target='_blank';a.rel='noopener noreferrer';a.click()}

export async function downloadBadgePhoto(key:string){const {data,error}=await supabase.storage.from('training-documents').download(key);if(error)throw error;if(!data||!['image/jpeg','image/png','image/webp'].includes(data.type)||data.size>5*1024*1024)throw Error('تعذر تحميل صورة صالحة للبطاقة.');return URL.createObjectURL(data)}
export async function saveBadgePhoto(id:string,source:File|string){const form=new FormData();form.set('applicantId',id);if(typeof source==='string')form.set('fileKey',source);else form.set('photo',source);const r=await request('/api/register?mode=badge-photo',{method:'POST',body:form});const data=await r.json();if(!r.ok)throw Error(data.error);return data.files}
