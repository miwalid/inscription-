export const normalizeRegistrationCode=(value:string)=>value.toUpperCase().replace(/[\s-]/g,'');
export const formatRegistrationCode=(value?:string)=>value?value.match(/.{1,4}/g)?.join('-')||value:'';
export function registrationQrUrl(code:string,baseUrl:string){const normalized=normalizeRegistrationCode(code);if(!/^[A-F0-9]{12}$/.test(normalized))throw Error('الرمز الشخصي غير صالح.');const url=new URL(baseUrl);url.search='';url.hash='';url.searchParams.set('admin','1');url.searchParams.set('code',normalized);return url.href}
