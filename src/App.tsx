import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Search, MapPin, Home, Compass, CalendarDays, SlidersHorizontal, LocateFixed, Map as MapIcon, Share2, ArrowLeft, Star, Users, Check, ShieldCheck, X, LoaderCircle, Flag, Cookie, Wallet } from 'lucide-react';
import { events, categories, fmt, spotsByMood, type Ev, type Cat } from './data';
import { useLocal } from './store';
import { Moods, Night, Adventure, Friends, Footer, TouristGuide, SanRafaelWeather, ActivityIcon } from './Extra';
import { listEvents, currentUserId, currentUserRole, onAuth, signIn, signOut, remoteMode, loadStats, setRating, toggleGoing, type Stats } from './api';
const Publish = lazy(() => import('./Publish').then(m => ({ default: m.Publish })));
const OsmMapView = lazy(() => import('./OsmMap').then(m => ({ default: m.OsmMapView })));
const Moderation = lazy(() => import('./Moderation').then(m => ({ default: m.Moderation })));
const ACCESS_FORM = import.meta.env.VITE_ACCESS_REQUEST_FORM_URL as string | undefined;

type View = 'inicio'|'explorar'|'agenda'|'mapa'|'planes'|'armar'|'publicar'|'revisar'|{ev:string};
const nav: {k:View;l:string;i:JSX.Element}[] = [
 {k:'inicio',l:'Inicio',i:<Home size={20}/>},{k:'explorar',l:'Explorar',i:<Compass size={20}/>},{k:'agenda',l:'Agenda',i:<CalendarDays size={20}/>},
 {k:'mapa',l:'Mapa',i:<MapIcon size={20}/>},{k:'planes',l:'Mis planes',i:<Heart size={20}/>}];

