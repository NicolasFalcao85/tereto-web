import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://aedbqwnsskuznmbywyav.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XP97uQLTvyBvGvhVTApwDA_V0g1hAmq";

interface User { id: string; email: string; user_metadata: { full_name?: string; avatar_url?: string }; }
interface Profile { id: string; username: string|null; full_name: string|null; avatar_url: string|null; points: number; }
interface Post { id: string; user_id: string; emoji: string; caption: string; gradient: string; image_url?: string|null; challenge_type: "trivia"|"photo"; prompt: string; correct_answer: string|null; hint: string|null; max_attempts: number; created_at: string; profile?: Profile; unlocked?: boolean; likes_count?: number; }

function getToken() { return localStorage.getItem("sb_access_token") ?? ""; }

const supabase = {
  auth: {
    async signInWithGoogle() { window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`; },
    async signOut() { await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method:"POST", headers:{ apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${getToken()}` } }); localStorage.removeItem("sb_access_token"); localStorage.removeItem("sb_refresh_token"); },
    async getSession(): Promise<{ user: User; access_token: string }|null> {
      const hash = window.location.hash;
      if (hash.includes("access_token")) { const p = new URLSearchParams(hash.slice(1)); const t = p.get("access_token"); if (t) { localStorage.setItem("sb_access_token", t); localStorage.setItem("sb_refresh_token", p.get("refresh_token")??""); window.history.replaceState({}, "", window.location.pathname); } }
      const token = localStorage.getItem("sb_access_token");
      if (!token) return null;
      try { const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers:{ apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${token}` } }); if (!res.ok) { localStorage.removeItem("sb_access_token"); return null; } return { user: await res.json(), access_token: token }; } catch { return null; }
    },
  },
};

async function sbFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: { apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${getToken()}`, "Content-Type":"application/json", ...(opts.headers||{}) } });
  if (res.status === 204) return null;
  return res.json();
}

async function uploadImage(userId: string, file: File): Promise<string|null> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/posts/${path}`, {
    method: "POST",
    headers: { apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${getToken()}`, "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/posts/${path}`;
}

const GlobalStyles = () => (<style>{`
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0A0A0E;--surface:#111116;--surface2:#18181F;--border:#222229;--border2:#2E2E38;--text:#F2F2F8;--muted:rgba(242,242,248,0.42);--accent:#E8FF47;--font-d:'Syne',sans-serif;--font-b:'DM Sans',sans-serif}
  html,body{font-family:var(--font-b);background:var(--bg);color:var(--text);min-height:100vh}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pop{0%{transform:scale(.5);opacity:0}65%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
  @keyframes unlockPulse{0%,100%{box-shadow:0 0 0 0 rgba(232,255,71,.4)}50%{box-shadow:0 0 0 12px rgba(232,255,71,0)}}
  @keyframes blurIn{from{filter:blur(20px);opacity:.4}to{filter:blur(0);opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
`}</style>);

function fmt(n: number) { return n>=1000?(n/1000).toFixed(1)+"k":String(n); }
function timeAgo(d: string) { const m=Math.floor((Date.now()-new Date(d).getTime())/60000); if(m<60) return `hace ${m}m`; const h=Math.floor(m/60); if(h<24) return `hace ${h}h`; return `hace ${Math.floor(h/24)}d`; }
function Spinner({ size=28 }: { size?: number }) { return <div style={{width:size,height:size,border:"3px solid var(--border2)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>; }
function Avatar({ size=36, img, emoji="👤" }: { size?: number; img?: string|null; emoji?: string }) {
  return <div style={{width:size,height:size,borderRadius:"50%",background:"var(--surface2)",border:"1.5px solid var(--border2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.42,flexShrink:0,overflow:"hidden"}}>{img?<img src={img} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:emoji}</div>;
}

function LoginPage({ onLogin }: { onLogin: (u: User) => void }) {
  const [loading, setLoading] = useState(false);
  void onLogin;
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,255,71,.07) 0%,transparent 70%)",top:"10%",left:"50%",transform:"translateX(-50%)",animation:"float 6s ease-in-out infinite",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:400,animation:"fadeUp .5s cubic-bezier(.22,1,.36,1) both",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontSize:52,marginBottom:16,animation:"pop .6s cubic-bezier(.22,1,.36,1) .1s both"}}>⚡</div>
          <div style={{fontFamily:"var(--font-d)",fontSize:38,fontWeight:800,letterSpacing:-1}}>Te<span style={{color:"var(--accent)"}}>Reto</span></div>
          <p style={{marginTop:12,color:"var(--muted)",fontSize:15,lineHeight:1.6}}>Desbloqueá contenido superando retos.<br/>La red social que te hace participar.</p>
        </div>
        <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:24,padding:"32px 28px"}}>
          <h2 style={{fontFamily:"var(--font-d)",fontSize:20,fontWeight:800,marginBottom:8}}>Empezá a jugar</h2>
          <p style={{color:"var(--muted)",fontSize:14,marginBottom:28,lineHeight:1.5}}>Creá tu cuenta o iniciá sesión. Es gratis.</p>
          <button onClick={async()=>{setLoading(true);await supabase.auth.signInWithGoogle();}} disabled={loading}
            style={{width:"100%",padding:"14px 20px",background:loading?"var(--surface2)":"#fff",border:"1.5px solid var(--border2)",borderRadius:14,cursor:loading?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12,fontFamily:"var(--font-b)",fontSize:15,fontWeight:600,color:loading?"var(--muted)":"#1a1a1a",transition:"all .2s",marginBottom:16}}>
            {loading?<Spinner size={20}/>:<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
            {loading?"Conectando...":"Continuar con Google"}
          </button>
          <button disabled style={{width:"100%",padding:"14px 20px",background:"var(--surface2)",border:"1.5px solid var(--border)",borderRadius:14,cursor:"not-allowed",fontFamily:"var(--font-b)",fontSize:15,fontWeight:500,color:"var(--muted)"}}>
            ✉️ &nbsp;Continuar con email <span style={{fontSize:11,marginLeft:6,opacity:.6}}>(próximamente)</span>
          </button>
          <p style={{marginTop:20,fontSize:12,color:"var(--muted)",textAlign:"center",lineHeight:1.6}}>Al continuar aceptás los términos de uso y la política de privacidad de TeReto.</p>
        </div>
      </div>
    </div>
  );
}

function LockedOverlay({ post, onTap }: { post: Post; onTap: () => void }) {
  const bg = post.image_url
    ? `url(${post.image_url})`
    : post.gradient;
  return (
    <div onClick={onTap} style={{position:"relative",borderRadius:16,overflow:"hidden",cursor:"pointer",userSelect:"none"}}>
      <div style={{height:300,background:bg,backgroundSize:"cover",backgroundPosition:"center",display:"flex",alignItems:"center",justifyContent:"center",fontSize:80,filter:"blur(18px)",transform:"scale(1.08)"}}>{!post.image_url&&post.emoji}</div>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(10,10,14,.2) 0%,rgba(10,10,14,.65) 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(232,255,71,.12)",border:"2px solid var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,animation:"unlockPulse 2s ease-in-out infinite"}}>🔒</div>
        <div style={{fontFamily:"var(--font-d)",fontSize:14,fontWeight:800,color:"#fff",textAlign:"center",padding:"0 24px"}}>Superá el reto para ver el contenido</div>
        <div style={{background:"var(--accent)",color:"#0A0A0E",padding:"6px 16px",borderRadius:99,fontWeight:700,fontSize:13,fontFamily:"var(--font-d)"}}>Ver reto →</div>
      </div>
    </div>
  );
}

