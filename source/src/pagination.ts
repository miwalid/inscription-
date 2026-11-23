type Page<T>={data:T[]|null;error:{message:string}|null;count:number|null};
// Advance by the actual page size, including when the server caps it below 500.
// Reject incomplete/changing lists rather than showing partial totals or exports.
export async function loadAllRows<T extends {id:string}>(fetchPage:(from:number,to:number)=>PromiseLike<Page<T>>):Promise<T[]>{
 const rows:T[]=[],ids=new Set<string>();let expected:number|undefined;
 for(;;){
  const {data,error,count}=await fetchPage(rows.length,rows.length+499);
  if(error)throw error;
  if(!data||count===null)throw Error('تعذر تحميل القائمة كاملة. أعد تحميل البيانات.');
  if(expected===undefined)expected=count;
  if(count!==expected||rows.length+data.length>expected||(!data.length&&rows.length<expected))throw Error('تغيرت القائمة أثناء التحميل. أعد تحميل البيانات.');
  for(const row of data){if(ids.has(row.id))throw Error('تغير ترتيب القائمة أثناء التحميل. أعد تحميل البيانات.');ids.add(row.id);rows.push(row)}
  if(rows.length===expected)return rows;
 }
}
