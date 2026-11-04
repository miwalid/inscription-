export const normalizeRegistrationCode=(value:string)=>value.toUpperCase().replace(/[\s-]/g,'');
export const formatRegistrationCode=(value?:string)=>value?value.match(/.{1,4}/g)?.join('-')||value:'';
