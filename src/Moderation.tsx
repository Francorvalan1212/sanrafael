import { useEffect, useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import { fmt } from './data';
import { deleteModerationEvent, listModerationEvents, setEventStatus, type EventStatus, type ModerationEvent } from './api';

const statusLabel: Record<EventStatus, string> = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' };

export function Moderation() {
 const [items, setItems] = useState<ModerationEvent[]>([]);
 const [busy, setBusy] = useState<string | null>(null); const [loading, setLoading] = useState(false);
 const [msg, setMsg] = useState(''); const [confirming, setConfirming] = useState<ModerationEvent | null>(null);
 const load = async () => { setLoading(true); setMsg(''); try { setItems(await listModerationEvents()); } catch (e: any) { setMsg(e.message || 'No pudimos cargar los eventos.'); } setLoading(false); };
 useEffect(() => { load(); const timer = window.setInterval(load, 15000); return () => window.clearInterval(timer); }, []);
 const review = async (id: string, status: EventStatus) => {
  setBusy(id); setMsg('');
  try { await setEventStatus(id, status); await load(); }
  catch (e: any) { setMsg(e.message || 'No pudimos actualizar el evento.'); }
  setBusy(null);
 };
 const remove = async (event: ModerationEvent) => {
  setConfirming(null);
  setBusy(event.id); setMsg('');
  try { await deleteModerationEvent(event.id); await load(); }
  catch (e: any) { setMsg(e.message || 'No pudimos eliminar el evento.'); }
  setBusy(null);
 };
 const pending = items.filter(e => e.status === 'pending');
 const reviewed = items.filter(e => e.status !== 'pending');
 return <section className="sec"><div className="row"><div><h2>Revisar eventos</h2><p className="sub">Aprobá las publicaciones antes de que aparezcan para todo el mundo.</p></div><button className="btn sm ghost" disabled={loading} onClick={load}>{loading ? 'Actualizando…' : 'Actualizar'}</button></div>
  {msg && <p className="note" role="alert">{msg}</p>}
  <h3>Pendientes ({pending.length})</h3>
  {pending.length ? pending.map(e => <article key={e.id} className="result">
   <h3>{e.title}</h3><p className="sub">{e.date} · {e.time || 'Hora a confirmar'} · {e.location}</p>
   <p>{e.description || 'Sin descripción.'}</p><p><b>{fmt(e.price)}</b>{e.author ? ` · publicado por @${e.author}` : ''}</p>
  <div className="row"><button className="btn" disabled={busy === e.id} onClick={() => review(e.id, 'approved')}><Check size={16} /> Aprobar</button>
    <button className="btn ghost" disabled={busy === e.id} onClick={() => review(e.id, 'rejected')}><X size={16} /> Rechazar</button></div>
  </article>) : <p className="empty">No hay eventos pendientes de revisión.</p>}
  <h3>Historial</h3>
  {reviewed.length ? reviewed.map(e => <div key={e.id} className={'ag moderation-item ' + e.status}><b>{statusLabel[e.status]}</b><span>{e.title}<small>{e.date} · {e.location}</small></span>
   <button className="btn sm ghost" disabled={busy === e.id} onClick={() => review(e.id, e.status === 'approved' ? 'rejected' : 'approved')}>{e.status === 'approved' ? 'Rechazar' : 'Aprobar'}</button>
  <button className="btn sm ghost" aria-label={'Eliminar ' + e.title} disabled={busy === e.id} onClick={() => setConfirming(e)}><Trash2 size={16} /></button></div>) : <p className="empty">Todavía no hay eventos revisados.</p>}
  {confirming && <div className="modal" onClick={() => setConfirming(null)}><div className="sheet" role="dialog" aria-modal="true" aria-labelledby="delete-event-title" onClick={e => e.stopPropagation()}>
   <button className="x" aria-label="Cerrar" onClick={() => setConfirming(null)}>✕</button><h3 id="delete-event-title">Eliminar evento</h3>
   <p>¿Seguro que querés eliminar “{confirming.title}”? Esta acción no se puede deshacer.</p>
   <div className="row"><button className="btn ghost" onClick={() => setConfirming(null)}>Cancelar</button><button className="btn danger" onClick={() => remove(confirming)}>Eliminar</button></div>
  </div></div>}
 </section>;
}
