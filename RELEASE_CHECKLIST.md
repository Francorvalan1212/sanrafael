# Checklist de lanzamiento

Ejecutar `npm run check:launch` antes de cada publicación. El comando compila la versión de producción, verifica los recursos y evita que los eventos locales de muestra aparezcan en los bundles.

## Configuración y Supabase

- [ ] Confirmar en el panel de hosting que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` pertenecen al proyecto de producción. El control local valida su forma, pero no puede confirmar a qué proyecto apunta la clave.
- [ ] Reemplazar `VITE_ACCESS_REQUEST_FORM_URL`: el valor local coincide con la URL del formulario de ejemplo. Probar el formulario desde la web publicada.
- [ ] Mantener `service_role`, contraseñas y secretos fuera de las variables `VITE_*`. `VITE_GOOGLE_MAPS_KEY` es visible en el navegador: restringirla por dominio y APIs habilitadas en Google Cloud.
- [ ] Respaldar la base de datos de staging; ejecutar `supabase/schema.sql` y después `supabase/security-hardening.sql` desde el editor SQL de Supabase o una conexión administrativa. No ejecutar primero contra producción.
- [ ] Comprobar que la versión Postgres de Supabase soporta la vista `event_stats` con `security_invoker` y revisar el resultado del SQL antes de promoverlo a producción.
- [ ] Desactivar el registro público de Auth si las cuentas deben ser aprobadas manualmente; revisar URLs de redirección, confirmación de email, SMTP y límites/CAPTCHA.
- [ ] Crear el primer moderador mediante una operación administrativa controlada y verificar el rol; no habilitar escritura pública sobre `profiles.role`.
- [ ] Probar RLS en staging como visitante, organizador y moderador: solo eventos aprobados son públicos, las altas nacen pendientes, solo moderadores aprueban/rechazan y nadie lee identificadores privados de otros usuarios.

## Contenido y flujos

- [ ] Cargar y verificar eventos reales, fechas, horarios, precios, lugares, coordenadas, imágenes y enlaces. Los eventos y boliches locales de muestra solo se incluyen en desarrollo.
- [ ] Confirmar que los lugares estáticos del mapa siguen vigentes y que el estado de apertura no se presenta como dato confirmado sin horarios actualizados.
- [ ] Probar login, publicación pendiente, aprobación, rechazo, borrado por propietario, carga y borrado de imagen, ratings, asistencia, favoritos, compartir y reporte de errores.
- [ ] Repetir los flujos principales en móvil y escritorio con cuentas de prueba; verificar los errores de red, cargas vacías y recuperación tras recargar.

## Hosting, privacidad y operación

- [ ] Confirmar que el proveedor aplica `public/_headers`. Si el proveedor no admite el formato `_headers`, traducir esas reglas a su configuración nativa y comprobar las cabeceras reales en una respuesta desplegada.
- [ ] Probar CSP con Supabase, Google Maps, fuentes y OpenStreetMap habilitados; revisar consola y solicitudes bloqueadas en el sitio de staging.
- [ ] Verificar HTTPS, dominio canónico, manifest/PWA, robots.txt, sitemap.xml, caché offline y metadatos sociales después del despliegue.
- [ ] Publicar política de privacidad y términos; definir canal y plazo de respuesta a reportes, retención y eliminación de datos, responsable de moderación y procedimiento de respaldo/restauración.
- [ ] Revisar Lighthouse en móvil y escritorio, accesibilidad/contraste, SEO y logs de errores. Investigar la advertencia de Vite sobre bundles mayores a 500 kB antes de aumentar dependencias o carga inicial.
- [ ] Promover a producción solo después de aprobar todos los puntos de staging y conservar un procedimiento de rollback.
