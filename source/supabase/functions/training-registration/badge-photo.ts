// A photo can be changed only by the approved owner of the dossier's stage.
export async function handleBadgePhoto(req:Request,client:any,json:(data:unknown,status?:number)=>Response,validFile:(file:File)=>Promise<boolean>){
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];if(!token)return json({error:'سجّل الدخول إلى حساب المنظم.'},401);
 const {data:auth,error:authError}=await client.auth.getUser(token);if(authError||!auth.user)return json({error:'سجّل الدخول إلى حساب المنظم.'},401);
 const {data:admin,error:adminError}=await client.from('training_admins').select('user_id').eq('user_id',auth.user.id).maybeSingle();if(adminError)throw adminError;if(!admin)return json({error:'غير مسموح لهذا الحساب.'},403);
 if(Number(req.headers.get('content-length')||0)>6*1024*1024)return json({error:'الحجم الأقصى للصورة 5 MB.'},413);
 const form=await req.formData(),id=String(form.get('applicantId')||'');if(!/^[0-9a-f-]{36}$/i.test(id))return json({error:'الملف غير متاح.'},404);
 const {data:person,error:personError}=await client.from('training_applicants').select('id,stage_id,files').eq('id',id).is('deleted_at',null).maybeSingle();if(personError)throw personError;if(!person)return json({error:'الملف غير متاح.'},404);
 const {data:stage,error:stageError}=await client.from('training_stages').select('id').eq('id',person.stage_id).eq('owner_id',auth.user.id).maybeSingle();if(stageError)throw stageError;if(!stage)return json({error:'الملف غير متاح.'},404);
 const original=person.files||[],files=original.map(({role,...file}:any)=>role&&role!=='portrait'?{...file,role}:file);const key=String(form.get('fileKey')||'');let uploaded='';
 const imageTypes=['image/jpeg','image/png','image/webp'];
 if(key){const file=files.find((f:any)=>f.key===key&&imageTypes.includes(f.type));if(!file)return json({error:'اختر صورة من ملف هذا المشارك.'},400);file.role='portrait'}
 else{
  const file=form.get('photo');if(!(file instanceof File)||!file.size||file.size>5*1024*1024||!imageTypes.includes(file.type)||!await validFile(file))return json({error:'اختر صورة JPG أو PNG أو WEBP لا تتجاوز 5 MB.'},400);
  if(files.length>=15)return json({error:'بلغ الملف الحد الأقصى للوثائق. اختر صورة من الوثائق الموجودة.'},400);
  uploaded=person.id+'/'+crypto.randomUUID();const {error}=await client.storage.from('training-documents').upload(uploaded,file,{contentType:file.type,upsert:false});if(error)throw error;
  files.push({key:uploaded,name:'صورة البطاقة',filename:file.name.slice(0,200),type:file.type,role:'portrait'});
 }
 try{
  // Compare the previous JSON to avoid overwriting a concurrent document/photo change.
  const {data:saved,error}=await client.from('training_applicants').update({files}).eq('id',person.id).eq('files',JSON.stringify(original)).is('deleted_at',null).select('id').maybeSingle();if(error)throw error;if(!saved){if(uploaded)await client.storage.from('training-documents').remove([uploaded]);return json({error:'تغيّر الملف. أعد فتحه وحاول مجدداً.'},409)}
  return json({ok:true,files});
 }catch(error){if(uploaded)await client.storage.from('training-documents').remove([uploaded]);throw error}
}
