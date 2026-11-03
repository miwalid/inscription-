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
if(path==='/api/manage'&&!init){
 const [stages,people]=await Promise.all([supabase.from('training_stages').select('*').order('created_at',{ascending:false}),supabase.from('training_applicants').select('*').order('created_at',{ascending:false})]);
 if(stages.error)throw stages.error;if(people.error)throw people.error;
 return response({stages:stages.data,applicants:people.data.map(({stage_id,created_at,...a}:any)=>({...a,stageId:stage_id,created:created_at}))});
}
if(path==='/api/manage'&&init){
 const {type,data}=JSON.parse(String(init.body));
 if(type==='stage'){
 const stage={id:data.id||crypto.randomUUID(),title:data.title.trim(),description:data.description||'',place:data.place,start:data.start,end:data.end,fee:Number(data.fee),closed:!!data.closed,docs:data.docs};
 const {error}=await supabase.from('training_stages').upsert(stage).select('id').single();if(error)throw error;
 }else if(type==='applicant'){
 if(data.gender!=null&&!['male','female'].includes(data.gender))throw Error('اختر الجنس: ذكر أو أنثى.');
 const {error}=await supabase.from('training_applicants').update({gender:data.gender??null,decision:data.decision,paid:data.decision==='accepted'&&!!data.paid,present:!!data.present}).eq('id',data.id).is('deleted_at',null).select('id').single();if(error)throw error;
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
