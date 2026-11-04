export type BadgeFile={key:string;name:string;filename?:string;type:string;role?:string};
export const isPortraitLabel=(name:string)=>/(?:صورة\s*(?:حديثة|شخصية|فوتوغرافية)|الصورة\s*(?:الحديثة|الشخصية)|^صورة$|^photo(?:\s|$)|portrait)/i.test(name.normalize('NFKC'));
export const isBadgeImage=(file:BadgeFile)=>['image/jpeg','image/png','image/webp'].includes(file.type);
export function portraitKey(files:BadgeFile[]=[]){return files.find(f=>isBadgeImage(f)&&f.role==='portrait')?.key||files.find(f=>isBadgeImage(f)&&isPortraitLabel(f.name))?.key||''}
