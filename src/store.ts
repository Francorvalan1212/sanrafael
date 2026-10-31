import { useEffect, useState } from 'react';
export function useLocal<T>(key:string, init:T){ const [v,setV]=useState<T>(()=>{try{return JSON.parse(localStorage.getItem(key)||'')}catch{return init}});
 useEffect(()=>{localStorage.setItem(key,JSON.stringify(v))},[key,v]); return [v,setV] as const; }