const bg=(u:string)=>({backgroundImage:`linear-gradient(transparent 38%,rgba(15,23,42,.72)),url(${u})`,backgroundSize:'cover',backgroundPosition:'center'});
const weekendLabel=()=>{const friday=new Date();friday.setDate(friday.getDate()+((5-friday.getDay()+7)%7));return [0,1,2].map(offset=>{const date=new Date(friday);date.setDate(friday.getDate()+offset);const label=new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric'}).format(date).replace(',','');return label.charAt(0).toUpperCase()+label.slice(1)}).join(' · ')};
const agendaMonthLabel=()=>{const label=new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(new Date());return label.charAt(0).toUpperCase()+label.slice(1)};
const distanceBetween=(a:[number,number],b:[number,number])=>{const r=6371;const [la1,lo1]=a.map(x=>x*Math.PI/180);const [la2,lo2]=b.map(x=>x*Math.PI/180);const dLat=la2-la1;const dLon=lo2-lo1;const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(h));};
const Fav = ({on,toggle}:{on:boolean;toggle:()=>void}) => (
 <motion.button whileTap={{scale:.8}} animate={{scale:on?[1,1.3,1]:1}} className={'fav'+(on?' on':'')} aria-label="Guardar" onClick={e=>{e.stopPropagation();toggle()}}>
 <Heart size={18} fill={on?'currentColor':'none'}/></motion.button>);

const none:Stats={avg:0,ratings:0,going:0,myStars:0,iGo:false};
const DeferredView=({children}:{children:React.ReactNode})=><Suspense fallback={<section className="sec deferred-view"><LoaderCircle size={20} className="spin"/><span>Cargando esta sección…</span></section>}>{children}</Suspense>;
const Meta=({s}:{s:Stats})=><p className="meta" style={{display:'flex',gap:6,alignItems:'center'}}><Star size={13} fill="currentColor" style={{color:'#F59E0B'}}/> {s.ratings?`${s.avg.toFixed(1)} (${s.ratings})`:'Sin calificaciones'} · <Users size={13}/> {s.going} {s.going===1?'va':'van'}</p>;
const EventCard = ({e,st,fav,toggle,open}:{st:Stats;e:Ev;fav:boolean;toggle:()=>void;open:()=>void}) => (
 <motion.article layout initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="card" onClick={open} style={{'--tone':e.tone} as React.CSSProperties}>
  <div className="ph" style={e.image?bg(e.image):undefined}><span className="cat">{e.category}</span><Fav on={fav} toggle={toggle}/></div>
  <div className="body"><small>{e.day} · {e.time}</small><h3>{e.title}</h3>{e.verified&&<span className="verified"><ShieldCheck size={13}/> Información confirmada</span>}
   <p><MapPin size={13}/> {e.location} · {e.distance}</p><Meta s={st}/>
   <div className="row"><b>{fmt(e.price)}</b><span className="btn sm">Ver evento</span></div></div>
 </motion.article>);

function ListSummary({count,loading,query,clear}:{count:number;loading:boolean;query:string;clear:()=>void}){
 return <div className="list-summary" aria-live="polite">{loading?<><LoaderCircle size={15} className="spin"/> Actualizando catálogo…</>:<><span><b>{count}</b> {count===1?'plan disponible':'planes disponibles'}{query&&<> para <strong>“{query}”</strong></>}</span>{query&&<button className="text-action" onClick={clear}>Ver todos</button>}</>}</div>;
}

export default function App(){
 const [view,setView]=useState<View>('inicio'); const [favs,setFavs]=useLocal<string[]>('favs',[]); const [plans,setPlans]=useLocal<string[]>('plans',[]);
 const [q,setQ]=useState(''); const [cat,setCat]=useState<Cat|'Todos'>('Todos');
 const [dayFilter,setDayFilter]=useState('Todos'); const [budgetFilter,setBudgetFilter]=useState('Todos'); const [sort,setSort]=useState('date'); const [nearby,setNearby]=useState<[number,number]|null>(null); const [geoLoading,setGeoLoading]=useState(false); const [geoMessage,setGeoMessage]=useState('');
 const [authOpen,setAuthOpen]=useState(false); const [reportEvent,setReportEvent]=useState<Ev|null>(null); const [stats,setStats]=useState<Record<string,Stats>>({}); const [pub,setPub]=useState<Ev[]>([]); const [uid,setUid]=useState<string|null>(null); const [role,setRole]=useState<'user'|'moderator'|null>(null); const [loading,setLoading]=useState(true); const [loadError,setLoadError]=useState('');
 const refresh=async()=>{setLoading(true);setLoadError('');
  const [catalogResult,statsResult]=await Promise.allSettled([Promise.all([currentUserId(),currentUserRole(),listEvents()]),loadStats()]);
  if(catalogResult.status==='fulfilled'){const [nextUid,nextRole,nextPub]=catalogResult.value;setUid(nextUid);setRole(nextRole);setPub(nextPub);}else{console.error(catalogResult.reason);setLoadError('No pudimos actualizar los eventos publicados. Mostramos el catálogo disponible.');}
  if(statsResult.status==='fulfilled')setStats(statsResult.value);else{console.error(statsResult.reason);setLoadError('Algunas métricas no están disponibles ahora.');}
  setLoading(false);
 };
 useEffect(()=>{refresh();return onAuth(refresh)},[]);
 const all=useMemo(()=>[...pub,...events].filter(e => !e.status || e.status === 'approved').map(e=>e.verified===undefined?{...e,verified:true,updatedAt:'Datos editoriales'}:e),[pub]);
 useEffect(()=>{const event=typeof view==='object'?all.find(e=>e.id===view.ev):null;const description=document.querySelector('meta[name="description"]');if(event){document.title=`${event.title} | Qué hacer en San Rafael`;description?.setAttribute('content',`${event.title}: ${event.description} En ${event.location}, San Rafael, Mendoza.`);}else{document.title='Qué hacer en San Rafael | Eventos, turismo y planes';description?.setAttribute('content','Descubrí qué hacer en San Rafael, Mendoza: eventos, fiestas, gastronomía, aventuras, lugares y planes para este finde.');}return()=>{document.title='Qué hacer en San Rafael | Eventos, turismo y planes';}},[view,all]);
 const guard=async(fn:()=>Promise<void>)=>{try{await fn();await refresh()}catch(e:any){if(e.message==='LOGIN')setAuthOpen(true);else alert(e.message||'No pudimos guardar. Probá de nuevo.')}};
 const rate=(id:string,n:number)=>guard(()=>setRating(id,n)); const going=(id:string,on:boolean)=>guard(()=>toggleGoing(id,on));
 const go=(v:View)=>{setView(v);window.scrollTo(0,0)};
 const toggle=(id:string)=>setFavs(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);
 const list=useMemo(()=>all.filter(e=>(cat==='Todos'||e.category===cat)&&(dayFilter==='Todos'||e.day.includes(dayFilter))&&(budgetFilter==='Todos'||(budgetFilter==='free'?e.price===0:e.price>0&&e.price<=25000))&&(e.title+e.location+e.tags.join(' ')+e.category+(e.price===0?' gratis':'')).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>sort==='price'?a.price-b.price:sort==='title'?a.title.localeCompare(b.title):sort==='nearby'&&nearby?distanceBetween(nearby,a.coordinates)-distanceBetween(nearby,b.coordinates):a.day.localeCompare(b.day)||a.time.localeCompare(b.time)),[q,cat,dayFilter,budgetFilter,sort,nearby,all]);
 const locate=()=>{if(!navigator.geolocation){setGeoMessage('Tu navegador no permite usar la ubicación.');return;}setGeoLoading(true);setGeoMessage('');navigator.geolocation.getCurrentPosition(p=>{setNearby([p.coords.latitude,p.coords.longitude]);setSort('nearby');setGeoLoading(false);},()=>{setGeoLoading(false);setGeoMessage('No pudimos acceder a tu ubicación. Podés seguir explorando por día y presupuesto.');},{enableHighAccuracy:false,timeout:8000,maximumAge:300000});};
 const clearFilters=()=>{setQ('');setCat('Todos');setDayFilter('Todos');setBudgetFilter('Todos');setSort('date');setNearby(null);setGeoMessage('')};
 const grid=(l:Ev[])=>l.length?<motion.div layout className="grid"><AnimatePresence>{l.map(e=><EventCard key={e.id} st={stats[e.id]??none} e={e} fav={favs.includes(e.id)} toggle={()=>toggle(e.id)} open={()=>go({ev:e.id})}/>)}</AnimatePresence></motion.div>:<p className="empty">No encontramos planes con ese filtro. Probá con otra categoría.</p>;
 const chips=<div className="chips">{(['Todos',...categories] as const).map(c=><button key={c} className={c===cat?'chip on':'chip'} onClick={()=>setCat(c)}>{c}</button>)}</div>;
 const key=typeof view==='string'?view:'ev'; const appNav=role==='moderator'?[...nav,{k:'revisar' as View,l:'Revisar',i:<ShieldCheck size={20}/>}]:nav;
 return <>
  <header className="hdr"><div className="brand"><img src="/san-rafael-mark.svg" alt="San Rafael, Mendoza"/><button className="logo" onClick={()=>go('inicio')}>¿QUÉ HACEMOS?<small>SAN RAFAEL</small></button></div>
  <nav className="dnav">{appNav.map(n=><button key={n.l} className={view===n.k?'on':''} onClick={()=>go(n.k)}>{n.l}</button>)}</nav>
   <span className="loc"><MapPin size={14}/> San Rafael, Mendoza</span><button className="btn sm pub" onClick={()=>go('publicar')}>Publicar evento</button>
   {remoteMode&&(uid?<button className="btn sm ghost" onClick={()=>signOut()}>Salir</button>:<button className="btn sm ghost" onClick={()=>setAuthOpen(true)}>Ingresar</button>)}</header>
  {loadError&&<div className="status-banner" role="status"><span>{loadError}</span><button aria-label="Cerrar aviso" onClick={()=>setLoadError('')}><X size={16}/></button></div>}
  <AnimatePresence mode="wait"><motion.main key={key} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.18}}>
  {view==='inicio'&&<>
   <section className="hero"><div className="heroin"><h1>¿Qué hacemos este finde?</h1>
    <p>Encontrá planes, fiestas, aventuras y gastronomía en San Rafael.</p>
    <div className="search"><Search size={20}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Boliches, rafting, bodegas, fiestas…"/></div>
    <div className="row c"><button className="btn" onClick={()=>document.getElementById('finde')?.scrollIntoView({behavior:'smooth'})}>Explorar planes</button><button className="btn ghost" onClick={()=>go('armar')}>Armá tu finde</button></div><div className="hero-proof"><span><Check size={14}/> Curado localmente</span><span><ShieldCheck size={14}/> Información confirmada</span><span><MapPin size={14}/> San Rafael real</span></div></div></section>
  <SanRafaelWeather/>
  <section id="finde" className="sec"><h2>Este finde en San Rafael</h2><p className="sub">{weekendLabel()}</p>{chips}<ListSummary count={list.length} loading={loading} query={q} clear={()=>setQ('')}/>{grid(list)}
    {import.meta.env.DEV&&<p className="note">Datos de demostración: los eventos no están confirmados.</p>}</section>
  <Moods pick={(c,t)=>{setCat(c);setQ(t);go('explorar')}}/><Night go={go}/><Adventure all={()=>{setCat('Aventura');setQ('');go('explorar')}}/><Friends events={all}/></>}
  {view==='inicio'&&<TouristGuide go={go}/>} 
  {view==='explorar'&&<section className="sec"><div className="section-title"><div><h2>Explorar</h2><p className="sub">Encontrá el plan justo para tu día y presupuesto.</p></div><button className="btn sm ghost" onClick={clearFilters}><X size={15}/> Limpiar</button></div>
   <div className="search"><Search size={20}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscá un plan o lugar" aria-label="Buscar un plan o lugar"/>{q&&<button aria-label="Limpiar búsqueda" onClick={()=>setQ('')}><X size={18}/></button>}</div>
  <div className="filter-panel"><div className="filter-label"><SlidersHorizontal size={16}/> Filtros</div><div><small>Día</small><div className="chips compact">{['Todos','Viernes','Sábado','Domingo'].map(d=><button key={d} className={dayFilter===d?'chip on':'chip'} onClick={()=>setDayFilter(d)}>{d}</button>)}</div></div><div><small>Presupuesto</small><div className="chips compact"><button className={budgetFilter==='Todos'?'chip on':'chip'} onClick={()=>setBudgetFilter('Todos')}>Todos</button><button className={budgetFilter==='free'?'chip on':'chip'} onClick={()=>setBudgetFilter('free')}>Gratis</button><button className={budgetFilter==='cheap'?'chip on':'chip'} onClick={()=>setBudgetFilter('cheap')}>Hasta $25.000</button></div></div><label className="sort-control">Ordenar<select value={sort} onChange={e=>setSort(e.target.value)}><option value="date">Fecha y hora</option><option value="price">Precio más bajo</option><option value="title">Nombre</option><option value="nearby" disabled={!nearby}>Más cerca</option></select></label><button className={nearby?'location-action active':'location-action'} onClick={nearby?()=>{setNearby(null);setSort('date')} : locate} disabled={geoLoading}><LocateFixed size={16}/>{geoLoading?'Buscando…':nearby?'Cerca de mí':'Buscar cerca de mí'}</button></div>{geoMessage&&<p className="note geo-message" role="status">{geoMessage}</p>}
   {chips}<ListSummary count={list.length} loading={loading} query={q} clear={()=>setQ('')}/>{grid(list)}</section>}
  {view==='agenda'&&<section className="sec"><h2>Agenda</h2><p className="sub">{agendaMonthLabel()}</p>{chips}
   {[...new Set(list.map(e=>e.day))].sort((a,b)=>Number(a.split(' ')[1])-Number(b.split(' ')[1])).map(d=>{const l=list.filter(e=>e.day===d).sort((a,b)=>a.time.localeCompare(b.time));return l.length?<div key={d} className="day"><h3>{d}</h3>
    {l.map(e=><button key={e.id} className="ag" onClick={()=>go({ev:e.id})}><b>{e.time}</b><span>{e.title}<small>{e.location}</small></span></button>)}</div>:null})}</section>}
  {view==='mapa'&&<DeferredView><OsmMapView events={all}/></DeferredView>} 
  {view==='publicar'&&<DeferredView><Publish uid={uid} mine={pub.filter(p=>p.mine)} refresh={refresh}/></DeferredView>} 
  {view==='revisar'&&role==='moderator'&&<DeferredView><Moderation/></DeferredView>}
  {view==='planes'&&<Saved evs={all} favs={favs} plans={plans} open={id=>go({ev:id})} toggle={toggle} clear={()=>setPlans([])}/>}
  {view==='armar'&&<Builder save={p=>setPlans(x=>[p,...x])} back={()=>go('inicio')} />}
  {typeof view==='object'&&(()=>{const e=all.find(x=>x.id===view.ev); if(!e) return <section className="sec"><p className="empty">Este evento ya no existe.</p></section>; return <section className="sec det"><button className="back" onClick={()=>go('inicio')}><ArrowLeft size={18}/> Volver</button>
   <div className="ph big" style={{'--tone':e.tone,...(e.image?bg(e.image):{})} as React.CSSProperties}/><span className="cat s">{e.category}</span><h2>{e.title}</h2>
  <p>{e.date} · {e.time}</p><p><MapPin size={14}/> {e.location}</p><p><b>{fmt(e.price)}</b></p>{e.verified&&<p className="verified"><ShieldCheck size={14}/> Información confirmada por el equipo</p>}<p>{e.description}</p>{e.updatedAt&&<small className="updated-at">Actualizado recientemente</small>}{e.author&&<p>Publicado por @{e.author}</p>}<Engage e={e} st={stats[e.id]??none} rate={rate} going={going}/>
  <div className="row"><button className="btn" onClick={()=>toggle(e.id)}>{favs.includes(e.id)?'Guardado':'Guardar'}</button>
  <button className="btn ghost" onClick={()=>share(e.title)}><Share2 size={16}/> Compartir</button>{e.tickets&&<a className="btn" href={e.tickets} target="_blank" rel="noreferrer">Comprar entradas</a>}</div><button className="report-link" onClick={()=>setReportEvent(e)}><Flag size={14}/> ¿Encontraste un dato incorrecto?</button></section>})()}
  </motion.main></AnimatePresence>
  {authOpen&&!uid&&<AuthModal onClose={()=>setAuthOpen(false)} refresh={refresh}/>}
  {reportEvent&&<ReportModal event={reportEvent} onClose={()=>setReportEvent(null)}/>} 
  <Footer go={go}/>
  <nav className="bnav">{appNav.map(n=><button key={n.l} className={view===n.k?'on':''} onClick={()=>go(n.k)}>{n.i}<span>{n.l}</span></button>)}</nav>
  <CookieConsent/>
 </>;
}
async function share(t:string){const d={title:t,text:`¿Qué hacemos? ${t}`,url:location.href};
 if(navigator.share) try{await navigator.share(d)}catch{} else {await navigator.clipboard?.writeText(d.url);alert('Link copiado')}}

