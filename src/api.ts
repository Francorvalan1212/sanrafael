// Capa de datos. Con VITE_SUPABASE_* usa Supabase; sin ellas funciona en modo local (localStorage).
import { createClient } from '@supabase/supabase-js';
import type { Ev, Cat } from './data';
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined, key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const sb = url && key ? createClient(url, key) : null;
export const remoteMode = !!sb;
const tones: Record<string, string> = { Música: '#EC4899', Fiestas: '#EC4899', Gastronomía: '#F59E0B', Cultura: '#F97316', Aventura: '#0EA5A4', Familiar: '#22C55E' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
interface Row { id: string; owner: string; title: string; category: string; event_date: string; event_time: string | null; location: string; price: number; description: string | null; instagram: string | null; whatsapp: string | null; tickets_url: string | null; image_url?: string | null; status?: EventStatus; created_at?: string; reviewed_at?: string | null; profiles?: { username: string } | null }
export type EventStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'user' | 'moderator';
export interface ModerationEvent extends Ev { status: EventStatus; owner: string; }
const toEv = (r: Row, uid: string | null): Ev => { const d = new Date(r.event_date + 'T12:00:00');
 return { id: r.id, title: r.title, category: r.category as Cat, day: cap(d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })), date: cap(d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })), time: r.event_time?.slice(0, 5) ?? '', location: r.location, price: r.price, image: r.image_url ?? '', tone: tones[r.category] ?? '#2563EB', description: r.description ?? '', distance: '—', isOpen: true, coordinates: [-34.617, -68.33], tags: [], mine: r.owner === uid, tickets: r.tickets_url ?? undefined, author: r.profiles?.username, status: r.status, verified: r.status === 'approved', updatedAt: r.reviewed_at || r.created_at }; };
export const deviceId = () => { let d = localStorage.getItem('deviceId'); if (!d) { d = crypto.randomUUID(); localStorage.setItem('deviceId', d); } return d; };
const readLocal = (): Row[] => { try { return JSON.parse(localStorage.getItem('published_v2') || '[]'); } catch { return []; } };
const writeLocal = (r: Row[]) => localStorage.setItem('published_v2', JSON.stringify(r));

export async function currentUserId(): Promise<string | null> { if (!sb) return deviceId(); return (await sb.auth.getSession()).data.session?.user.id ?? null; }
export async function currentUserRole(): Promise<UserRole | null> {
 if (!sb) return null;
 const uid = await currentUserId(); if (!uid) return null;
 const { data, error } = await sb.from('profiles').select('role').eq('id', uid).maybeSingle();
 if (error) throw error;
 return (data?.role as UserRole | undefined) ?? 'user';
}
export async function listEvents(): Promise<Ev[]> { const uid = await currentUserId();
 if (!sb) return (import.meta.env.DEV ? readLocal() : []).map(r => toEv(r, uid));
 const { data, error } = await sb.from('published_events').select('*, profiles!published_events_owner_fkey(username)').order('created_at', { ascending: false }); if (error) throw error;
 return (data as Row[]).map(r => toEv(r, uid)); }
async function shrink(file: File): Promise<Blob> { const bmp = await createImageBitmap(file); const s = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
 const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s); c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
 return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('No se pudo procesar la imagen')), 'image/jpeg', 0.82)); }
const toDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
export async function publishEvent(f: Record<string, string>, file?: File | null) {
 let image_url: string | null = null, path = '';
 if (file) { const blob = await shrink(file);
  if (!sb) image_url = await toDataUrl(blob);
  else { path = `${await currentUserId()}/${crypto.randomUUID()}.jpg`; const { error } = await sb.storage.from('event-images').upload(path, blob, { contentType: 'image/jpeg' }); if (error) throw error; image_url = sb.storage.from('event-images').getPublicUrl(path).data.publicUrl; } }
 const row = { title: f.name, category: f.category, event_date: f.date, event_time: f.time || null, location: f.location, price: Number(f.price) || 0, description: f.description || null, instagram: f.instagram || null, whatsapp: f.whatsapp || null, tickets_url: f.tickets || null, image_url, status: 'pending' as const };
 if (!sb) { writeLocal([{ ...row, id: crypto.randomUUID(), owner: deviceId() }, ...readLocal()]); return; }
 const { error } = await sb.from('published_events').insert(row);
 if (error) { if (path) await sb.storage.from('event-images').remove([path]); throw error; } }
