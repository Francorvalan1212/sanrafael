import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Share2, Copy, X, Instagram, Facebook, Mail, MessageCircle, ArrowUpRight, Utensils, Flame, Waves, Mountain, Wine, Heart, Users, Wallet, Moon, Drama, Sun, CloudSun, CloudFog, CloudRain, CloudLightning } from 'lucide-react';
import { type Ev, events, places, adventures, moods, nightKinds, categories, fmt } from './data';
import { useLocal } from './store';
type Go = (v: any) => void;
const T = (c: string) => ({ '--tone': c } as React.CSSProperties);
const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q + ' San Rafael Mendoza')}`;
const weatherLabel=(code:number)=>code===0?'Despejado':code<=3?'Parcialmente nublado':code<=48?'Niebla':code<=67?'Lluvia':code<=77?'Nieve':code<=82?'Chaparrones':'Tormenta';
const weatherIcon=(code:number)=>code===0?<Sun/>:code<=3?<CloudSun/>:code<=48?<CloudFog/>:code<=77?<CloudRain/>:code<=82?<CloudRain/>:<CloudLightning/>;
export const ActivityIcon=({name}:{name:string})=>({food:<Utensils/>,party:<Flame/>,water:<Waves/>,adventure:<Waves/>,wine:<Wine/>,mountain:<Mountain/>,sun:<Sun/>,culture:<Drama/>}[name]||<MapPin/>);
const moodIcon=(name:string)=>({party:<Flame/>,mountain:<Mountain/>,wine:<Wine/>,heart:<Heart/>,family:<Users/>,wallet:<Wallet/>}[name]||<MapPin/>);

const touristRoutes = [
 {days:'1 día', title:'Esencia de San Rafael', intro:'Paisajes, vino y una noche tranquila.', cost:'Desde $25.000', stops:[['Mañana','Cañón del Atuel','Naturaleza'],['Tarde','Bodega y degustación','Gastronomía'],['Noche','Cena en la ciudad','Gastronomía']]},
 {days:'2 días', title:'Aventura y sabores', intro:'El equilibrio ideal para una escapada de fin de semana.', cost:'Desde $60.000', stops:[['Día 1','Rafting en Valle Grande','Aventura'],['Día 1','Cena entre viñedos','Gastronomía'],['Día 2','Bodegas de Rama Caída','Gastronomía'],['Día 2','Atardecer en Los Reyunos','Naturaleza']]},
 {days:'3 días', title:'San Rafael completo', intro:'Una guía para conocer lo esencial sin correr.', cost:'Desde $95.000', stops:[['Día 1','Cañón del Atuel','Naturaleza'],['Día 2','Rafting o trekking','Aventura'],['Día 3','Bodegas, plaza y cena','Gastronomía']]}
];

export function TouristGuide({go}:{go:Go}){
 const [selected,setSelected]=useState(1); const route=touristRoutes[selected];
 return <section className="sec tourist-guide"><div className="section-title"><div><span className="eyebrow">GUÍA PARA VISITANTES</span><h2>Tu viaje, resuelto</h2><p className="sub">Elegí cuántos días tenés y te proponemos un recorrido con lo mejor de San Rafael.</p></div><span className="tourist-pin"><MapPin size={17}/> San Rafael</span></div>
  <div className="tourist-tabs">{touristRoutes.map((r,i)=><button key={r.days} className={i===selected?'tourist-tab on':'tourist-tab'} onClick={()=>setSelected(i)}><b>{r.days}</b><small>{i===0?'Escapada':i===1?'Fin de semana':'Experiencia completa'}</small></button>)}</div>
  <div className="tourist-route"><div><h3>{route.title}</h3><p>{route.intro}</p><strong>{route.cost} por persona</strong></div><div className="route-stops">{route.stops.map(([when,place,kind])=><button key={`${when}-${place}`} onClick={()=>go('explorar')}><small>{when} · {kind}</small><b>{place}</b><span>Ver planes</span></button>)}</div><div className="row"><button className="btn" onClick={()=>go('armar')}>Personalizar recorrido</button><button className="btn ghost" onClick={()=>go('mapa')}>Abrir mapa</button></div></div>
 </section>;
}

export function SanRafaelWeather(){
 const [data,setData]=useState<any>(null); const [error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.6177&longitude=-68.3301&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FArgentina%2FMendoza&forecast_days=3',{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('weather');return r.json()}).then(setData).catch(e=>{if(e.name!=='AbortError')setError(true)});return()=>controller.abort()},[]);
 if(error)return <section className="weather sec"><div><span className="eyebrow">SAN RAFAEL AHORA</span><h3>Clima no disponible</h3><p className="sub">Podés seguir explorando todos los planes.</p></div></section>;
 if(!data)return <section className="weather sec"><div className="weather-loading"><span className="eyebrow">SAN RAFAEL AHORA</span><strong>Consultando el clima…</strong></div></section>;
 return <section className="weather sec"><div className="weather-now"><span className="eyebrow">SAN RAFAEL AHORA</span><div className="weather-main"><b>{weatherIcon(data.current.weather_code)}</b><strong>{Math.round(data.current.temperature_2m)}°</strong><span>{weatherLabel(data.current.weather_code)}<small>Viento {Math.round(data.current.wind_speed_10m)} km/h</small></span></div></div><div className="weather-days">{data.daily.time.map((day:string,i:number)=><div key={day}><b>{i===0?'Hoy':new Date(`${day}T12:00:00`).toLocaleDateString('es-AR',{weekday:'short'})}</b><span>{Math.round(data.daily.temperature_2m_max[i])}° / {Math.round(data.daily.temperature_2m_min[i])}°</span><small>{data.daily.precipitation_probability_max[i]}% lluvia</small></div>)}</div></section>;
}

export const Moods = ({ pick }: { pick: (c: any, q: string) => void }) => (
 <section className="sec"><h2>Buscá tu plan</h2><p className="sub">Decinos qué tenés ganas de hacer y te mostramos opciones.</p>
  <div className="tiles">{moods.map(m => <button key={m.t} className="tile" style={T(m.tone)} onClick={() => pick(m.cat, m.q)}><div className="tile-icon">{moodIcon(m.icon)}</div><h3>{m.t}</h3><small>{m.s}</small></button>)}</div></section>);

export function Night({ go }: { go: Go }) {
 const [k, setK] = useState('Todos'); const l = places.filter(p => k === 'Todos' || p.kind === k);
 return <section className="sec"><h2><Moon className="section-icon"/> ¿Dónde salimos hoy?</h2><p className="sub">Descubrí bares, boliches, fiestas y música en vivo.</p>
  <div className="chips">{nightKinds.map(n => <button key={n} className={n === k ? 'chip on' : 'chip'} onClick={() => setK(n)}>{n}</button>)}</div>
  {l.length ? <div className="grid">{l.map(p => <motion.div layout key={p.id} className="card" style={T(p.tone)}>
   <div className="ph short"><span className="cat"><i className={p.isOpen ? 'dot' : 'dot off'} /> {p.isOpen ? 'Abierto esta noche' : 'Cerrado'}</span></div>
   <div className="body"><h3>{p.name}</h3><p><MapPin size={13} /> {p.address} · {p.type}</p>
    <div className="row"><a className="btn sm ghost" href={mapsUrl(p.name)} target="_blank" rel="noreferrer">Ver ubicación</a><button className="btn sm" onClick={() => go('agenda')}>Ver eventos</button></div></div></motion.div>)}</div>
   : <p className="empty">Todavía no cargamos lugares de esta categoría.</p>}
  <p className="note">Estado “abierto” de demostración, sin horarios reales.</p></section>;
}

export const Adventure = ({ all }: { all: () => void }) => (
 <section className="sec"><h2><Mountain className="section-icon"/> ¿Te animás?</h2><p className="sub">Aventura, naturaleza y paisajes que tenés que conocer.</p>
  <div className="hs">{adventures.map(a => <div key={a.id} className="adv" style={T(a.tone)}><small>{a.tag}</small><h3>{a.title}</h3><span><MapPin size={13} /> {a.where}</span></div>)}</div>
  <button className="btn" onClick={all}>Ver todas las aventuras</button></section>);

type FriendItem = { t: string; on: boolean; cost?: number; eventId?: string };
export function Friends({ events: published }: { events: Ev[] }) {
 const [items, setItems] = useLocal<FriendItem[]>('friends', [{ t: 'Rafting', on: true }, { t: 'Almuerzo', on: true }, { t: 'Atardecer', on: true }, { t: 'Boliche', on: false }]);
 const [people, setPeople] = useLocal('friends-people', 4);
 const [newItem, setNewItem] = useState('');
 const [modal, setModal] = useState(false); const [ok, setOk] = useState(false);
 useEffect(() => { const params = new URLSearchParams(location.search); const shared = params.get('plan'); const sharedPeople = Number(params.get('personas')); if (shared) setItems(shared.split('|').filter(Boolean).map(t => ({ t, on: true }))); if (sharedPeople > 0) setPeople(sharedPeople); }, []);
 const selected = items.filter(it => it.on);
 const total = selected.reduce((sum, it) => sum + (it.cost ?? ({ Rafting: 35000, Almuerzo: 9000, Atardecer: 0, Boliche: 15000 }[it.t] || 0)), 0);
 const perPerson = people ? Math.ceil(total / people) : 0;
 const link = `${location.origin}${location.pathname}?plan=${encodeURIComponent(selected.map(it => it.t).join('|'))}&personas=${people}`;
 const copy = async () => { try { await navigator.clipboard.writeText(link); setOk(true); } catch { setOk(false); } };
 const addItem = () => { const title = newItem.trim(); if (!title || items.some(it => it.t.toLowerCase() === title.toLowerCase())) return; setItems(x => [...x, { t: title, on: true }]); setNewItem(''); };
 return <section className="sec"><h2><Users className="section-icon"/> Planes con amigos</h2>
  <div className="result friends-plan"><h3><Flame className="inline-icon"/> Finde con los pibes</h3><p className="sub">Elegí las actividades y repartí el presupuesto entre el grupo.</p>
   <div className="friends-toolbar"><strong>{selected.length} {selected.length === 1 ? 'actividad' : 'actividades'}</strong><label className="people-count">Personas <button type="button" aria-label="Restar persona" onClick={() => setPeople(Math.max(1, people - 1))}>−</button><b>{people}</b><button type="button" aria-label="Sumar persona" onClick={() => setPeople(people + 1)}>+</button></label></div>
  {items.map((it, i) => <label key={it.eventId || it.t} className="chk"><input type="checkbox" checked={it.on} onChange={() => setItems(x => x.map((y, j) => j === i ? { ...y, on: !y.on } : y))} /> <span>{it.t}</span><small>{it.cost ? `$${it.cost.toLocaleString('es-AR')}` : ({ Atardecer: 'Gratis' }[it.t] || 'A confirmar')}</small></label>)}
   <div className="add-activity"><input value={newItem} placeholder="Agregar actividad" onChange={e => setNewItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addItem(); }} /><button className="btn sm ghost" type="button" onClick={addItem}>Agregar</button></div>
  {published.length > 0 && <div className="published-activities"><small>Eventos publicados</small>{published.map(e => { const added = items.some(it => it.eventId === e.id || it.t === e.title); return <div key={e.id} className="published-activity"><span><b>{e.title}</b><small>{e.day} · {e.location} · {e.price ? `$${e.price.toLocaleString('es-AR')}` : 'A confirmar'}</small></span><button className="btn sm ghost" type="button" disabled={added} onClick={() => setItems(x => [...x, { t: e.title, on: true, cost: e.price, eventId: e.id }])}>{added ? 'Agregado' : 'Agregar'}</button></div>; })}</div>}
   <div className="budget"><span>Estimado total <b>${total.toLocaleString('es-AR')}</b></span><span>Por persona <b>${perPerson.toLocaleString('es-AR')}</b></span></div>
   <div className="row"><button className="btn" onClick={() => setModal(true)}>Invitar amigos</button><button className="btn ghost" onClick={() => setModal(true)}><Share2 size={16} /> Compartir</button></div></div>
  {modal && <div className="modal" onClick={() => { setModal(false); setOk(false); }}><motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sheet" onClick={e => e.stopPropagation()}>
   <button className="x" aria-label="Cerrar" onClick={() => { setModal(false); setOk(false); }}><X size={18} /></button><h3>Compartí el plan</h3>
   <div className="search"><input readOnly value={link} /><button onClick={copy} aria-label="Copiar"><Copy size={18} /></button></div>
   {ok && <p className="note">Link copiado.</p>}
   <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(`Finde con los pibes: ${selected.map(it => it.t).join(', ')}. Somos ${people} y son $${perPerson.toLocaleString('es-AR')} por persona. ${link}`)}`} target="_blank" rel="noreferrer">Enviar por WhatsApp</a></motion.div></div>}
 </section>;
}

