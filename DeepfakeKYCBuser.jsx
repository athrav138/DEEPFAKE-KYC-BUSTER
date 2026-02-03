/*
 * ============================================================
 *  DEEPFAKE KYC BUSTER — Full-Stack Identity Verification App
 *  Single-file React application (demo / prototype)
 * ============================================================
 *
 * ARCHITECTURE OVERVIEW
 * ----------------------
 * Pages:        Landing → Login/Register → KYC Wizard (6 steps) → Result
 *               Admin Dashboard (stats, flagged users, charts, audit log)
 * State:        All managed via React Context (no external store needed)
 * AI Layer:     Placeholder functions that mirror real CNN / ViT signatures.
 *               Swap the bodies of analyzeFrame(), detectSpoof(), etc.
 *               with your PyTorch / TensorFlow model calls via REST.
 * Demo Data:    Seeded users, verification records, and fraud metrics.
 *
 * HOW TO INTEGRATE REAL MODELS LATER
 * ------------------------------------
 * 1. Find every function marked  /** @AI-PLACEHOLDER *\/
 * 2. Replace the simulated logic with a POST to your model endpoint:
 *      const res = await fetch('/api/ai/detect', { method:'POST', body: ... })
 * 3. Ensure the response shape matches { score, label, artifacts }
 * 4. The UI will automatically pick up the new scores.
 *
 * DEPLOYMENT CHECKLIST
 * --------------------
 * • Wrap in a Next.js or Vite project (this file = one page/component).
 * • Add a FastAPI / Node backend that hosts the AI endpoints.
 * • Replace JWT_SECRET with an env variable; sign tokens server-side.
 * • Point the camera streams to your WebSocket for real-time analysis.
 * • Swap dummy DB calls for PostgreSQL / MongoDB queries.
 * ============================================================
 */

import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import {
  Shield, ShieldCheck, ShieldX, AlertTriangle, Lock, Eye, EyeOff,
  Camera, Upload, FileText, User, Mail, Phone, ArrowRight, ArrowLeft,
  CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Users,
  BarChart3, Settings, LogOut, Search, Filter, Download, Play,
  Pause, RotateCcw, Mic, Volume2, ChevronRight, Info, Wifi, WifiOff,
  Brain, Scan, Activity, AlertOctagon, Database
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";

// ─────────────────────────────────────────────
// THEME & DESIGN TOKENS
// ─────────────────────────────────────────────
const T = {
  navy:      "#0a1628",
  navyMid:   "#0f2040",
  navyLight:"#162d4a",
  slate:     "#1e3a5f",
  accent:    "#00d4ff",
  accentDim: "#00a8cc",
  green:     "#00e676",
  amber:     "#ffb740",
  red:       "#ff4757",
  white:     "#ffffff",
  gray1:     "#8899aa",
  gray2:     "#5a6f83",
  cardBg:    "#111f33",
  cardBorder:"#1a3050",
};

// ─────────────────────────────────────────────
// DEMO / SEED DATA
// ─────────────────────────────────────────────
const SEED_USERS = [
  { id:"u1", name:"Priya Mehta",    email:"priya@email.com", status:"verified",   risk:"low",    score:96, ts:"2025-01-28 09:14", flagged:false },
  { id:"u2", name:"Ravi Joshi",     email:"ravi@email.com",  status:"suspicious", risk:"high",   score:42, ts:"2025-01-28 10:02", flagged:true  },
  { id:"u3", name:"Ananya Das",     email:"ananya@email.com",status:"verified",   risk:"low",    score:91, ts:"2025-01-29 11:30", flagged:false },
  { id:"u4", name:"Vikram Sen",     email:"vikram@email.com",status:"rejected",   risk:"high",   score:18, ts:"2025-01-29 14:22", flagged:true  },
  { id:"u5", name:"Sanya Iyer",     email:"sanya@email.com", status:"suspicious", risk:"medium", score:61, ts:"2025-01-30 08:45", flagged:true  },
  { id:"u6", name:"Deepak Rao",     email:"deepak@email.com",status:"verified",   risk:"low",    score:88, ts:"2025-01-30 16:10", flagged:false },
  { id:"u7", name:"Zara Patel",     email:"zara@email.com",  status:"rejected",   risk:"high",   score:11, ts:"2025-01-31 07:55", flagged:true  },
  { id:"u8", name:"Arjun Nair",     email:"arjun@email.com", status:"verified",   risk:"low",    score:94, ts:"2025-02-01 13:20", flagged:false },
];

const FRAUD_TREND = [
  { month:"Aug", deepfake:12, replay:8,  synthetic:5 },
  { month:"Sep", deepfake:18, replay:11, synthetic:7 },
  { month:"Oct", deepfake:15, replay:14, synthetic:9 },
  { month:"Nov", deepfake:24, replay:10, synthetic:12},
  { month:"Dec", deepfake:30, replay:18, synthetic:15},
  { month:"Jan", deepfake:28, replay:22, synthetic:18},
  { month:"Feb", deepfake:34, replay:19, synthetic:21},
];

const ATTACK_TYPES = [
  { name:"Deepfake Face",   value:38, color:T.red    },
  { name:"Screen Replay",  value:22, color:T.amber  },
  { name:"Synthetic ID",   value:20, color:"#a855f7"},
  { name:"Voice Clone",    value:12, color:"#38bdf8"},
  { name:"Photo Spoof",    value:8,  color:T.gray1  },
];

const AUDIT_LOGS = [
  { id:1, action:"Verification Started",  user:"Priya Mehta",   level:"info",    ts:"2025-02-03 09:00:12" },
  { id:2, action:"Liveness Check Passed", user:"Priya Mehta",   level:"success", ts:"2025-02-03 09:00:45" },
  { id:3, action:"Deepfake Flag Raised",  user:"Ravi Joshi",    level:"warning", ts:"2025-02-03 09:02:10" },
  { id:4, action:"Session Blocked",       user:"Vikram Sen",    level:"error",   ts:"2025-02-03 09:05:33" },
  { id:5, action:"Document Verified",     user:"Ananya Das",    level:"success", ts:"2025-02-03 09:10:01" },
  { id:6, action:"Voice Mismatch",        user:"Sanya Iyer",    level:"warning", ts:"2025-02-03 09:12:50" },
  { id:7, action:"GAN Artifact Detected", user:"Vikram Sen",    level:"error",   ts:"2025-02-03 09:15:22" },
  { id:8, action:"Risk Score Updated",    user:"Zara Patel",    level:"warning", ts:"2025-02-03 09:18:40" },
];

// ─────────────────────────────────────────────
// AI PLACEHOLDER FUNCTIONS
// ─────────────────────────────────────────────
/*
 * Each function below is a stand-in for a real ML model.
 * Replace the body with your actual inference call.
 * Shape contracts are documented in JSDoc.
 */

/** @AI-PLACEHOLDER
 *  @returns {{ deepfakeScore: number, artifacts: string[], confidence: number }}
 *  Replace with CNN / Vision Transformer face-texture analysis.
 */
function analyzeFrameForDeepfake() {
  const r = Math.random();
  return {
    deepfakeScore: r < 0.15 ? 0.72 + Math.random()*0.25 : Math.random()*0.3,
    artifacts: r < 0.15 ? ["texture_seam","blending_edge","frequency_anomaly"] : [],
    confidence: 0.85 + Math.random()*0.14,
  };
}

/** @AI-PLACEHOLDER  Liveness / anti-spoofing */
function detectSpoofAttack() {
  const r = Math.random();
  return {
    isSpoof: r < 0.1,
    method:  r < 0.1 ? ["screen_replay","printed_photo"][Math.floor(Math.random()*2)] : null,
    confidence: 0.88,
  };
}

/** @AI-PLACEHOLDER  Voice clone detector */
function analyzeVoiceClone(durationMs) {
  return {
    isClone:    Math.random() < 0.08,
    confidence: 0.82 + Math.random()*0.15,
    voicePrint: "vp_" + Math.random().toString(36).slice(2,10),
  };
}

/** @AI-PLACEHOLDER  Lip-sync coherence */
function detectLipSync() {
  return { syncScore: 0.6 + Math.random()*0.38, inSync: Math.random() > 0.12 };
}

/** @AI-PLACEHOLDER  GAN-generated face detector */
function detectGANFace() {
  const r = Math.random();
  return {
    isGAN:      r < 0.1,
    ganType:    r < 0.1 ? "StyleGAN3" : null,
    score:      r < 0.1 ? 0.7 + Math.random()*0.28 : Math.random()*0.2,
  };
}

/** @AI-PLACEHOLDER  Document authenticity */
function verifyDocument(fileName) {
  return {
    authentic:  Math.random() > 0.12,
    docType:    fileName.toLowerCase().includes("pan") ? "PAN Card" : "Aadhaar Card",
    extracted:  { name:"Auto Extracted", dob:"01/01/1990", id:"XXXX-XXXX-XXXX" },
  };
}

// ─────────────────────────────────────────────
// GLOBAL APP CONTEXT
// ─────────────────────────────────────────────
const AppCtx = createContext();

function AppProvider({ children }) {
  const [page, setPage]           = useState("landing");    // landing|login|kyc|admin|result
  const [user, setUser]           = useState(null);         // { name, email, role }
  const [kycStep, setKycStep]     = useState(0);
  const [kycData, setKycData]     = useState({});
  const [kycResult, setKycResult] = useState(null);
  const [toast, setToast]         = useState(null);
  const [sessionValid, setSessionValid] = useState(true);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((msg, type="info") => setToast({ msg, type }), []);
  const nav       = useCallback((p) => { setPage(p); setKycStep(0); setKycData({}); }, []);

  return (
    <AppCtx.Provider value={{ page, nav, user, setUser, kycStep, setKycStep, kycData, setKycData, kycResult, setKycResult, showToast, sessionValid }}>
      {children}
      {toast && <Toast toast={toast} />}
    </AppCtx.Provider>
  );
}

function useApp() { return useContext(AppCtx); }

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function Toast({ toast }) {
  const colors = { info: T.accent, success: T.green, warning: T.amber, error: T.red };
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:9999,
      background:T.cardBg, border:`1px solid ${colors[toast.type]}`,
      borderLeft:`4px solid ${colors[toast.type]}`, borderRadius:10,
      padding:"14px 20px", maxWidth:340, color:T.white,
      boxShadow:"0 8px 32px rgba(0,0,0,.5)", fontSize:14,
      animation:"slideInToast .3s ease",
    }}>
      {toast.msg}
      <style>{`@keyframes slideInToast{ from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROUTER (renders current page)
// ─────────────────────────────────────────────
function App() {
  const { page, user } = useApp();

  const routes = {
    landing: <LandingPage />,
    login:   <LoginPage />,
    kyc:     <KYCWizard />,
    admin:   <AdminDashboard />,
    result:  <ResultPage />,
  };

  return (
    <div style={{ background: T.navy, minHeight:"100vh", color: T.white, fontFamily:"'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#0a1628; }
        ::-webkit-scrollbar-thumb { background:#1e3a5f; border-radius:3px; }
        input::placeholder { color: ${T.gray2}; }
        input:-webkit-autofill { background: transparent !important; }
      `}</style>
      {routes[page] || <LandingPage />}
    </div>
  );
}

