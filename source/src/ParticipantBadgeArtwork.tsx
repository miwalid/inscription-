export const additionalParticipantModels=[
 {id:'botanical',name:'نباتي',number:4},
 {id:'geometric',name:'هندسي',number:5},
 {id:'solar',name:'شمسي',number:6},
 {id:'vertical-ribbon',name:'شريط عمودي',number:7},
 {id:'circles',name:'دوائر',number:8},
 {id:'art-deco',name:'آرت ديكو',number:9},
 {id:'waves',name:'أمواج',number:10},
] as const;
export type AdditionalParticipantDesign=typeof additionalParticipantModels[number]['id'];
export function ParticipantBadgeArtwork({design}:{design:AdditionalParticipantDesign}){
 const green='#075c35',gold='#e7bb27',yellow='#ffde36',red='#d31831';
 if(design==='botanical')return <>{[[35,25,0],[815,25,90],[35,1175,-90],[815,1175,180]].map(([x,y,r],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${r})`}><path d="M0 145Q35 60 130 0" fill="none" stroke="#708e43" strokeWidth="4"/>{[0,1,2,3].map(n=><g key={n} transform={`translate(${n*26} ${115-n*27}) rotate(35)`}><ellipse cx="-16" cy="-13" rx="13" ry="29" fill={n%2?'#a0b460':'#4c793a'}/><ellipse cx="16" cy="-27" rx="12" ry="26" fill={n%2?'#4c793a':'#a0b460'}/></g>)}</g>)}<path d="M150 886H300M550 886H700" stroke={red} strokeWidth="5"/></>;
 if(design==='geometric')return <><path d="M0 0H280L0 280ZM850 0V280L570 0Z" fill={green}/><path d="M0 180L180 0H275L0 275ZM650 0H850V200Z" fill={yellow}/><path d="M0 0H180L0 180Z" fill="#287c4d"/><path d="M0 1170H850V1200H0Z" fill={yellow}/><path d="M715 1200H850V1065Z" fill={red}/><path d="M165 886H295M555 886H685" stroke={red} strokeWidth="5"/></>;
 if(design==='solar')return <><path d="M0 0H850V465Q425 675 0 465Z" fill="#fff1a5"/><path d="M0 465Q425 675 850 465" fill="none" stroke={gold} strokeWidth="13"/>{Array.from({length:19},(_,i)=>{const a=(i*10-180)*Math.PI/180;return <path key={i} d={`M${425+180*Math.cos(a)} ${185+180*Math.sin(a)}L${425+280*Math.cos(a)} ${185+280*Math.sin(a)}`} stroke={gold} strokeWidth="3"/>})}<path d="M145 886H300M550 886H705M0 1180H850" stroke={gold} strokeWidth="5"/></>;
 if(design==='vertical-ribbon')return <><path d="M0 0H100V1200H0Z" fill={green}/><path d="M110 0H135V1200H110Z" fill={yellow}/><path d="M210 886H325M610 886H725" stroke={red} strokeWidth="5"/></>;
 if(design==='circles')return <><circle cx="0" cy="0" r="330" fill={yellow}/><circle cx="0" cy="0" r="225" fill={green}/><circle cx="1000" cy="560" r="235" fill={yellow}/><path d="M0 1090V1200H110Z" fill={yellow}/><path d="M180 886H305M545 886H670" stroke={red} strokeWidth="5"/></>;
 if(design==='art-deco')return <><path d="M90 18H760V48H810V98H832V1102H810V1152H760V1182H90V1152H40V1102H18V98H40V48H90Z" fill="none" stroke={green} strokeWidth="5"/><path d="M105 34H745V64H794V114H816V1086H794V1136H745V1166H105V1136H56V1086H34V114H56V64H105Z" fill="none" stroke={gold} strokeWidth="4"/><path d="M80 520H140M80 540H160M80 560H140M710 520H770M690 540H770M710 560H770M185 886H305M545 886H665" stroke={gold} strokeWidth="4"/></>;
 return <><path d="M0 0H340Q200 35 0 200Z" fill={green}/><path d="M0 120Q150 0 340 0H415Q185 35 0 245Z" fill={yellow}/><path d="M0 1090Q230 1030 425 1105T850 1080V1200H0Z" fill={red}/><path d="M0 1110Q230 1050 425 1125T850 1100V1200H0Z" fill={yellow}/><path d="M0 1140Q230 1080 425 1155T850 1130V1200H0Z" fill={green}/><path d="M150 880H290M560 880H700" stroke={red} strokeWidth="5"/></>;
}
