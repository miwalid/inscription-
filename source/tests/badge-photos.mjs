import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const transpile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {handleBadgePhoto}=await import('data:text/javascript;base64,'+Buffer.from(transpile(readFileSync('supabase/functions/training-registration/badge-photo.ts','utf8'))).toString('base64'));
const personId='11111111-1111-4111-8111-111111111111',stageId='22222222-2222-4222-8222-222222222222';
const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0]);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status});
const valid=async f=>Buffer.from(await f.slice(0,8).arrayBuffer()).equals(Buffer.from(png.slice(0,8)));
function fixture({conflict=false,deleted=false,approved=true,count=2}={}){
 const files=[{key:personId+'/old',name:'صورة حديثة',type:'image/png',role:'portrait'},{key:personId+'/proof',name:'نسخة هوية',type:'application/pdf'}];while(files.length<count)files.push({key:personId+'/'+files.length,name:'وثيقة',type:'application/pdf'});
 const db={training_admins:approved?[{user_id:'owner'},{user_id:'other'}]:[],training_stages:[{id:stageId,owner_id:'owner',closed:false,docs:[],fee:30}],training_applicants:[{id:personId,stage_id:stageId,files,deleted_at:deleted?'2026-11-01':null}]};const events={uploads:[],removed:[],updates:0};
 const client={auth:{getUser:async token=>({data:{user:token==='owner-token'?{id:'owner'}:token==='other-token'?{id:'other'}:null},error:null})},storage:{from:()=>({upload:async(key)=>{events.uploads.push(key);return{error:null}},remove:async keys=>{events.removed.push(...keys);return{error:null}}})},from(table){let filters=[],patch,insert;
  const query={select(){return query},eq(key,value){filters.push(row=>key==='files'?JSON.stringify(row[key])===value:row[key]===value);return query},is(key,value){filters.push(row=>row[key]===value);return query},update(value){patch=value;return query},insert(value){insert=value;return query},async maybeSingle(){const row=db[table].find(row=>filters.every(f=>f(row)));if(patch&&row&&!conflict){events.updates++;Object.assign(row,structuredClone(patch))}return{data:row&&(!patch||!conflict)?structuredClone(row):null,error:null}},async single(){if(insert){const row={...insert,personal_code:'ABCDEF123456'};db[table].push(row);return{data:structuredClone(row),error:null}}return query.maybeSingle()}};return query}};
 return{db,client,events};
}
function request(token,{key,photo}={}){const f=new FormData();f.set('applicantId',personId);if(key)f.set('fileKey',key);if(photo)f.set('photo',photo);return new Request('https://example.invalid/?mode=badge-photo',{method:'POST',headers:token?{Authorization:'Bearer '+token}:{},body:f})}
for(const [label,token,options,status] of [['anonymous',null,{},401],['invalid session','bad',{},401],['unapproved organizer','owner-token',{approved:false},403],['other stage owner','other-token',{},404],['deleted dossier','owner-token',{deleted:true},404]]){const f=fixture(options);const r=await handleBadgePhoto(request(token,{key:personId+'/old'}),f.client,json,valid);assert.equal(r.status,status,label);assert.equal(f.events.updates,0);assert.equal(f.events.uploads.length,0)}
console.log('PASS authenticated, approved owner required; foreign and deleted dossiers denied');
for(const key of ['foreign/photo',personId+'/proof']){const f=fixture();assert.equal((await handleBadgePhoto(request('owner-token',{key}),f.client,json,valid)).status,400)}
{const f=fixture();const r=await handleBadgePhoto(request('owner-token',{key:personId+'/old'}),f.client,json,valid);assert.equal(r.status,200);const d=await r.json();assert.equal(d.files.length,2);assert.equal(d.files.filter(x=>x.role==='portrait').length,1);assert.equal(d.files[1].type,'application/pdf')}
console.log('PASS existing portrait selection cannot use another dossier or a PDF');
{const f=fixture();const r=await handleBadgePhoto(request('owner-token',{photo:new File([png],'portrait.png',{type:'image/png'})}),f.client,json,valid);assert.equal(r.status,200);const d=await r.json();assert.equal(d.files.length,3);assert.equal(d.files.filter(x=>x.role==='portrait').length,1);assert.equal(d.files[2].role,'portrait');assert.equal(f.events.removed.length,0);assert.ok(f.events.uploads[0].startsWith(personId+'/'))}
for(const [file,options,status] of [[new File(['not png'],'fake.png',{type:'image/png'}),{},400],[new File(['%PDF-'],'proof.pdf',{type:'application/pdf'}),{},400],[new File([png],'photo.png',{type:'image/png'}),{count:15},400],[new File([png],'photo.png',{type:'image/png'}),{conflict:true},409]]){const f=fixture(options);const r=await handleBadgePhoto(request('owner-token',{photo:file}),f.client,json,valid);assert.equal(r.status,status);if(options.conflict)assert.deepEqual(f.events.removed,f.events.uploads);assert.equal(f.events.updates,0)}
console.log('PASS photo upload preserves proofs, checks format and capacity, cleans up concurrent conflicts');
// Exercise the real public registration handler without network or service credentials.
const source=readFileSync('supabase/functions/training-registration/index.ts','utf8').replace(/^import .*\n/gm,'');
const f=fixture();let serve;new Function('createClient','Deno','handleBadgePhoto',transpile(source))(()=>f.client,{env:{get:()=>''},serve:handler=>{serve=handler}},handleBadgePhoto);
function registration(photo){const form=new FormData();for(const [k,v]of Object.entries({stageId,firstName:'اختبار',lastName:'صورة',phone:'20000000',birth:'2000-01-01',gender:'female'}))form.set(k,v);if(photo)form.set('badgePhoto',photo);return new Request('https://example.invalid/',{method:'POST',headers:{apikey:'sb_publishable_LnRL8UGGU1pu_i46odcGQg_4qnRte3W'},body:form})}
{const r=await serve(registration(new File([png],'portrait.png',{type:'image/png'})));assert.equal(r.status,200);const d=await r.json();assert.equal(d.personal_code,'ABCDEF123456');const row=f.db.training_applicants.at(-1);assert.equal(row.files[0].role,'portrait');assert.equal(row.gender,'female');assert.equal(row.paid,false)}
assert.equal((await serve(registration(new File(['fake'],'fake.png',{type:'image/png'})))).status,400);
f.db.training_stages[0].docs=[{name:'صورة حديثة',required:true}];assert.equal((await serve(registration())).status,400);
console.log('PASS public portrait retained with personal code; corrupt photo and missing required photo rejected');
