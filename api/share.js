const SUPABASE_URL = "https://aedbqwnsskuznmbywyav.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XP97uQLTvyBvGvhVTApwDA_V0g1hAmq";
const APP_URL = "https://tereto-web.vercel.app";

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
  const id = req.query.id;
  const appUrl = id ? `${APP_URL}?post=${id}` : APP_URL;

  if (!id) return res.redirect(302, APP_URL);

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?id=eq.${id}&select=emoji,caption,prompt,image_url,challenge_type,profile:profiles(full_name,username)`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const posts = await r.json();
    const post = posts?.[0];

    if (!post) return res.redirect(302, APP_URL);

    const creador = esc(post.profile?.full_name || post.profile?.username || "Alguien");
    const tipo = post.challenge_type === "trivia" ? "🧠 Trivia" : "📸 Foto";
    const title = esc(`${creador} te desafió en TeReto ${tipo}`);
    const description = esc(`¿Podés superar este reto? "${post.prompt}"`);
    const image = post.image_url || `${APP_URL}/og-image.png`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${appUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="TeReto">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <meta http-equiv="refresh" content="0;url=${appUrl}">
</head>
<body style="background:#0A0A0E;color:#F2F2F8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
  <div style="text-align:center">
    <div style="font-size:48px;margin-bottom:16px">⚡</div>
    <div style="font-size:22px;font-weight:800;margin-bottom:8px">Te<span style="color:#E8FF47">Reto</span></div>
    <p style="color:rgba(242,242,248,.5);margin-bottom:20px">${description}</p>
    <a href="${appUrl}" style="background:#E8FF47;color:#0A0A0E;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:800;font-size:15px">Ver reto →</a>
  </div>
</body>
</html>`);
  } catch {
    return res.redirect(302, appUrl);
  }
}
