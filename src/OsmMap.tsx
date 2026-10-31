import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// @ts-ignore (sin tipos)
import OpeningHours from 'opening_hours';
import { MapPin, X } from 'lucide-react';
import { STATIC_PLACES } from './staticPlaces';
import type { Ev } from './data';

// Mapa: Leaflet para la visualizacion y catalogo local editable para los lugares.
const CENTER: [number, number] = [-34.6177, -68.3301];
const KINDS = [{ k: 'boliches', l: 'Boliches', c: '#EC4899' }, { k: 'bares', l: 'Bares', c: '#2563EB' }, { k: 'restaurantes', l: 'Restaurantes', c: '#F59E0B' }];
const color = (k: string) => KINDS.find(x => x.k === k)!.c;
type St = 'open' | 'closed' | 'unknown';
interface P { id: string; name: string; kind: string; lat: number; lng: number; addr: string; hours?: string; phone?: string }

async function fetchPlaces(): Promise<P[]> {
 return STATIC_PLACES;
}
async function geocodeEvent(e: Ev): Promise<Ev & { lat: number; lng: number }> {
 const fallback = { ...e, lat: e.coordinates[0], lng: e.coordinates[1] };
 try {
  const key = `event_point_${e.id}_${e.location}`; const cached = sessionStorage.getItem(key);
  if (cached) return { ...e, ...JSON.parse(cached) };
  const q = encodeURIComponent(`${e.location}, San Rafael, Mendoza, Argentina`);
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ar&q=${q}`, { headers: { Accept: 'application/json' } });
  if (!r.ok) return fallback;
  const hit = (await r.json())[0]; if (!hit) return fallback;
  const point = { lat: Number(hit.lat), lng: Number(hit.lon) }; sessionStorage.setItem(key, JSON.stringify(point));
  return { ...e, ...point };
 } catch { return fallback; }
}
function stateOf(p: P): St {
 if (!p.hours) return 'unknown';
 try { return new OpeningHours(p.hours, { lat: p.lat, lon: p.lng, address: { country_code: 'ar', state: 'Mendoza' } }).getState() ? 'open' : 'closed'; } catch { return 'unknown'; }
}
const rank = (s: St) => s === 'open' ? 0 : 1;
const mapsSearchUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query} en San Rafael, Mendoza`)}`;

export function OsmMapView({ events = [] }: { events?: Ev[] }) {
 const el = useRef<HTMLDivElement>(null); const map = useRef<L.Map | null>(null); const layer = useRef<L.LayerGroup | null>(null);
 const [places, setPlaces] = useState<P[]>([]); const [loading, setLoading] = useState(true); const [err, setErr] = useState(''); const [tick, setTick] = useState(0);
 const [eventPoints, setEventPoints] = useState<Array<Ev & { lat: number; lng: number }>>([]);
 const [active, setActive] = useState<string[]>(['boliches', 'bares', 'restaurantes']); const [onlyOpen, setOnlyOpen] = useState(false); const [sel, setSel] = useState<(P & { st: St }) | null>(null);

 useEffect(() => { const m = L.map(el.current!, { center: CENTER, zoom: 13, zoomControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(m);
  layer.current = L.layerGroup().addTo(m); map.current = m; return () => { m.remove(); map.current = null; }; }, []);
 useEffect(() => { setLoading(true); setErr(''); fetchPlaces().then(setPlaces).catch(e => setErr(e.message || 'No pudimos cargar los lugares.')).finally(() => setLoading(false)); }, [tick]);
 useEffect(() => { let cancelled = false; setEventPoints(events.map(e => ({ ...e, lat: e.coordinates[0], lng: e.coordinates[1] }))); Promise.all(events.map(geocodeEvent)).then(points => { if (!cancelled) setEventPoints(points); }); return () => { cancelled = true; }; }, [events]);

 const shown = useMemo(() => places.map(p => ({ ...p, st: stateOf(p) })).filter(p => active.includes(p.kind) && (onlyOpen ? p.st === 'open' : p.st !== 'closed'))
  .sort((a, b) => rank(a.st) - rank(b.st) || a.name.localeCompare(b.name)), [places, active, onlyOpen]);
 useEffect(() => { const g = layer.current; if (!g || !map.current) return; g.clearLayers();
  shown.forEach(p => L.circleMarker([p.lat, p.lng], { radius: 9, fillColor: color(p.kind), fillOpacity: 0.95, color: '#fff', weight: 2 }).on('click', () => setSel(p)).addTo(g));
  eventPoints.forEach(e => { const popup = document.createElement('div'); const title = document.createElement('strong'); title.textContent = e.title; const detail = document.createElement('div'); detail.textContent = `${e.date} · ${e.time || 'Hora a confirmar'} · ${e.location}`; popup.append(title, detail); L.circleMarker([e.lat, e.lng], { radius: 11, fillColor: e.tone, fillOpacity: 1, color: '#fff', weight: 3 }).bindPopup(popup).addTo(g); });
  const points = [...shown.map(p => [p.lat, p.lng] as [number, number]), ...eventPoints.map(e => [e.lat, e.lng] as [number, number])];
  if (points.length) map.current.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 }); }, [shown, eventPoints]);

 const choose = (p: P & { st: St }) => { setSel(p); map.current?.setView([p.lat, p.lng], 17); document.getElementById('osmmap')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
 const toggle = (k: string) => setActive(a => a.includes(k) ? a.filter(x => x !== k) : [...a, k]);
 const label = (k: string) => KINDS.find(x => x.k === k)!.l; const badge = (s: St) => s === 'open' ? 'Abierto ahora' : 'Horario no informado';
 return <section className="sec"><h2>Mapa</h2><p className="sub">Bares, restaurantes y boliches de San Rafael. Los cerrados ahora se ocultan.</p>
  <div className="chips">{KINDS.map(k => <button key={k.k} className={active.includes(k.k) ? 'chip on' : 'chip'} onClick={() => toggle(k.k)}><i className="dot" style={{ background: k.c }} /> {k.l}</button>)}
   <button className={onlyOpen ? 'chip on' : 'chip'} onClick={() => setOnlyOpen(o => !o)}>Solo abiertos confirmados</button>
   <a className="chip" href={mapsSearchUrl('restaurantes y bares')} target="_blank" rel="noreferrer">Buscar todos en Google Maps</a></div>
  {err && <p className="note" role="alert">{err} <button className="chip" onClick={() => setTick(t => t + 1)}>Reintentar</button></p>}
  <div style={{ position: 'relative', isolation: 'isolate' }}><div id="osmmap" ref={el} style={{ height: '62vh', minHeight: 360, borderRadius: 18, border: '1px solid var(--bd)', background: 'var(--c1)' }} />
   {loading && <div className="pop" style={{ zIndex: 1000, top: 12, bottom: 'auto', maxWidth: 200 }}>Buscando lugares…</div>}
  {sel && <div className="pop" style={{ zIndex: 1000 }}><button className="x" aria-label="Cerrar" onClick={() => setSel(null)}><X size={18} /></button><h3>{sel.name}</h3>
  <small>{label(sel.kind)} · {sel.st === 'open' && <i className="dot"/>} {badge(sel.st)}</small><p><MapPin size={13} /> {sel.addr || 'Dirección no informada'}</p>
    {sel.hours && <small>Horario: {sel.hours}</small>}
    <p><a className="btn sm" href={`https://www.google.com/maps/dir/?api=1&destination=${sel.lat},${sel.lng}`} target="_blank" rel="noreferrer">Cómo llegar</a></p></div>}</div>
  <h3>{loading ? '' : `${shown.length} lugares`}</h3>
  {!loading && !shown.length && !err && <p className="empty">No hay lugares con estos filtros. Probá desactivar “Solo abiertos confirmados”.</p>}
  {shown.map(p => <button key={p.id} className="ag" onClick={() => choose(p)}><b style={{ color: color(p.kind) }}>{label(p.kind)}</b><span>{p.name}<small>{p.addr || 'Dirección no informada'} · {badge(p.st)}</small></span></button>)}
  <p className="note">Datos de OpenStreetMap, cargados por la comunidad: pueden faltar locales u horarios. “Abierto” se calcula con el horario cargado; si no hay, se muestra “Horario no informado”.</p></section>;
}