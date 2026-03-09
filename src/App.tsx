import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://aedbqwnsskuznmbywyav.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XP97uQLTvyBvGvhVTApwDA_V0g1hAmq";

interface User { id: string; email: string; user_metadata: { full_name?: string; avatar_url?: string }; }
interface Profile { id: string; username: string|null; full_name: string|null; avatar_url: string|null; points: number; }
interface Post { id: string; user_id: string; emoji: string; caption: string; gradient: string; challenge_type: "trivia"|"photo"; prompt: string; correct_answer: string|null; hint: string|null; max_attempts: number; created_at: string; profile?: Profile; unlocked?: boolean; likes_count?: number; }

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

function Spinner() { return <div style={{width:28,height:28,border:"3px solid var(--border2)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>; }
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
            {loading?<Spinner/>:<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
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
  return (
    <div onClick={onTap} style={{position:"relative",borderRadius:16,overflow:"hidden",cursor:"pointer",userSelect:"none"}}>
      <div style={{height:280,background:post.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80,filter:"blur(18px)",transform:"scale(1.05)"}}>{post.emoji}</div>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(10,10,14,.3) 0%,rgba(10,10,14,.7) 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
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
      <div style={{height:280,background:post.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80}}>{post.emoji}</div>
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

function ChallengeModal({ post, onClose, onUnlock }: { post: Post; onClose: ()=>void; onUnlock: (id:string)=>void }) {
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(post.max_attempts);
  const [status, setStatus] = useState<"idle"|"wrong"|"success">("idle");
  const [showHint, setShowHint] = useState(false);
  const [photoName, setPhotoName] = useState<string|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(()=>{ if(post.challenge_type==="trivia") setTimeout(()=>inputRef.current?.focus(),100); },[post.challenge_type]);

  function handleSubmit() {
    if (post.challenge_type==="trivia") {
      if (!answer.trim()) return;
      if (answer.trim().toLowerCase()===post.correct_answer?.toLowerCase()) { setStatus("success"); setTimeout(()=>onUnlock(post.id),1400); }
      else { setAttempts(a=>a-1); setStatus("wrong"); setTimeout(()=>setStatus("idle"),1200); }
    } else { if (!photoName) return; setStatus("success"); setTimeout(()=>onUnlock(post.id),1400); }
  }

  const canSubmit = post.challenge_type==="trivia" ? attempts>0&&answer.trim() : photoName;

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(10,10,14,.88)",backdropFilter:"blur(6px)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .15s ease both"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",animation:"fadeUp .3s cubic-bezier(.22,1,.36,1) both"}}>
        <div style={{width:36,height:4,borderRadius:99,background:"var(--border2)",margin:"0 auto 22px"}}/>
        {status==="success"?(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:64,animation:"pop .4s cubic-bezier(.22,1,.36,1) both",marginBottom:12}}>🔓</div>
            <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:800,color:"var(--accent)",marginBottom:6}}>¡Reto superado!</div>
            <div style={{color:"var(--muted)",fontSize:14}}>Desbloqueando contenido…</div>
          </div>
        ):(
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
              <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:"28px 16px",background:photoName?"rgba(78,205,196,.06)":"var(--surface2)",border:`1.5px dashed ${photoName?"#4ECDC4":"var(--border2)"}`,borderRadius:16,cursor:"pointer",marginBottom:16}}>
                <span style={{fontSize:32}}>{photoName?"✅":"📸"}</span>
                <span style={{fontSize:14,color:photoName?"#4ECDC4":"var(--muted)",fontWeight:photoName?600:400}}>{photoName||"Tocá para elegir una foto"}</span>
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files?.[0]&&setPhotoName(e.target.files[0].name)}/>
              </label>
            )}
            <button onClick={handleSubmit} disabled={!canSubmit}
              style={{width:"100%",padding:"15px",background:canSubmit?"var(--accent)":"var(--surface2)",border:"none",borderRadius:15,cursor:"pointer",fontFamily:"var(--font-d)",fontSize:16,fontWeight:800,color:canSubmit?"#0A0A0E":"var(--muted)",transition:"all .2s"}}>
              {attempts===0&&post.challenge_type==="trivia"?"Sin intentos disponibles":"Responder →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BottomNav({ active, onChange }: { active: string; onChange: (id:string)=>void }) {
  const items = [{id:"feed",icon:"🏠",label:"Feed"},{id:"explore",icon:"🔍",label:"Explorar"},{id:"create",icon:"⚡",label:"",accent:true},{id:"notifs",icon:"🔔",label:"Notifs"},{id:"profile",icon:"👤",label:"Perfil"}];
  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,10,14,.95)",backdropFilter:"blur(16px)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-around",alignItems:"center",padding:"10px 0 20px",zIndex:20}}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>onChange(item.id)} style={{background:item.accent?"var(--accent)":"none",border:"none",borderRadius:item.accent?"50%":0,width:item.accent?44:"auto",height:item.accent?44:"auto",cursor:"pointer",display:"flex",flexDirection:item.accent?"row":"column",alignItems:"center",justifyContent:"center",gap:3,padding:item.accent?0:"4px 8px",opacity:!item.accent&&active!==item.id?0.4:1,transition:"opacity .15s"}}>
          <span style={{fontSize:item.accent?20:18}}>{item.icon}</span>
          {!item.accent&&<span style={{fontSize:10,color:active===item.id?"var(--text)":"var(--muted)",fontWeight:active===item.id?600:400}}>{item.label}</span>}
        </button>
      ))}
    </nav>
  );
}

