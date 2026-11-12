# Vetas

Mini historias de amor anónimas, dibujadas como caminos en el mapa de Buenos Aires.

## Cómo verla

Abrí `index.html` con doble clic en Chrome o Edge. No hace falta instalar nada, pero sí tener internet: el mapa, las librerías y las tipografías se cargan desde la web.

## Archivos

- `index.html`: la estructura de la página y las librerías.
- `style.css`: colores, tipografías y diseño.
- `app.js`: toda la lógica, el mapa y la conexión con Supabase.

## Supabase

La URL del proyecto y la publishable key están al principio de `app.js`. Son públicas y están pensadas para ir en la página. Nunca pongas la secret key (`sb_secret_...`) en ningún archivo del repo.

Para ocultar una historia: en Supabase, **Table Editor → stories**, marcá `hidden` como `true`.

## Publicación

En GitHub: **Settings → Pages → Deploy from a branch → main / (root)**. La página queda en `https://<tu-usuario>.github.io/vetas/` y se actualiza sola con cada push.
