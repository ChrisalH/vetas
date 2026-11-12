# Vetas

Mini historias de amor anónimas, dibujadas como caminos en el mapa de Buenos Aires. Cada historia tiene un título, una canción, un pensamiento final y varias **paradas** (lugar + texto + coordenadas) que se unen en un camino sobre el mapa. Pensada para usarse **desde el celular**.

## Contexto de trabajo

- Santiago es **ayudante** en la app: **no tiene acceso al proyecto de Supabase** (ni al dashboard, ni a la secret key, ni a la base).
- Por lo tanto: no se pueden crear índices, cambiar policies RLS, ni tocar tablas/funciones. Si un cambio requiere algo del lado de la base, **no asumirlo hecho**: dejarlo escrito como pedido para quien administra Supabase.
- Nunca pedir ni escribir la secret key (`sb_secret_...`). La publishable key que está en `app.js` es pública por diseño.

## Stack

- **JavaScript puro**, sin framework ni build. Estilo ES5 (`var`, funciones, IIFE `'use strict'`) en `app.js`; mantener ese estilo al editar.
- **MapLibre GL 5.24** (mapa vectorial, estilo `positron` de OpenFreeMap, recoloreado oscuro por código) y **supabase-js 2.117** desde CDN (jsdelivr), versiones fijadas.
- Tipografías de Google Fonts (EB Garamond, IM Fell English).
- Se publica en **GitHub Pages** (rama `main`, raíz). Se abre también con doble clic en `index.html`.

## Qué es la app real (importante)

`index.html` carga **`app.js` + `style.css`** (raíz). **Eso es lo que corre.**

`src/` + `package.json` (Vite) es un esqueleto de migración **que `index.html` no usa**. No editar `src/` creyendo que cambia la app. No hay tests.

## Estructura de `app.js`

Un solo archivo, por secciones comentadas:

1. **Configuración** (`CONFIG`): URL/key de Supabase, `maxStories` (40), estilo del mapa, radio de zona (300 m).
2. **Colores**: `PALETTE` (4 colores de historia) y `MAP_COLORS`.
3. **Historias de ejemplo**: se usan si Supabase no está configurado.
4. **Datos (Supabase)**: `loadStories()` hace un `select` de `stories` con `stops(...)` anidadas (últimas 40, mezcladas al azar); `publishStory()` llama al RPC `publish_story`, que valida y guarda todo junto. Hay timeouts (12 s / 15 s).
5. **Ayudas HTML**: helper `h()`. Todo el texto entra con `textContent`: **nunca usar `innerHTML` con texto de usuarios** (las historias son contenido anónimo).
6. **Mapa** (`MapView`): una sola instancia fija detrás de las pantallas. Fuentes GeoJSON (`routes`, `zones`, `focus-route`, `focus-zones`, `draft-*`). La animación dorada usa `line-gradient` con `line-progress`.
7. **Pantallas**: bienvenida (con caminos SVG animados de fondo), inicio con mapa, historia, contar (formulario para publicar).
8. **Navegación** por hash: `#/` bienvenida, `#/mapa`, `#/historia/:id`, `#/contar`.
9. **Admin**: NO es una ruta de la app. Vive solo en `/vetas/admin/` (`admin/index.html`), que define `window.VETAS_ADMIN = true` y carga `../app.js`; con esa bandera `app.js` monta solo `mountAdmin` (sin mapa ni hash). `index.html#/admin` no existe a propósito. Login con Supabase Auth (email + contraseña); lista todas las historias, filtra visibles/ocultas, oculta/muestra y borra con confirmación.

## Base de datos

Definida en `supabase/schema.sql` y `supabase/admin.sql` (son scripts para pegar en el SQL Editor; **están en el repo pero Santiago no los puede correr**).

- `stories`: `id uuid, title (1-80), color (una de las 4 de PALETTE), song (1-120), thought (1-300), hidden, created_at`.
- `stops`: `id, story_id (cascade), position (0-11), place (1-80), body (1-1500), lat, lng` (lat/lng acotados a Buenos Aires y alrededores). Máximo 12 paradas por historia.
- Ya existen los índices `stories_recent_idx` (`created_at desc where not hidden`) y `stops_story_idx (story_id)`.
- RLS: el público (anon) solo **lee** historias visibles (`not hidden`) y sus paradas. Nadie escribe directo en las tablas.
- Escritura pública solo vía RPC `publish_story(p_title, p_color, p_song, p_thought, p_stops)` (`security definer`, valida y guarda todo junto).
- Admin (`admins` + `is_admin()`): usuario autenticado que puede leer todo (también ocultas), ocultar/mostrar (`update`) y borrar historias. La pantalla (`mountAdmin` en `app.js`) usa un cliente de Supabase aparte con sesión en `sessionStorage` y verifica con `rpc('is_admin')` tras el login. **No se probó contra la base real** (sin acceso), solo con un Supabase simulado.

## Performance (pendiente, pensando en celular)

Revisado leyendo código, **sin medir**. Ideas ordenadas por impacto:

- Preconnect a Supabase y OpenFreeMap; `defer` en scripts; disparar el fetch de historias temprano desde el `<head>`.
- Reemplazar `supabase-js` por `fetch` directo a PostgREST (solo se usa un select y un rpc).
- Cachear la última respuesta en `localStorage`/`sessionStorage` y refrescar en segundo plano.
- Bajar `maxStories` en celu o no traer el texto completo de las paradas en la lista.
- Sacar `backdrop-filter: blur()` de `style.css` (~líneas 197 y 355): caro sobre un mapa WebGL.
- Animación dorada: `setPaintProperty` por frame; SVG de bienvenida: pausar con `visibilitychange`.
- Mapa: `pixelRatio` limitado a 2, `maxBounds`/`minZoom` en Buenos Aires, `fadeDuration: 0`.
- Los índices en Supabase ya existen (ver schema.sql): no hace falta pedirlos.

## Convenciones

- Chat en español; **código, comentarios nuevos y commits en inglés** (los comentarios existentes del repo están en español: no reescribirlos sin motivo).
- Commits sin atribución a Claude (sin `Co-Authored-By`).
- Respetar `prefers-reduced-motion` (ya se hace en el mapa y animaciones).
- Probar siempre pensando en pantalla chica, táctil y 4G.
