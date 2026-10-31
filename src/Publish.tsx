import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { categories, fmt, type Ev } from './data';
import { publishEvent, deleteEvent, signIn, signOut, remoteMode } from './api';
const fields: [string, string, string][] = [['name', 'Nombre del evento', 'text'], ['date', 'Fecha', 'date'], ['time', 'Hora', 'time'], ['location', 'Ubicación', 'text'], ['price', 'Precio', 'number'], ['instagram', 'Instagram', 'text'], ['whatsapp', 'WhatsApp', 'tel'], ['tickets', 'Link de entradas', 'url']];
const ACCESS_FORM = import.meta.env.VITE_ACCESS_REQUEST_FORM_URL as string | undefined;
export function Publish({ uid, mine, refresh }: { uid: string | null; mine: Ev[]; refresh: () => Promise<void> }) {
 const blank = { category: categories[0] } as Record<string, string>;
 const [f, setF] = useState(blank); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
 const [file, setFile] = useState<File | null>(null); const [fk, setFk] = useState(0);
 const [a, setA] = useState({ email: '', password: '' });
 const today = new Date().toISOString().slice(0, 10);
 const ok = !!(f.name && f.name.trim().length >= 3 && f.date && f.date >= today && f.location && f.location.trim().length >= 3);
 const statusCounts = { pending: mine.filter(e => e.status === 'pending').length, approved: mine.filter(e => e.status === 'approved').length, rejected: mine.filter(e => e.status === 'rejected').length };
 const pick = (fl?: File) => { if (!fl) return setFile(null); if (!fl.type.startsWith('image/')) { setMsg('Elegí un archivo de imagen.'); return; } if (fl.size > 5e6) { setMsg('La imagen pesa más de 5 MB.'); return; } setMsg(''); setFile(fl); };
 const submit = async () => { setBusy(true); setMsg(''); try { await publishEvent(f, file); setF(blank); setFile(null); setFk(k => k + 1); setMsg('Evento enviado. Queda pendiente de aprobación.'); await refresh(); } catch (e: any) { setMsg('No pudimos publicar: ' + (e.message || 'error')); } setBusy(false); };
 const del = async (e: Ev) => { if (!confirm('¿Borrar este evento? No se puede deshacer.')) return; try { await deleteEvent(e.id, e.image); setMsg('Evento borrado.'); await refresh(); } catch (er: any) { setMsg('No pudimos borrar: ' + er.message); } };
 const auth = async () => { setMsg(''); if (a.password.length < 6) return setMsg('La contraseña debe tener al menos 6 caracteres.');
  setBusy(true); try { await signIn(a.email, a.password); await refresh(); } catch (e: any) { setMsg(e.message); } setBusy(false); };
 return <section className="sec"><h2><Plus className="section-icon"/> Publicá tu evento</h2><p className="sub">¿Organizás algo en San Rafael? Llegá a personas que están buscando qué hacer.</p>
  {remoteMode && uid ? <>
  <div className="form">{fields.map(([k, l, t]) => <label key={k}>{l}{['name', 'date', 'location'].includes(k) && ' *'}<input required={['name', 'date', 'location'].includes(k)} type={t} min={k === 'price' ? 0 : k === 'date' ? today : undefined} value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>)}
    <label>Categoría<select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
    <label className="full">Imagen<input key={fk} type="file" accept="image/*" onChange={e => pick(e.target.files?.[0])} /></label>
    {file && <img className="prev" alt="Vista previa" src={URL.createObjectURL(file)} />}
    <label className="full">Descripción<textarea rows={4} value={f.description || ''} onChange={e => setF({ ...f, description: e.target.value })} /></label></div>
  <button className="btn" disabled={busy} onClick={() => ok ? submit() : setMsg(`Completá nombre y ubicación, y elegí una fecha desde hoy (${today}).`)}>{busy ? 'Publicando…' : 'Publicar evento'}</button>
   <button className="btn ghost" style={{ marginLeft: 8 }} onClick={() => signOut()}>Salir</button>
   <h3>Mis eventos publicados</h3><div className="organizer-stats"><div><b>{mine.length}</b><small>Total</small></div><div><b>{statusCounts.pending}</b><small>En revisión</small></div><div><b>{statusCounts.approved}</b><small>Publicados</small></div></div>
  {mine.length ? mine.map(e => <div key={e.id} className="ag"><b>{e.time || '—'}</b><span>{e.title}<small>{e.date} · {e.location} · {fmt(e.price)}</small></span>
    <em className={'event-status '+(e.status||'pending')}>{e.status==='approved'?'Publicado':e.status==='rejected'?'Rechazado':'En revisión'}</em><button aria-label={'Borrar ' + e.title} onClick={() => del(e)} style={{ marginLeft: 'auto', color: '#EF4444' }}><Trash2 size={18} /></button></div>)
    : <p className="empty">Todavía no publicaste nada. Completá el formulario y aparece acá.</p>}
  </>
  : <div className="result"><h3>Solicitá acceso para publicar</h3><p className="sub">Revisamos cada solicitud y creamos la cuenta aprobada para evitar publicaciones no verificadas.</p>
    {ACCESS_FORM && !ACCESS_FORM.includes('TU_FORM_ID')
     ? <a className="btn" href={ACCESS_FORM} target="_blank" rel="noreferrer">Completar solicitud</a>
     : <button className="btn" onClick={() => setMsg('Configurá VITE_ACCESS_REQUEST_FORM_URL en .env con la URL de tu encuesta de Google Forms.')}>Completar solicitud</button>}
    {remoteMode ? <><h3>Ya tengo una cuenta</h3><div className="form"><label>Email<input type="email" value={a.email} autoComplete="email" onChange={e => setA({ ...a, email: e.target.value })} /></label>
     <label>Contraseña<input type="password" value={a.password} autoComplete="current-password" onChange={e => setA({ ...a, password: e.target.value })} /></label></div>
    <button className="btn" disabled={busy || !a.email || !a.password} onClick={auth}>Ingresar</button></> : <p className="note">Configurá Supabase para habilitar cuentas aprobadas y publicaciones.</p>}</div>}
  {msg && <p className="note" role="status">{msg}</p>}
  {!remoteMode && <p className="note">Modo local: sin cuentas, y los eventos se guardan solo en este navegador. Configurá Supabase para usar usuarios y base de datos.</p>}
  <div className="tiers">{[['Gratis', '1 evento'], ['Pro', 'Más eventos · Evento destacado · Mayor visibilidad'], ['Negocio', 'Perfil propio · Estadísticas · Promociones']].map(([t, s]) => <div key={t} className="result"><h3>{t}</h3><p className="sub">{s}</p></div>)}</div>
  <p className="note">Los pagos todavía no están implementados.</p></section>;
}
