import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 CONFIGURACIÓN — reemplazá estos valores con los de tu proyecto Supabase
// Dashboard → Project Settings → API
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://aedbqwnsskuznmbywyav.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XP97uQLTvyBvGvhVTApwDA_V0g1hAmq";

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Auth client (sin SDK, fetch puro para no usar npm)
// ─────────────────────────────────────────────────────────────────────────────
const supabase = {
  auth: {
    async signInWithGoogle() {
      const redirectTo = window.location.origin;
      const url = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
      window.location.href = url;
    },
    async signOut() {
      const token = localStorage.getItem("sb_access_token");
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("sb_access_token");
      localStorage.removeItem("sb_refresh_token");
      localStorage.removeItem("sb_user");
    },
    async getSession() {
      // Lee el hash de la URL si viene del redirect de Google
      const hash = window.location.hash;
      if (hash.includes("access_token")) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token) {
          localStorage.setItem("sb_access_token", access_token);
          localStorage.setItem("sb_refresh_token", refresh_token ?? "");
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
      const token = localStorage.getItem("sb_access_token");
      if (!token) return null;
      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { localStorage.removeItem("sb_access_token"); return null; }
        const user = await res.json();
        return { user, access_token: token };
      } catch { return null; }
    },
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// Estilos globales
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0A0A0E;
      --surface: #111116;
      --surface2: #18181F;
      --border: #222229;
      --border2: #2E2E38;
      --text: #F2F2F8;
      --muted: rgba(242,242,248,0.42);
      --muted2: rgba(242,242,248,0.10);
      --accent: #E8FF47;
      --font-d: 'Syne', sans-serif;
      --font-b: 'DM Sans', sans-serif;
    }
    html, body { font-family: var(--font-b); background: var(--bg); color: var(--text); min-height: 100vh; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

    @keyframes fadeUp    { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
    @keyframes pop       { 0% { transform:scale(.5); opacity:0; } 65% { transform:scale(1.08); } 100% { transform:scale(1); opacity:1; } }
    @keyframes unlockPulse { 0%,100% { box-shadow:0 0 0 0 rgba(232,255,71,.4); } 50% { box-shadow:0 0 0 12px rgba(232,255,71,0); } }
    @keyframes blurIn    { from { filter:blur(20px); opacity:.4; } to { filter:blur(0); opacity:1; } }
    @keyframes heartPop  { 0% { transform:scale(1); } 30% { transform:scale(1.4); } 60% { transform:scale(.95); } 100% { transform:scale(1); } }
    @keyframes spin      { to { transform:rotate(360deg); } }
    @keyframes gradientShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// Mock posts data
// ─────────────────────────────────────────────────────────────────────────────
const POSTS = [
  { id:"1", user:{name:"sofía.mk",avatar:"🧁",verified:true}, time:"hace 2h", likes:1284, comments:47,
    lockedContent:{type:"image",emoji:"🌊",caption:"El mejor atardecer del año 🌅",gradient:"linear-gradient(135deg,#667eea,#f093fb)"},
    challenge:{type:"trivia",prompt:"¿En qué año se tomó la primera fotografía de la historia?",answer:"1826",hint:"Fue en Francia, antes de 1830",attempts:3}, unlocked:false },
  { id:"2", user:{name:"juancruz.dev",avatar:"🎸",verified:false}, time:"hace 5h", likes:873, comments:21,
    lockedContent:{type:"image",emoji:"🏔️",caption:"Llegué a la cima después de 6 horas 💪",gradient:"linear-gradient(135deg,#4facfe,#00f2fe)"},
    challenge:{type:"photo",prompt:"Subí una foto haciendo algo activo o deportivo",hint:"Cualquier deporte o ejercicio vale",attempts:3}, unlocked:false },
  { id:"3", user:{name:"maru.viaja",avatar:"✈️",verified:true}, time:"hace 1d", likes:3201, comments:118,
    lockedContent:{type:"image",emoji:"🗼",caption:"Finalmente en París ❤️",gradient:"linear-gradient(135deg,#fa709a,#fee140)"},
    challenge:{type:"trivia",prompt:"¿Cuántos escalones tiene la Torre Eiffel hasta el primer piso?",answer:"347",hint:"Entre 300 y 400",attempts:3}, unlocked:false },
  { id:"4", user:{name:"cooks.arg",avatar:"👨‍🍳",verified:false}, time:"hace 3h", likes:542, comments:33,
    lockedContent:{type:"image",emoji:"🍕",caption:"La receta secreta de mi nonna 🤫",gradient:"linear-gradient(135deg,#f7971e,#ffd200)"},
    challenge:{type:"trivia",prompt:"¿De qué ciudad italiana es originaria la pizza Margherita?",answer:"nápoles",hint:"Sur de Italia",attempts:3}, unlocked:false },
];

function fmt(n) { return n >= 1000 ? (n/1000).toFixed(1)+"k" : String(n); }

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    // Si no hay Supabase configurado, simulamos login para el demo
    if (SUPABASE_URL.includes("TU_PROYECTO")) {
      setTimeout(() => {
        onLogin({
          id: "demo-user",
          email: "demo@tereto.app",
          user_metadata: { full_name: "Usuario Demo", avatar_url: null },
        });
      }, 1200);
      return;
    }
    await supabase.auth.signInWithGoogle();
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      {/* Animated background blobs */}
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,255,71,.07) 0%, transparent 70%)",
        top: "10%", left: "50%", transform: "translateX(-50%)",
        animation: "float 6s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(102,126,234,.08) 0%, transparent 70%)",
        bottom: "15%", right: "10%",
        animation: "float 8s ease-in-out infinite reverse",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: 400,
        animation: "fadeUp .5s cubic-bezier(.22,1,.36,1) both",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 52, marginBottom: 16, animation: "pop .6s cubic-bezier(.22,1,.36,1) .1s both" }}>
            ⚡
          </div>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 38, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
            Te<span style={{ color: "var(--accent)" }}>Reto</span>
          </div>
          <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>
            Desbloqueá contenido superando retos.<br />La red social que te hace participar.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border2)",
          borderRadius: 24, padding: "32px 28px",
        }}>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            Empezá a jugar
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
            Creá tu cuenta o iniciá sesión. Es gratis.
          </p>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: "100%", padding: "14px 20px",
              background: loading ? "var(--surface2)" : "#fff",
              border: "1.5px solid var(--border2)",
              borderRadius: 14, cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              fontFamily: "var(--font-b)", fontSize: 15, fontWeight: 600,
              color: loading ? "var(--muted)" : "#1a1a1a",
              transition: "all .2s",
              marginBottom: 16,
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-1px)", e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,255,255,.12)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "none")}
          >
            {loading ? (
              <div style={{ width: 20, height: 20, border: "2px solid var(--border2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? "Conectando..." : "Continuar con Google"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>o</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Email (coming soon) */}
          <button
            disabled
            style={{
              width: "100%", padding: "14px 20px",
              background: "var(--surface2)", border: "1.5px solid var(--border)",
              borderRadius: 14, cursor: "not-allowed",
              fontFamily: "var(--font-b)", fontSize: 15, fontWeight: 500,
              color: "var(--muted)",
            }}
          >
            ✉️ &nbsp; Continuar con email <span style={{ fontSize: 11, marginLeft: 6, opacity: .6 }}>(próximamente)</span>
          </button>

          <p style={{ marginTop: 20, fontSize: 12, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
            Al continuar aceptás los términos de uso y la política de privacidad de TeReto.
          </p>
        </div>

        {/* Features preview */}
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center" }}>
          {["🔒 Contenido bloqueado", "🧠 Retos reales", "⚡ Puntos y logros"].map(f => (
            <div key={f} style={{
              padding: "6px 12px", borderRadius: 99,
              background: "var(--surface)", border: "1px solid var(--border)",
              fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap",
            }}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEED COMPONENTS (igual que antes, condensados)
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ emoji, size = 36, img = null }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--surface2)", border: "1.5px solid var(--border2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, flexShrink: 0, overflow: "hidden",
    }}>
      {img ? <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : emoji}
    </div>
  );
}

function LockedOverlay({ post, onTap }) {
  return (
    <div onClick={onTap} style={{ position:"relative", borderRadius:16, overflow:"hidden", cursor:"pointer", userSelect:"none" }}>
      <div style={{ height:280, background:post.lockedContent.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:80, filter:"blur(18px)", transform:"scale(1.05)" }}>
        {post.lockedContent.emoji}
      </div>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(10,10,14,.3) 0%,rgba(10,10,14,.7) 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
        <div style={{ width:52,height:52,borderRadius:"50%",background:"rgba(232,255,71,.12)",border:"2px solid var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,animation:"unlockPulse 2s ease-in-out infinite" }}>🔒</div>
        <div style={{ fontFamily:"var(--font-d)",fontSize:14,fontWeight:800,color:"#fff",textAlign:"center",padding:"0 24px" }}>Superá el reto para ver el contenido</div>
        <div style={{ background:"var(--accent)",color:"#0A0A0E",padding:"6px 16px",borderRadius:99,fontWeight:700,fontSize:13,fontFamily:"var(--font-d)" }}>Ver reto →</div>
      </div>
    </div>
  );
}

function UnlockedContent({ post }) {
  return (
    <div style={{ borderRadius:16, overflow:"hidden", animation:"blurIn .6s cubic-bezier(.22,1,.36,1) both", position:"relative" }}>
      <div style={{ height:280, background:post.lockedContent.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:80 }}>{post.lockedContent.emoji}</div>
      <div style={{ position:"absolute",bottom:12,left:12,background:"rgba(10,10,14,.75)",backdropFilter:"blur(8px)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:6 }}>
        <span style={{ fontSize:12 }}>🔓</span>
        <span style={{ fontSize:11,color:"var(--accent)",fontWeight:700 }}>Desbloqueado</span>
      </div>
    </div>
  );
}

function FeedCard({ post, onOpenChallenge, likedIds, onLike, index }) {
  const liked = likedIds.includes(post.id);
  return (
    <article style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,overflow:"hidden",animation:`fadeUp .4s cubic-bezier(.22,1,.36,1) ${index*55}ms both` }}>
      <div style={{ padding:"14px 16px",display:"flex",alignItems:"center",gap:10 }}>
        <Avatar emoji={post.user.avatar} />
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",alignItems:"center",gap:5 }}>
            <span style={{ fontWeight:600,fontSize:14 }}>{post.user.name}</span>
            {post.user.verified && <span style={{ fontSize:12,color:"var(--accent)" }}>✓</span>}
          </div>
          <div style={{ fontSize:12,color:"var(--muted)" }}>{post.time}</div>
        </div>
      </div>
      <div style={{ padding:"0 12px" }}>
        {post.unlocked ? <UnlockedContent post={post} /> : <LockedOverlay post={post} onTap={() => onOpenChallenge(post)} />}
      </div>
      {post.unlocked && (
        <div style={{ padding:"12px 16px 4px",fontSize:14,lineHeight:1.5 }}>
          <span style={{ fontWeight:600,marginRight:6 }}>{post.user.name}</span>{post.lockedContent.caption}
        </div>
      )}
      <div style={{ padding:"12px 16px 14px",display:"flex",alignItems:"center",gap:16 }}>
        <button onClick={() => onLike(post.id)} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:0,fontFamily:"var(--font-b)" }}>
          <span style={{ fontSize:18 }}>{liked?"❤️":"🤍"}</span>
          <span style={{ fontSize:13,fontWeight:600,color:liked?"#FF6B6B":"var(--muted)" }}>{fmt(post.likes+(liked?1:0))}</span>
        </button>
        <button style={{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:0,fontFamily:"var(--font-b)",color:"var(--muted)",fontSize:13 }}>
          <span style={{ fontSize:18 }}>💬</span> {post.comments}
        </button>
        <button style={{ background:"none",border:"none",cursor:"pointer",marginLeft:"auto",color:"var(--muted)",fontSize:18,padding:0 }}>↗</button>
      </div>
      {!post.unlocked && (
        <div onClick={() => onOpenChallenge(post)} style={{ margin:"0 12px 14px",padding:"10px 14px",background:"rgba(232,255,71,.06)",border:"1px solid rgba(232,255,71,.2)",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:18 }}>{post.challenge.type==="trivia"?"🧠":"📸"}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11,color:"var(--accent)",fontWeight:700,letterSpacing:.5,marginBottom:2 }}>{post.challenge.type==="trivia"?"TRIVIA":"SUBÍ UNA FOTO"}</div>
            <div style={{ fontSize:13,color:"var(--muted)",lineHeight:1.35 }}>{post.challenge.prompt.slice(0,55)}{post.challenge.prompt.length>55?"…":""}</div>
          </div>
          <span style={{ color:"var(--accent)",fontSize:16 }}>→</span>
        </div>
      )}
    </article>
  );
}

function ChallengeModal({ post, onClose, onUnlock }) {
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(post.challenge.attempts);
  const [status, setStatus] = useState("idle");
  const [showHint, setShowHint] = useState(false);
  const [photoName, setPhotoName] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { if(post.challenge.type==="trivia") setTimeout(()=>inputRef.current?.focus(),100); }, []);

  function handleSubmit() {
    if (post.challenge.type === "trivia") {
      if (!answer.trim()) return;
      if (answer.trim().toLowerCase() === post.challenge.answer.toLowerCase()) {
        setStatus("success"); setTimeout(() => onUnlock(post.id), 1400);
      } else {
        const left = attempts-1; setAttempts(left); setStatus("wrong");
        setTimeout(() => setStatus("idle"), 1200);
      }
    } else {
      if (!photoName) return;
      setStatus("success"); setTimeout(() => onUnlock(post.id), 1400);
    }
  }

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(10,10,14,.88)",backdropFilter:"blur(6px)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .15s ease both" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%",maxWidth:520,background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",animation:"fadeUp .3s cubic-bezier(.22,1,.36,1) both" }}>
        <div style={{ width:36,height:4,borderRadius:99,background:"var(--border2)",margin:"0 auto 22px" }} />
        {status==="success" ? (
          <div style={{ textAlign:"center",padding:"20px 0" }}>
            <div style={{ fontSize:64,animation:"pop .4s cubic-bezier(.22,1,.36,1) both",marginBottom:12 }}>🔓</div>
            <div style={{ fontFamily:"var(--font-d)",fontSize:22,fontWeight:800,color:"var(--accent)",marginBottom:6 }}>¡Reto superado!</div>
            <div style={{ color:"var(--muted)",fontSize:14 }}>Desbloqueando contenido…</div>
          </div>
        ) : (
          <>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
              <Avatar emoji={post.user.avatar} size={32} />
              <div style={{ flex:1 }}>
                <span style={{ fontWeight:600,fontSize:13 }}>{post.user.name}</span>
                <div style={{ fontSize:11,color:"var(--muted)" }}>bloqueó este contenido con un reto</div>
              </div>
              <div style={{ padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:post.challenge.type==="trivia"?"rgba(232,255,71,.1)":"rgba(78,205,196,.1)",color:post.challenge.type==="trivia"?"var(--accent)":"#4ECDC4",letterSpacing:.5 }}>
                {post.challenge.type==="trivia"?"🧠 TRIVIA":"📸 FOTO"}
              </div>
            </div>
            <div style={{ background:"var(--surface2)",borderRadius:16,padding:"18px",border:"1px solid var(--border)",marginBottom:18 }}>
              <p style={{ fontSize:16,fontWeight:600,lineHeight:1.5 }}>{post.challenge.prompt}</p>
            </div>
            {post.challenge.hint && !showHint && (
              <button onClick={()=>setShowHint(true)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:13,fontFamily:"var(--font-b)",marginBottom:14,padding:0 }}>💡 Ver pista</button>
            )}
            {showHint && (
              <div style={{ padding:"10px 14px",borderRadius:10,background:"rgba(255,235,100,.06)",border:"1px solid rgba(255,235,100,.2)",fontSize:13,color:"#FFE66D",marginBottom:14 }}>💡 {post.challenge.hint}</div>
            )}
            {post.challenge.type==="trivia" && (
              <>
                <input ref={inputRef} value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="Tu respuesta…" disabled={attempts===0}
                  style={{ width:"100%",padding:"13px 16px",background:status==="wrong"?"rgba(255,107,107,.08)":"var(--surface2)",border:`1.5px solid ${status==="wrong"?"#FF6B6B":"var(--border2)"}`,borderRadius:13,color:"var(--text)",fontSize:15,fontFamily:"var(--font-b)",outline:"none",marginBottom:6 }} />
                {status==="wrong" && <div style={{ fontSize:12,color:"#FF6B6B",marginBottom:10,paddingLeft:4 }}>Incorrecto. {attempts>0?`Te quedan ${attempts} intento${attempts!==1?"s":""}.`:"Sin más intentos."}</div>}
                <div style={{ display:"flex",gap:5,marginBottom:16 }}>
                  {Array.from({length:post.challenge.attempts}).map((_,i)=>(
                    <div key={i} style={{ flex:1,height:3,borderRadius:99,background:i<attempts?"var(--accent)":"var(--border2)",transition:"background .3s" }} />
                  ))}
                </div>
              </>
            )}
            {post.challenge.type==="photo" && (
              <label style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:"28px 16px",background:photoName?"rgba(78,205,196,.06)":"var(--surface2)",border:`1.5px dashed ${photoName?"#4ECDC4":"var(--border2)"}`,borderRadius:16,cursor:"pointer",marginBottom:16 }}>
                <span style={{ fontSize:32 }}>{photoName?"✅":"📸"}</span>
                <span style={{ fontSize:14,color:photoName?"#4ECDC4":"var(--muted)",fontWeight:photoName?600:400 }}>{photoName||"Tocá para elegir una foto"}</span>
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>e.target.files?.[0]&&setPhotoName(e.target.files[0].name)} />
              </label>
            )}
            <button onClick={handleSubmit} disabled={post.challenge.type==="trivia"?(attempts===0||!answer.trim()):!photoName}
              style={{ width:"100%",padding:"15px",background:(post.challenge.type==="trivia"?attempts>0&&answer.trim():photoName)?"var(--accent)":"var(--surface2)",border:"none",borderRadius:15,cursor:"pointer",fontFamily:"var(--font-d)",fontSize:16,fontWeight:800,color:(post.challenge.type==="trivia"?attempts>0&&answer.trim():photoName)?"#0A0A0E":"var(--muted)",transition:"all .2s" }}>
              {attempts===0&&post.challenge.type==="trivia"?"Sin intentos disponibles":"Responder →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BottomNav({ active, onChange, user }) {
  const items = [
    {id:"feed",icon:"🏠"}, {id:"explore",icon:"🔍"},
    {id:"create",icon:"⚡",accent:true},
    {id:"notifs",icon:"🔔"}, {id:"profile",icon:"👤"},
  ];
  return (
    <nav style={{ position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,10,14,.95)",backdropFilter:"blur(16px)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-around",alignItems:"center",padding:"10px 0 20px",zIndex:20 }}>
      {items.map(item => (
        <button key={item.id} onClick={()=>onChange(item.id)} style={{ background:item.accent?"var(--accent)":"none",border:"none",borderRadius:item.accent?"50%":0,width:item.accent?44:"auto",height:item.accent?44:"auto",cursor:"pointer",display:"flex",flexDirection:item.accent?"row":"column",alignItems:"center",justifyContent:"center",gap:3,padding:item.accent?0:"4px 8px",opacity:!item.accent&&active!==item.id?0.4:1,transition:"opacity .15s" }}>
          <span style={{ fontSize:item.accent?20:18 }}>{item.icon}</span>
          {!item.accent && <span style={{ fontSize:10,color:active===item.id?"var(--text)":"var(--muted)",fontWeight:active===item.id?600:400 }}>{item.id==="profile"?"Perfil":item.id==="feed"?"Feed":item.id==="explore"?"Explorar":"Notifs"}</span>}
        </button>
      ))}
    </nav>
  );
}

function ProfilePage({ user, unlockedCount, total, onLogout }) {
  return (
    <div style={{ maxWidth:520,margin:"0 auto",padding:"0 0 80px",animation:"fadeUp .35s ease both" }}>
      <div style={{ padding:"52px 20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <h2 style={{ fontFamily:"var(--font-d)",fontSize:22,fontWeight:800 }}>Mi perfil</h2>
        <button onClick={onLogout} style={{ background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:10,padding:"7px 14px",cursor:"pointer",color:"var(--muted)",fontSize:13,fontFamily:"var(--font-b)" }}>Salir</button>
      </div>
      <div style={{ margin:"0 16px",padding:"24px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,display:"flex",gap:16,alignItems:"center" }}>
        <Avatar emoji="👤" size={64} img={user.user_metadata?.avatar_url} />
        <div>
          <div style={{ fontFamily:"var(--font-d)",fontSize:18,fontWeight:800 }}>{user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario"}</div>
          <div style={{ fontSize:13,color:"var(--muted)",marginTop:3 }}>{user.email}</div>
        </div>
      </div>
      <div style={{ margin:"16px 16px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
        {[["🔓","Desbloqueados",unlockedCount],["🔒","Pendientes",total-unlockedCount],["⚡","Puntos",unlockedCount*150],["🏆","Nivel",Math.floor(unlockedCount/3)+1]].map(([emoji,label,val])=>(
          <div key={label} style={{ padding:"16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,textAlign:"center" }}>
            <div style={{ fontSize:24,marginBottom:6 }}>{emoji}</div>
            <div style={{ fontFamily:"var(--font-d)",fontSize:20,fontWeight:800 }}>{val}</div>
            <div style={{ fontSize:12,color:"var(--muted)",marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState(POSTS);
  const [activeNav, setActiveNav] = useState("feed");
  const [challengePost, setChallengePost] = useState(null);
  const [likedIds, setLikedIds] = useState([]);

  // Verificar sesión al cargar
  useEffect(() => {
    supabase.auth.getSession().then(session => {
      if (session?.user) setUser(session.user);
      setLoading(false);
    });
  }, []);

  function handleLogin(userData) { setUser(userData); }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setPosts(POSTS);
    setLikedIds([]);
    setActiveNav("feed");
  }

  function handleUnlock(postId) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, unlocked: true } : p));
    setChallengePost(null);
  }

  const unlockedCount = posts.filter(p => p.unlocked).length;

  if (loading) {
    return (
      <>
        <GlobalStyles />
        <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16 }}>
          <div style={{ width:36,height:36,border:"3px solid var(--border2)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin .7s linear infinite" }} />
          <div style={{ fontFamily:"var(--font-d)",fontSize:18,fontWeight:800 }}>Te<span style={{ color:"var(--accent)" }}>Reto</span></div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight:"100vh",background:"var(--bg)" }}>
        {!user ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <>
            {activeNav === "feed" && (
              <div style={{ maxWidth:520,margin:"0 auto",padding:"0 0 80px" }}>
                <div style={{ position:"sticky",top:0,zIndex:10,background:"rgba(10,10,14,.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid var(--border)",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div style={{ fontFamily:"var(--font-d)",fontSize:22,fontWeight:800,letterSpacing:-.5 }}>Te<span style={{ color:"var(--accent)" }}>Reto</span></div>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <span style={{ fontSize:13,color:"var(--muted)" }}>⚡ {unlockedCount * 150} pts</span>
                    <Avatar emoji="👤" size={32} img={user.user_metadata?.avatar_url} />
                  </div>
                </div>
                <div style={{ padding:"12px 12px 0",display:"flex",flexDirection:"column",gap:16 }}>
                  {posts.map((post,i) => (
                    <FeedCard key={post.id} post={post} index={i} onOpenChallenge={setChallengePost} likedIds={likedIds} onLike={id=>setLikedIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])} />
                  ))}
                </div>
              </div>
            )}
            {activeNav === "profile" && (
              <ProfilePage user={user} unlockedCount={unlockedCount} total={posts.length} onLogout={handleLogout} />
            )}
            {(activeNav === "explore" || activeNav === "create" || activeNav === "notifs") && (
              <div style={{ maxWidth:520,margin:"0 auto",padding:"80px 24px",textAlign:"center" }}>
                <div style={{ fontSize:52,marginBottom:16 }}>{activeNav==="explore"?"🔍":activeNav==="create"?"⚡":"🔔"}</div>
                <div style={{ fontFamily:"var(--font-d)",fontSize:22,fontWeight:800,marginBottom:10 }}>
                  {activeNav==="explore"?"Explorar":activeNav==="create"?"Crear reto":"Notificaciones"}
                </div>
                <div style={{ color:"var(--muted)",fontSize:14,lineHeight:1.6 }}>Próximamente en la siguiente versión.</div>
              </div>
            )}
            <BottomNav active={activeNav} onChange={setActiveNav} user={user} />
            {challengePost && <ChallengeModal post={challengePost} onClose={()=>setChallengePost(null)} onUnlock={handleUnlock} />}
          </>
        )}
      </div>
    </>
  );
}