const layer = (c: string) => c === 'Fiestas' || c === 'Música' ? 'Noche' : c === 'Aventura' ? 'Naturaleza' : c === 'Gastronomía' ? 'Gastronomía' : c === 'Cultura' ? 'Cultura' : 'Eventos';
const layers: [string, string][] = [['Noche', '#EC4899'], ['Naturaleza', '#22C55E'], ['Gastronomía', '#F59E0B'], ['Eventos', '#EC4899'], ['Cultura', '#F97316']];
export function MapView({ go, evs }: { go: Go; evs: Ev[] }) {
 const [on, setOn] = useState<string[]>(layers.map(l => l[0])); const [sel, setSel] = useState<string | null>(null);
 const pins = [...evs.map(e => ({ id: e.id, t: e.title, sub: `${e.day} · ${e.time}`, where: e.location, lay: layer(e.category), c: e.coordinates, ev: true })),
  ...places.map(p => ({ id: p.id, t: p.name, sub: p.type, where: p.address, lay: 'Noche', c: p.coordinates, ev: false }))]
  .map((p, i) => ({ ...p, x: Math.min(92, Math.max(6, (p.c[1] + 68.42) / 0.14 * 100 + (i % 3) * 3)), y: Math.min(88, Math.max(8, (-34.58 - p.c[0]) / 0.3 * 100 + (i % 2) * 4)) }));
 const cur = pins.find(p => p.id === sel);
 return <section className="sec"><h2>Mapa</h2><p className="sub">Vista de muestra: después se conecta a Mapbox, Google Maps u OpenStreetMap.</p>
  <div className="chips">{layers.map(([n, c]) => <button key={n} className={on.includes(n) ? 'chip on' : 'chip'} onClick={() => setOn(x => x.includes(n) ? x.filter(y => y !== n) : [...x, n])}><i className="dot" style={{ background: c }} /> {n}</button>)}</div>
  <div className="map">{pins.filter(p => on.includes(p.lay)).map(p => <button key={p.id} className="pin" aria-label={p.t} style={{ left: p.x + '%', top: p.y + '%', background: layers.find(l => l[0] === p.lay)![1] }} onClick={() => setSel(p.id)} />)}
   {cur && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pop"><h3>{cur.t}</h3><small>{cur.sub}</small><p><MapPin size={13} /> {cur.where}</p>
    {cur.ev ? <button className="btn sm" onClick={() => go({ ev: cur.id })}>Ver detalles</button> : <a className="btn sm" href={mapsUrl(cur.t)} target="_blank" rel="noreferrer">Ver ubicación</a>}</motion.div>}</div>
  <a className="btn" style={{ display: 'inline-block', marginTop: 14 }} href={mapsUrl('')} target="_blank" rel="noreferrer">Abrir mapa completo</a></section>;
}

