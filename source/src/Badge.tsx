import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Printer} from 'lucide-react';
import BrandLogo from './BrandLogo';
import './badge.css';
export type BadgeEntry={person:{id:string;firstName:string;lastName:string;gender:'male'|'female'},stage:{title:string;start:string;end:string}};
export function badgeDate(value:string){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);return m?`${m[3]}/${m[2]}/${m[1]}`:value}
export function fitBadgeText(root:ParentNode){root.querySelectorAll<HTMLElement>('[data-badge-fit]').forEach(el=>{if(!el.clientHeight)return;const content=(el.firstElementChild||el) as HTMLElement;const start=Number(el.dataset.badgeFit);let size=start;el.style.fontSize=size+'pt';while(size>8&&(content.scrollHeight>el.clientHeight+1||content.scrollWidth>el.clientWidth+1)){size-=.5;el.style.fontSize=size+'pt'}})}
export function TraineeBadge({entry}:{entry:BadgeEntry}){const ref=useRef<HTMLElement>(null);useEffect(()=>{let live=true;document.fonts.ready.then(()=>{if(live&&ref.current)fitBadgeText(ref.current)});return()=>{live=false}},[entry]);return <article ref={ref} className="trainee-badge" dir="rtl" aria-label={'بطاقة '+entry.person.firstName+' '+entry.person.lastName}>
<div className="badge-top-colors" aria-hidden="true"><span/><span/><span/></div>
<div className="badge-logo"><BrandLogo/></div>
<div className={'badge-role '+entry.person.gender}>{entry.person.gender==='female'?'مدربة':'مدرب'}</div>
<div className="badge-name-label">الاسم واللقب</div>
<div className="badge-full-name" data-badge-fit="23"><div><span>{entry.person.firstName}</span><span>{entry.person.lastName}</span></div></div>
<div className="badge-stage-title" data-badge-fit="14"><div>{entry.stage.title}</div></div>
<div className="badge-stage-dates" dir="ltr">{badgeDate(entry.stage.start)}{entry.stage.end&&entry.stage.end!==entry.stage.start?' — '+badgeDate(entry.stage.end):''}</div>
<div className="badge-bottom-rule" aria-hidden="true"/>
</article>}
export function BadgePrintArea({entries}:{entries:BadgeEntry[]}){return <div className="badge-print-area" aria-hidden="true">{Array.from({length:Math.ceil(entries.length/4)},(_,page)=><section className="badge-sheet" key={page}>{entries.slice(page*4,page*4+4).map(entry=><TraineeBadge key={entry.person.id} entry={entry}/>)}</section>)}</div>}
export function BadgePanel({entries}:{entries:BadgeEntry[]}){const[index,setIndex]=useState(0),[printing,setPrinting]=useState(false);const frame=useRef<HTMLDivElement>(null);useEffect(()=>{if(!frame.current)return;const node=frame.current;const update=()=>node.style.setProperty('--badge-preview-scale',String(Math.min(1,node.clientWidth/(85*96/25.4))));const obs=new ResizeObserver(update);obs.observe(node);update();return()=>obs.disconnect()},[]);
async function print(){setPrinting(true);try{await document.fonts.ready;const images=Array.from(document.querySelectorAll<HTMLImageElement>('.badge-print-area img'));await Promise.all(images.map(img=>img.decode().catch(()=>undefined)));fitBadgeText(document);window.print()}finally{setPrinting(false)}}
return <><div className="section-label">بطاقة المشارك</div><h2>معاينة البطاقة</h2><p className="muted badge-dimensions">عرض 8.5 سم × ارتفاع 12 سم · عمودي</p><div className="badge-preview-frame" ref={frame}><div className="badge-preview-scaled"><TraineeBadge entry={entries[index]}/></div></div>{entries.length>1&&<div className="badge-pagination"><button type="button" className="secondary" disabled={index===0} onClick={()=>setIndex(i=>i-1)} aria-label="البطاقة السابقة"><ChevronRight size={16}/></button><span>{index+1} / {entries.length}</span><button type="button" className="secondary" disabled={index===entries.length-1} onClick={()=>setIndex(i=>i+1)} aria-label="البطاقة التالية"><ChevronLeft size={16}/></button></div>}<p className="muted badge-print-help">تُطبع 4 بطاقات في ورقة A4 عمودية. اختر A4 والحجم الفعلي 100% وألغِ رؤوس الصفحات وتذييلاتها.</p><button className="primary full" disabled={printing} onClick={print}><Printer size={17}/>{printing?'جارٍ تجهيز الطباعة…':entries.length>1?'طباعة البطاقات / حفظ PDF':'طباعة البطاقة / حفظ PDF'}</button></>}