function CookieConsent(){
 const [choice,setChoice]=useLocal<'pending'|'accepted'|'rejected'>('cookie-consent','pending');
 if(choice!=='pending')return null;
 return <aside className="cookie-banner" role="dialog" aria-label="Preferencias de privacidad"><div className="cookie-copy"><Cookie size={20}/><div><strong>Tu privacidad importa</strong><p>Usamos almacenamiento local y cookies técnicas para mantener tu sesión, favoritos y planes. No vendemos tus datos.</p><a href="mailto:hola@quehacemos.app?subject=Consulta%20de%20privacidad">Consultas de privacidad</a></div></div><div className="cookie-actions"><button className="btn sm ghost" onClick={()=>setChoice('rejected')}>Rechazar no esenciales</button><button className="btn sm" onClick={()=>setChoice('accepted')}>Aceptar</button></div></aside>;
}

function Saved({favs,plans,open,toggle,clear,evs}:{evs:Ev[];favs:string[];plans:string[];open:(id:string)=>void;toggle:(id:string)=>void;clear:()=>void}){
 const [tab,setTab]=useState<'g'|'p'>('g');
 const [notice,setNotice]=useState(typeof Notification==='undefined'?'unsupported':Notification.permission);
 const enableNotices=async()=>{if(typeof Notification==='undefined')return setNotice('unsupported');const permission=await Notification.requestPermission();setNotice(permission);if(permission==='granted')new Notification('Avisos activados',{body:'Te avisaremos cuando vuelvas por tus planes guardados.',icon:'/san-rafael-mark.svg'});};
 useEffect(()=>{if(notice==='granted'&&favs.length){const key=`notice-${new Date().toISOString().slice(0,10)}`;if(!localStorage.getItem(key)){new Notification('Tus planes en San Rafael',{body:`Tenés ${favs.length} ${favs.length===1?'evento guardado':'eventos guardados'} para revisar.`,icon:'/san-rafael-mark.svg'});localStorage.setItem(key,'1');}}},[notice,favs.length]);
 return <section className="sec"><h2>Mis planes</h2><div className="chips"><button className={tab==='g'?'chip on':'chip'} onClick={()=>setTab('g')}>Guardados</button><button className={tab==='p'?'chip on':'chip'} onClick={()=>setTab('p')}>Mis planes</button></div>
 {tab==='g'&&<div className="notice-box"><div><strong>Recordatorios</strong><p>Recibí un aviso cuando vuelvas a visitar la página.</p></div><button className="btn sm ghost" onClick={enableNotices} disabled={notice==='granted'}>{notice==='granted'?'Avisos activos':notice==='denied'?'Permiso bloqueado':notice==='unsupported'?'No disponible':'Activar avisos'}</button></div>}
 {tab==='g'?(favs.length?evs.filter(e=>favs.includes(e.id)).map(e=><button key={e.id} className="ag" onClick={()=>open(e.id)}><b>{e.time}</b><span>{e.title}<small>{e.day} · {e.location}</small></span></button>):<p className="empty">Todavía no guardaste nada. Tocá el corazón en cualquier evento.</p>)
 :(plans.length?<>{plans.map((p,i)=><pre key={i} className="plan">{p}</pre>)}<button className="btn ghost" onClick={clear}>Borrar planes</button></>:<p className="empty">Todavía no armaste ningún plan. Probá “Armá tu finde”.</p>)}</section>;
}

