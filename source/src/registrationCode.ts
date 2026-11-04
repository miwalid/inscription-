export const normalizeRegistrationCode=(value:string)=>value.toUpperCase().replace(/[\s-]/g,'');
export const formatRegistrationCode=(value?:string)=>value?value.match(/.{1,4}/g)?.join('-')||value:'';
export function registrationQrUrl(code:string,baseUrl:string){const normalized=normalizeRegistrationCode(code);if(!/^[A-F0-9]{12}$/.test(normalized))throw Error('الرمز الشخصي غير صالح.');const url=new URL(baseUrl);url.search='';url.hash='';url.searchParams.set('admin','1');url.searchParams.set('code',normalized);return url.href}

export function scannedRegistrationCode(value:string,baseUrl:string):string|null{
 const raw=normalizeRegistrationCode(value.trim());if(/^[A-F0-9]{12}$/.test(raw))return raw;
 try{const url=new URL(value.trim()),base=new URL(baseUrl);if(url.origin!==base.origin||url.pathname!==base.pathname||url.username||url.password||url.searchParams.get('admin')!=='1'||url.searchParams.getAll('code').length!==1)return null;const code=normalizeRegistrationCode(url.searchParams.get('code')||'');return /^[A-F0-9]{12}$/.test(code)?code:null}catch{return null}
}
