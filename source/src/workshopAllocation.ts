export type Workshop={name:string;color:string};
export type WorkshopPerson={id:string;stageId:string;firstName:string;lastName:string;gender?:string;decision:string;paid:boolean;deleted_at?:string|null;workshop_index?:number|null};
export type WorkshopScope='accepted'|'confirmed'|'all';
export type WorkshopAssignment={id:string;gender:'male'|'female';workshop_index:number};
export const workshopColors=['#167348','#D13B46','#F1C232','#167D9A','#9B4DAC','#E77926','#638C28','#A83D76','#2862B5','#73513D','#00A399','#DE715F','#8B850F','#6659B0','#518997','#A44F1D','#A180B8','#467254','#B58936','#635B60'];
export function eligibleForWorkshop(p:WorkshopPerson,stageId:string,scope:WorkshopScope){return p.stageId===stageId&&!p.deleted_at&&(scope==='all'||p.decision==='accepted'&&(scope!=='confirmed'||p.paid))}
export function workshopForPerson(person:{workshop_index?:number|null},stage?:{workshops?:Workshop[]}){return person.workshop_index?stage?.workshops?.[person.workshop_index-1]:undefined}
export function workshopTextColor(color:string){const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.179?'#12251b':'#ffffff'}
function shuffled<T>(items:T[],random:()=>number){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const secureRandom=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
// Minimize the count of each gender first, then total occupancy. Both differences stay <= 1.
export function allocateWorkshops(people:WorkshopPerson[],count:number,random:()=>number=secureRandom):WorkshopAssignment[]{
 if(!Number.isInteger(count)||count<1||count>20)throw Error('اختر عدداً بين 1 و20 ورشة.');
 if(!people.length)throw Error('لا يوجد مشاركون مطابقون للاختيار.');
 if(new Set(people.map(p=>p.id)).size!==people.length)throw Error('قائمة المشاركين مكررة.');
 const missing=people.find(p=>!['male','female'].includes(p.gender||''));if(missing)throw Error('حدد الجنس في ملف '+missing.firstName+' '+missing.lastName+' قبل التوزيع.');
 const groups=Array.from({length:count},(_,i)=>({index:i+1,male:0,female:0,total:0})),result:WorkshopAssignment[]=[];
 for(const gender of ['male','female'] as const){for(const person of shuffled(people.filter(p=>p.gender===gender),random)){const group=shuffled(groups,random).sort((a,b)=>a[gender]-b[gender]||a.total-b.total)[0];group[gender]++;group.total++;result.push({id:person.id,gender,workshop_index:group.index})}}
 return result;
}
export function validateWorkshops(workshops:Workshop[]){if(!workshops.length||workshops.length>20)throw Error('اختر عدداً بين 1 و20 ورشة.');if(workshops.some(w=>!w.name.trim()||w.name.trim().length>60||!/^#[0-9a-f]{6}$/i.test(w.color)))throw Error('أكمل أسماء الورشات (حتى 60 حرفاً) وألوانها.');if(new Set(workshops.map(w=>w.name.trim())).size!==workshops.length)throw Error('اختر اسماً مختلفاً لكل ورشة.');if(new Set(workshops.map(w=>w.color.toLowerCase())).size!==workshops.length)throw Error('اختر لوناً مختلفاً لكل ورشة.')}