function Builder({save,back}:{save:(p:string)=>void;back:()=>void}){
 const [day,setDay]=useState('Sábado'); const [who,setWho]=useState('Amigos'); const [budget,setBudget]=useState(25000); const [moods,setMoods]=useState<string[]>(['Aventura']); const [done,setDone]=useState(false);
 const steps=useMemo(()=>Array.from(new Map(moods.flatMap(m=>spotsByMood[m]).map(step=>[step.t,step])).values()).sort((a,b)=>(a.h<'06'?'z'+a.h:a.h).localeCompare(b.h<'06'?'z'+b.h:b.h)),[moods]);
 const total=steps.reduce((s,x)=>s+x.cost,0); const txt=`${day} (${who})\n${steps.map(s=>`${s.h} ${s.t}`).join('\n')}\nPresupuesto estimado: $${total.toLocaleString('es-AR')}`;
 const autoBuild=(mode:'cheap'|'experience')=>{const cheap=mode==='cheap';setDay(cheap?'Domingo':'Sábado');setWho(cheap?'Amigos':'Pareja');setBudget(cheap?25000:100000);setMoods(cheap?['Naturaleza','Gastronomía']:['Aventura','Gastronomía']);setDone(true)};
 const Opt=({v,cur,set}:{v:string|number;cur:string|number;set:()=>void})=><button className={v===cur?'chip on':'chip'} onClick={set}>{typeof v==='number'?(v===0?'$0':v>=50000?'$50.000+':`Hasta $${v.toLocaleString('es-AR')}`):v}</button>;
 return <section className="sec builder"><button className="back" onClick={back}><ArrowLeft size={18}/> Volver al inicio</button>
  <div className="builder-head"><span className="eyebrow">PLANIFICADOR PERSONAL</span><h2>Armá tu finde</h2><p className="sub">Tres decisiones rápidas y te devolvemos un plan listo para compartir.</p></div>
  <div className="builder-progress"><span className="active"><b>1</b> Elegí</span><i/><span className={moods.length?'active':''}><b>2</b> Combiná</span><i/><span className={done?'active':''}><b>3</b> Disfrutá</span></div>
  <div className="auto-build"><div><small className="eyebrow">MODO AUTOMÁTICO</small><strong>¿Preferís que lo armemos por vos?</strong><p>Usamos precios online orientativos y priorizamos ahorro o experiencia.</p></div><div className="auto-actions"><button className="btn sm ghost" onClick={()=>autoBuild('cheap')}>Más económico</button><button className="btn sm" onClick={()=>autoBuild('experience')}>Mejor experiencia</button></div></div>
  <div className="builder-grid"><div className="builder-options">
   <div className="builder-block"><small className="eyebrow">CUÁNDO</small><h3>¿Qué día salís?</h3><div className="chips">{['Viernes','Sábado','Domingo'].map(d=><Opt key={d} v={d} cur={day} set={()=>setDay(d)}/>)}</div></div>
   <div className="builder-block"><small className="eyebrow">COMPAÑÍA</small><h3>¿Con quién vas?</h3><div className="chips">{['Solo','Pareja','Amigos','Familia'].map(d=><Opt key={d} v={d} cur={who} set={()=>setWho(d)}/>)}</div></div>
   <div className="builder-block"><small className="eyebrow">PRESUPUESTO</small><h3>¿Cuánto querés gastar?</h3><div className="chips">{[0,10000,25000,50000].map(d=><Opt key={d} v={d} cur={budget} set={()=>setBudget(d)}/>)}</div></div>
   <div className="builder-block"><small className="eyebrow">ESTILO</small><h3>¿Qué te gustaría hacer?</h3><div className="chips">{Object.keys(spotsByMood).map(m=><button key={m} className={moods.includes(m)?'chip on':'chip'} onClick={()=>setMoods(x=>x.includes(m)?x.filter(y=>y!==m):[...x,m])}>{m}</button>)}</div></div>
  </div><aside className="builder-preview"><small className="eyebrow">TU BORRADOR</small><h3>{day} · {who}</h3><p>{steps.length ? `${steps.length} actividades seleccionadas` : 'Elegí al menos un estilo'}</p><div className="preview-total"><span>Estimado</span><strong>${total.toLocaleString('es-AR')}</strong></div><button className="btn" disabled={!moods.length} onClick={()=>setDone(true)}>Generar mi plan</button><small className="price-note">Precios orientativos: pueden cambiar según fecha, cupos y proveedor.</small></aside></div>
  {done&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="result"><h3>Tu plan · {day}</h3>
  {steps.map(s=><div key={s.t} className="step"><b>{s.h}</b><span><ActivityIcon name={s.icon}/> {s.t}</span></div>)}
  <p className="estimate"><Wallet size={16}/> Estimado: ${total.toLocaleString('es-AR')} {total>budget&&budget<50000?'· supera tu presupuesto, sacá algo':''}</p>
  <p className="source-note">Referencias consultadas: <a href="https://www.quehacersanrafael.site/atracciones/rafting-valle-grande" target="_blank" rel="noreferrer">rafting y tirolesa</a>, <a href="https://parquedelaaventura.com/" target="_blank" rel="noreferrer">Parque de la Aventura</a> y <a href="https://queresto.com/lacenaida" target="_blank" rel="noreferrer">menú de La Cenaida</a>.</p>
   <div className="row"><button className="btn" onClick={()=>save(txt)}>Guardar plan</button><button className="btn ghost" onClick={()=>share(txt)}><Share2 size={16}/> Compartir</button></div></motion.div>}
 </section>;
}