function UnlockedContent({ post }: { post: Post }) {
  return (
    <div style={{borderRadius:16,overflow:"hidden",animation:"blurIn .6s cubic-bezier(.22,1,.36,1) both",position:"relative"}}>
      {post.image_url
        ? <img src={post.image_url} style={{width:"100%",height:300,objectFit:"cover",display:"block"}} alt={post.caption}/>
        : <div style={{height:300,background:post.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80}}>{post.emoji}</div>
      }
      <div style={{position:"absolute",bottom:12,left:12,background:"rgba(10,10,14,.75)",backdropFilter:"blur(8px)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:12}}>🔓</span><span style={{fontSize:11,color:"var(--accent)",fontWeight:700}}>Desbloqueado</span>
      </div>
    </div>
  );
}

function FeedCard({ post, onOpenChallenge, likedIds, onLike, index }: { post: Post; onOpenChallenge: (p:Post)=>void; likedIds: string[]; onLike: (id:string)=>void; index: number }) {
  const liked = likedIds.includes(post.id);
  return (
    <article style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,overflow:"hidden",animation:`fadeUp .4s cubic-bezier(.22,1,.36,1) ${index*55}ms both`}}>
      <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
        <Avatar size={36} img={post.profile?.avatar_url}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:14}}>{post.profile?.full_name||post.profile?.username||"Usuario"}</div>
          <div style={{fontSize:12,color:"var(--muted)"}}>{timeAgo(post.created_at)}</div>
        </div>
      </div>
      <div style={{padding:"0 12px"}}>
        {post.unlocked?<UnlockedContent post={post}/>:<LockedOverlay post={post} onTap={()=>onOpenChallenge(post)}/>}
      </div>
      {post.unlocked&&<div style={{padding:"12px 16px 4px",fontSize:14,lineHeight:1.5}}><span style={{fontWeight:600,marginRight:6}}>{post.profile?.full_name||"Usuario"}</span>{post.caption}</div>}
      <div style={{padding:"12px 16px 14px",display:"flex",alignItems:"center",gap:16}}>
        <button onClick={()=>onLike(post.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:0,fontFamily:"var(--font-b)"}}>
          <span style={{fontSize:18}}>{liked?"❤️":"🤍"}</span>
          <span style={{fontSize:13,fontWeight:600,color:liked?"#FF6B6B":"var(--muted)"}}>{fmt((post.likes_count||0)+(liked?1:0))}</span>
        </button>
        <button style={{background:"none",border:"none",cursor:"pointer",marginLeft:"auto",color:"var(--muted)",fontSize:18,padding:0}}>↗</button>
      </div>
      {!post.unlocked&&(
        <div onClick={()=>onOpenChallenge(post)} style={{margin:"0 12px 14px",padding:"10px 14px",background:"rgba(232,255,71,.06)",border:"1px solid rgba(232,255,71,.2)",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>{post.challenge_type==="trivia"?"🧠":"📸"}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"var(--accent)",fontWeight:700,letterSpacing:.5,marginBottom:2}}>{post.challenge_type==="trivia"?"TRIVIA":"SUBÍ UNA FOTO"}</div>
            <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.35}}>{post.prompt.slice(0,55)}{post.prompt.length>55?"…":""}</div>
          </div>
          <span style={{color:"var(--accent)",fontSize:16}}>→</span>
        </div>
      )}
    </article>
  );
}

