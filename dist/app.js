const menu=document.querySelector('.menu'),navigation=document.querySelector('#navigation');
function closeMenu(){menu.setAttribute('aria-expanded','false');navigation.classList.remove('open')}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));navigation.classList.toggle('open',open)});
navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
const projects={memorybook:{title:'MemoryBook',image:'memorybook',description:'Un espacio para crear álbumes de fotos, personalizar sus páginas y construir recuerdos con otras personas. Un proyecto que une edición visual, colaboración y el encanto de un libro de fotografías.',tags:['React','Editor visual','Colaboración'],url:null},filmlab:{title:'FilmLab',image:'filmlab',description:'Un proyecto nacido de mi interés por la fotografía. Una experiencia de edición pensada para experimentar con ajustes, tonos y estilos desde el celular.',tags:['Fotografía','Color','Experiencia móvil'],repo:'film-lab',url:'https://film-lab-joy.vercel.app/'},professional:{title:'FilmLab Professional',image:'filmlab-pro',description:'La exploración de un editor fotográfico de escritorio, con máscaras y ajustes de color. Una interfaz que busca dar más espacio a la imagen y acercar herramientas de edición a un flujo creativo.',tags:['Edición','Máscaras','Interfaz de escritorio'],repo:'Film-Lab-Professional'},bimu:{title:'Bimu',image:'bimu',description:'Un asistente de escritorio para Windows que combina una mascota animada, un chat con IA local y comandos de voz. Desarrollado con React y Tauri, e integrado con Ollama y reconocimiento de voz local.',tags:['React','Tauri','Ollama','Voz'],repo:'Bimu'},soundlify:{title:'Soundlify',image:'soundlify',description:'Un dashboard conectado con Spotify para explorar artistas y canciones destacados en distintos períodos. Presenta un perfil del oyente, características de sus gustos y una distribución de géneros musicales.',tags:['Spotify','Dashboard','Perfil musical'],repo:'soundlify',url:'https://soundlify.vercel.app'}};
// Cards and modal share one project configuration; links only appear with a known URL.
document.querySelectorAll('.project').forEach(card=>{
 const trigger=card.querySelector('[data-project]');const project=projects[trigger.dataset.project];
 const target=(card.matches('.film-pro')?card.querySelector('.project-copy>div'):card.querySelector('.numbered-copy>div'))||card.querySelector('.project-copy');
 const actions=document.createElement('div');actions.className='project-actions';
 const details=document.createElement('button');details.className='project-details';details.type='button';details.textContent='Ver proyecto';details.addEventListener('click',()=>openProject(trigger.dataset.project,details));actions.append(details);
 if(project.url){const link=document.createElement('a');link.className='project-web';link.href=project.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Ver en la web ↗';link.setAttribute('aria-label',`Ver ${project.title} en la web`);actions.append(link)}
 target.append(actions);
});
const dialog=document.querySelector('#project-dialog'),scroller=document.querySelector('#modal-scroll');let previousFocus;
function openProject(key,trigger){const p=projects[key];previousFocus=trigger;
 document.querySelector('#dialog-title').textContent=p.title;
 const image=document.querySelector('#dialog-image');image.src=`assets/${p.image}-real.webp`;image.alt=`Captura real de ${p.title}`;image.classList.toggle('mobile-capture',key==='filmlab');
 document.querySelector('#dialog-description').textContent=p.description;
 document.querySelector('#dialog-tags').replaceChildren(...p.tags.map(t=>{const el=document.createElement('span');el.textContent=t;return el}));
 const repo=document.querySelector('#repo-link');repo.hidden=!p.repo;if(p.repo)repo.href=`https://github.com/marianoarias1/${p.repo}`;
 const web=document.querySelector('#web-link');web.hidden=!p.url;if(p.url)web.href=p.url;
 dialog.showModal();document.body.style.overflow='hidden';scroller.scrollTop=0;requestAnimationFrame(layoutScrollbar);
}
document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>openProject(button.dataset.project,button)));
document.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';previousFocus?.focus({preventScroll:true})});
// The native content scroller drives a curved SVG track, including its rounded ends.
const rail=document.querySelector('#curved-scrollbar'),track=rail.querySelector('.scroll-rail'),handle=rail.querySelector('.scroll-handle'),hit=rail.querySelector('.scroll-hit');
let railLength=0,handleLength=0,scrollFrame=0,dragging=false,dragOffset=0;
function updateScrollbar(){scrollFrame=0;const max=scroller.scrollHeight-scroller.clientHeight;const progress=max>0?scroller.scrollTop/max:0;handle.style.strokeDasharray=`${handleLength} ${railLength+1}`;handle.style.strokeDashoffset=String(-progress*(railLength-handleLength));rail.setAttribute('aria-valuenow',String(Math.round(progress*100)))}
function layoutScrollbar(){if(!dialog.open)return;const h=scroller.clientHeight;rail.setAttribute('viewBox',`0 0 64 ${h}`);const radius=Math.min(15,h/8);const d=`M ${50-radius} 13 Q 50 13 50 ${radius+13} L 50 ${h-radius-13} Q 50 ${h-13} ${50-radius} ${h-13}`;for(const path of [track,handle,hit])path.setAttribute('d',d);railLength=track.getTotalLength();const ratio=scroller.clientHeight/scroller.scrollHeight;handleLength=Math.min(railLength,Math.max(46,railLength*ratio));const active=scroller.scrollHeight>scroller.clientHeight+2;rail.classList.toggle('is-hidden',!active);rail.setAttribute('aria-disabled',String(!active));rail.tabIndex=active?0:-1;updateScrollbar()}
scroller.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScrollbar)},{passive:true});
new ResizeObserver(layoutScrollbar).observe(scroller);new ResizeObserver(layoutScrollbar).observe(document.querySelector('.dialog-flow'));document.querySelector('#dialog-image').addEventListener('load',layoutScrollbar);
function nearestDistance(event){const bounds=rail.getBoundingClientRect();const x=(event.clientX-bounds.left)*64/bounds.width,y=(event.clientY-bounds.top)*scroller.clientHeight/bounds.height;let best=Infinity,distance=0;for(let i=0;i<=160;i++){const d=railLength*i/160,p=track.getPointAtLength(d),delta=(p.x-x)**2+(p.y-y)**2;if(delta<best){best=delta;distance=d}}return distance}
function scrollToDistance(distance){const travel=railLength-handleLength;if(travel<=0)return;scroller.scrollTop=Math.max(0,Math.min(1,distance/travel))*(scroller.scrollHeight-scroller.clientHeight)}
rail.addEventListener('pointerdown',event=>{if(rail.classList.contains('is-hidden'))return;event.preventDefault();rail.focus({preventScroll:true});const distance=nearestDistance(event),max=scroller.scrollHeight-scroller.clientHeight,current=max>0?scroller.scrollTop/max*(railLength-handleLength):0;dragOffset=distance>=current&&distance<=current+handleLength?distance-current:handleLength/2;dragging=true;rail.setPointerCapture(event.pointerId);rail.classList.add('is-dragging');scrollToDistance(distance-dragOffset)});
rail.addEventListener('pointermove',event=>{if(dragging)scrollToDistance(nearestDistance(event)-dragOffset)});
function release(){dragging=false;rail.classList.remove('is-dragging')}
rail.addEventListener('pointerup',release);rail.addEventListener('pointercancel',release);rail.addEventListener('lostpointercapture',release);
rail.addEventListener('keydown',event=>{let next=scroller.scrollTop;const page=scroller.clientHeight*.85;if(event.key==='ArrowDown')next+=45;else if(event.key==='ArrowUp')next-=45;else if(event.key==='PageDown'||event.key===' ')next+=page;else if(event.key==='PageUp')next-=page;else if(event.key==='Home')next=0;else if(event.key==='End')next=scroller.scrollHeight;else return;event.preventDefault();scroller.scrollTop=next});
// Reveal once when a project enters the viewport; reduced-motion stays fully visible.
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
if(!reducedMotion.matches&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');observer.unobserve(entry.target)}}},{threshold:.08,rootMargin:'0px 0px -25px 0px'});document.querySelectorAll('.project').forEach(card=>{card.classList.add('reveal-pending');observer.observe(card)});reducedMotion.addEventListener('change',event=>{if(event.matches){document.querySelectorAll('.reveal-pending').forEach(card=>card.classList.remove('reveal-pending'));observer.disconnect()}})}