function ReportModal({event,onClose}:{event:Ev;onClose:()=>void}){
 const [reason,setReason]=useState('Horario o fecha incorrecta'); const [details,setDetails]=useState(''); const [sent,setSent]=useState(false);
 const send=()=>{const subject=encodeURIComponent(`Corrección de evento: ${event.title}`);const body=encodeURIComponent(`Evento: ${event.title}\nUbicación: ${event.location}\nMotivo: ${reason}\nDetalle: ${details||'Sin detalle adicional.'}`);window.location.href=`mailto:hola@quehacemos.app?subject=${subject}&body=${body}`;setSent(true);};
 return <div className="modal" onClick={onClose}><motion.div initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} className="sheet" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={e=>e.stopPropagation()}>
  <button className="x" aria-label="Cerrar" onClick={onClose}><X size={18}/></button>{sent?<><h3 id="report-title">Gracias por avisarnos</h3><p className="sub">Se abrió tu correo con la información del evento para que podamos revisarlo.</p><button className="btn" onClick={onClose}>Cerrar</button></>:<><h3 id="report-title">Ayudanos a mantenerlo actualizado</h3><p className="sub">¿Qué dato de “{event.title}” deberíamos corregir?</p><div className="form"><label>Motivo<select value={reason} onChange={e=>setReason(e.target.value)}><option>Horario o fecha incorrecta</option><option>Precio desactualizado</option><option>Ubicación incorrecta</option><option>Evento cancelado</option><option>Otro</option></select></label><label>Detalle adicional<textarea rows={4} value={details} placeholder="Contanos qué cambió..." onChange={e=>setDetails(e.target.value)}/></label></div><button className="btn" onClick={send}>Enviar corrección</button></>}</motion.div></div>;
}