function ChallengeModal({ post, onClose, onUnlock, user }: { post: Post; onClose: ()=>void; onUnlock: (id:string, photoFile?: File)=>Promise<void>; user: User }) {
  const isOwn = post.user_id === user.id;
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(post.max_attempts);
  const [attemptsLoaded, setAttemptsLoaded] = useState(false);
  const [status, setStatus] = useState<"idle"|"wrong"|"success"|"pending"|"uploading">("idle");
  const [showHint, setShowHint] = useState(false);
  const [photoFile, setPhotoFile] = useState<File|null>(null);
  const [photoPreview, setPhotoPreview] = useState<string|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    if (post.challenge_type==="trivia") setTimeout(()=>inputRef.current?.focus(),100);
    // Load real attempts from DB
    if (!isOwn) {
      sbFetch(`attempts?user_id=eq.${user.id}&post_id=eq.${post.id}&select=count`).then(data=>{
        if (Array.isArray(data) && data.length>0) setAttempts(Math.max(0, post.max_attempts - data[0].count));
        setAttemptsLoaded(true);
      });
    }
  },[post.challenge_type, post.id, user.id, isOwn]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function saveAttempt() {
    // Upsert attempt count
    const existing = await sbFetch(`attempts?user_id=eq.${user.id}&post_id=eq.${post.id}&select=id,count`);
    if (Array.isArray(existing) && existing.length>0) {
      await sbFetch(`attempts?id=eq.${existing[0].id}`, { method:"PATCH", body:JSON.stringify({ count: existing[0].count+1 }), headers:{ Prefer:"return=minimal" } });
    } else {
      await sbFetch("attempts", { method:"POST", body:JSON.stringify({ user_id:user.id, post_id:post.id, count:1 }), headers:{ Prefer:"return=minimal" } });
    }
  }

  async function handleSubmit() {
    if (post.challenge_type==="trivia") {
      if (!answer.trim()) return;
      if (answer.trim().toLowerCase()===post.correct_answer?.toLowerCase()) {
        setStatus("success"); setTimeout(()=>onUnlock(post.id),1400);
      } else {
        await saveAttempt();
        setAttempts(a=>a-1); setStatus("wrong"); setTimeout(()=>setStatus("idle"),1200);
      }
    } else {
      if (!photoFile) return;
      setStatus("uploading");
      await onUnlock(post.id, photoFile);
      setStatus("pending");
    }
  }

  const canSubmit = post.challenge_type==="trivia" ? attempts>0&&!!answer.trim() : !!photoFile;

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(10,10,14,.88)",backdropFilter:"blur(6px)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .15s ease both"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",animation:"fadeUp .3s cubic-bezier(.22,1,.36,1) both",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,borderRadius:99,background:"var(--border2)",margin:"0 auto 22px"}}/>
        {isOwn?(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:52,marginBottom:12}}>🙈</div>
            <div style={{fontFamily:"var(--font-d)",fontSize:20,fontWeight:800,marginBottom:8}}>Este es tu reto</div>
            <div style={{color:"var(--muted)",fontSize:14,lineHeight:1.6,marginBottom:20}}>No podés responder tus propios retos.<br/>Compartilo para que otros lo intenten.</div>
            <button onClick={onClose} style={{background:"var(--accent)",border:"none",borderRadius:12,padding:"12px 24px",cursor:"pointer",fontFamily:"var(--font-d)",fontSize:15,fontWeight:800,color:"#0A0A0E"}}>Cerrar</button>
          </div>
        ) : status==="success"?(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:64,animation:"pop .4s cubic-bezier(.22,1,.36,1) both",marginBottom:12}}>🔓</div>
            <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:800,color:"var(--accent)",marginBottom:6}}>¡Reto superado!</div>
            <div style={{color:"var(--muted)",fontSize:14}}>Desbloqueando contenido…</div>
          </div>
        ) : (status==="pending"||status==="uploading")?(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:64,marginBottom:12}}>{status==="uploading"?"⏳":"📬"}</div>
            <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:800,color:"var(--accent)",marginBottom:6}}>{status==="uploading"?"Subiendo foto…":"¡Foto enviada!"}</div>
            <div style={{color:"var(--muted)",fontSize:14,lineHeight:1.6}}>{status==="uploading"?"Espera un momento...":"El creador del reto va a revisar tu foto.\nTe avisamos cuando sea aprobada."}</div>
            {status==="pending"&&<button onClick={onClose} style={{marginTop:20,background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:12,padding:"10px 20px",cursor:"pointer",color:"var(--text)",fontFamily:"var(--font-b)",fontSize:14}}>Cerrar</button>}
          </div>
        ) : (status==="idle"||status==="wrong")?(
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <Avatar size={32} img={post.profile?.avatar_url}/>
              <div style={{flex:1}}><span style={{fontWeight:600,fontSize:13}}>{post.profile?.full_name||"Usuario"}</span><div style={{fontSize:11,color:"var(--muted)"}}>bloqueó este contenido con un reto</div></div>
              <div style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:post.challenge_type==="trivia"?"rgba(232,255,71,.1)":"rgba(78,205,196,.1)",color:post.challenge_type==="trivia"?"var(--accent)":"#4ECDC4",letterSpacing:.5}}>{post.challenge_type==="trivia"?"🧠 TRIVIA":"📸 FOTO"}</div>
            </div>
            <div style={{background:"var(--surface2)",borderRadius:16,padding:"18px",border:"1px solid var(--border)",marginBottom:18}}>
              <p style={{fontSize:16,fontWeight:600,lineHeight:1.5}}>{post.prompt}</p>
            </div>
            {post.hint&&!showHint&&<button onClick={()=>setShowHint(true)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:13,fontFamily:"var(--font-b)",marginBottom:14,padding:0}}>💡 Ver pista</button>}
            {showHint&&<div style={{padding:"10px 14px",borderRadius:10,background:"rgba(255,235,100,.06)",border:"1px solid rgba(255,235,100,.2)",fontSize:13,color:"#FFE66D",marginBottom:14}}>💡 {post.hint}</div>}
            {post.challenge_type==="trivia"&&(
              <>
                <input ref={inputRef} value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="Tu respuesta…" disabled={attempts===0}
                  style={{width:"100%",padding:"13px 16px",background:status==="wrong"?"rgba(255,107,107,.08)":"var(--surface2)",border:`1.5px solid ${status==="wrong"?"#FF6B6B":"var(--border2)"}`,borderRadius:13,color:"var(--text)",fontSize:15,fontFamily:"var(--font-b)",outline:"none",marginBottom:6}}/>
                {status==="wrong"&&<div style={{fontSize:12,color:"#FF6B6B",marginBottom:10,paddingLeft:4}}>Incorrecto. {attempts>0?`Te quedan ${attempts} intento${attempts!==1?"s":""}.`:"Sin más intentos."}</div>}
                <div style={{display:"flex",gap:5,marginBottom:16}}>
                  {Array.from({length:post.max_attempts}).map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:99,background:i<attempts?"var(--accent)":"var(--border2)",transition:"background .3s"}}/>)}
                </div>
              </>
            )}
            {post.challenge_type==="photo"&&(
              <div style={{marginBottom:16}}>
                {photoPreview?(
                  <div style={{position:"relative",borderRadius:16,overflow:"hidden",marginBottom:10}}>
                    <img src={photoPreview} style={{width:"100%",height:200,objectFit:"cover",display:"block"}} alt="preview"/>
                    <button onClick={()=>{setPhotoFile(null);setPhotoPreview(null);}} style={{position:"absolute",top:8,right:8,background:"rgba(10,10,14,.8)",border:"none",borderRadius:8,padding:"4px 10px",cursor:"pointer",color:"#fff",fontSize:12,fontFamily:"var(--font-b)"}}>Cambiar</button>
                  </div>
                ):(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,padding:"20px 12px",background:"var(--surface2)",border:"1.5px dashed var(--border2)",borderRadius:14,cursor:"pointer"}}>
                      <span style={{fontSize:28}}>📷</span>
                      <span style={{fontSize:13,color:"var(--muted)",fontWeight:500}}>Cámara</span>
                      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handlePhotoSelect}/>
                    </label>
                    <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,padding:"20px 12px",background:"var(--surface2)",border:"1.5px dashed var(--border2)",borderRadius:14,cursor:"pointer"}}>
                      <span style={{fontSize:28}}>🖼️</span>
                      <span style={{fontSize:13,color:"var(--muted)",fontWeight:500}}>Galería</span>
                      <input ref={galleryRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoSelect}/>
                    </label>
                  </div>
                )}
                <div style={{padding:"8px 12px",borderRadius:10,background:"rgba(78,205,196,.06)",border:"1px solid rgba(78,205,196,.2)",fontSize:12,color:"#4ECDC4"}}>
                  📋 El creador del reto va a verificar tu foto antes de desbloquear el contenido.
                </div>
              </div>
            )}
            <button onClick={handleSubmit} disabled={!canSubmit}
              style={{width:"100%",padding:"15px",background:canSubmit?"var(--accent)":"var(--surface2)",border:"none",borderRadius:15,cursor:canSubmit?"pointer":"default",fontFamily:"var(--font-d)",fontSize:16,fontWeight:800,color:canSubmit?"#0A0A0E":"var(--muted)",transition:"all .2s"}}>
              {attempts===0&&post.challenge_type==="trivia"?"Sin intentos disponibles":post.challenge_type==="photo"?"Enviar foto 📸":"Responder →"}
            </button>
          </>
        ):null}
      </div>
    </div>
  );
}

