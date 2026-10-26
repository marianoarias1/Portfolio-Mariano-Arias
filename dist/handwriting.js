const glyphs={
'よ':{w:85,s:['M 43,21 Q 46,58 48,76 C 53,106 9,108 18,86 C 24,73 59,80 75,96','M 45,43 Q 62,44 75,36']},
'う':{w:75,s:['M 26,18 Q 44,23 54,21','M 15,53 C 79,14 75,87 34,107']},
'こ':{w:80,s:['M 17,31 Q 42,22 63,31 L 53,40','M 18,72 C -1,105 53,104 70,94']},
'そ':{w:85,s:['M 24,18 Q 45,16 62,15 L 22,53 Q 54,45 78,42 C 21,67 26,99 65,103']},
'欢':{w:110,s:['M 10,30 L 45,30 Q 39,69 9,96','M 12,47 Q 28,61 47,86','M 64,13 Q 60,37 48,50','M 61,33 L 98,33 L 88,52','M 73,44 Q 71,78 49,101','M 73,63 Q 82,89 104,102']},
'迎':{w:115,s:['M 15,19 L 27,31','M 9,48 L 28,48 L 19,77 Q 34,100 108,97','M 64,18 L 44,30 L 44,73 L 64,65','M 76,25 L 100,25 L 100,68 Q 96,77 86,69','M 76,25 L 76,91']}
};
const fontResponse=await fetch('assets/handwriting-font.json');
if(!fontResponse.ok)throw new Error('Handwriting font could not load');
const fontGlyphs=await fontResponse.json();
const words=[['Bienvenido','es'],['Welcome','en'],['ようこそ','ja'],['欢迎','zh'],['Bienvenue','fr'],['Benvenuto','it']];
const host=document.querySelector('#greeting'),motion=matchMedia('(prefers-reduced-motion: reduce)'),ns='http://www.w3.org/2000/svg';
let frame=0,wordIndex=0,phase='draw',start=0,paths=[],total=0;
function node(tag,attrs={},parent){const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(parent)parent.append(el);return el}
function build(word,lang){host.replaceChildren();host.lang=lang;const asian=lang==='zh'||lang==='ja';let x=10;const letters=[];
for(const c of word){if(asian){const g=glyphs[c];letters.push({x,asian:true,strokes:g.s.map(d=>({d,width:8.5}))});x+=g.w}else{const g=fontGlyphs[c];letters.push({...g,x});x+=g.advance}}
const w=x+65,h=asian?140:260;
const svg=node('svg',{viewBox:`0 0 ${w} ${h}`,preserveAspectRatio:'xMidYMid meet',class:`handwriting${asian?' asian-ink':''}`},host);
paths=[];total=0;
for(const letter of letters){const transform=`translate(${letter.x} 0)`;
for(const stroke of letter.strokes){const width=asian?6.5:10.5;const p=node('path',{d:stroke.d,transform,fill:'none',stroke:'currentColor','stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round','shape-rendering':'geometricPrecision'},svg);const length=p.getTotalLength();if(!length)continue;p.style.strokeDasharray=`${length} ${length+width*2}`;p.style.strokeDashoffset=String(length+width);p.style.visibility='hidden';paths.push({p,length,from:total});total+=length}}
}
function paint(progress,erasing=false){const distance=progress*total;for(const {p,length,from}of paths){const local=Math.max(0,Math.min(length,distance-from));p.style.visibility=erasing?(local>=length?'hidden':'visible'):(local<=0?'hidden':'visible');p.style.strokeDashoffset=String(erasing?-local:length-local)}}
function tick(time){if(!start)start=time;const duration=phase==='draw'?3400:phase==='hold'?2100:phase==='erase'?2000:350;const progress=Math.min(1,(time-start)/duration);if(phase==='draw')paint(progress);if(phase==='erase')paint(progress,true);if(progress===1){start=time;if(phase==='draw')phase='hold';else if(phase==='hold')phase='erase';else if(phase==='erase')phase='gap';else{wordIndex=(wordIndex+1)%words.length;build(...words[wordIndex]);phase='draw'}}frame=requestAnimationFrame(tick)}
function run(){cancelAnimationFrame(frame);wordIndex=0;phase='draw';start=0;build(...words[0]);if(motion.matches)paint(1);else frame=requestAnimationFrame(tick)}
motion.addEventListener('change',run);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(frame);else if(!motion.matches){start=0;frame=requestAnimationFrame(tick)}});run();