function ProfilePage({ user, posts, unlockedIds, onLogout }: { user: User; posts: Post[]; unlockedIds: string[]; onLogout: ()=>void }) {
  return (
    <div style={{maxWidth:520,margin:"0 auto",padding:"0 0 80px",animation:"fadeUp .35s ease both"}}>
      <div style={{padding:"52px 20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h2 style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:800}}>Mi perfil</h2>
        <button onClick={onLogout} style={{background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:10,padding:"7px 14px",cursor:"pointer",color:"var(--muted)",fontSize:13,fontFamily:"var(--font-b)"}}>Salir</button>
      </div>
      <div style={{margin:"0 16px",padding:"24px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,display:"flex",gap:16,alignItems:"center"}}>
        <Avatar size={64} img={user.user_metadata?.avatar_url}/>
        <div>
          <div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:800}}>{user.user_metadata?.full_name||user.email?.split("@")[0]||"Usuario"}</div>
          <div style={{fontSize:13,color:"var(--muted)",marginTop:3}}>{user.email}</div>
        </div>
      </div>
      <div style={{margin:"16px 16px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {([["🔓","Desbloqueados",unlockedIds.length],["🔒","Pendientes",posts.length-unlockedIds.length],["⚡","Puntos",unlockedIds.length*150],["🏆","Nivel",Math.floor(unlockedIds.length/3)+1]] as [string,string,number][]).map(([e,l,v])=>(
          <div key={l} style={{padding:"16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:6}}>{e}</div>
            <div style={{fontFamily:"var(--font-d)",fontSize:20,fontWeight:800}}>{v}</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{l}</div>
          </div>
        ))}
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
  const [activeNav, setActiveNav] = useState("feed");
  const [challengePost, setChallengePost] = useState<Post|null>(null);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(()=>{ supabase.auth.getSession().then(s=>{ if(s?.user) setUser(s.user); setLoading(false); }); },[]);
  useEffect(()=>{ if(user){ loadPosts(); loadUnlocks(); loadLikes(); } },[user]);

  async function loadPosts() {
    setPostsLoading(true);
    try {
      const data = await sbFetch("posts?select=*,profile:profiles(id,full_name,username,avatar_url)&order=created_at.desc");
      if (Array.isArray(data)) setPosts(data);
    } finally { setPostsLoading(false); }
  }

  async function loadUnlocks() {
    if (!user) return;
    const data = await sbFetch(`unlocks?user_id=eq.${user.id}&select=post_id`);
    if (Array.isArray(data)) setUnlockedIds(data.map((u: {post_id:string})=>u.post_id));
  }

  async function loadLikes() {
    if (!user) return;
    const data = await sbFetch(`likes?user_id=eq.${user.id}&select=post_id`);
    if (Array.isArray(data)) setLikedIds(data.map((l: {post_id:string})=>l.post_id));
  }

  async function handleUnlock(postId: string) {
    if (!user) return;
    await sbFetch("unlocks", { method:"POST", body:JSON.stringify({ user_id:user.id, post_id:postId }), headers:{ Prefer:"return=minimal" } });
    await sbFetch(`profiles?id=eq.${user.id}`, { method:"PATCH", body:JSON.stringify({ points:(unlockedIds.length+1)*150 }), headers:{ Prefer:"return=minimal" } });
    setUnlockedIds(prev=>[...prev,postId]);
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
          {activeNav==="profile"&&<ProfilePage user={user} posts={posts} unlockedIds={unlockedIds} onLogout={handleLogout}/>}
          {["explore","create","notifs"].includes(activeNav)&&(
            <div style={{maxWidth:520,margin:"0 auto",padding:"80px 24px",textAlign:"center"}}>
              <div style={{fontSize:52,marginBottom:16}}>{activeNav==="explore"?"🔍":activeNav==="create"?"⚡":"🔔"}</div>
              <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:800,marginBottom:10}}>{activeNav==="explore"?"Explorar":activeNav==="create"?"Crear reto":"Notificaciones"}</div>
              <div style={{color:"var(--muted)",fontSize:14}}>Próximamente.</div>
            </div>
          )}
          <BottomNav active={activeNav} onChange={setActiveNav}/>
          {challengePost&&<ChallengeModal post={challengePost} onClose={()=>setChallengePost(null)} onUnlock={handleUnlock}/>}
        </>
      )}
    </div></>
  );
}
