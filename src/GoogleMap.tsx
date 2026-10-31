import { useEffect, useRef, useState } from 'react';
import { MapPin, Star } from 'lucide-react';
import { MapView } from './Extra';
declare const google: any;
const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;
const MAP_ID = (import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined) || 'DEMO_MAP_ID';
const CENTER = { lat: -34.6177, lng: -68.3301 };
const BOUNDS = { north: -34.55, south: -34.7, east: -68.22, west: -68.42 };
const KINDS = [
 { k: 'boliches', l: 'Boliches', q: 'boliches y discotecas', type: 'night_club', c: '#EC4899' },
 { k: 'bares', l: 'Bares', q: 'bares', type: 'bar', c: '#2563EB' },
 { k: 'restaurantes', l: 'Restaurantes', q: 'restaurantes', type: 'restaurant', c: '#F59E0B' },
];
interface P { id: string; name: string; addr: string; lat: number; lng: number; rating?: number; n?: number; url?: string; kind: string }

let loader: Promise<void> | null = null;
const loadGoogle = () => (loader ??= new Promise<void>((res, rej) => {
 if ((window as any).google?.maps?.importLibrary) return res();
 (window as any).__gm = () => res();
 const s = document.createElement('script'); s.async = true; s.onerror = () => rej(new Error('No se pudo cargar Google Maps.'));
 s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&v=weekly&loading=async&language=es&region=AR&callback=__gm`; document.head.appendChild(s);
}));

async function fetchKind(k: typeof KINDS[number], open: boolean): Promise<P[]> {
 const { Place } = await google.maps.importLibrary('places');
 const { places } = await Place.searchByText({ textQuery: `${k.q} en San Rafael, Mendoza`, includedType: k.type, maxResultCount: 20, locationRestriction: BOUNDS, language: 'es', region: 'ar',
  ...(open ? { isOpenNow: true } : {}), fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating', 'userRatingCount', 'googleMapsURI'] });
 return places.map((p: any) => ({ id: p.id, name: p.displayName, addr: p.formattedAddress || '', lat: p.location.lat(), lng: p.location.lng(), rating: p.rating ?? undefined, n: p.userRatingCount ?? undefined, url: p.googleMapsURI, kind: k.k }));
}

function Real() {
 const el = useRef<HTMLDivElement>(null); const map = useRef<any>(null); const marks = useRef<any[]>([]);
 const [ready, setReady] = useState(false); const [err, setErr] = useState('');
 const [active, setActive] = useState<string[]>(['boliches', 'bares', 'restaurantes']); const [open, setOpen] = useState(true);
 const [cache, setCache] = useState<Record<string, P[]>>({}); const [loading, setLoading] = useState(false); const [sel, setSel] = useState<P | null>(null);

 useEffect(() => { (window as any).gm_authFailure = () => setErr('Google rechazó la clave de API. Revisá que esté habilitada Maps JavaScript API y Places API (New), y las restricciones de dominio.');
  loadGoogle().then(async () => { const { Map } = await google.maps.importLibrary('maps'); await google.maps.importLibrary('marker');
  map.current = new Map(el.current, { center: CENTER, zoom: 13, mapId: MAP_ID, colorScheme: 'LIGHT', gestureHandling: 'greedy', mapTypeControl: false, streetViewControl: false }); setReady(true); }).catch(e => setErr(e.message)); }, []);

 useEffect(() => { if (!ready) return; const todo = KINDS.filter(k => active.includes(k.k) && !cache[`${k.k}:${open}`]); if (!todo.length) return;
  setLoading(true); setErr('');
  Promise.all(todo.map(async k => [`${k.k}:${open}`, await fetchKind(k, open)] as const)).then(r => setCache(c => ({ ...c, ...Object.fromEntries(r) })))
   .catch(e => setErr('No pudimos cargar los lugares: ' + (e.message || 'error de Places API'))).finally(() => setLoading(false)); }, [ready, active, open]);

 const shown = active.flatMap(k => cache[`${k}:${open}`] ?? []).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
 useEffect(() => { if (!ready) return; marks.current.forEach(m => (m.map = null)); marks.current = [];
  const { AdvancedMarkerElement, PinElement } = google.maps.marker; const bounds = new google.maps.LatLngBounds();
  shown.forEach(p => { const c = KINDS.find(k => k.k === p.kind)!.c; const pin = new PinElement({ background: c, borderColor: '#fff', glyphColor: '#fff' });
   const m = new AdvancedMarkerElement({ map: map.current, position: { lat: p.lat, lng: p.lng }, content: pin.element, title: p.name }); m.addListener('click', () => setSel(p)); marks.current.push(m); bounds.extend({ lat: p.lat, lng: p.lng }); });
  if (shown.length) map.current.fitBounds(bounds, 60); }, [ready, cache, active, open]);

 const choose = (p: P) => { setSel(p); map.current?.panTo({ lat: p.lat, lng: p.lng }); map.current?.setZoom(16); document.getElementById('gmap')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
 const toggle = (k: string) => setActive(a => a.includes(k) ? a.filter(x => x !== k) : [...a, k]);
 const label = (k: string) => KINDS.find(x => x.k === k)!.l;
 return <section className="sec"><h2>Mapa</h2><p className="sub">{open ? 'Bares, restaurantes y boliches abiertos ahora en San Rafael.' : 'Bares, restaurantes y boliches de San Rafael.'}</p>
  <div className="chips">{KINDS.map(k => <button key={k.k} className={active.includes(k.k) ? 'chip on' : 'chip'} onClick={() => toggle(k.k)}><i className="dot" style={{ background: k.c }} /> {k.l}</button>)}
   <button className={open ? 'chip on' : 'chip'} onClick={() => setOpen(o => !o)}>Abierto ahora</button></div>
  {err && <p className="note" role="alert">{err}</p>}
  <div style={{ position: 'relative' }}><div id="gmap" ref={el} style={{ height: '62vh', minHeight: 360, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--bd)', background: 'var(--c1)' }} />
   {loading && <div className="pop" style={{ top: 12, bottom: 'auto', maxWidth: 200 }}>Buscando lugares…</div>}
   {sel && <div className="pop"><button className="x" aria-label="Cerrar" onClick={() => setSel(null)}>✕</button><h3>{sel.name}</h3>
    <small>{label(sel.kind)}{open ? ' · Abierto ahora' : ''}{sel.rating ? ` · ⭐ ${sel.rating} (${sel.n ?? 0})` : ''}</small><p><MapPin size={13} /> {sel.addr}</p>
    {sel.url && <a className="btn sm" href={sel.url} target="_blank" rel="noreferrer">Ver en Google Maps</a>}</div>}</div>
  <h3>{shown.length ? `${shown.length} lugares` : loading ? '' : 'Sin resultados'}</h3>
  {!loading && !shown.length && !err && <p className="empty">No encontramos lugares abiertos con estos filtros. Probá desactivar “Abierto ahora”.</p>}
  {shown.map(p => <button key={p.id} className="ag" onClick={() => choose(p)}><b style={{ color: KINDS.find(k => k.k === p.kind)!.c }}>{label(p.kind)}</b>
   <span>{p.name}<small>{p.addr}{p.rating ? ` · ⭐ ${p.rating}` : ''}</small></span></button>)}
  <p className="note">Datos de Google Maps. La disponibilidad de horarios depende de lo que carga cada local.</p></section>;
}

export function GoogleMapView({ go, evs }: { go: (v: any) => void; evs: any[] }) {
 return KEY ? <Real /> : <><MapView go={go} evs={evs} /><section className="sec" style={{ paddingTop: 0 }}><p className="note">Mapa de muestra. Para ver el mapa real de Google con lugares abiertos, configurá VITE_GOOGLE_MAPS_KEY en el archivo .env.</p></section></>;
}