function AuthModal({onClose,refresh}:{onClose:()=>void;refresh:()=>Promise<void>}){
 const [a,setA]=useState({email:'',password:''}); const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false);
 const submit=async()=>{setMsg('');
  if(a.password.length<6)return setMsg('La contraseña debe tener al menos 6 caracteres.');
  setBusy(true);
  try{ await signIn(a.email,a.password);
   await refresh(); onClose();
  }catch(e:any){setMsg(e.message||'Ocurrió un error. Probá de nuevo.')}
  setBusy(false)};
 return <div className="modal" onClick={onClose}><motion.div initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} className="sheet" role="dialog" aria-label="Ingresar" onClick={e=>e.stopPropagation()}>
  <button className="x" aria-label="Cerrar" onClick={onClose}>✕</button>
  <h3>Ingresar</h3><p className="sub">Las cuentas se habilitan únicamente después de aprobar una solicitud.</p>
  <p>{ACCESS_FORM && !ACCESS_FORM.includes('TU_FORM_ID')
   ? <a className="btn ghost" href={ACCESS_FORM} target="_blank" rel="noreferrer">Solicitar acceso</a>
   : <button className="btn ghost" onClick={() => setMsg('Configurá VITE_ACCESS_REQUEST_FORM_URL en .env con la URL de tu encuesta de Google Forms.')}>Solicitar acceso</button>}</p>
  <div className="form"><label>Email<input type="email" value={a.email} autoComplete="email" onChange={e=>setA({...a,email:e.target.value})}/></label>
   <label>Contraseña<input type="password" value={a.password} autoComplete="current-password" onChange={e=>setA({...a,password:e.target.value})}/></label></div>
  {msg&&<p className="note" role="status">{msg}</p>}
  <button className="btn" disabled={busy||!a.email||!a.password} onClick={submit}>{busy?'Un momento…':'Ingresar'}</button>
 </motion.div></div>;
}

