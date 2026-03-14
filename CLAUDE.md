# TeReto — Contexto del proyecto

## Qué es
Red social donde el contenido (fotos) está bloqueado detrás de retos. Para ver una publicación, el usuario debe superar un desafío (trivia o foto). Mezcla Instagram + gamificación social.

## Stack
- **Frontend:** React + TypeScript, Vite
- **Backend:** Supabase (Auth, DB, Storage)
- **Deploy:** Netlify (build: `vite build`, publish: `dist`)
- **Repo:** https://github.com/NicolasFalcao85/tereto-web

## Credenciales Supabase
- URL: `https://aedbqwnsskuznmbywyav.supabase.co`
- Anon Key: `sb_publishable_XP97uQLTvyBvGvhVTApwDA_V0g1hAmq`

## Estructura del proyecto
```
src/
  App.tsx        ← TODO el código está acá (un solo archivo ~1050 líneas)
public/
index.html
vite.config.ts
```

## Base de datos (Supabase)

### Tablas
- `profiles` — id, username, full_name, avatar_url, points, is_private
- `posts` — id, user_id, emoji, caption, gradient, image_url, challenge_type (trivia|photo), prompt, correct_answer, hint, max_attempts, visibility (public|friends), created_at
- `unlocks` — id, user_id, post_id, status (pending|approved|rejected), photo_url, reviewed_at, unlocked_at
- `likes` — id, user_id, post_id
- `attempts` — id, user_id, post_id, count
- `follows` — id, follower_id, following_id, status (pending|accepted|rejected), created_at
- `notifications` — id, user_id, type (unlock_approved|unlock_rejected|new_attempt|follow_request|follow_accepted), post_id, unlock_id, read, created_at

### Storage
- Bucket `posts` (público) — fotos de posts y fotos de retos

## Auth
- Solo Google OAuth
- Token guardado en localStorage como `sb_access_token`
- Supabase helper custom (no SDK oficial), ver funciones `supabase` y `sbFetch` en App.tsx

## Build
- SIEMPRE usar `vite build` (no `npm run build` — falla por TypeScript strict)
- Deploy automático en Netlify al pushear a main

## Funcionalidades implementadas
- ✅ Login con Google OAuth
- ✅ Feed con posts blureados
- ✅ Retos de trivia (respuesta correcta desbloquea)
- ✅ Retos de foto (usuario sube foto → creador aprueba/rechaza)
- ✅ Cámara y galería en mobile
- ✅ Intentos reales guardados en DB (no se resetean)
- ✅ No podés responder tu propio reto
- ✅ Likes
- ✅ Crear posts con foto + gradiente + reto
- ✅ Visibilidad por post (público / solo amigos)
- ✅ Privacidad de cuenta (pública / privada)
- ✅ Sistema de seguidores con solicitud + aprobación
- ✅ Notificaciones (aprobaciones, rechazos, solicitudes de seguimiento)
- ✅ Perfil con stats, mis posts, siguiendo/seguidores
- ✅ Username personalizado (@usuario)
- ✅ Explorar con búsqueda (retos + personas)
- ✅ Compartir reto por link
- ✅ Eliminar posts propios

## Pendiente / Roadmap
- [ ] Comentarios después de desbloquear
- [ ] Ranking / Leaderboard por puntos
- [ ] Perfil público de otros usuarios (tocar avatar → ver perfil)
- [ ] Link de compartir funcional (abrir post directo desde URL)
- [ ] Editar post
- [ ] Contador de intentos en el feed
- [ ] Onboarding primera vez

## Notas importantes
- Todo el código está en un solo `App.tsx` — considerar dividir en componentes si crece mucho
- RLS activado en todas las tablas
- El trigger de Supabase para crear perfiles puede no funcionar en primer login — el perfil se crea manualmente o hay que verificar el trigger
- Usuario de prueba: nicolas.a.falcao@gmail.com (ID: 41e7c2ed-6a35-47b3-afe7-d75d91d6326d)
