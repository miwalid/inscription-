export type BadgeFile={key:string;name:string;filename?:string;type:string;role?:string};
export const isPortraitLabel=(name:string)=>/(?:صورة\s*(?:حديثة|شخصية|فوتوغرافية)|الصورة\s*(?:الحديثة|الشخصية)|^صورة$|^photo(?:\s|$)|portrait)/i.test(name.normalize('NFKC'));
export const isBadgeImage=(file:BadgeFile)=>['image/jpeg','image/png','image/webp'].includes(file.type);
export function portraitKey(files:BadgeFile[]=[]){return files.find(f=>isBadgeImage(f)&&f.role==='portrait')?.key||files.find(f=>isBadgeImage(f)&&isPortraitLabel(f.name))?.key||''}

export function printableBadgeEntries<T extends {person:{id:string}}>(entries:T[],photos:Record<string,{url?:string;error?:boolean}>,readyOnly:boolean){return readyOnly?entries.filter(e=>photos[e.person.id]?.url&&!photos[e.person.id]?.error):entries}