// ─────────────────────────────────────────────
// TOP NAV (shared across inner pages)
// ─────────────────────────────────────────────
function TopNav({ title, showAdmin }) {
  const { nav, user, setUser, showToast } = useApp();
  return (
    <nav style={{
      background:T.navyMid, borderBottom:`1px solid ${T.cardBorder}`,
      padding:"12px 28px", display:"flex", alignItems:"center", justifyContent:"space-between",
      position:"sticky", top:0, zIndex:100,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={() => nav("landing")}>
        <Shield size={24} color={T.accent} />
        <span style={{ fontWeight:700, fontSize:18, letterSpacing:"-0.5px" }}>
          <span style={{ color:T.accent }}>Deepfake</span> KYC Buster
        </span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        {showAdmin && (
          <button onClick={() => nav("admin")} style={{ background:"transparent", border:`1px solid ${T.cardBorder}`, color:T.accent, borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <BarChart3 size={14} /> Admin
          </button>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:8, background:T.cardBg, borderRadius:20, padding:"5px 14px 5px 5px" }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${T.accent},${T.accentDim})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>
            {user?.name?.[0] || "?"}
          </div>
          <span style={{ fontSize:13, color:T.gray1 }}>{user?.name || "User"}</span>
        </div>
        <button onClick={() => { setUser(null); nav("landing"); showToast("Logged out","info"); }} style={{ background:"transparent", border:"none", cursor:"pointer", color:T.gray2, display:"flex", alignItems:"center" }}>
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════
//  PAGE 1 — LANDING
// ═══════════════════════════════════════════════════
function LandingPage() {
  const { nav } = useApp();

  const stats = [
    { label:"Deepfake Attacks / Year", value:"$48B+", icon: AlertTriangle },
    { label:"Identity Fraud Cases",    value:"1.4M+", icon: Users },
    { label:"Detection Accuracy",      value:"99.2%", icon: CheckCircle },
    { label:"Verification Speed",      value:"<3s",   icon: Activity },
  ];

  const layers = [
    { icon: Eye,      title:"Liveness Detection",         desc:"Challenge-response: blink, smile, head-turn in random order. Defeats photos & screen replays instantly." },
    { icon: Brain,    title:"AI Deepfake Analysis",       desc:"CNN + Vision Transformer scans face texture, micro-expressions, and frequency-domain artifacts in real time." },
    { icon: Mic,      title:"Voice & Lip-Sync Check",     desc:"Detects voice cloning and verifies that lip movements match spoken words frame-by-frame." },
    { icon: Scan,     title:"GAN Face Detection",         desc:"Identifies StyleGAN, ProGAN, and other generative model outputs via spectral analysis." },
    { icon: Lock,     title:"Anti-Spoofing Shield",       desc:"Blocks masks, printed photos, screen recordings, and virtual camera injections at the device level." },
    { icon: Database, title:"Audit & Compliance",         desc:"Every event is time-stamped, encrypted, and exportable. Designed for regulatory compliance from day one." },
  ];

  return (
    <div style={{ minHeight:"100vh", overflow:"hidden" }}>
      {/* ── Hero ── */}
      <header style={{ position:"relative", padding:"24px 28px 100px", textAlign:"center" }}>
        {/* nav bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", maxWidth:1140, margin:"0 auto 80px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Shield size={28} color={T.accent} />
            <span style={{ fontWeight:700, fontSize:20 }}><span style={{ color:T.accent }}>Deepfake</span> KYC Buster</span>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={() => nav("login")} style={{ background:"transparent", border:`1px solid ${T.cardBorder}`, color:T.white, borderRadius:8, padding:"8px 20px", cursor:"pointer", fontSize:14 }}>Sign In</button>
            <button onClick={() => nav("login")} style={{ background:`linear-gradient(135deg,${T.accent},${T.accentDim})`, border:"none", color:T.navy, borderRadius:8, padding:"8px 20px", cursor:"pointer", fontSize:14, fontWeight:700 }}>Get Started</button>
          </div>
        </div>

        {/* animated glow orbs */}
        <div style={{ position:"absolute", top:80, left:"15%", width:360, height:360, borderRadius:"50%", background:`radial-gradient(circle,${T.accent}18,transparent 70%)`, filter:"blur(60px)", pointerEvents:"none", animation:"pulseOrb 4s ease-in-out infinite" }} />
        <div style={{ position:"absolute", top:200, right:"10%", width:280, height:280, borderRadius:"50%", background:`radial-gradient(circle,${T.accentDim}12,transparent 70%)`, filter:"blur(50px)", pointerEvents:"none", animation:"pulseOrb 5s ease-in-out infinite alternate" }} />

        {/* headline */}
        <div style={{ position:"relative", zIndex:2, maxWidth:780, margin:"0 auto" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:20, padding:"6px 16px", marginBottom:28 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:T.green, boxShadow:`0 0 8px ${T.green}` }} />
            <span style={{ fontSize:13, color:T.gray1 }}>Identity Theft 2.0 — Real-time protection is here</span>
          </div>
          <h1 style={{ fontSize:"clamp(38px,6vw,68px)", fontWeight:800, lineHeight:1.1, letterSpacing:"-2px", marginBottom:24 }}>
            Stop Deepfakes<br />
            <span style={{ background:`linear-gradient(90deg,${T.accent},${T.green})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Before They Strike</span>
          </h1>
          <p style={{ fontSize:18, color:T.gray1, maxWidth:600, margin:"0 auto 40px", lineHeight:1.6 }}>
            Next-generation KYC powered by multi-modal AI. Detect deepfake faces, voice clones, synthetic identities, and replay attacks in under 3 seconds.
          </p>
          <button onClick={() => nav("login")} style={{
            background:`linear-gradient(135deg,${T.accent},${T.accentDim})`, border:"none", color:T.navy,
            borderRadius:12, padding:"16px 40px", cursor:"pointer", fontSize:16, fontWeight:700,
            display:"inline-flex", alignItems:"center", gap:8, boxShadow:`0 4px 24px ${T.accent}40`,
            transition:"transform .2s, box-shadow .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 32px ${T.accent}50`; }}
            onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=`0 4px 24px ${T.accent}40`; }}
          >
            Start Verification <ArrowRight size={18} />
          </button>
        </div>

        <style>{`@keyframes pulseOrb{ 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }`}</style>
      </header>

      {/* ── Stats bar ── */}
      <section style={{ maxWidth:1140, margin:"0 auto", padding:"0 28px 80px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16 }}>
          {stats.map((s,i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:14, padding:"22px 20px", textAlign:"center" }}>
                <Icon size={22} color={T.accent} style={{ marginBottom:10 }} />
                <div style={{ fontSize:28, fontWeight:800, color:T.white }}>{s.value}</div>
                <div style={{ fontSize:12, color:T.gray2, marginTop:4 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Security Layers ── */}
      <section style={{ maxWidth:1140, margin:"0 auto", padding:"0 28px 100px" }}>
        <h2 style={{ textAlign:"center", fontSize:36, fontWeight:700, marginBottom:12 }}>Six Layers of <span style={{ color:T.accent }}>Defense</span></h2>
        <p style={{ textAlign:"center", color:T.gray1, marginBottom:48, fontSize:15 }}>Every verification runs through our complete detection pipeline</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20 }}>
          {layers.map((l,i) => {
            const Icon = l.icon;
            return (
              <div key={i} style={{
                background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:16, padding:28,
                transition:"border-color .3s, transform .2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=T.accent; e.currentTarget.style.transform="translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=T.cardBorder; e.currentTarget.style.transform="translateY(0)"; }}
              >
                <div style={{ width:48, height:48, borderRadius:12, background:`${T.accent}15`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                  <Icon size={24} color={T.accent} />
                </div>
                <h3 style={{ fontSize:17, fontWeight:600, marginBottom:8 }}>{l.title}</h3>
                <p style={{ fontSize:13, color:T.gray1, lineHeight:1.6 }}>{l.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop:`1px solid ${T.cardBorder}`, padding:"28px", textAlign:"center", color:T.gray2, fontSize:13 }}>
        © 2025 Deepfake KYC Buster. All biometric data is encrypted end-to-end and deleted after verification. Compliance-ready (India IT Act, GDPR principles).
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  PAGE 2 — LOGIN / REGISTER
// ═══════════════════════════════════════════════════
function LoginPage() {
  const { nav, setUser, showToast } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [form, setForm]             = useState({ name:"", email:"", phone:"", password:"" });

  const handleSubmit = () => {
    if (!form.email || !form.password) { showToast("Please fill required fields","error"); return; }
    // Simulate JWT session — in production sign a real token server-side
    const token = "eyJhbGciOiJIUzI1NiJ9." + btoa(JSON.stringify({ sub:form.email, role:"user", iat:Date.now() }));
    console.log("[SESSION] Simulated JWT:", token);

    const role = form.email === "admin@bank.com" ? "admin" : "user";
    setUser({ name: role === "admin" ? "Admin Officer" : (form.name || "User"), email: form.email, role });
    showToast(isRegister ? "Account created ✓" : "Welcome back!","success");
    nav(role === "admin" ? "admin" : "kyc");
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20, position:"relative" }}>
      {/* background glow */}
      <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle,${T.accent}0a,transparent 70%)`, pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:2 }}>
        {/* logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <Shield size={42} color={T.accent} style={{ marginBottom:10 }} />
          <h1 style={{ fontSize:26, fontWeight:700 }}><span style={{ color:T.accent }}>Deepfake</span> KYC Buster</h1>
          <p style={{ color:T.gray1, fontSize:14, marginTop:6 }}>{isRegister ? "Create your secure account" : "Welcome back — sign in to continue"}</p>
        </div>

        <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:18, padding:32 }}>
          {/* tab toggle */}
          <div style={{ display:"flex", background:T.navy, borderRadius:10, padding:4, marginBottom:28 }}>
            {["Sign In","Register"].map((t,i) => (
              <button key={t} onClick={() => setIsRegister(i===1)} style={{
                flex:1, padding:"9px 0", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontWeight:600,
                background: (i===1) === isRegister ? T.accent : "transparent",
                color: (i===1) === isRegister ? T.navy : T.gray1,
                transition:"all .25s",
              }}>{t}</button>
            ))}
          </div>

          {isRegister && <InputField label="Full Name" icon={<User size={16} />} value={form.name} onChange={v => setForm({...form, name:v})} placeholder="Priya Mehta" />}
          <InputField label="Email" icon={<Mail size={16} />} value={form.email} onChange={v => setForm({...form, email:v})} placeholder="you@email.com" />
          {isRegister && <InputField label="Phone" icon={<Phone size={16} />} value={form.phone} onChange={v => setForm({...form, phone:v})} placeholder="+91 XXXXXXXXXX" />}
          <InputField label="Password" icon={<Lock size={16} />} value={form.password} onChange={v => setForm({...form, password:v})} placeholder="••••••••" type={showPw?"text":"password"} suffix={<button onClick={() => setShowPw(!showPw)} style={{ background:"none", border:"none", cursor:"pointer", color:T.gray1 }}>{showPw ? <EyeOff size={16}/> : <Eye size={16}/>}</button>} />

          <div style={{ fontSize:11, color:T.gray2, marginBottom:20, textAlign:"center" }}>
            {!isRegister && <span>Demo: <strong style={{ color:T.accent }}>admin@bank.com</strong> opens the Admin Dashboard</span>}
          </div>

          <button onClick={handleSubmit} style={{
            width:"100%", background:`linear-gradient(135deg,${T.accent},${T.accentDim})`, border:"none", color:T.navy,
            borderRadius:10, padding:"13px 0", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            {isRegister ? "Create Account" : "Sign In"} <ArrowRight size={16} />
          </button>
        </div>

        <p style={{ textAlign:"center", color:T.gray2, fontSize:12, marginTop:20 }}>
          Your biometric data is never stored permanently and is deleted after verification.
        </p>
      </div>
    </div>
  );
}

/* Reusable input */
function InputField({ label, icon, value, onChange, placeholder, type="text", suffix }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ fontSize:12, color:T.gray1, fontWeight:600, display:"block", marginBottom:6 }}>{label}</label>
      <div style={{ display:"flex", alignItems:"center", background:T.navy, border:`1px solid ${T.cardBorder}`, borderRadius:10, padding:"0 12px", gap:8 }}>
        <span style={{ color:T.gray2 }}>{icon}</span>
        <input value={value} type={type} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
          flex:1, background:"transparent", border:"none", outline:"none", color:T.white, fontSize:14, padding:"11px 0",
        }} />
        {suffix}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  PAGE 3 — KYC WIZARD
// ═══════════════════════════════════════════════════
const KYC_STEPS = ["Personal Info","Documents","Selfie Capture","Liveness Check","Voice Verify","Review"];

function KYCWizard() {
  const { kycStep, setKycStep, nav } = useApp();

  const stepComponents = [
    <KYCStep1 />,
    <KYCStep2 />,
    <KYCStep3 />,
    <KYCStep4 />,
    <KYCStep5 />,
    <KYCStep6 />,
  ];

  return (
    <div style={{ minHeight:"100vh" }}>
      <TopNav title="KYC Verification" showAdmin={false} />

      {/* progress bar */}
      <div style={{ maxWidth:760, margin:"32px auto 0", padding:"0 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          {KYC_STEPS.map((s,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", flex: i < KYC_STEPS.length-1 ? 1 : "auto" }}>
              {/* circle */}
              <div style={{
                width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                background: i < kycStep ? T.accent : i === kycStep ? T.navyLight : T.navy,
                border: `2px solid ${i <= kycStep ? T.accent : T.cardBorder}`,
                color: i < kycStep ? T.navy : T.white, fontWeight:700, fontSize:13, zIndex:2, position:"relative",
                transition:"all .3s",
              }}>
                {i < kycStep ? <CheckCircle size={18} /> : i+1}
              </div>
              {/* connector line */}
              {i < KYC_STEPS.length-1 && (
                <div style={{ flex:1, height:3, background: i < kycStep ? T.accent : T.cardBorder, borderRadius:2, margin:"0 4px", transition:"background .3s" }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:28 }}>
          {KYC_STEPS.map((s,i) => (
            <span key={i} style={{ fontSize:10, color: i === kycStep ? T.accent : T.gray2, fontWeight: i === kycStep ? 700 : 400, textAlign:"center", flex:1, maxWidth:80 }}>{s}</span>
          ))}
        </div>
      </div>

      {/* step content */}
      <div style={{ maxWidth:660, margin:"0 auto", padding:"0 24px 60px" }}>
        {stepComponents[kycStep]}
      </div>
    </div>
  );
}

/* ── KYC Step 1: Personal Info ── */
function KYCStep1() {
  const { setKycStep, kycData, setKycData, showToast } = useApp();
  const [form, setForm] = useState(kycData.personal || { firstName:"", lastName:"", dob:"", aadhaar:"" });

  const next = () => {
    if (!form.firstName || !form.lastName) { showToast("Please fill all fields","error"); return; }
    setKycData({ ...kycData, personal: form });
    setKycStep(1);
    showToast("Personal info saved","success");
  };

  return (
    <StepCard title="Personal Information" subtitle="Enter your details exactly as they appear on your ID documents">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <InputField label="First Name" icon={<User size={16} />} value={form.firstName} onChange={v => setForm({...form, firstName:v})} placeholder="Priya" />
        <InputField label="Last Name"  icon={<User size={16} />} value={form.lastName}  onChange={v => setForm({...form, lastName:v})}  placeholder="Mehta" />
      </div>
      <InputField label="Date of Birth" icon={<Clock size={16} />} value={form.dob} onChange={v => setForm({...form, dob:v})} placeholder="DD/MM/YYYY" />
      <InputField label="Aadhaar / National ID (last 4)" icon={<FileText size={16} />} value={form.aadhaar} onChange={v => setForm({...form, aadhaar:v})} placeholder="XXXX" />
      <NavButtons onNext={next} showBack={false} />
    </StepCard>
  );
}

/* ── KYC Step 2: Document Upload ── */
function KYCStep2() {
  const { setKycStep, kycData, setKycData, showToast } = useApp();
  const [docs, setDocs]       = useState(kycData.docs || []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFiles = (files) => {
    Array.from(files).forEach(f => {
      setUploading(true);
      setTimeout(() => {
        const result = verifyDocument(f.name);
        setDocs(prev => [...prev, { name:f.name, size:f.size, result, id: Date.now()+Math.random() }]);
        setUploading(false);
        showToast(`${f.name} uploaded & scanned`,"info");
      }, 1200);
    });
  };

  const next = () => {
    if (docs.length === 0) { showToast("Upload at least one document","error"); return; }
    setKycData({ ...kycData, docs });
    setKycStep(2);
  };

  return (
    <StepCard title="Document Upload" subtitle="Upload your Aadhaar or PAN card for OCR extraction and authenticity verification">
      {/* drop zone */}
      <div
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor=T.accent; }}
        onDragLeave={e => { e.currentTarget.style.borderColor=T.cardBorder; }}
        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor=T.cardBorder; handleFiles(e.dataTransfer.files); }}
        style={{
          border:`2px dashed ${T.cardBorder}`, borderRadius:14, padding:"40px 20px", textAlign:"center", cursor:"pointer",
          transition:"border-color .2s", background:`${T.navy}80`,
        }}
      >
        <Upload size={32} color={T.accent} style={{ marginBottom:12 }} />
        <p style={{ color:T.gray1, fontSize:14 }}>Drag & drop your ID here or <span style={{ color:T.accent, fontWeight:600 }}>click to browse</span></p>
        <p style={{ color:T.gray2, fontSize:12, marginTop:6 }}>Supported: JPG, PNG, PDF (max 5 MB)</p>
        <input ref={fileRef} type="file" accept="image/*,.pdf" multiple style={{ display:"none" }} onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* uploaded list */}
      {docs.length > 0 && (
        <div style={{ marginTop:18 }}>
          {docs.map((d,i) => (
            <div key={d.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:T.navy, border:`1px solid ${T.cardBorder}`, borderRadius:10, padding:"12px 16px", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <FileText size={18} color={T.accent} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{d.name}</div>
                  <div style={{ fontSize:11, color:T.gray2 }}>{d.result.docType} • {(d.size/1024).toFixed(0)} KB</div>
                </div>
              </div>
              <RiskBadge status={d.result.authentic ? "verified" : "rejected"} />
            </div>
          ))}
        </div>
      )}

      {uploading && <div style={{ color:T.accent, fontSize:13, marginTop:12, textAlign:"center" }}>Scanning document… <Spinner size={14} /></div>}
      <NavButtons onNext={next} onBack={() => setKycStep(0)} />
    </StepCard>
  );
}

/* ── KYC Step 3: Selfie Capture ── */
function KYCStep3() {
  const { setKycStep, kycData, setKycData, showToast } = useApp();
  const videoRef = useRef();
  const canvasRef = useRef();
  const [streaming, setStreaming]   = useState(false);
  const [captured, setCaptured]     = useState(kycData.selfie || null);
  const [analysis, setAnalysis]     = useState(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user" }, audio:false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setStreaming(true);
      showToast("Camera active — position your face","info");
    } catch(e) {
      showToast("Camera access denied. Demo mode active.","warning");
      setStreaming("demo");
    }
  };

  const capture = () => {
    if (streaming === "demo") {
      // demo: pretend we captured
      setCaptured("demo_selfie");
      const a = analyzeFrameForDeepfake();
      const g = detectGANFace();
      const s = detectSpoofAttack();
      setAnalysis({ ...a, gan: g, spoof: s });
      showToast("Selfie captured & analyzed","success");
      return;
    }
    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width  = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    setCaptured(canvasRef.current.toDataURL());
    // run AI checks
    const a = analyzeFrameForDeepfake();
    const g = detectGANFace();
    const s = detectSpoofAttack();
    setAnalysis({ ...a, gan: g, spoof: s });
    showToast("Selfie captured & analyzed","success");
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setStreaming(false);
  };

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const next = () => {
    if (!captured) { showToast("Capture a selfie first","error"); return; }
    setKycData({ ...kycData, selfie: captured, selfieAnalysis: analysis });
    setKycStep(3);
  };

  return (
    <StepCard title="Selfie Capture" subtitle="Take a clear selfie. Our AI will scan for deepfake artifacts in real time.">
      {/* camera box */}
      <div style={{ position:"relative", background:T.navy, borderRadius:14, overflow:"hidden", border:`1px solid ${T.cardBorder}`, aspectRatio:"4/3", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {!streaming && !captured && (
          <div style={{ textAlign:"center" }}>
            <Camera size={48} color={T.accent} style={{ marginBottom:12 }} />
            <p style={{ color:T.gray1, fontSize:14 }}>Click below to open camera</p>
          </div>
        )}
        {streaming === true && <video ref={videoRef} muted style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
        {streaming === "demo" && (
          <div style={{ textAlign:"center" }}>
            <div style={{ width:100, height:100, borderRadius:"50%", border:`3px dashed ${T.accent}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
              <User size={48} color={T.accent} />
            </div>
            <p style={{ color:T.accent, fontSize:13 }}>Demo Camera Feed</p>
          </div>
        )}
        {captured && captured !== "demo_selfie" && <img src={captured} alt="selfie" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
        {captured === "demo_selfie" && (
          <div style={{ textAlign:"center" }}>
            <div style={{ width:100, height:100, borderRadius:"50%", background:`linear-gradient(135deg,${T.accent}30,${T.accentDim}30)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", border:`2px solid ${T.green}` }}>
              <CheckCircle size={40} color={T.green} />
            </div>
            <p style={{ color:T.green, fontSize:13, fontWeight:600 }}>Selfie Captured</p>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display:"none" }} />

        {/* face guide overlay when streaming */}
        {streaming && !captured && (
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:140, height:180, border:`2px dashed ${T.accent}60`, borderRadius:"50%", pointerEvents:"none" }} />
        )}
      </div>

      {/* action buttons */}
      <div style={{ display:"flex", gap:10, marginTop:16 }}>
        {!streaming && !captured && <button onClick={startCamera} className="btn-accent" style={btnAccentStyle}>Open Camera</button>}
        {streaming && !captured && <button onClick={capture} className="btn-accent" style={btnAccentStyle}>Capture</button>}
        {captured && <button onClick={() => { setCaptured(null); setAnalysis(null); stopCamera(); }} style={{ ...btnOutlineStyle }}><RotateCcw size={15} /> Retake</button>}
        {streaming && <button onClick={stopCamera} style={btnOutlineStyle}>Stop</button>}
      </div>

      {/* analysis results */}
      {analysis && (
        <div style={{ marginTop:20, background:T.navy, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:18 }}>
          <p style={{ fontSize:13, fontWeight:600, color:T.accent, marginBottom:10 }}>AI Analysis Results</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <MiniStat label="Deepfake Score"  value={`${(analysis.deepfakeScore*100).toFixed(1)}%`} color={analysis.deepfakeScore > 0.5 ? T.red : T.green} />
            <MiniStat label="GAN Detection"   value={analysis.gan.isGAN ? analysis.gan.ganType : "Clean"} color={analysis.gan.isGAN ? T.red : T.green} />
            <MiniStat label="Spoof Attack"    value={analysis.spoof.isSpoof ? analysis.spoof.method : "None"} color={analysis.spoof.isSpoof ? T.red : T.green} />
            <MiniStat label="Confidence"      value={`${(analysis.confidence*100).toFixed(1)}%`} color={T.accent} />
          </div>
          {analysis.artifacts.length > 0 && <p style={{ fontSize:11, color:T.red, marginTop:10 }}>⚠ Artifacts: {analysis.artifacts.join(", ")}</p>}
        </div>
      )}

      <NavButtons onNext={next} onBack={() => setKycStep(1)} />
    </StepCard>
  );
}

/* ── KYC Step 4: Liveness Challenge ── */
function KYCStep4() {
  const { setKycStep, kycData, setKycData, showToast } = useApp();
  const CHALLENGES = ["Blink your eyes", "Smile", "Turn your head left", "Turn your head right", "Open your mouth"];
  const [challenges, setChallenges] = useState(() => shuffle(CHALLENGES).slice(0,3));
  const [current, setCurrent]       = useState(0);
  const [passed, setPassed]         = useState([]);
  const [simulating, setSimulating] = useState(false);

  const simulateAction = () => {
    setSimulating(true);
    setTimeout(() => {
      setPassed(prev => [...prev, challenges[current]]);
      setSimulating(false);
      if (current < challenges.length - 1) {
        setCurrent(c => c+1);
        showToast("Challenge passed ✓","success");
      } else {
        showToast("All liveness challenges passed!","success");
      }
    }, 1800);
  };

  const allPassed = passed.length === challenges.length;

  const next = () => {
    if (!allPassed) { showToast("Complete all challenges first","error"); return; }
    setKycData({ ...kycData, liveness: { passed: true, challenges } });
    setKycStep(4);
  };

  return (
    <StepCard title="Liveness Verification" subtitle="Perform the following random actions to prove you are a real person">
      {/* challenge display */}
      <div style={{ textAlign:"center", background:T.navy, border:`1px solid ${allPassed ? T.green : T.cardBorder}`, borderRadius:16, padding:"32px 20px" }}>
        {allPassed ? (
          <>
            <CheckCircle size={56} color={T.green} style={{ marginBottom:12 }} />
            <p style={{ fontSize:18, fontWeight:700, color:T.green }}>Liveness Verified!</p>
            <p style={{ color:T.gray1, fontSize:13, marginTop:6 }}>All {challenges.length} challenges completed successfully</p>
          </>
        ) : (
          <>
            <div style={{ fontSize:13, color:T.gray2, marginBottom:12 }}>Challenge {current+1} of {challenges.length}</div>
            <div style={{
              fontSize:22, fontWeight:700, color:T.white, marginBottom:20,
              padding:"14px 28px", background:`${T.accent}10`, border:`2px solid ${T.accent}40`, borderRadius:12, display:"inline-block",
            }}>
              {challenges[current]}
            </div>
            <br />
            <button onClick={simulateAction} disabled={simulating} style={{ ...btnAccentStyle, opacity: simulating ? .6 : 1, cursor: simulating ? "not-allowed" : "pointer" }}>
              {simulating ? <><Spinner size={16} /> Detecting…</> : "I Did It"}
            </button>
          </>
        )}
      </div>

      {/* progress chips */}
      <div style={{ display:"flex", gap:8, marginTop:18, flexWrap:"wrap" }}>
        {challenges.map((c,i) => {
          const done = passed.includes(c);
          return (
            <span key={i} style={{
              fontSize:12, padding:"5px 12px", borderRadius:20,
              background: done ? `${T.green}18` : `${T.navy}`,
              border:`1px solid ${done ? T.green : T.cardBorder}`,
              color: done ? T.green : T.gray1,
              display:"flex", alignItems:"center", gap:6,
            }}>
              {done ? <CheckCircle size={13} /> : <Clock size={13} />} {c}
            </span>
          );
        })}
      </div>

      <NavButtons onNext={next} onBack={() => setKycStep(2)} />
    </StepCard>
  );
}

/* ── KYC Step 5: Voice Verification ── */
function KYCStep5() {
  const { setKycStep, kycData, setKycData, showToast } = useApp();
  const [recording, setRecording]   = useState(false);
  const [recorded, setRecorded]     = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [lipSync, setLipSync]       = useState(null);
  const timerRef = useRef();
  const [elapsed, setElapsed]       = useState(0);

  const phrase = "The quick brown fox jumps over the lazy dog";

  const startRecord = () => {
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e+1), 1000);
    // Simulate 3-second recording then auto-stop
    setTimeout(() => {
      clearInterval(timerRef.current);
      setRecording(false);
      setRecorded(true);
      const vr = analyzeVoiceClone(3000);
      const ls = detectLipSync();
      setVoiceResult(vr);
      setLipSync(ls);
      showToast("Voice analyzed","success");
    }, 3500);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const next = () => {
    if (!recorded) { showToast("Record your voice first","error"); return; }
    setKycData({ ...kycData, voice: { result: voiceResult, lipSync } });
    setKycStep(5);
  };

  return (
    <StepCard title="Voice Verification" subtitle="Read the phrase aloud while the camera is active. We verify lip-sync and detect voice cloning.">
      {/* phrase card */}
      <div style={{ background:T.navy, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:"18px 22px", textAlign:"center", marginBottom:20 }}>
        <p style={{ fontSize:11, color:T.gray2, marginBottom:6, textTransform:"uppercase", letterSpacing:1 }}>Read this phrase aloud</p>
        <p style={{ fontSize:17, fontWeight:600, color:T.white, lineHeight:1.5 }}>{phrase}</p>
      </div>

      {/* mic button */}
      <div style={{ textAlign:"center" }}>
        <button onClick={startRecord} disabled={recording || recorded} style={{
          width:80, height:80, borderRadius:"50%", border:"none", cursor: recording || recorded ? "not-allowed" : "pointer",
          background: recording ? T.red : recorded ? T.green : `linear-gradient(135deg,${T.accent},${T.accentDim})`,
          display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto",
          boxShadow: recording ? `0 0 24px ${T.red}60` : `0 0 18px ${T.accent}40`,
          transition:"all .3s", opacity: recorded && !recording ? .7 : 1,
        }}>
          {recording ? <Pause size={32} color={T.white} /> : <Mic size={32} color={recording ? T.white : T.navy} />}
        </button>
        <p style={{ color:T.gray1, fontSize:13, marginTop:10 }}>
          {recording ? `Recording… ${elapsed}s` : recorded ? "Recording complete" : "Tap to start recording"}
        </p>
        {recorded && (
          <button onClick={() => { setRecorded(false); setVoiceResult(null); setLipSync(null); }} style={{ ...btnOutlineStyle, marginTop:8, display:"inline-flex" }}>
            <RotateCcw size={14} /> Re-record
          </button>
        )}
      </div>

      {/* results */}
      {voiceResult && (
        <div style={{ marginTop:22, background:T.navy, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:18 }}>
          <p style={{ fontSize:13, fontWeight:600, color:T.accent, marginBottom:10 }}>Voice & Lip Analysis</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <MiniStat label="Voice Clone"   value={voiceResult.isClone ? "DETECTED" : "Clean"} color={voiceResult.isClone ? T.red : T.green} />
            <MiniStat label="Lip Sync"      value={lipSync?.inSync ? "Matched" : "Mismatch"} color={lipSync?.inSync ? T.green : T.red} />
            <MiniStat label="Confidence"    value={`${(voiceResult.confidence*100).toFixed(1)}%`} color={T.accent} />
            <MiniStat label="Sync Score"    value={`${(lipSync?.syncScore*100).toFixed(1)}%`} color={lipSync?.syncScore > 0.7 ? T.green : T.amber} />
          </div>
        </div>
      )}

      <NavButtons onNext={next} onBack={() => setKycStep(3)} />
    </StepCard>
  );
}

/* ── KYC Step 6: Review & Submit ── */
function KYCStep6() {
  const { kycData, nav, setKycResult, showToast } = useApp();
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    setSubmitting(true);
    // Compute overall score from all AI checks (simulated aggregation)
    setTimeout(() => {
      const selfieScore  = kycData.selfieAnalysis?.deepfakeScore || 0;
      const ganFlag      = kycData.selfieAnalysis?.gan?.isGAN || false;
      const spoofFlag    = kycData.selfieAnalysis?.spoof?.isSpoof || false;
      const voiceClone   = kycData.voice?.result?.isClone || false;
      const lipOk        = kycData.voice?.lipSync?.inSync !== false;

      // Risk aggregation
      let riskPoints = 0;
      if (selfieScore > 0.5) riskPoints += 40;
      if (ganFlag)           riskPoints += 30;
      if (spoofFlag)         riskPoints += 25;
      if (voiceClone)        riskPoints += 20;
      if (!lipOk)            riskPoints += 15;

      const confidenceScore = Math.max(10, 100 - riskPoints - Math.floor(Math.random()*8));
      let status, risk;
      if (riskPoints === 0)        { status = "verified";   risk = "low"; }
      else if (riskPoints < 30)    { status = "suspicious"; risk = "medium"; }
      else                         { status = "rejected";   risk = "high"; }

      // Audit log entry (would persist to DB in production)
      const auditEntry = {
        userId: Date.now(),
        name: `${kycData.personal?.firstName} ${kycData.personal?.lastName}`,
        status, risk, confidenceScore,
        timestamp: new Date().toISOString(),
        details: { selfieScore, ganFlag, spoofFlag, voiceClone, lipOk },
      };
      console.log("[AUDIT] Verification record:", JSON.stringify(auditEntry, null, 2));

      setKycResult({ status, risk, confidenceScore, details: auditEntry.details, name: auditEntry.name });
      setSubmitting(false);
      nav("result");
    }, 2200);
  };

  const sections = [
    { title:"Personal Info", items: [
      ["Name", `${kycData.personal?.firstName || "—"} ${kycData.personal?.lastName || "—"}`],
      ["DOB",  kycData.personal?.dob || "—"],
    ]},
    { title:"Documents", items: [
      ["Uploaded", kycData.docs?.length ? `${kycData.docs.length} document(s)` : "None"],
    ]},
    { title:"Selfie & AI Scan", items: [
      ["Deepfake Score", kycData.selfieAnalysis ? `${(kycData.selfieAnalysis.deepfakeScore*100).toFixed(1)}%` : "—"],
      ["GAN Detected",   kycData.selfieAnalysis?.gan?.isGAN ? "Yes" : "No"],
    ]},
    { title:"Voice & Lip", items: [
      ["Voice Clone",  kycData.voice?.result?.isClone ? "Detected" : "Clean"],
      ["Lip Sync",     kycData.voice?.lipSync?.inSync ? "Matched" : "Mismatch"],
    ]},
  ];

  return (
    <StepCard title="Review & Submit" subtitle="Verify all information before final submission. This cannot be undone.">
      {sections.map((sec,i) => (
        <div key={i} style={{ background:T.navy, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:16, marginBottom:12 }}>
          <p style={{ fontSize:12, color:T.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>{sec.title}</p>
          {sec.items.map(([k,v],j) => (
            <div key={j} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderTop: j ? `1px solid ${T.cardBorder}` : "none" }}>
              <span style={{ color:T.gray2, fontSize:13 }}>{k}</span>
              <span style={{ color:T.white, fontSize:13, fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
      ))}

      {/* encryption notice */}
      <div style={{ display:"flex", alignItems:"center", gap:10, background:`${T.green}08`, border:`1px solid ${T.green}30`, borderRadius:10, padding:"12px 16px", marginTop:8 }}>
        <Lock size={16} color={T.green} />
        <p style={{ fontSize:12, color:T.green }}>All data is transmitted with end-to-end encryption (AES-256). Biometrics will be deleted within 24 hours.</p>
      </div>

      <div style={{ marginTop:24, textAlign:"center" }}>
        <button onClick={submit} disabled={submitting} style={{ ...btnAccentStyle, padding:"14px 48px", fontSize:16, opacity: submitting ? .7 : 1 }}>
          {submitting ? <><Spinner size={16} /> Submitting…</> : "Submit & Verify"}
        </button>
      </div>
    </StepCard>
  );
}

// ═══════════════════════════════════════════════════
//  PAGE 4 — RESULT
// ═══════════════════════════════════════════════════
function ResultPage() {
  const { kycResult, nav } = useApp();
  if (!kycResult) return null;

  const { status, risk, confidenceScore, details, name } = kycResult;
  const statusColors = { verified: T.green, suspicious: T.amber, rejected: T.red };
  const StatusIcon   = status === "verified" ? ShieldCheck : status === "suspicious" ? AlertTriangle : ShieldX;
  const color        = statusColors[status];

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, position:"relative" }}>
      <div style={{ position:"absolute", top:"40%", left:"50%", transform:"translate(-50%,-50%)", width:440, height:440, borderRadius:"50%", background:`radial-gradient(circle,${color}0c,transparent 70%)`, pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:520, position:"relative", zIndex:2 }}>
        {/* logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <Shield size={32} color={T.accent} />
        </div>

        <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:22, padding:"40px 32px", textAlign:"center" }}>
          {/* big status icon */}
          <div style={{ width:100, height:100, borderRadius:"50%", background:`${color}15`, border:`3px solid ${color}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <StatusIcon size={52} color={color} />
          </div>
          <h2 style={{ fontSize:30, fontWeight:800, color, marginBottom:6 }}>{status.charAt(0).toUpperCase()+status.slice(1)}</h2>
          <p style={{ color:T.gray1, fontSize:14 }}>Verification for <strong style={{ color:T.white }}>{name}</strong></p>

          {/* confidence gauge */}
          <div style={{ margin:"28px 0" }}>
            <ConfidenceGauge score={confidenceScore} color={color} />
          </div>

          {/* risk badge */}
          <div style={{ display:"flex", justifyContent:"center", gap:16, marginBottom:24 }}>
            <RiskBadge status={status} />
            <span style={{ display:"flex", alignItems:"center", gap:6, background:T.navy, border:`1px solid ${T.cardBorder}`, borderRadius:20, padding:"5px 14px", fontSize:13 }}>
              <Activity size={14} color={T.amber} /> Risk: <strong style={{ color: risk==="low"?T.green:risk==="medium"?T.amber:T.red }}>{risk.toUpperCase()}</strong>
            </span>
          </div>

          {/* detail flags */}
          <div style={{ textAlign:"left", background:T.navy, borderRadius:12, padding:18, marginBottom:24 }}>
            {[
              ["Deepfake Detected",  details.selfieScore > 0.5],
              ["GAN Face Detected",  details.ganFlag],
              ["Spoof Attack",       details.spoofFlag],
              ["Voice Clone",        details.voiceClone],
              ["Lip Sync Mismatch", !details.lipOk],
            ].map(([label, flag],i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 0", borderBottom: i<4 ? `1px solid ${T.cardBorder}` : "none" }}>
                <span style={{ fontSize:13, color:T.gray1 }}>{label}</span>
                {flag ? <span style={{ color:T.red, fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}><AlertOctagon size={13} /> Flagged</span>
                      : <span style={{ color:T.green, fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}><CheckCircle size={13} /> Clear</span>}
              </div>
            ))}
          </div>

          {/* actions */}
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => nav("kyc")} style={btnOutlineStyle}><RotateCcw size={15} /> Retry</button>
            <button onClick={() => nav("landing")} style={{ ...btnAccentStyle, flex:1 }}>Done</button>
          </div>
        </div>

        <p style={{ textAlign:"center", color:T.gray2, fontSize:11, marginTop:16 }}>
          Audit log has been recorded. Biometric data will be purged within 24 hours.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  PAGE 5 — ADMIN DASHBOARD
// ═══════════════════════════════════════════════════
function AdminDashboard() {
  const { nav } = useApp();
  const [tab, setTab]           = useState("overview");   // overview | flagged | analytics | audit
  const [searchQ, setSearchQ]   = useState("");
  const [reviewUser, setReviewUser] = useState(null);

  const filteredUsers = SEED_USERS.filter(u => u.name.toLowerCase().includes(searchQ.toLowerCase()));

  return (
    <div style={{ minHeight:"100vh", display:"flex" }}>
      {/* sidebar */}
      <aside style={{ width:220, background:T.navyMid, borderRight:`1px solid ${T.cardBorder}`, minHeight:"100vh", position:"sticky", top:0 }}>
        <div style={{ padding:"20px 18px", borderBottom:`1px solid ${T.cardBorder}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }} onClick={() => nav("landing")}>
            <Shield size={22} color={T.accent} />
            <span style={{ fontWeight:700, fontSize:15 }}><span style={{ color:T.accent }}>KYC</span> Admin</span>
          </div>
        </div>
        {[
          { id:"overview",   icon:BarChart3,  label:"Overview" },
          { id:"flagged",    icon:AlertTriangle, label:"Flagged Users" },
          { id:"analytics",  icon:TrendingUp, label:"Analytics" },
          { id:"audit",      icon:Database,   label:"Audit Log" },
        ].map(item => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              width:"100%", background: active ? `${T.accent}12` : "transparent",
              border:"none", borderLeft: active ? `3px solid ${T.accent}` : "3px solid transparent",
              color: active ? T.accent : T.gray1, padding:"11px 18px", cursor:"pointer",
              display:"flex", alignItems:"center", gap:10, fontSize:14, textAlign:"left",
              transition:"all .2s",
            }}>
              <Icon size={17} /> {item.label}
            </button>
          );
        })}
        <div style={{ marginTop:"auto", padding:18, borderTop:`1px solid ${T.cardBorder}`, position:"absolute", bottom:0, width:"100%" }}>
          <button onClick={() => nav("landing")} style={{ background:"none", border:"none", color:T.gray2, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
            <LogOut size={15} /> Exit Admin
          </button>
        </div>
      </aside>

      {/* main */}
      <main style={{ flex:1, padding:28, minHeight:"100vh", overflow:"auto" }}>
        <TopNav title="Admin Dashboard" showAdmin={false} />

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:700, marginBottom:20 }}>Dashboard Overview</h2>
            {/* KPI cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:28 }}>
              {[
                { label:"Total Verifications", value:1284,  icon:Users,          color:T.accent, trend:"+12%" },
                { label:"Verified",            value:1102,  icon:ShieldCheck,    color:T.green,  trend:"+8%" },
                { label:"Flagged / Suspicious",value:128,   icon:AlertTriangle,  color:T.amber,  trend:"+5%" },
                { label:"Rejected",            value:54,    icon:ShieldX,        color:T.red,    trend:"-2%" },
              ].map((k,i) => {
                const Icon = k.icon;
                const upGood = k.color !== T.red;
                const isUp   = k.trend.startsWith("+");
                return (
                  <div key={i} style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:14, padding:"18px 18px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <p style={{ fontSize:12, color:T.gray2, marginBottom:6 }}>{k.label}</p>
                        <p style={{ fontSize:28, fontWeight:800, color:T.white }}>{k.value.toLocaleString()}</p>
                      </div>
                      <div style={{ width:40, height:40, borderRadius:10, background:`${k.color}15`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Icon size={20} color={k.color} />
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:10 }}>
                      {isUp ? <TrendingUp size={13} color={upGood ? T.green : T.red} /> : <TrendingDown size={13} color={T.green} />}
                      <span style={{ fontSize:12, color: isUp === upGood ? T.green : T.red }}>{k.trend} vs last month</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* recent activity */}
            <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:16, padding:22 }}>
              <h3 style={{ fontSize:16, fontWeight:600, marginBottom:16 }}>Recent Verifications</h3>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.cardBorder}` }}>
                    {["Name","Email","Status","Risk","Score","Time"].map(h => (
                      <th key={h} style={{ textAlign:"left", fontSize:11, color:T.gray2, fontWeight:600, textTransform:"uppercase", letterSpacing:1, padding:"8px 10px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SEED_USERS.slice(0,5).map((u,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.cardBorder}44` }}>
                      <td style={{ padding:"10px", fontSize:14 }}>{u.name}</td>
                      <td style={{ padding:"10px", fontSize:13, color:T.gray1 }}>{u.email}</td>
                      <td style={{ padding:"10px" }}><RiskBadge status={u.status} /></td>
                      <td style={{ padding:"10px" }}><RiskLevel level={u.risk} /></td>
                      <td style={{ padding:"10px", fontSize:14, fontWeight:700, color: u.score>70?T.green:u.score>40?T.amber:T.red }}>{u.score}%</td>
                      <td style={{ padding:"10px", fontSize:12, color:T.gray2 }}>{u.ts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FLAGGED USERS ── */}
        {tab === "flagged" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontSize:22, fontWeight:700 }}>Flagged Users</h2>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, background:T.navy, border:`1px solid ${T.cardBorder}`, borderRadius:10, padding:"8px 14px" }}>
                  <Search size={15} color={T.gray2} />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search users…" style={{ background:"transparent", border:"none", outline:"none", color:T.white, fontSize:13, width:160 }} />
                </div>
                <button style={{ ...btnOutlineStyle, display:"flex", alignItems:"center", gap:6 }}><Download size={14} /> Export</button>
              </div>
            </div>

            <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:16, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead style={{ background:T.navyMid }}>
                  <tr>
                    {["#","Name","Email","Status","Risk","Score","Flagged","Action"].map(h => (
                      <th key={h} style={{ textAlign:"left", fontSize:11, color:T.gray2, fontWeight:600, textTransform:"uppercase", letterSpacing:1, padding:"12px 14px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.cardBorder}44`, background: u.flagged ? `${T.red}04` : "transparent" }}>
                      <td style={{ padding:"12px 14px", color:T.gray2, fontSize:13 }}>{i+1}</td>
                      <td style={{ padding:"12px 14px", fontSize:14, fontWeight:600 }}>{u.name}</td>
                      <td style={{ padding:"12px 14px", fontSize:13, color:T.gray1 }}>{u.email}</td>
                      <td style={{ padding:"12px 14px" }}><RiskBadge status={u.status} /></td>
                      <td style={{ padding:"12px 14px" }}><RiskLevel level={u.risk} /></td>
                      <td style={{ padding:"12px 14px", fontSize:14, fontWeight:700, color: u.score>70?T.green:u.score>40?T.amber:T.red }}>{u.score}%</td>
                      <td style={{ padding:"12px 14px" }}>{u.flagged ? <span style={{ color:T.red, fontSize:12 }}>⚑ Yes</span> : <span style={{ color:T.green, fontSize:12 }}>— No</span>}</td>
                      <td style={{ padding:"12px 14px" }}>
                        <button onClick={() => setReviewUser(u)} style={{ background:`${T.accent}18`, border:`1px solid ${T.accent}40`, color:T.accent, borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12 }}>Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === "analytics" && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:700, marginBottom:20 }}>Fraud Trend Analytics</h2>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:18, marginBottom:24 }}>
              {/* trend line chart */}
              <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:16, padding:22 }}>
                <h3 style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Attack Trends (Last 7 Months)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={FRAUD_TREND}>
                    <defs>
                      <linearGradient id="gDeep" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.red} stopOpacity=".3"/><stop offset="95%" stopColor={T.red} stopOpacity="0"/></linearGradient>
                      <linearGradient id="gReplay" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.amber} stopOpacity=".3"/><stop offset="95%" stopColor={T.amber} stopOpacity="0"/></linearGradient>
                      <linearGradient id="gSynth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity=".3"/><stop offset="95%" stopColor="#a855f7" stopOpacity="0"/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
                    <XAxis dataKey="month" stroke={T.gray2} tick={{ fill:T.gray2, fontSize:12 }} />
                    <YAxis stroke={T.gray2} tick={{ fill:T.gray2, fontSize:12 }} />
                    <Tooltip contentStyle={{ background:T.navyMid, border:`1px solid ${T.cardBorder}`, borderRadius:10, color:T.white, fontSize:13 }} />
                    <Legend wrapperStyle={{ fontSize:12 }} />
                    <Area type="monotone" dataKey="deepfake"  stroke={T.red}    fill="url(#gDeep)"   name="Deepfake" />
                    <Area type="monotone" dataKey="replay"    stroke={T.amber}  fill="url(#gReplay)" name="Replay" />
                    <Area type="monotone" dataKey="synthetic" stroke="#a855f7" fill="url(#gSynth)"  name="Synthetic" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* pie */}
              <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:16, padding:22 }}>
                <h3 style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Attack Breakdown</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={ATTACK_TYPES} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                      {ATTACK_TYPES.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background:T.navyMid, border:`1px solid ${T.cardBorder}`, borderRadius:10, color:T.white, fontSize:12 }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* legend */}
                <div style={{ marginTop:8 }}>
                  {ATTACK_TYPES.map((a,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:T.gray1, marginBottom:4 }}>
                      <span style={{ width:12, height:12, borderRadius:3, background:a.color, display:"inline-block" }} />
                      <span style={{ flex:1 }}>{a.name}</span>
                      <span style={{ color:T.white, fontWeight:600 }}>{a.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* bar chart */}
            <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:16, padding:22 }}>
              <h3 style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Monthly Attack Volume</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={FRAUD_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
                  <XAxis dataKey="month" stroke={T.gray2} tick={{ fill:T.gray2, fontSize:12 }} />
                  <YAxis stroke={T.gray2} tick={{ fill:T.gray2, fontSize:12 }} />
                  <Tooltip contentStyle={{ background:T.navyMid, border:`1px solid ${T.cardBorder}`, borderRadius:10, color:T.white, fontSize:13 }} />
                  <Bar dataKey="deepfake"  fill={T.red}    radius={[4,4,0,0]} name="Deepfake" />
                  <Bar dataKey="replay"    fill={T.amber}  radius={[4,4,0,0]} name="Replay" />
                  <Bar dataKey="synthetic" fill="#a855f7" radius={[4,4,0,0]} name="Synthetic" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── AUDIT LOG ── */}
        {tab === "audit" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontSize:22, fontWeight:700 }}>Audit & Compliance Log</h2>
              <button style={{ ...btnOutlineStyle, display:"flex", alignItems:"center", gap:6 }}><Download size={14} /> Export CSV</button>
            </div>
            <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:16, overflow:"hidden" }}>
              {AUDIT_LOGS.map((log,i) => {
                const colors = { info:T.accent, success:T.green, warning:T.amber, error:T.red };
                const c = colors[log.level];
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderBottom:`1px solid ${T.cardBorder}44` }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:c, boxShadow:`0 0 6px ${c}60` }} />
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:14, fontWeight:600 }}>{log.action}</p>
                      <p style={{ fontSize:12, color:T.gray2 }}>User: {log.user}</p>
                    </div>
                    <span style={{ fontSize:11, color:T.gray2, whiteSpace:"nowrap" }}>{log.ts}</span>
                    <span style={{ fontSize:10, background:`${c}18`, color:c, padding:"3px 10px", borderRadius:12, fontWeight:600, textTransform:"uppercase" }}>{log.level}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ── Manual Review Modal ── */}
      {reviewUser && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:18, padding:32, width:"90%", maxWidth:480, maxHeight:"80vh", overflow:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:700 }}>Manual Review</h3>
              <button onClick={() => setReviewUser(null)} style={{ background:"none", border:"none", color:T.gray1, cursor:"pointer", fontSize:22 }}>×</button>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:`linear-gradient(135deg,${T.accent},${T.accentDim})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:18, color:T.navy }}>
                {reviewUser.name[0]}
              </div>
              <div>
                <p style={{ fontWeight:600 }}>{reviewUser.name}</p>
                <p style={{ fontSize:13, color:T.gray2 }}>{reviewUser.email}</p>
              </div>
              <RiskBadge status={reviewUser.status} />
            </div>

            <div style={{ background:T.navy, borderRadius:12, padding:16, marginBottom:18 }}>
              {[["Verification Score", reviewUser.score+"%"], ["Risk Level", reviewUser.risk], ["Status", reviewUser.status], ["Flagged", reviewUser.flagged?"Yes":"No"], ["Timestamp", reviewUser.ts]].map(([k,v],i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom: i<4 ? `1px solid ${T.cardBorder}` : "none" }}>
                  <span style={{ color:T.gray2, fontSize:13 }}>{k}</span>
                  <span style={{ color:T.white, fontSize:13, fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* override actions */}
            <p style={{ fontSize:12, color:T.gray2, marginBottom:10 }}>Override Decision (Role: Admin)</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setReviewUser(null); }} style={{ flex:1, background:`${T.green}18`, border:`1px solid ${T.green}40`, color:T.green, borderRadius:10, padding:"10px 0", cursor:"pointer", fontWeight:600, fontSize:14 }}>
                ✓ Approve
              </button>
              <button onClick={() => { setReviewUser(null); }} style={{ flex:1, background:`${T.amber}18`, border:`1px solid ${T.amber}40`, color:T.amber, borderRadius:10, padding:"10px 0", cursor:"pointer", fontWeight:600, fontSize:14 }}>
                ⚠ Flag
              </button>
              <button onClick={() => { setReviewUser(null); }} style={{ flex:1, background:`${T.red}18`, border:`1px solid ${T.red}40`, color:T.red, borderRadius:10, padding:"10px 0", cursor:"pointer", fontWeight:600, fontSize:14 }}>
                ✕ Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  SHARED MINI-COMPONENTS
// ═══════════════════════════════════════════════════

/* Step card wrapper */
function StepCard({ title, subtitle, children }) {
  return (
    <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:18, padding:28 }}>
      <h2 style={{ fontSize:20, fontWeight:700, marginBottom:6 }}>{title}</h2>
      <p style={{ color:T.gray1, fontSize:13, marginBottom:22 }}>{subtitle}</p>
      {children}
    </div>
  );
}

/* Navigation buttons */
function NavButtons({ onNext, onBack, nextLabel="Continue" }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", marginTop:28 }}>
      {onBack ? <button onClick={onBack} style={btnOutlineStyle}><ArrowLeft size={15} /> Back</button> : <span />}
      <button onClick={onNext} style={btnAccentStyle}>{nextLabel} <ArrowRight size={15} /></button>
    </div>
  );
}

/* Risk Badge */
function RiskBadge({ status }) {
  const map = {
    verified:  { bg:`${T.green}18`,  border:T.green,  color:T.green,  icon:<ShieldCheck size={13}/>, label:"Verified" },
    suspicious:{ bg:`${T.amber}18`,  border:T.amber,  color:T.amber,  icon:<AlertTriangle size={13}/>, label:"Suspicious" },
    rejected:  { bg:`${T.red}18`,    border:T.red,    color:T.red,    icon:<ShieldX size={13}/>, label:"Rejected" },
  };
  const s = map[status] || map.suspicious;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:s.bg, border:`1px solid ${s.border}50`, color:s.color, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600 }}>
      {s.icon} {s.label}
    </span>
  );
}

/* Risk Level pill */
function RiskLevel({ level }) {
  const colors = { low: T.green, medium: T.amber, high: T.red };
  return <span style={{ fontSize:12, color:colors[level], fontWeight:700, textTransform:"uppercase" }}>{level}</span>;
}

/* Confidence Gauge (SVG arc) */
function ConfidenceGauge({ score, color }) {
  const radius = 54, circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={140} height={140} style={{ display:"block", margin:"0 auto" }}>
        <circle cx={70} cy={70} r={radius} fill="none" stroke={T.navy} strokeWidth={10} />
        <circle cx={70} cy={70} r={radius} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 70 70)"
          style={{ transition:"stroke-dashoffset .6s ease" }}
        />
        <text x={70} y={62} textAnchor="middle" fill={T.white} fontSize={28} fontWeight={800}>{score}</text>
        <text x={70} y={82} textAnchor="middle" fill={T.gray1} fontSize={12}>Confidence</text>
      </svg>
    </div>
  );
}

/* Mini stat box */
function MiniStat({ label, value, color }) {
  return (
    <div style={{ background:T.navyLight, borderRadius:10, padding:"10px 12px" }}>
      <p style={{ fontSize:11, color:T.gray2, marginBottom:3 }}>{label}</p>
      <p style={{ fontSize:15, fontWeight:700, color }}>{value}</p>
    </div>
  );
}

/* Spinner */
function Spinner({ size=20 }) {
  return (
    <span style={{ display:"inline-block", width:size, height:size, border:`2px solid ${T.cardBorder}`, borderTop:`2px solid ${T.accent}`, borderRadius:"50%", animation:"spin .6s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// ─────────────────────────────────────────────
// SHARED BUTTON STYLES
// ─────────────────────────────────────────────
const btnAccentStyle = {
  background:`linear-gradient(135deg,${T.accent},${T.accentDim})`, border:"none", color:T.navy,
  borderRadius:10, padding:"11px 28px", cursor:"pointer", fontSize:14, fontWeight:700,
  display:"inline-flex", alignItems:"center", gap:6,
};
const btnOutlineStyle = {
  background:"transparent", border:`1px solid ${T.cardBorder}`, color:T.gray1,
  borderRadius:10, padding:"11px 20px", cursor:"pointer", fontSize:14,
  display:"inline-flex", alignItems:"center", gap:6,
};

// ═══════════════════════════════════════════════════
//  ROOT EXPORT
// ═══════════════════════════════════════════════════
export default function DeepfakeKYCBuster() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
