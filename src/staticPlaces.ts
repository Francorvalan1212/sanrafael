export interface StaticPlace {
 id: string;
 name: string;
 kind: 'boliches' | 'bares' | 'restaurantes';
 lat: number;
 lng: number;
 addr: string;
}

export const STATIC_PLACES: StaticPlace[] = [
 { id: 'al-antojo-del-cocinero', name: 'Al Antojo del Cocinero', kind: 'restaurantes', lat: -34.6148391, lng: -68.3410931, addr: 'Avenida Ingeniero Ballofet' },
 { id: 'antidoto-gintoneria', name: 'Antídoto Gintonería', kind: 'bares', lat: -34.6125484, lng: -68.3398289, addr: 'Avenida Hipólito Yrigoyen' },
 { id: 'babel-bar', name: 'Babel Bar', kind: 'bares', lat: -34.609375, lng: -68.349327, addr: 'Avenida Hipólito Yrigoyen 1574' },
 { id: 'bahru', name: 'Bahrü', kind: 'bares', lat: -34.6086896, lng: -68.3526196, addr: 'Avenida Hipólito Yrigoyen' },
 { id: 'balcarce', name: 'Balcarce', kind: 'bares', lat: -34.6180424, lng: -68.3366831, addr: '25 de Mayo' },
 { id: 'bar-yrigoyen', name: 'Bar', kind: 'bares', lat: -34.6079674, lng: -68.3546836, addr: 'Avenida Hipólito Yrigoyen 2065' },
 { id: 'bonafide', name: 'Bonafide', kind: 'restaurantes', lat: -34.6150345, lng: -68.3291792, addr: 'Olascoaga' },
 { id: 'cafe-jireh', name: 'Cafe Jireh', kind: 'restaurantes', lat: -34.6160061, lng: -68.3308335, addr: 'Avenida Hipólito Yrigoyen 71' },
 { id: 'cafe-martinez', name: 'Café Martínez', kind: 'restaurantes', lat: -34.614289, lng: -68.3302429, addr: 'Carlos Pellegrini 134' },
 { id: 'casa-alvear', name: 'Casa Alvear', kind: 'restaurantes', lat: -34.6142895, lng: -68.3319548, addr: 'Comandante Salas' },
 { id: 'corbo-wine-bar', name: 'CORBO Wine Bar', kind: 'bares', lat: -34.609230, lng: -68.349716, addr: 'Avenida Hipólito Yrigoyen 1600' },
 { id: 'el-nordico', name: 'El Nórdico', kind: 'bares', lat: -34.6129789, lng: -68.3388148, addr: 'Avenida Hipólito Yrigoyen' },
 { id: 'friends', name: "Friend's", kind: 'bares', lat: -34.6157927, lng: -68.3299102, addr: 'Avenida San Martín' },
 { id: 'grido', name: 'Grido', kind: 'restaurantes', lat: -34.6075483, lng: -68.3560404, addr: 'Avenida Hipólito Yrigoyen, Costa El Toledano' },
 { id: 'guantanamo', name: 'Guantánamo', kind: 'bares', lat: -34.6092106, lng: -68.3498528, addr: 'Avenida Hipólito Yrigoyen' },
 { id: 'hangar-52', name: 'Hangar 52', kind: 'restaurantes', lat: -34.6071102, lng: -68.3557751, addr: 'Orlando P. Maluenda, Costa El Toledano' },
 { id: 'la-cuchara-de-fermin', name: 'La Cuchara de Fermín', kind: 'restaurantes', lat: -34.6084476, lng: -68.3542837, addr: 'Marcelino Champagnat 47' },
 { id: 'la-delicia-del-boulevard', name: 'La Delicia del Boulevard', kind: 'restaurantes', lat: -34.6093496, lng: -68.3493762, addr: 'Avenida Hipólito Yrigoyen 1594' },
 { id: 'la-gringa', name: 'La Gringa', kind: 'restaurantes', lat: -34.6149099, lng: -68.3296866, addr: 'Chile' },
 { id: 'la-maquina-resto-bar', name: 'La Máquina Resto Bar', kind: 'bares', lat: -34.6106928, lng: -68.3277955, addr: 'Avenida Rivadavia 18' },
 { id: 'la-massa-al-plato', name: 'La Massa al Plato', kind: 'restaurantes', lat: -34.608877, lng: -68.3506451, addr: 'Alfredo Ramón Cuartara' },
 { id: 'la-tana', name: 'La Tana', kind: 'restaurantes', lat: -34.6077514, lng: -68.3563167, addr: 'Avenida Deán Funes, Costa El Toledano' },
 { id: 'lobrador', name: "L'Obrador", kind: 'restaurantes', lat: -34.5956691, lng: -68.3911254, addr: 'Avenida Hipólito Yrigoyen, Capitán Montoya' },
 { id: 'la-santa-club', name: 'La Santa Club', kind: 'boliches', lat: -34.608089, lng: -68.355759, addr: 'José Hernández 75' },
 { id: 'mikelinos', name: "Mikelino's", kind: 'restaurantes', lat: -34.6095772, lng: -68.3506775, addr: 'Entre Ríos 2201' },
 { id: 'nina-cafe-bar', name: 'Nina - café bar', kind: 'bares', lat: -34.6152077, lng: -68.3293, addr: 'Olascoaga' },
 { id: 'olula', name: 'Olula', kind: 'bares', lat: -34.6121422, lng: -68.3458976, addr: 'Coronel Suárez' },
 { id: 'pagoda', name: 'Pagoda', kind: 'restaurantes', lat: -34.6172894, lng: -68.3272158, addr: 'Avenida Bartolomé Mitre' },
 { id: 'parrilla-el-turco', name: 'Parrilla El Turco', kind: 'restaurantes', lat: -34.622329, lng: -68.3747443, addr: 'Avenida Deán Funes 2330' },
 { id: 'penon', name: 'Peñon', kind: 'bares', lat: -34.6090803, lng: -68.350315, addr: 'Avenida Hipólito Yrigoyen' },
 { id: 'pizza-marca', name: 'Pizza Marca', kind: 'restaurantes', lat: -34.615186, lng: -68.3332539, addr: 'Avenida Hipólito Yrigoyen 265' },
 { id: 'roux-street', name: 'Roux Street', kind: 'restaurantes', lat: -34.609577, lng: -68.350449, addr: 'Entre Ríos 1665' },
 { id: 'salvador', name: 'Salvador', kind: 'restaurantes', lat: -34.5858327, lng: -68.351361, addr: 'Ortubia, Costa El Toledano' },
 { id: 'sud-restaurant', name: 'Sud Restaurant', kind: 'restaurantes', lat: -34.6126976, lng: -68.3395691, addr: 'Avenida Hipólito Yrigoyen 774' },
 { id: 'stroker', name: 'Stroker', kind: 'bares', lat: -34.6091068, lng: -68.3501165, addr: 'Avenida Hipólito Yrigoyen' },
 { id: 'the-club', name: 'The Club', kind: 'bares', lat: -34.6059914, lng: -68.3584442, addr: 'Canadá 12, esquina Hipólito Yrigoyen' },
];