export async function listModerationEvents(): Promise<ModerationEvent[]> {
 if (!sb) return [];
 const { data, error } = await sb.from('published_events').select('*, profiles!published_events_owner_fkey(username)').order('created_at', { ascending: false });
 if (error) throw error;
 return (data as Row[]).map(r => ({ ...toEv(r, null), status: r.status ?? 'approved', owner: r.owner }));
}
export async function setEventStatus(id: string, status: EventStatus) {
 if (!sb) return;
 const { error } = await sb.from('published_events').update({ status, reviewed_at: new Date().toISOString(), reviewed_by: await currentUserId() }).eq('id', id);
 if (error) throw error;
}
export async function deleteModerationEvent(id: string) {
 if (!sb) return;
 const { error } = await sb.from('published_events').delete().eq('id', id);
 if (error) throw error;
}
export async function deleteEvent(id: string, image?: string) {
 if (!sb) { writeLocal(readLocal().filter(r => !(r.id === id && r.owner === deviceId()))); return; }
 const { data, error } = await sb.from('published_events').delete().eq('id', id).select(); if (error) throw error;
 if (!data?.length) throw new Error('Solo quien publicó el evento puede borrarlo.');
 const p = image?.split('/event-images/')[1]; if (p) await sb.storage.from('event-images').remove([p]); }
export const signIn = async (email: string, password: string) => { const { error } = await sb!.auth.signInWithPassword({ email, password }); if (error) throw new Error(/invalid login/i.test(error.message) ? 'Email o contraseña incorrectos.' : error.message); };
export const signOut = () => sb?.auth.signOut();
export const onAuth = (cb: () => void) => { if (!sb) return () => {}; const { data } = sb.auth.onAuthStateChange(() => cb()); return () => data.subscription.unsubscribe(); };

// ---- Calificaciones y asistencia ----
export interface Stats { avg: number; ratings: number; going: number; myStars: number; iGo: boolean }
const readEng = (): any => { try { return JSON.parse(localStorage.getItem('eng_v1') || '{}'); } catch { return {}; } };
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export async function loadStats(): Promise<Record<string, Stats>> {
 const out: Record<string, Stats> = {}; const get = (id: string) => (out[id] ??= { avg: 0, ratings: 0, going: 0, myStars: 0, iGo: false });
 const g = readEng();
 Object.entries(g.ratings || {}).forEach(([id, n]) => { const s = get(id); s.avg = n as number; s.ratings = 1; s.myStars = n as number; });
 (g.going || []).forEach((id: string) => { const s = get(id); s.going = 1; s.iGo = true; });
 if (!sb) return out;
 const { data } = await sb.from('event_stats').select('*');
 (data || []).forEach((r: any) => { const s = get(r.event_id); s.avg = Number(r.avg_rating); s.ratings = Number(r.ratings); s.going = Number(r.going); });
 const did = deviceId(); const mr = await sb.from('event_ratings').select('event_id,device_id,stars');
 (mr.data || []).forEach((r: any) => { if (r.device_id === did) get(r.event_id).myStars = r.stars; });
 const mg = await sb.from('event_going').select('event_id').eq('device_id', deviceId());
 (mg.data || []).forEach((r: any) => { get(r.event_id).iGo = true; });
 return out; }
export async function setRating(id: string, stars: number) {
 if (!sb) { const g = readEng(); if (g.ratings?.[id]) return; g.ratings = { ...(g.ratings || {}), [id]: stars }; localStorage.setItem('eng_v1', JSON.stringify(g)); return; }
 const uid = await currentUserId(); if (!uid) throw new Error('LOGIN');
 const { error } = await sb.from('event_ratings').insert({ event_id: id, device_id: deviceId(), user_id: uid, stars }); if (error) throw error; }
export async function toggleGoing(id: string, on: boolean) {
 if (!sb || !isUuid(id)) { const g = readEng(); const s = new Set<string>(g.going || []); if (on) s.add(id); else s.delete(id); g.going = [...s]; localStorage.setItem('eng_v1', JSON.stringify(g)); return; }
 const uid = await currentUserId(); if (!uid) throw new Error('LOGIN');
 const did = deviceId(); const { error } = on ? await sb.from('event_going').upsert({ event_id: id, device_id: did, user_id: uid }, { onConflict: 'event_id,device_id', ignoreDuplicates: true }) : await sb.from('event_going').delete().eq('event_id', id).eq('device_id', did);
 if (error) throw error; }