interface PendingUnlock { id: string; photo_url: string; created_at: string; post: Post; challenger: Profile; }

function NotificationsPage({ user, posts, onReviewed }: { user: User; posts: Post[]; onReviewed: ()=>void }) {
  const [pending, setPending] = useState<PendingUnlock[]>([]);
  const [myNotifs, setMyNotifs] = useState<{id:string;type:string;post:Post;created_at:string;read:boolean}[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"mine"|"review">("mine");

  useEffect(()=>{ loadAll(); },[]);

  async function loadAll() {
    setLoading(true);
    // My notifications (approved/rejected)
    const notifData = await sbFetch(`notifications?user_id=eq.${user.id}&select=*,post:posts(prompt,emoji)&order=created_at.desc&limit=20`);
    if (Array.isArray(notifData)) setMyNotifs(notifData);
    // Mark as read
    await sbFetch(`notifications?user_id=eq.${user.id}&read=eq.false`, { method:"PATCH", body:JSON.stringify({read:true}), headers:{Prefer:"return=minimal"} });
    // Pending reviews of my posts
    const myPostIds = posts.filter(p=>p.user_id===user.id).map(p=>p.id);
    if (myPostIds.length>0) {
      const data = await sbFetch(`unlocks?status=eq.pending&post_id=in.(${myPostIds.join(",")})&select=*,post:posts(*),challenger:profiles!unlocks_user_id_fkey(*)`);
      if (Array.isArray(data)) { setPending(data); if(data.length>0) setTab("review"); }
    }
    setLoading(false);
  }

  async function handleReview(unlockId: string, approve: boolean, challengerUserId: string, postId: string) {
    await sbFetch(`unlocks?id=eq.${unlockId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: approve?"approved":"rejected", reviewed_at: new Date().toISOString() }),
      headers: { Prefer:"return=minimal" }
    });
    await sbFetch("notifications", {
      method: "POST",
      body: JSON.stringify({ user_id: challengerUserId, type: approve?"unlock_approved":"unlock_rejected", post_id: postId, unlock_id: unlockId }),
      headers: { Prefer:"return=minimal" }
    });
    setPending(prev=>prev.filter(u=>u.id!==unlockId));
    onReviewed();
  }

  return (
    <div style={{maxWidth:520,margin:"0 auto",padding:"0 0 80px",animation:"fadeUp .35s ease both"}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(10,10,14,.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid var(--border)",padding:"16px 20px"}}>
        <h2 style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:800,marginBottom:12}}>Notificaciones 🔔</h2>
        <div style={{display:"flex",gap:8}}>
          {([["mine","Mis notifs"],["review",`Revisar${pending.length>0?` (${pending.length})`:""}`]] as [string,string][]).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t as "mine"|"review")}
              style={{padding:"7px 16px",borderRadius:99,border:`1.5px solid ${tab===t?"var(--accent)":"var(--border2)"}`,background:tab===t?"rgba(232,255,71,.08)":"none",cursor:"pointer",fontFamily:"var(--font-b)",fontSize:13,fontWeight:600,color:tab===t?"var(--accent)":"var(--muted)"}}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"12px"}}>
        {loading?<div style={{display:"flex",justifyContent:"center",padding:"60px 0"}}><Spinner/></div>:
         tab==="mine"?(
           myNotifs.length===0?(
            <div style={{textAlign:"center",padding:"60px 20px"}}>
              <div style={{fontSize:48,marginBottom:12}}>🔔</div>
              <div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:800,marginBottom:8}}>Sin notificaciones</div>
              <div style={{color:"var(--muted)",fontSize:14}}>Cuando alguien apruebe o rechace tu foto vas a verlo acá.</div>
            </div>
           ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {myNotifs.map(n=>(
                <div key={n.id} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"14px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{fontSize:28}}>{n.type==="unlock_approved"?"✅":"❌"}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:n.type==="unlock_approved"?"var(--accent)":"#FF6B6B"}}>
                      {n.type==="unlock_approved"?"¡Tu foto fue aprobada!":"Tu foto fue rechazada"}
                    </div>
                    <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>{n.post?.prompt?.slice(0,50)||"Reto"} • {timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
           )
         ):(
           pending.length===0?(
            <div style={{textAlign:"center",padding:"60px 20px"}}>
              <div style={{fontSize:48,marginBottom:12}}>🎉</div>
              <div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:800,marginBottom:8}}>Todo al día</div>
              <div style={{color:"var(--muted)",fontSize:14}}>No tenés fotos pendientes de revisión.</div>
            </div>
           ):(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {pending.map(u=>(
                <div key={u.id} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
                  <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid var(--border)"}}>
                    <Avatar size={32} img={u.challenger?.avatar_url}/>
                    <div style={{flex:1}}>
                      <span style={{fontWeight:600,fontSize:13}}>{u.challenger?.full_name||"Usuario"}</span>
                      <div style={{fontSize:11,color:"var(--muted)"}}>quiere desbloquear tu reto • {timeAgo(u.created_at)}</div>
                    </div>
                  </div>
                  <div style={{padding:"10px 14px",fontSize:13,color:"var(--muted)",borderBottom:"1px solid var(--border)"}}>
                    <span style={{color:"var(--text)",fontWeight:500}}>Reto: </span>{u.post?.prompt}
                  </div>
                  {u.photo_url&&<img src={u.photo_url} style={{width:"100%",maxHeight:280,objectFit:"cover",display:"block"}} alt="foto del reto"/>}
                  <div style={{padding:"12px 14px",display:"flex",gap:8}}>
                    <button onClick={()=>handleReview(u.id,true,u.challenger?.id,u.post?.id)}
                      style={{flex:1,padding:"11px",background:"rgba(232,255,71,.1)",border:"1.5px solid var(--accent)",borderRadius:12,cursor:"pointer",fontFamily:"var(--font-d)",fontSize:14,fontWeight:800,color:"var(--accent)"}}>
                      ✅ Aprobar
                    </button>
                    <button onClick={()=>handleReview(u.id,false,u.challenger?.id,u.post?.id)}
                      style={{flex:1,padding:"11px",background:"rgba(255,107,107,.08)",border:"1.5px solid #FF6B6B",borderRadius:12,cursor:"pointer",fontFamily:"var(--font-d)",fontSize:14,fontWeight:800,color:"#FF6B6B"}}>
                      ❌ Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
           )
         )
        }
      </div>
    </div>
  );
}

function BottomNav({ active, onChange, pendingCount }: { active: string; onChange: (id:string)=>void; pendingCount: number }) {
  const items = [{id:"feed",icon:"🏠",label:"Feed"},{id:"explore",icon:"🔍",label:"Explorar"},{id:"create",icon:"⚡",label:"",accent:true},{id:"notifs",icon:"🔔",label:"Notifs"},{id:"profile",icon:"👤",label:"Perfil"}];
  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,10,14,.95)",backdropFilter:"blur(16px)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-around",alignItems:"center",padding:"10px 0 20px",zIndex:20}}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>onChange(item.id)} style={{background:item.accent?"var(--accent)":"none",border:"none",borderRadius:item.accent?"50%":0,width:item.accent?44:"auto",height:item.accent?44:"auto",cursor:"pointer",display:"flex",flexDirection:item.accent?"row":"column",alignItems:"center",justifyContent:"center",gap:3,padding:item.accent?0:"4px 8px",opacity:!item.accent&&active!==item.id?0.4:1,transition:"opacity .15s",position:"relative"}}>
          <span style={{fontSize:item.accent?20:18}}>{item.icon}</span>
          {!item.accent&&<span style={{fontSize:10,color:active===item.id?"var(--text)":"var(--muted)",fontWeight:active===item.id?600:400}}>{item.label}</span>}
          {item.id==="notifs"&&pendingCount>0&&<div style={{position:"absolute",top:2,right:2,width:8,height:8,borderRadius:"50%",background:"var(--accent)"}}/>}
        </button>
      ))}
    </nav>
  );
}

function ProfilePage({ user, posts, unlockedIds, onLogout, onPostDeleted }: { user: User; posts: Post[]; unlockedIds: string[]; onLogout: ()=>void; onPostDeleted: ()=>void }) {
  const myPosts = posts.filter(p=>p.user_id===user.id);
  const [username, setUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [copied, setCopied] = useState<string|null>(null);

  useEffect(()=>{
    sbFetch(`profiles?id=eq.${user.id}&select=username`).then(data=>{
      if (Array.isArray(data)&&data.length>0&&data[0].username) setUsername(data[0].username);
    });
  },[user.id]);

  async function handleSaveUsername() {
    const val = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_.]/g,"");
    if (!val||val.length<3) { setUsernameError("Mínimo 3 caracteres (letras, números, _ o .)"); return; }
    setSavingUsername(true); setUsernameError("");
    const data = await sbFetch(`profiles?id=eq.${user.id}`, { method:"PATCH", body:JSON.stringify({username:val}), headers:{Prefer:"return=minimal"} });
    if (data===null) { setUsername(val); setEditingUsername(false); }
    else setUsernameError("Ese username ya está en uso. Probá otro.");
    setSavingUsername(false);
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("¿Eliminar este post?")) return;
    await sbFetch(`posts?id=eq.${postId}`, { method:"DELETE" });
    onPostDeleted();
  }

  function handleShare(postId: string) {
    const url = `${window.location.origin}?post=${postId}`;
    navigator.clipboard.writeText(url).then(()=>{ setCopied(postId); setTimeout(()=>setCopied(null),2000); });
  }

  return (
    <div style={{maxWidth:520,margin:"0 auto",padding:"0 0 80px",animation:"fadeUp .35s ease both"}}>
      <div style={{padding:"52px 20px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h2 style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:800}}>Mi perfil</h2>
        <button onClick={onLogout} style={{background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:10,padding:"7px 14px",cursor:"pointer",color:"var(--muted)",fontSize:13,fontFamily:"var(--font-b)"}}>Salir</button>
      </div>

      {/* Info */}
      <div style={{margin:"0 16px",padding:"20px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20}}>
        <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:14}}>
          <Avatar size={60} img={user.user_metadata?.avatar_url}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:"var(--font-d)",fontSize:16,fontWeight:800}}>{user.user_metadata?.full_name||user.email?.split("@")[0]}</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{user.email}</div>
          </div>
        </div>
        {editingUsername?(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",gap:8}}>
              <input value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} placeholder="tu_username" autoFocus
                style={{flex:1,padding:"10px 12px",background:"var(--surface2)",border:"1.5px solid var(--border2)",borderRadius:10,color:"var(--text)",fontSize:14,fontFamily:"var(--font-b)",outline:"none"}}/>
              <button onClick={handleSaveUsername} disabled={savingUsername}
                style={{padding:"10px 16px",background:"var(--accent)",border:"none",borderRadius:10,cursor:"pointer",fontFamily:"var(--font-d)",fontSize:13,fontWeight:800,color:"#0A0A0E"}}>
                {savingUsername?"...":"Guardar"}
              </button>
              <button onClick={()=>setEditingUsername(false)}
                style={{padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:10,cursor:"pointer",color:"var(--muted)",fontSize:13,fontFamily:"var(--font-b)"}}>✕</button>
            </div>
            {usernameError&&<div style={{fontSize:12,color:"#FF6B6B"}}>{usernameError}</div>}
          </div>
        ):(
          <button onClick={()=>{ setUsernameInput(username); setEditingUsername(true); }}
            style={{background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:10,padding:"8px 14px",cursor:"pointer",color:username?"var(--accent)":"var(--muted)",fontSize:13,fontFamily:"var(--font-b)",width:"100%",textAlign:"left"}}>
            {username?`@${username}`:"+ Elegir @username"}
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{margin:"12px 16px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {([["🔓","Desbloqueados",unlockedIds.length],["📸","Mis posts",myPosts.length],["⚡","Puntos",unlockedIds.length*150],["🏆","Nivel",Math.floor(unlockedIds.length/3)+1]] as [string,string,number][]).map(([e,l,v])=>(
          <div key={l} style={{padding:"14px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{e}</div>
            <div style={{fontFamily:"var(--font-d)",fontSize:20,fontWeight:800}}>{v}</div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* My posts */}
      {myPosts.length>0&&(
        <div style={{margin:"16px 16px 0"}}>
          <div style={{fontFamily:"var(--font-d)",fontSize:16,fontWeight:800,marginBottom:10}}>Mis retos publicados</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {myPosts.map(post=>(
              <div key={post.id} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden"}}>
                <div style={{height:80,background:post.image_url?`url(${post.image_url})`:(post.gradient||"var(--surface2)"),backgroundSize:"cover",backgroundPosition:"center",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,filter:post.image_url?"blur(4px)":"none"}}>{!post.image_url&&post.emoji}</div>
                <div style={{padding:"10px 12px"}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{post.caption}</div>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:8}}>{post.challenge_type==="trivia"?"🧠":"📸"} {post.prompt.slice(0,50)}{post.prompt.length>50?"…":""}</div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>handleShare(post.id)}
                      style={{flex:1,padding:"8px",background:"rgba(232,255,71,.08)",border:"1px solid rgba(232,255,71,.2)",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--accent)",fontFamily:"var(--font-b)"}}>
                      {copied===post.id?"✅ Copiado!":"↗ Compartir"}
                    </button>
                    <button onClick={()=>handleDeletePost(post.id)}
                      style={{padding:"8px 12px",background:"rgba(255,107,107,.06)",border:"1px solid rgba(255,107,107,.2)",borderRadius:8,cursor:"pointer",fontSize:12,color:"#FF6B6B",fontFamily:"var(--font-b)"}}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExplorePage({ posts, onOpenChallenge, likedIds, onLike, currentUserId }: { posts: Post[]; onOpenChallenge: (p:Post)=>void; likedIds: string[]; onLike: (id:string)=>void; currentUserId: string }) {
  const [search, setSearch] = useState("");
  const otherPosts = posts.filter(p=>p.user_id!==currentUserId);
  const filtered = search.trim()
    ? otherPosts.filter(p=>p.caption?.toLowerCase().includes(search.toLowerCase())||p.prompt?.toLowerCase().includes(search.toLowerCase())||p.profile?.full_name?.toLowerCase().includes(search.toLowerCase()))
    : otherPosts;

  return (
    <div style={{maxWidth:520,margin:"0 auto",padding:"0 0 80px",animation:"fadeUp .35s ease both"}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(10,10,14,.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid var(--border)",padding:"16px 20px"}}>
        <h2 style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:800,marginBottom:12}}>Explorar 🔍</h2>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar retos, usuarios..."
          style={{width:"100%",padding:"11px 14px",background:"var(--surface2)",border:"1.5px solid var(--border2)",borderRadius:12,color:"var(--text)",fontSize:14,fontFamily:"var(--font-b)",outline:"none"}}/>
      </div>
      <div style={{padding:"12px 12px 0",display:"flex",flexDirection:"column",gap:16}}>
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:48,marginBottom:12}}>🔍</div>
            <div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:800,marginBottom:8}}>{search?"Sin resultados":"Sin posts de otros usuarios"}</div>
            <div style={{color:"var(--muted)",fontSize:14}}>Invitá amigos para que publiquen sus retos.</div>
          </div>
        ):filtered.map((post,i)=><FeedCard key={post.id} post={post} index={i} onOpenChallenge={onOpenChallenge} likedIds={likedIds} onLike={onLike}/>)}
      </div>
    </div>
  );
}


  "linear-gradient(135deg,#667eea,#f093fb)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#f7971e,#ffd200)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#30cfd0,#667eea)",
];

function CreatePage({ user, onPublished }: { user: User; onPublished: ()=>void }) {
  const [imageFile, setImageFile] = useState<File|null>(null);
  const [imagePreview, setImagePreview] = useState<string|null>(null);
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [caption, setCaption] = useState("");
  const [challengeType, setChallengeType] = useState<"trivia"|"photo">("trivia");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const canPublish = caption.trim() && prompt.trim() && (challengeType==="photo" || answer.trim());

  async function handlePublish() {
    if (!canPublish || publishing) return;
    setPublishing(true); setError("");
    try {
      let image_url: string|null = null;
      if (imageFile) {
        image_url = await uploadImage(user.id, imageFile);
        if (!image_url) { setError("Error al subir la imagen. Intentá de nuevo."); setPublishing(false); return; }
      }
      const data = await sbFetch("posts", {
        method: "POST",
        body: JSON.stringify({ user_id:user.id, emoji:"🖼️", caption, gradient, image_url, challenge_type:challengeType, prompt, correct_answer:answer||null, hint:hint||null, max_attempts:3 }),
        headers: { Prefer:"return=representation" }
      });
      if (data && !data.error && !data.message) onPublished();
      else setError("Error al publicar. Intentá de nuevo.");
    } catch { setError("Error al publicar. Intentá de nuevo."); }
    finally { setPublishing(false); }
  }

  return (
    <div style={{maxWidth:520,margin:"0 auto",padding:"0 0 80px",animation:"fadeUp .35s ease both"}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(10,10,14,.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid var(--border)",padding:"16px 20px"}}>
        <h2 style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:800}}>Crear reto ⚡</h2>
      </div>
      <div style={{padding:"16px 12px",display:"flex",flexDirection:"column",gap:16}}>

        {/* Foto del contenido */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
          <label style={{display:"block",cursor:"pointer"}}>
            {imagePreview ? (
              <div style={{position:"relative"}}>
                <img src={imagePreview} style={{width:"100%",height:240,objectFit:"cover",display:"block",filter:"blur(16px)",transform:"scale(1.05)"}} alt="preview"/>
                <div style={{position:"absolute",inset:0,background:"rgba(10,10,14,.5)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
                  <div style={{fontSize:28}}>🔒</div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:13,fontWeight:800,color:"#fff"}}>Así se verá blureada</div>
                  <div style={{fontSize:12,color:"var(--muted)"}}>Tocá para cambiar la foto</div>
                </div>
              </div>
            ) : (
              <div style={{height:200,background:gradient,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
                <div style={{fontSize:36}}>📷</div>
                <div style={{fontFamily:"var(--font-d)",fontSize:15,fontWeight:800,color:"#fff"}}>Subí tu foto</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>Se va a mostrar blureada hasta que superen el reto</div>
              </div>
            )}
            <input type="file" accept="image/*" style={{display:"none"}} onChange={handleImageChange}/>
          </label>
          {!imagePreview&&(
            <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)"}}>
              <div style={{fontSize:11,color:"var(--muted)",marginBottom:8}}>O elegí un color de fondo:</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {GRADIENTS.map(g=>(
                  <button key={g} onClick={()=>setGradient(g)} style={{width:32,height:32,borderRadius:8,background:g,border:`3px solid ${gradient===g?"var(--accent)":"transparent"}`,cursor:"pointer",transition:"all .15s"}}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Caption */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:12,color:"var(--accent)",fontWeight:700,letterSpacing:.5,marginBottom:10}}>DESCRIPCIÓN</div>
          <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Describí tu contenido..." rows={2}
            style={{width:"100%",background:"var(--surface2)",border:"1.5px solid var(--border2)",borderRadius:12,padding:"12px",color:"var(--text)",fontSize:14,fontFamily:"var(--font-b)",outline:"none",resize:"none"}}/>
        </div>

        {/* Tipo de reto */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:12,color:"var(--accent)",fontWeight:700,letterSpacing:.5,marginBottom:10}}>TIPO DE RETO</div>
          <div style={{display:"flex",gap:8}}>
            {(["trivia","photo"] as const).map(t=>(
              <button key={t} onClick={()=>setChallengeType(t)}
                style={{flex:1,padding:"12px",borderRadius:12,border:`1.5px solid ${challengeType===t?"var(--accent)":"var(--border2)"}`,background:challengeType===t?"rgba(232,255,71,.08)":"var(--surface2)",cursor:"pointer",fontFamily:"var(--font-b)",fontSize:14,fontWeight:600,color:challengeType===t?"var(--accent)":"var(--muted)",transition:"all .15s"}}>
                {t==="trivia"?"🧠 Trivia":"📸 Foto"}
              </button>
            ))}
          </div>
        </div>

        {/* Reto */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:12,color:"var(--accent)",fontWeight:700,letterSpacing:.5}}>EL RETO</div>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={challengeType==="trivia"?"Escribí la pregunta...":"Describí qué foto tiene que subir el usuario..."} rows={2}
            style={{width:"100%",background:"var(--surface2)",border:"1.5px solid var(--border2)",borderRadius:12,padding:"12px",color:"var(--text)",fontSize:14,fontFamily:"var(--font-b)",outline:"none",resize:"none"}}/>
          {challengeType==="trivia"&&(
            <input value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Respuesta correcta..."
              style={{width:"100%",background:"var(--surface2)",border:"1.5px solid var(--border2)",borderRadius:12,padding:"12px",color:"var(--text)",fontSize:14,fontFamily:"var(--font-b)",outline:"none"}}/>
          )}
          <input value={hint} onChange={e=>setHint(e.target.value)} placeholder="Pista (opcional)..."
            style={{width:"100%",background:"var(--surface2)",border:"1.5px solid var(--border2)",borderRadius:12,padding:"12px",color:"var(--text)",fontSize:14,fontFamily:"var(--font-b)",outline:"none"}}/>
        </div>

        {error&&<div style={{padding:"12px",borderRadius:12,background:"rgba(255,107,107,.08)",border:"1px solid #FF6B6B",fontSize:13,color:"#FF6B6B"}}>{error}</div>}

        <button onClick={handlePublish} disabled={!canPublish||publishing}
          style={{width:"100%",padding:"16px",background:canPublish&&!publishing?"var(--accent)":"var(--surface2)",border:"none",borderRadius:15,cursor:canPublish&&!publishing?"pointer":"default",fontFamily:"var(--font-d)",fontSize:16,fontWeight:800,color:canPublish&&!publishing?"#0A0A0E":"var(--muted)",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          {publishing?<><Spinner size={20}/> Publicando...</>:"Publicar reto ⚡"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User|null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeNav, setActiveNav] = useState("feed");
  const [challengePost, setChallengePost] = useState<Post|null>(null);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(()=>{ supabase.auth.getSession().then(s=>{ if(s?.user) setUser(s.user); setLoading(false); }); },[]);
  useEffect(()=>{ if(user){ loadPosts(); loadUnlocks(); loadLikes(); loadPendingCount(); } },[user]);

  async function loadPosts() {
    setPostsLoading(true);
    try {
      const data = await sbFetch("posts?select=*,profile:profiles(id,full_name,username,avatar_url)&order=created_at.desc");
      if (Array.isArray(data)) setPosts(data);
    } finally { setPostsLoading(false); }
  }

  async function loadUnlocks() {
    if (!user) return;
    const data = await sbFetch(`unlocks?user_id=eq.${user.id}&status=eq.approved&select=post_id`);
    if (Array.isArray(data)) setUnlockedIds(data.map((u: {post_id:string})=>u.post_id));
  }

  async function loadLikes() {
    if (!user) return;
    const data = await sbFetch(`likes?user_id=eq.${user.id}&select=post_id`);
    if (Array.isArray(data)) setLikedIds(data.map((l: {post_id:string})=>l.post_id));
  }

  async function loadPendingCount() {
    if (!user) return;
    let count = 0;
    // Unread notifications for me
    const notifs = await sbFetch(`notifications?user_id=eq.${user.id}&read=eq.false&select=id`);
    if (Array.isArray(notifs)) count += notifs.length;
    // Pending reviews of my posts
    const myPosts = await sbFetch(`posts?user_id=eq.${user.id}&select=id`);
    if (Array.isArray(myPosts)&&myPosts.length>0) {
      const ids = myPosts.map((p:{id:string})=>p.id).join(",");
      const pending = await sbFetch(`unlocks?status=eq.pending&post_id=in.(${ids})&select=id`);
      if (Array.isArray(pending)) count += pending.length;
    }
    setPendingCount(count);
  }

  async function handleUnlock(postId: string, photoFile?: File) {
    if (!user) return;
    const post = posts.find(p=>p.id===postId);
    if (!post) return;
    if (post.challenge_type==="photo" && photoFile) {
      const photo_url = await uploadImage(user.id, photoFile);
      if (!photo_url) return;
      await sbFetch("unlocks", { method:"POST", body:JSON.stringify({ user_id:user.id, post_id:postId, status:"pending", photo_url }), headers:{ Prefer:"return=minimal" } });
      return; // modal se cierra desde el propio ChallengeModal al setStatus("pending")
    } else {
      await sbFetch("unlocks", { method:"POST", body:JSON.stringify({ user_id:user.id, post_id:postId, status:"approved" }), headers:{ Prefer:"return=minimal" } });
      await sbFetch(`profiles?id=eq.${user.id}`, { method:"PATCH", body:JSON.stringify({ points:(unlockedIds.length+1)*150 }), headers:{ Prefer:"return=minimal" } });
      setUnlockedIds(prev=>[...prev,postId]);
    }
    setChallengePost(null);
  }

  async function handleLike(postId: string) {
    if (!user) return;
    if (likedIds.includes(postId)) {
      await sbFetch(`likes?user_id=eq.${user.id}&post_id=eq.${postId}`, { method:"DELETE" });
      setLikedIds(prev=>prev.filter(id=>id!==postId));
    } else {
      await sbFetch("likes", { method:"POST", body:JSON.stringify({ user_id:user.id, post_id:postId }), headers:{ Prefer:"return=minimal" } });
      setLikedIds(prev=>[...prev,postId]);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null); setPosts([]); setUnlockedIds([]); setLikedIds([]); setActiveNav("feed");
  }

  const postsWithUnlocked = posts.map(p=>({...p, unlocked:unlockedIds.includes(p.id)}));

  if (loading) return (<><GlobalStyles/><div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><Spinner/><div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:800}}>Te<span style={{color:"var(--accent)"}}>Reto</span></div></div></>);

  return (
    <><GlobalStyles/>
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      {!user?<LoginPage onLogin={setUser}/>:(
        <>
          {activeNav==="feed"&&(
            <div style={{maxWidth:520,margin:"0 auto",padding:"0 0 80px"}}>
              <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(10,10,14,.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid var(--border)",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:800,letterSpacing:-.5}}>Te<span style={{color:"var(--accent)"}}>Reto</span></div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:13,color:"var(--muted)"}}>⚡ {unlockedIds.length*150} pts</span>
                  <Avatar size={32} img={user.user_metadata?.avatar_url}/>
                </div>
              </div>
              {postsLoading?<div style={{display:"flex",justifyContent:"center",padding:"60px 0"}}><Spinner/></div>:(
                <div style={{padding:"12px 12px 0",display:"flex",flexDirection:"column",gap:16}}>
                  {postsWithUnlocked.map((post,i)=><FeedCard key={post.id} post={post} index={i} onOpenChallenge={setChallengePost} likedIds={likedIds} onLike={handleLike}/>)}
                  {postsWithUnlocked.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:"var(--muted)"}}>No hay posts todavía.</div>}
                </div>
              )}
            </div>
          )}
          {activeNav==="explore"&&<ExplorePage posts={postsWithUnlocked} onOpenChallenge={setChallengePost} likedIds={likedIds} onLike={handleLike} currentUserId={user.id}/>}
          {activeNav==="create"&&<CreatePage user={user} onPublished={()=>{ loadPosts(); setActiveNav("feed"); }}/>}
          {activeNav==="notifs"&&<NotificationsPage user={user} posts={posts} onReviewed={()=>{ loadUnlocks(); loadPendingCount(); }}/>}
          {activeNav==="profile"&&<ProfilePage user={user} posts={posts} unlockedIds={unlockedIds} onLogout={handleLogout} onPostDeleted={()=>{ loadPosts(); }}/>}
          <BottomNav active={activeNav} onChange={setActiveNav} pendingCount={pendingCount}/>
          {challengePost&&<ChallengeModal post={challengePost} onClose={()=>setChallengePost(null)} onUnlock={handleUnlock} user={user}/>}
        </>
      )}
    </div></>
  );
}