function Engage({e,st,rate,going}:{e:Ev;st:Stats;rate:(id:string,n:number)=>void;going:(id:string,on:boolean)=>void}){
 const [hover,setHover]=useState(0);
 return <div className="result" style={{margin:'16px 0'}}><Meta s={st}/>
  <div className="row"><button className={st.iGo?'btn':'btn ghost'} onClick={()=>going(e.id,!st.iGo)}>{st.iGo?<><Check size={16}/> Voy a ir</>:'Voy a ir'}</button>
   <b>{st.going} {st.going===1?'persona va':'personas van'}</b></div>
  <h3>Calificá este evento</h3>
  <div onMouseLeave={()=>setHover(0)} style={{display:'flex',gap:4,color:'#F59E0B'}}>{[1,2,3,4,5].map(n=><button key={n} disabled={!!st.myStars} aria-label={`${n} ${n===1?'estrella':'estrellas'}`} onMouseEnter={()=>setHover(n)} onClick={()=>rate(e.id,n)}><Star size={30} fill={n<=(hover||st.myStars)?'currentColor':'none'}/></button>)}</div>
  <small style={{color:'var(--t2)'}}>{st.myStars?`Ya calificaste este evento con ${st.myStars}/5 desde este dispositivo.`:'Tocá una estrella para calificar una sola vez desde este dispositivo.'}</small></div>;
}