export const Footer = ({ go }: { go: Go }) => (
 <footer className="foot"><div className="foot-main"><div className="foot-brand"><div className="brand foot-brandmark"><img src="/san-rafael-mark.svg" alt="San Rafael, Mendoza"/><span className="logo">¿QUÉ HACEMOS?<small>SAN RAFAEL</small></span></div><p>La guía local para descubrir planes, eventos y lugares que valen la pena.</p><span className="foot-location"><MapPin size={14}/> San Rafael, Mendoza</span></div>
  <div className="foot-column"><strong>Descubrí</strong>{([['Explorar', 'explorar'], ['Agenda', 'agenda'], ['Mapa', 'mapa'], ['Armá tu finde', 'armar']] as const).map(([l, v]) => <button key={l} onClick={() => go(v)}>{l}<ArrowUpRight size={13}/></button>)}</div>
  <div className="foot-column"><strong>Participá</strong><button onClick={() => go('publicar')}>Publicar evento<ArrowUpRight size={13}/></button><a href="mailto:hola@quehacemos.app">Contacto<Mail size={13}/></a><a href="mailto:hola@quehacemos.app?subject=Corrección%20de%20información">Corregir información<ArrowUpRight size={13}/></a></div>
  <div className="foot-column foot-social"><strong>Seguinos</strong><div className="social-links"><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18}/></a><a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={18}/></a><a href="https://wa.me/" target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={18}/></a></div><small>Ideas, novedades y planes<br/>para tu próximo finde.</small></div></div>
  <div className="foot-bottom"><small>© 2026 ¿Qué hacemos, San Rafael?</small><div><a href="mailto:hola@quehacemos.app?subject=Privacidad">Privacidad</a><span>·</span><a href="mailto:hola@quehacemos.app?subject=Contacto">Contacto</a></div></div></footer>);
