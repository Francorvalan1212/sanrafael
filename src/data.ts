// DATOS DE DEMOSTRACIÓN. Reemplazar por API/Supabase/Firebase en api.ts. No son eventos confirmados.
export type Cat = 'Música' | 'Gastronomía' | 'Cultura' | 'Aventura' | 'Fiestas' | 'Familiar';
export interface Ev { id: string; title: string; category: Cat; day: string; date: string; time: string; location: string; price: number; image: string; tone: string; description: string; distance: string; isOpen: boolean; coordinates: [number, number]; tags: string[]; mine?: boolean; tickets?: string; author?: string; status?: 'pending'|'approved'|'rejected'; verified?: boolean; updatedAt?: string; }
export const categories: Cat[] = ['Fiestas','Música','Aventura','Cultura','Gastronomía','Familiar'];
const sampleEvents: Ev[] = [
 { id:'cachumba', title:'Cachumba en vivo', category:'Música', day:'Viernes 25', date:'Viernes 25 de septiembre', time:'23:00', location:'Ninamundo — Cañada Seca', price:10000, image:'', tone:'#EC4899', description:'Noche de música y baile en vivo.', distance:'9 km', isOpen:true, coordinates:[-34.65,-68.3], tags:['noche','baile'] },
 { id:'alupura', title:'Noche en Finca Alupurá', category:'Gastronomía', day:'Sábado 26', date:'Sábado 26 de septiembre', time:'19:00', location:'Cuadro Benegas', price:65000, image:'', tone:'#F59E0B', description:'Vinos, gastronomía y música en vivo entre viñedos.', distance:'6 km', isOpen:true, coordinates:[-34.6,-68.35], tags:['vinos','cita'] },
 { id:'adultos', title:'Adultos en Crisis', category:'Cultura', day:'Sábado 26', date:'Sábado 26 de septiembre', time:'22:00', location:'Brooklyn Live House', price:0, image:'', tone:'#F97316', description:'Stand up. Precio a confirmar con el organizador.', distance:'2 km', isOpen:true, coordinates:[-34.617,-68.33], tags:['stand up','amigos'] },
 { id:'carpera', title:'Noche Carpera', category:'Fiestas', day:'Sábado 26', date:'Sábado 26 de septiembre', time:'23:00', location:'Ninamundo', price:0, image:'', tone:'#EC4899', description:'Música y baile toda la noche.', distance:'9 km', isOpen:true, coordinates:[-34.65,-68.3], tags:['noche','baile'] },
 { id:'ballet', title:'Gran Gala de Ballet', category:'Cultura', day:'Jueves 24', date:'Jueves 24 de septiembre', time:'21:00', location:'Teatro Roma', price:0, image:'', tone:'#F97316', description:'Función de gala.', distance:'1 km', isOpen:false, coordinates:[-34.617,-68.335], tags:['teatro'] },
 { id:'rafting', title:'Rafting en Valle Grande', category:'Aventura', day:'Domingo 27', date:'Domingo 27 de septiembre', time:'10:30', location:'Valle Grande', price:35000, image:'', tone:'#0EA5A4', description:'Descenso por el Atuel con guías.', distance:'35 km', isOpen:true, coordinates:[-34.85,-68.4], tags:['río','amigos','familia'] },
 { id:'planb-noche', title:'Noche en Plan B', category:'Fiestas', day:'Viernes 25', date:'Viernes 25 de septiembre', time:'00:30', location:'Plan B — Av. Hipólito Yrigoyen', price:0, image:'', tone:'#EC4899', description:'Música, baile y noche de boliche en San Rafael.', distance:'2 km', isOpen:true, coordinates:[-34.615,-68.34], tags:['noche','boliche','amigos'] },
 { id:'ox-subsuelo', title:'Noche en Ox Subsuelo', category:'Fiestas', day:'Sábado 26', date:'Sábado 26 de septiembre', time:'00:30', location:'Ox Subsuelo — San Rafael', price:0, image:'', tone:'#EC4899', description:'Club nocturno para salir con amigos.', distance:'2 km', isOpen:true, coordinates:[-34.62,-68.328], tags:['noche','boliche','amigos'] },
 { id:'mona-disco', title:'Noche en Mona Disco', category:'Fiestas', day:'Sábado 26', date:'Sábado 26 de septiembre', time:'00:30', location:'San Rafael', price:0, image:'', tone:'#EC4899', description:'Una noche para bailar y disfrutar con amigos.', distance:'2 km', isOpen:true, coordinates:[-34.61,-68.33], tags:['noche','boliche','baile'] },
 { id:'brooklyn-live', title:'Música en vivo en Brooklyn', category:'Música', day:'Viernes 25', date:'Viernes 25 de septiembre', time:'22:30', location:'Brooklyn Live House — San Rafael', price:0, image:'', tone:'#EC4899', description:'Shows y música en vivo en un clásico de la noche local.', distance:'2 km', isOpen:true, coordinates:[-34.617,-68.33], tags:['noche','música','shows'] },
];
export const events: Ev[] = import.meta.env.DEV ? sampleEvents : [];
export const fmt = (n:number)=> n===0 ? 'Consultar / gratis' : `Desde $${n.toLocaleString('es-AR')}`;
export const spotsByMood: Record<string,{t:string;h:string;icon:string;cost:number}[]> = {
 Fiesta:[{h:'21:30',t:'Cena previa',icon:'food',cost:11000},{h:'00:30',t:'Boliche',icon:'party',cost:0}],
 Aventura:[{h:'10:30',t:'Rafting en Valle Grande',icon:'water',cost:35000},{h:'13:00',t:'Tirolesa en Valle Grande',icon:'adventure',cost:26000}],
 Gastronomía:[{h:'14:00',t:'Almuerzo en restaurante',icon:'wine',cost:11000},{h:'21:30',t:'Cena para compartir',icon:'food',cost:22500}],
 Naturaleza:[{h:'10:30',t:'Cañón del Atuel',icon:'mountain',cost:0},{h:'18:00',t:'Atardecer',icon:'sun',cost:0}],
 Cultura:[{h:'21:00',t:'Espectáculo',icon:'culture',cost:8000}],
 Relax:[{h:'17:00',t:'Paseo y atardecer',icon:'sun',cost:0},{h:'21:00',t:'Cena tranqui',icon:'food',cost:15000}],
};
export interface Place { id:string; name:string; kind:'Boliches'|'Bares'|'Fiestas'|'Música en vivo'|'After'; type:string; address:string; isOpen:boolean; tone:string; coordinates:[number,number]; }
export const nightKinds=['Todos','Boliches','Bares','Fiestas','Música en vivo','After'];
const samplePlaces: Place[] = [
 {id:'planb',name:'Plan B',kind:'Boliches',type:'Discoteca',address:'Av. Hipólito Yrigoyen',isOpen:true,tone:'#EC4899',coordinates:[-34.615,-68.34]},
 {id:'ox',name:'Ox Subsuelo',kind:'Boliches',type:'Club nocturno',address:'San Rafael',isOpen:true,tone:'#EC4899',coordinates:[-34.62,-68.328]},
 {id:'mona',name:'Mona Disco',kind:'Boliches',type:'Discoteca',address:'San Rafael',isOpen:true,tone:'#EC4899',coordinates:[-34.61,-68.33]},
 {id:'brooklyn',name:'Brooklyn Live House',kind:'Música en vivo',type:'Bar con shows',address:'San Rafael',isOpen:true,tone:'#EC4899',coordinates:[-34.617,-68.33]},
];
export const places: Place[] = import.meta.env.DEV ? samplePlaces : [];
export const adventures=[
 {id:'a1',title:'Rafting',where:'Valle Grande',tag:'Aventura',tone:'#0EA5A4'},
 {id:'a2',title:'Trekking',where:'Cañón del Atuel',tag:'Naturaleza',tone:'#22C55E'},
 {id:'a3',title:'Kayak',where:'Valle Grande',tag:'Aventura',tone:'#0EA5A4'},
 {id:'a4',title:'4x4',where:'Mendoza',tag:'Aventura',tone:'#0EA5A4'},
];
export const moods=[
 {t:'Quiero salir',icon:'party',s:'Boliches · Fiestas · DJs · Bandas · Bares',cat:'Fiestas',q:'',tone:'#EC4899'},
 {t:'Quiero aventura',icon:'mountain',s:'Rafting · Kayak · Trekking · 4x4',cat:'Aventura',q:'',tone:'#0EA5A4'},
 {t:'Quiero algo tranqui',icon:'wine',s:'Bodegas · Restaurantes · Atardeceres',cat:'Gastronomía',q:'',tone:'#F59E0B'},
 {t:'Quiero una cita',icon:'heart',s:'Cena · Bodegas · Naturaleza · Música',cat:'Todos',q:'cita',tone:'#EF4444'},
 {t:'Quiero ir en familia',icon:'family',s:'Parques · Actividades · Paseos',cat:'Familiar',q:'',tone:'#22C55E'},
 {t:'Quiero gastar poco',icon:'wallet',s:'Planes gratuitos o económicos',cat:'Todos',q:'gratis',tone:'#2563EB'},
];
