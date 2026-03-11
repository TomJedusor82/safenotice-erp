import React, { useState } from "react";

// ─── STORAGE (localStorage standard) ────────────────────────────────────────
const LS_KEY = "safenotice_notices";
const loadNotices = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } };
const saveNotices = (n) => { try { localStorage.setItem(LS_KEY, JSON.stringify(n)); } catch {} };

// ─── DONNÉES ──────────────────────────────────────────────────────────────────
const CATEGORIES_ERP = {
  "Restauration / CHR":       { icon: "🍽️", code: "N", color: "#f59e0b" },
  "Commerce / Magasins":      { icon: "🛍️", code: "M", color: "#6366f1" },
  "Établissements scolaires": { icon: "🎓", code: "R", color: "#10b981" },
  "Hôtels / Hébergements":    { icon: "🏨", code: "O", color: "#3b82f6" },
};
const LOCAUX_PAR_TYPE = {
  "Restauration / CHR":       ["Cuisine","Salle de restauration","Bar","Cave / Réserve","Sanitaires","Terrasse"],
  "Commerce / Magasins":      ["Zone de vente","Réserve / Stock","Caisse","Vestiaires","Sanitaires","Parking"],
  "Établissements scolaires": ["Salles de classe","Gymnase","Bibliothèque","Réfectoire","Sanitaires","Laboratoires"],
  "Hôtels / Hébergements":    ["Chambres","Hall / Réception","Restaurant","Parking","Piscine","Sanitaires"],
};
const RISQUES_PAR_TYPE = {
  "Restauration / CHR":       ["Incendie cuisine (friteuses, grils)","Intoxication alimentaire","Glissades (sols humides)","Brûlures","Risque gaz"],
  "Commerce / Magasins":      ["Effondrement rayonnages","Incendie (stocks)","Vol / Agression","Glissades","Risque électrique"],
  "Établissements scolaires": ["Incendie","Intrusion / Malveillance","Chutes","Risque chimique (laboratoires)","Accidents sportifs"],
  "Hôtels / Hébergements":    ["Incendie nocturne","Noyade (piscine)","Chutes (escaliers)","Intoxication CO","Légionellose"],
};
const MOYENS_LABELS = {
  extincteurs:      "🧯 Extincteurs portatifs",
  robinetIncendie:  "🚿 Robinets d'incendie armés (RIA)",
  sprinklers:       "💧 Système sprinkler",
  detecteurFumee:   "🔊 Détecteurs de fumée",
  eclairageSecours: "💡 Éclairage de sécurité (BAES)",
  desenfumage:      "🌀 Désenfumage",
  portesCoupe:      "🚪 Portes coupe-feu",
  exutoires:        "🏠 Exutoires de toiture",
};
const CHECKLIST_ITEMS = {
  "Mensuel": [
    { id:"m1", label:"Vérification visuelle des extincteurs (pression, sécurité)" },
    { id:"m2", label:"Test des blocs de secours (BAES)" },
    { id:"m3", label:"Contrôle signalétique d'évacuation" },
    { id:"m4", label:"Essai de la sirène d'alarme incendie" },
    { id:"m5", label:"Vérification dégagement des issues de secours" },
  ],
  "Trimestriel": [
    { id:"t1", label:"Exercice d'évacuation du personnel" },
    { id:"t2", label:"Contrôle des portes coupe-feu" },
    { id:"t3", label:"Vérification des colonnes sèches/humides" },
    { id:"t4", label:"Contrôle du tableau de signalisation incendie (SSI)" },
  ],
  "Annuel": [
    { id:"a1", label:"Vérification extincteurs par technicien agréé" },
    { id:"a2", label:"Maintenance système de détection incendie (SDI)" },
    { id:"a3", label:"Contrôle électrique par organisme agréé" },
    { id:"a4", label:"Vérification des installations gaz" },
    { id:"a5", label:"Contrôle désenfumage / exutoires" },
    { id:"a6", label:"Mise à jour du registre de sécurité" },
    { id:"a7", label:"Formation personnel aux premiers secours" },
    { id:"a8", label:"Révision du plan d'évacuation affiché" },
  ],
  "Tous les 3 ans": [
    { id:"t3a1", label:"Passage de la commission de sécurité (ERP cat. 1 à 3)" },
    { id:"t3a2", label:"Vérification moyens de secours par bureau de contrôle" },
    { id:"t3a3", label:"Audit complet de conformité réglementaire ERP" },
  ],
};
const EMPTY_FORM = {
  typeERP:"", nomEtablissement:"", adresse:"", ville:"", codePostal:"",
  responsable:"", telephone:"", email:"", categorie:"", capaciteMax:"",
  nombreNiveaux:"1", surfaceTotale:"", locaux:[], risques:[],
  moyensSecours:{ extincteurs:true, robinetIncendie:false, sprinklers:false,
    detecteurFumee:true, eclairageSecours:true, desenfumage:false, portesCoupe:false, exutoires:false },
  sorties:"", derniereVisite:"", observations:"",
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  card:   { background:"#161b22", border:"1px solid #30363d", borderRadius:12, padding:24, marginBottom:20 },
  sTitle: { fontSize:13, fontWeight:700, color:"#e94560", textTransform:"uppercase", letterSpacing:1, marginBottom:16 },
  input:  { width:"100%", background:"#0d1117", border:"1px solid #30363d", borderRadius:6, padding:"10px 12px", color:"#e6edf3", fontSize:14, outline:"none", fontFamily:"inherit" },
  label:  { display:"block", fontSize:12, color:"#7d8590", marginBottom:6 },
  btn: (v) => v === "primary"
    ? { background:"linear-gradient(135deg,#e94560,#c41230)", color:"#fff", border:"none", borderRadius:8, padding:"12px 28px", fontSize:14, fontWeight:600, cursor:"pointer" }
    : { background:"transparent", border:"1px solid #30363d", color:"#7d8590", borderRadius:8, padding:"12px 20px", fontSize:14, cursor:"pointer" },
  chip: (active) => ({
    padding:"6px 14px", borderRadius:20, fontSize:13, cursor:"pointer",
    background: active ? "rgba(233,69,96,0.2)" : "#0d1117",
    border:`1px solid ${active ? "#e94560" : "#30363d"}`,
    color: active ? "#e94560" : "#7d8590",
  }),
  header: { background:"linear-gradient(90deg,#0f3460,#16213e)", borderBottom:"1px solid #30363d" },
  inner:  { maxWidth:1040, margin:"0 auto", padding:"0 24px" },
};
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&display=swap');
  @keyframes spin { to { transform:rotate(360deg); } }
  input:focus,textarea:focus,select:focus { border-color:#e94560 !important; }
  select { appearance:none; }
  ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:#0d1117; } ::-webkit-scrollbar-thumb { background:#30363d; border-radius:3px; }
`;

// ─── PLAN D'ÉVACUATION ───────────────────────────────────────────────────────
const CELL = 22, COLS = 32, ROWS = 20;
const PLAN_TOOLS = [
  { id:"wall",   label:"Mur",             color:"#4a5568", icon:null },
  { id:"exit",   label:"🚪 Sortie",       color:"#22c55e", icon:"🚪" },
  { id:"fire",   label:"🧯 Extincteur",   color:"#ef4444", icon:"🧯" },
  { id:"alarm",  label:"🔔 Alarme",       color:"#f59e0b", icon:"🔔" },
  { id:"rally",  label:"🟢 Rassemblement",color:"#06b6d4", icon:"🟢" },
  { id:"stair",  label:"🔼 Escalier",     color:"#8b5cf6", icon:"🔼" },
  { id:"room",   label:"🏠 Local",        color:"#64748b", icon:null  },
];
const getColor = (type) => PLAN_TOOLS.find(t => t.id === type)?.color || "#fff";
const cellKey  = (r,c) => `${r}-${c}`;

function EvacuationPlan({ planData, setPlanData }) {
  const [tool,    setTool]    = useState("wall");
  const [drawing, setDrawing] = useState(false);
  const [start,   setStart]   = useState(null);
  const [showLabel, setShowLabel] = useState(false);
  const [pending,   setPending]   = useState(null);
  const [roomName,  setRoomName]  = useState("");

  const paint = (r,c) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (tool === "room") { setPending({r,c}); setShowLabel(true); return; }
    setPlanData(prev => {
      const key = cellKey(r,c);
      if (prev[key]?.type === tool) { const {[key]:_, ...rest} = prev; return rest; }
      return { ...prev, [key]: { type:tool } };
    });
  };
  const fillRect = (r1,c1,r2,c2) => {
    const [minR,maxR] = [Math.min(r1,r2), Math.max(r1,r2)];
    const [minC,maxC] = [Math.min(c1,c2), Math.max(c1,c2)];
    setPlanData(prev => {
      const n = {...prev};
      for (let r=minR;r<=maxR;r++) for (let c=minC;c<=maxC;c++) n[cellKey(r,c)]={type:"wall"};
      return n;
    });
  };
  const confirmRoom = () => {
    if (!pending) return;
    setPlanData(prev => ({ ...prev, [cellKey(pending.r,pending.c)]: { type:"room", label:roomName||"Local" } }));
    setRoomName(""); setShowLabel(false); setPending(null);
  };
  const onDown  = (r,c) => { setDrawing(true); if (tool==="wall") setStart({r,c}); else paint(r,c); };
  const onUp    = (r,c) => { if (drawing && tool==="wall" && start) fillRect(start.r,start.c,r,c); setDrawing(false); setStart(null); };
  const onEnter = (r,c) => { if (drawing && tool !== "wall") paint(r,c); };

  return (
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12,alignItems:"center"}}>
        {PLAN_TOOLS.map(t => (
          <button key={t.id} onClick={()=>setTool(t.id)} style={{padding:"5px 10px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",border:`2px solid ${tool===t.id?t.color:"#30363d"}`,background:tool===t.id?`${t.color}22`:"#0d1117",color:tool===t.id?t.color:"#7d8590"}}>{t.label}</button>
        ))}
        <button onClick={()=>setPlanData({})} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:6,fontSize:12,background:"transparent",border:"1px solid #30363d",color:"#7d8590",cursor:"pointer"}}>🗑 Effacer</button>
      </div>
      {showLabel && (
        <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
          <input autoFocus value={roomName} onChange={e=>setRoomName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&confirmRoom()} placeholder="Nom du local" style={{...S.input,width:200}}/>
          <button onClick={confirmRoom} style={{...S.btn("primary"),padding:"8px 14px",fontSize:13}}>Ajouter</button>
          <button onClick={()=>{setShowLabel(false);setPending(null);}} style={{...S.btn("ghost"),padding:"8px 12px",fontSize:13}}>✕</button>
        </div>
      )}
      <div style={{overflowX:"auto",userSelect:"none"}}>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${COLS},${CELL}px)`,border:"1px solid #30363d",borderRadius:6,background:"#0a0d14",width:"fit-content"}}
          onMouseLeave={()=>{setDrawing(false);setStart(null);}}>
          {Array.from({length:ROWS},(_,r) => Array.from({length:COLS},(_,c) => {
            const key = cellKey(r,c);
            const cell = planData[key];
            return (
              <div key={key}
                onMouseDown={()=>onDown(r,c)} onMouseUp={()=>onUp(r,c)} onMouseEnter={()=>onEnter(r,c)}
                style={{width:CELL,height:CELL,boxSizing:"border-box",border:"1px solid #1a1f2e",background:cell?(cell.type==="wall"?"#4a5568":`${getColor(cell.type)}33`):"transparent",cursor:"crosshair",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,overflow:"hidden"}}>
                {cell && cell.type !== "wall" && (
                  <span style={{fontSize:cell.type==="room"?7:11}}>
                    {cell.type==="room" ? (cell.label?.slice(0,5)||"🏠") : PLAN_TOOLS.find(t=>t.id===cell.type)?.icon}
                  </span>
                )}
              </div>
            );
          }))}
        </div>
      </div>
      <p style={{fontSize:11,color:"#4d5566",marginTop:8}}>💡 Clic pour placer · Glisser pour tracer des murs · Re-cliquer pour effacer</p>
    </div>
  );
}

// ─── CHECKLIST ────────────────────────────────────────────────────────────────
function ChecklistPanel({ noticeId }) {
  const ck = `safenotice_checklist_${noticeId}`;
  const [checks, setChecks] = useState(() => { try { return JSON.parse(localStorage.getItem(ck)||"{}"); } catch { return {}; } });
  const toggle = (id) => {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    try { localStorage.setItem(ck, JSON.stringify(next)); } catch {}
  };
  const total = Object.values(CHECKLIST_ITEMS).flat().length;
  const done  = Object.values(checks).filter(Boolean).length;
  const pct   = Math.round((done/total)*100);
  const statusColor = pct===100?"#22c55e":pct>=75?"#f59e0b":pct>=40?"#e94560":"#7d8590";

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{flex:1,background:"#0d1117",borderRadius:99,height:8,overflow:"hidden",marginRight:16}}>
          <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,#e94560,${statusColor})`,borderRadius:99,transition:"width .4s ease"}}/>
        </div>
        <div style={{fontSize:22,fontWeight:800,color:statusColor,minWidth:50,textAlign:"right"}}>{pct}%</div>
      </div>
      {Object.entries(CHECKLIST_ITEMS).map(([freq,items]) => (
        <div key={freq} style={{...S.card,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={S.sTitle}>🗓 {freq}</div>
            <span style={{fontSize:12,color:"#7d8590"}}>{items.filter(i=>checks[i.id]).length}/{items.length}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {items.map(item => (
              <div key={item.id} onClick={()=>toggle(item.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:8,cursor:"pointer",background:checks[item.id]?"rgba(34,197,94,0.08)":"#0d1117",border:`1px solid ${checks[item.id]?"#22c55e":"#30363d"}`,transition:"all .2s"}}>
                <div style={{width:20,height:20,borderRadius:4,flexShrink:0,border:`2px solid ${checks[item.id]?"#22c55e":"#30363d"}`,background:checks[item.id]?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {checks[item.id]&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
                </div>
                <span style={{fontSize:13,color:checks[item.id]?"#e6edf3":"#7d8590",textDecoration:checks[item.id]?"line-through":"none",lineHeight:1.4}}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {pct===100&&<div style={{background:"rgba(34,197,94,0.1)",border:"1px solid #22c55e",borderRadius:8,padding:"14px 20px",color:"#22c55e",fontSize:14,fontWeight:600,textAlign:"center"}}>✓ Vérification complète — à archiver dans le registre de sécurité</div>}
    </div>
  );
}

// ─── RENDER NOTICE ────────────────────────────────────────────────────────────
function renderNoticeText(text) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (line.startsWith("# "))   return <h1 key={i} style={{fontSize:20,fontWeight:700,color:"#fff",borderBottom:"2px solid #e94560",paddingBottom:8,margin:"24px 0 12px"}}>{line.slice(2)}</h1>;
    if (line.startsWith("## "))  return <h2 key={i} style={{fontSize:16,fontWeight:700,color:"#e6edf3",margin:"20px 0 8px"}}>{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} style={{fontSize:14,fontWeight:600,color:"#e94560",margin:"14px 0 6px"}}>{line.slice(4)}</h3>;
    if (line.startsWith("---")) return <hr key={i} style={{border:"none",borderTop:"1px solid #30363d",margin:"16px 0"}}/>;
    if (line.startsWith("- "))  return <div key={i} style={{paddingLeft:16,marginBottom:4,color:"#c9d1d9",fontSize:14}}>• {line.slice(2)}</div>;
    if (line.trim() === "")     return <div key={i} style={{height:8}}/>;
    return <p key={i} style={{marginBottom:6,color:"#c9d1d9",fontSize:14,lineHeight:1.6}}>{line.replace(/\*\*(.+?)\*\*/g,"$1")}</p>;
  });
}

// ─── EXPORT PDF ───────────────────────────────────────────────────────────────
function exportToPDF(notice) {
  const win = window.open("","_blank");
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Notice Sécurité — ${notice.nomEtablissement}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;color:#1a1a2e;font-size:11pt;line-height:1.6}
.cover{background:linear-gradient(135deg,#1a1a2e,#0f3460);color:#fff;padding:60px 50px;margin-bottom:30px}
.cover-badge{background:#e94560;color:#fff;display:inline-block;padding:6px 16px;border-radius:3px;font-size:9pt;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px}
.cover h1{font-family:'Source Serif 4',serif;font-size:26pt;font-weight:700;margin-bottom:10px}
.cover h2{font-size:13pt;font-weight:400;opacity:.75;margin-bottom:30px}
.cover-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}
.cover-item{background:rgba(255,255,255,.08);border-left:3px solid #e94560;padding:10px 15px}
.cover-item .lbl{font-size:8pt;opacity:.6;text-transform:uppercase;letter-spacing:1px}
.cover-item .val{font-size:11pt;font-weight:600}
.content{padding:0 50px 50px}
h1{font-family:'Source Serif 4',serif;font-size:18pt;color:#0f3460;border-bottom:3px solid #e94560;padding-bottom:8px;margin:28px 0 12px}
h2{font-family:'Source Serif 4',serif;font-size:13pt;color:#16213e;margin:18px 0 8px}
h3{font-size:11pt;color:#0f3460;margin:12px 0 6px;font-weight:600}
p{margin-bottom:7px}li{margin-bottom:4px}
hr{border:none;border-top:1px solid #e0e0e0;margin:18px 0}
.footer{background:#1a1a2e;color:rgba(255,255,255,.5);text-align:center;padding:18px;font-size:8pt;margin-top:40px}
@media print{.cover,.footer{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="cover">
  <div class="cover-badge">ERP — Notice de Sécurité</div>
  <h1>${notice.nomEtablissement}</h1>
  <h2>${notice.typeERP} · Catégorie ${notice.categorie||"N/A"}</h2>
  <div class="cover-grid">
    <div class="cover-item"><div class="lbl">Adresse</div><div class="val">${notice.adresse}, ${notice.codePostal} ${notice.ville}</div></div>
    <div class="cover-item"><div class="lbl">Responsable</div><div class="val">${notice.responsable}</div></div>
    <div class="cover-item"><div class="lbl">Capacité maximale</div><div class="val">${notice.capaciteMax} personnes</div></div>
    <div class="cover-item"><div class="lbl">Date d'édition</div><div class="val">${new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</div></div>
  </div>
</div>
<div class="content">
${(notice.noticeText||"").replace(/^# (.+)$/gm,"<h1>$1</h1>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/^---$/gm,"<hr>").split("\n").map(l=>{if(l.startsWith("<h")||l.startsWith("<hr"))return l;if(l.startsWith("- "))return`<li>${l.slice(2)}</li>`;if(l.trim()==="")return"<br>";return`<p>${l}</p>`;}).join("\n")}
</div>
<div class="footer">Document généré le ${new Date().toLocaleDateString("fr-FR")} · SafeNotice ERP · À conserver dans le registre de sécurité</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
  win.document.write(html); win.document.close();
}

// ─── APP PRINCIPALE ───────────────────────────────────────────────────────────
export default function App() {
  const [notices,    setNotices]    = useState(loadNotices);
  const [view,       setView]       = useState("home");   // home | new | detail
  const [step,       setStep]       = useState(1);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [openNotice, setOpenNotice] = useState(null);
  const [detailTab,  setDetailTab]  = useState("notice");
  const [planData,   setPlanData]   = useState({});

  const updateForm  = (f,v) => setFormData(p => ({...p, [f]:v}));
  const toggleArr   = (f,v) => setFormData(p => ({...p, [f]: p[f].includes(v) ? p[f].filter(x=>x!==v) : [...p[f],v]}));
  const toggleMoy   = (k)   => setFormData(p => ({...p, moyensSecours:{...p.moyensSecours,[k]:!p.moyensSecours[k]}}));
  const STEPS_LABEL = ["Type ERP","Identification","Sécurité"];

  const generateNotice = async () => {
    setLoading(true); setError(null);
    const moyensActifs = Object.entries(formData.moyensSecours).filter(([,v])=>v).map(([k])=>MOYENS_LABELS[k]).join(", ");
    const prompt = `Tu es un expert en sécurité incendie et réglementation ERP en France. Génère une notice de sécurité professionnelle et réglementaire.

DONNÉES :
- Type ERP : ${formData.typeERP} (code ${CATEGORIES_ERP[formData.typeERP]?.code||"N/A"})
- Nom : ${formData.nomEtablissement} | Adresse : ${formData.adresse}, ${formData.codePostal} ${formData.ville}
- Responsable : ${formData.responsable} | ${formData.telephone} | ${formData.email}
- Catégorie ERP : ${formData.categorie} | Capacité : ${formData.capaciteMax} pers. | Niveaux : ${formData.nombreNiveaux} | Surface : ${formData.surfaceTotale} m²
- Locaux : ${formData.locaux.join(", ")} | Risques : ${formData.risques.join(", ")}
- Moyens de secours : ${moyensActifs}
- Sorties de secours : ${formData.sorties} | Dernière visite commission : ${formData.derniereVisite}
- Observations : ${formData.observations||"Aucune"}

Génère la notice avec ces sections numérotées :
# NOTICE DE SÉCURITÉ
## Établissement Recevant du Public
---
## 1. IDENTIFICATION DE L'ÉTABLISSEMENT
## 2. CLASSEMENT RÉGLEMENTAIRE
## 3. DESCRIPTION DES LOCAUX
## 4. ANALYSE DES RISQUES
## 5. MOYENS DE PRÉVENTION ET DE PROTECTION
## 6. ORGANISATION DES SECOURS
## 7. CONSIGNES EN CAS D'INCENDIE
## 8. PLAN DE MAINTENANCE
## 9. REGISTRE DE SÉCURITÉ
## 10. DÉCLARATION DU RESPONSABLE

Sois précis, professionnel, cite les textes réglementaires français applicables.`;
    try {
      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || "";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": apiKey,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true"
        },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:4000, messages:[{role:"user",content:prompt}] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.map(i=>i.text||"").join("\n")||"";
      const newNotice = { ...formData, id:Date.now().toString(), noticeText:text, savedAt:new Date().toLocaleDateString("fr-FR"), planData:{} };
      const updated = [newNotice, ...notices];
      setNotices(updated); saveNotices(updated);
      setOpenNotice(newNotice); setPlanData({}); setDetailTab("notice"); setView("detail");
    } catch(e) { setError(`Erreur : ${e.message||"Veuillez réessayer."}`); }
    finally { setLoading(false); }
  };

  const deleteNotice = (id) => {
    const updated = notices.filter(n=>n.id!==id);
    setNotices(updated); saveNotices(updated);
    if (openNotice?.id === id) setView("home");
  };

  const savePlan = () => {
    const updated = notices.map(n => n.id===openNotice.id ? {...n, planData} : n);
    setNotices(updated); saveNotices(updated);
    setOpenNotice(prev => ({...prev, planData}));
  };

  // ── VUE ACCUEIL ──────────────────────────────────────────────────────────────
  if (view==="home") return (
    <div style={{minHeight:"100vh",background:"#0d1117",fontFamily:"'DM Sans',system-ui,sans-serif",color:"#e6edf3"}}>
      <style>{css}</style>
      <div style={S.header}>
        <div style={{...S.inner,display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{background:"#e94560",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🛡️</div>
            <div>
              <div style={{fontWeight:700,fontSize:16,color:"#fff"}}>SafeNotice ERP</div>
              <div style={{fontSize:11,color:"#7d8590"}}>Générateur de notices sécurité</div>
            </div>
          </div>
          <button onClick={()=>{setFormData(EMPTY_FORM);setStep(1);setView("new");}} style={S.btn("primary")}>+ Nouvelle notice</button>
        </div>
      </div>
      <div style={{...S.inner,padding:"32px 24px"}}>
        {!process.env.REACT_APP_ANTHROPIC_API_KEY && (
          <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid #f59e0b",borderRadius:10,padding:"14px 18px",marginBottom:24,color:"#f59e0b",fontSize:13,display:"flex",alignItems:"center",gap:10}}>
            ⚠️ <span>Variable <code>REACT_APP_ANTHROPIC_API_KEY</code> non configurée. Ajoutez votre clé API dans les variables d'environnement Vercel/Netlify.</span>
          </div>
        )}
        <div style={{marginBottom:24}}>
          <h2 style={{fontSize:22,fontWeight:700,color:"#fff",marginBottom:4}}>Mes notices ERP</h2>
          <p style={{color:"#7d8590"}}>{notices.length} notice{notices.length!==1?"s":""} enregistrée{notices.length!==1?"s":""}</p>
        </div>
        {notices.length===0 ? (
          <div style={{...S.card,textAlign:"center",padding:56}}>
            <div style={{fontSize:52,marginBottom:16}}>🛡️</div>
            <p style={{color:"#7d8590",marginBottom:20,fontSize:15}}>Aucune notice pour le moment.<br/>Créez votre première notice de sécurité ERP.</p>
            <button onClick={()=>{setFormData(EMPTY_FORM);setStep(1);setView("new");}} style={S.btn("primary")}>Créer ma première notice</button>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {notices.map(n => {
              const info = CATEGORIES_ERP[n.typeERP]||{};
              return (
                <div key={n.id} style={{...S.card,marginBottom:0,display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
                  <div style={{fontSize:32}}>{info.icon||"🏢"}</div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{fontWeight:700,fontSize:16,color:"#fff",marginBottom:3}}>{n.nomEtablissement||"Sans nom"}</div>
                    <div style={{fontSize:13,color:"#7d8590"}}>{n.typeERP} · {n.adresse||""}{n.ville?`, ${n.ville}`:""} · {n.savedAt}</div>
                    <div style={{display:"flex",gap:6,marginTop:7,flexWrap:"wrap"}}>
                      {n.categorie&&<span style={{background:"rgba(233,69,96,0.15)",color:"#e94560",padding:"2px 8px",borderRadius:99,fontSize:11}}>Cat. {n.categorie}</span>}
                      {n.capaciteMax&&<span style={{background:"#0d1117",color:"#7d8590",padding:"2px 8px",borderRadius:99,fontSize:11,border:"1px solid #30363d"}}>{n.capaciteMax} pers.</span>}
                      {n.planData&&Object.keys(n.planData).length>0&&<span style={{background:"rgba(6,182,212,0.15)",color:"#06b6d4",padding:"2px 8px",borderRadius:99,fontSize:11}}>🗺 Plan</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setOpenNotice(n);setPlanData(n.planData||{});setDetailTab("notice");setView("detail");}} style={{...S.btn("ghost"),fontSize:13,padding:"8px 14px"}}>✏️ Ouvrir</button>
                    <button onClick={()=>exportToPDF(n)} style={{background:"rgba(233,69,96,0.1)",border:"1px solid #e94560",color:"#e94560",borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer"}}>📄 PDF</button>
                    <button onClick={()=>deleteNotice(n.id)} style={{background:"transparent",border:"1px solid #30363d",color:"#4d5566",borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer"}}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── VUE CRÉATION ─────────────────────────────────────────────────────────────
  if (view==="new") return (
    <div style={{minHeight:"100vh",background:"#0d1117",fontFamily:"'DM Sans',system-ui,sans-serif",color:"#e6edf3"}}>
      <style>{css}</style>
      <div style={S.header}>
        <div style={{...S.inner,display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setView("home")} style={{background:"transparent",border:"none",color:"#7d8590",cursor:"pointer",fontSize:14,padding:"4px 8px"}}>← Accueil</button>
            <div style={{width:1,height:20,background:"#30363d"}}/>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{background:"#e94560",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🛡️</div>
              <div style={{fontWeight:700,fontSize:15,color:"#fff"}}>Nouvelle notice</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {STEPS_LABEL.map((s,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,background:step>i+1?"#e94560":step===i+1?"#0f3460":"transparent",border:`2px solid ${step>=i+1?"#e94560":"#30363d"}`,color:step>=i+1?"#fff":"#7d8590"}}>{step>i+1?"✓":i+1}</div>
                <span style={{fontSize:11,color:step===i+1?"#fff":"#7d8590"}}>{s}</span>
                {i<2&&<div style={{width:12,height:1,background:"#30363d"}}/>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{...S.inner,padding:"32px 24px"}}>
        {step===1&&(
          <div>
            <h2 style={{fontSize:24,fontWeight:700,marginBottom:8,color:"#fff"}}>Quel type d'établissement ?</h2>
            <p style={{color:"#7d8590",marginBottom:28}}>Sélectionnez le type d'ERP pour adapter la notice aux risques spécifiques.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:32}}>
              {Object.entries(CATEGORIES_ERP).map(([type,info])=>(
                <div key={type} onClick={()=>updateForm("typeERP",type)} style={{border:`2px solid ${formData.typeERP===type?"#e94560":"#30363d"}`,borderRadius:12,padding:24,cursor:"pointer",background:formData.typeERP===type?"rgba(233,69,96,0.1)":"#161b22",transition:"all .2s"}}>
                  <div style={{fontSize:32,marginBottom:10}}>{info.icon}</div>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:4,color:"#fff"}}>{type}</div>
                  <div style={{fontSize:12,color:"#7d8590"}}>Type {info.code}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>formData.typeERP&&setStep(2)} style={{...S.btn("primary"),opacity:formData.typeERP?1:.4}}>Continuer →</button>
          </div>
        )}
        {step===2&&(
          <div>
            <h2 style={{fontSize:24,fontWeight:700,marginBottom:8,color:"#fff"}}>Identification de l'établissement</h2>
            <p style={{color:"#7d8590",marginBottom:28}}>Ces informations figureront sur la notice officielle.</p>
            <div style={S.card}>
              <div style={S.sTitle}>Informations générales</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {[["Nom de l'établissement *","nomEtablissement","Ex: Restaurant Le Mistral"],["Responsable / Gérant *","responsable","Nom et prénom"],["Téléphone","telephone","06 00 00 00 00"],["Email","email","contact@etablissement.fr"]].map(([l,f,p])=>(
                  <div key={f}><label style={S.label}>{l}</label><input value={formData[f]} onChange={e=>updateForm(f,e.target.value)} placeholder={p} style={S.input}/></div>
                ))}
              </div>
            </div>
            <div style={S.card}>
              <div style={S.sTitle}>Adresse</div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:16}}>
                {[["Adresse *","adresse","12 rue de la Paix"],["Code postal *","codePostal","75001"],["Ville *","ville","Paris"]].map(([l,f,p])=>(
                  <div key={f}><label style={S.label}>{l}</label><input value={formData[f]} onChange={e=>updateForm(f,e.target.value)} placeholder={p} style={S.input}/></div>
                ))}
              </div>
            </div>
            <div style={S.card}>
              <div style={S.sTitle}>Caractéristiques techniques</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:16,marginBottom:20}}>
                {[["Catégorie ERP","categorie","1 à 5"],["Capacité max","capaciteMax","150"],["Niveaux","nombreNiveaux","2"],["Surface (m²)","surfaceTotale","450"]].map(([l,f,p])=>(
                  <div key={f}><label style={S.label}>{l}</label><input value={formData[f]} onChange={e=>updateForm(f,e.target.value)} placeholder={p} style={S.input}/></div>
                ))}
              </div>
              <div><label style={S.label}>Locaux concernés</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {(LOCAUX_PAR_TYPE[formData.typeERP]||[]).map(l=>(
                    <div key={l} onClick={()=>toggleArr("locaux",l)} style={S.chip(formData.locaux.includes(l))}>{l}</div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>setStep(1)} style={S.btn("ghost")}>← Retour</button>
              <button onClick={()=>setStep(3)} style={S.btn("primary")}>Continuer →</button>
            </div>
          </div>
        )}
        {step===3&&(
          <div>
            <h2 style={{fontSize:24,fontWeight:700,marginBottom:8,color:"#fff"}}>Sécurité & Moyens de secours</h2>
            <p style={{color:"#7d8590",marginBottom:28}}>Ces données alimentent le cœur de votre notice réglementaire.</p>
            <div style={S.card}>
              <div style={S.sTitle}>Risques identifiés</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {(RISQUES_PAR_TYPE[formData.typeERP]||[]).map(r=>(
                  <div key={r} onClick={()=>toggleArr("risques",r)} style={S.chip(formData.risques.includes(r))}>⚠️ {r}</div>
                ))}
              </div>
            </div>
            <div style={S.card}>
              <div style={S.sTitle}>Moyens de secours disponibles</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {Object.entries(MOYENS_LABELS).map(([k,label])=>(
                  <div key={k} onClick={()=>toggleMoy(k)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:8,cursor:"pointer",background:formData.moyensSecours[k]?"rgba(233,69,96,0.1)":"#0d1117",border:`1px solid ${formData.moyensSecours[k]?"#e94560":"#30363d"}`}}>
                    <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${formData.moyensSecours[k]?"#e94560":"#30363d"}`,background:formData.moyensSecours[k]?"#e94560":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {formData.moyensSecours[k]&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
                    </div>
                    <span style={{fontSize:13,color:formData.moyensSecours[k]?"#e6edf3":"#7d8590"}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={S.card}>
              <div style={S.sTitle}>Informations complémentaires</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                <div><label style={S.label}>Nombre de sorties de secours</label><input value={formData.sorties} onChange={e=>updateForm("sorties",e.target.value)} placeholder="Ex: 3" style={S.input}/></div>
                <div><label style={S.label}>Dernière visite commission</label><input type="date" value={formData.derniereVisite} onChange={e=>updateForm("derniereVisite",e.target.value)} style={S.input}/></div>
              </div>
              <div><label style={S.label}>Observations particulières</label>
                <textarea value={formData.observations} onChange={e=>updateForm("observations",e.target.value)} rows={3} placeholder="Travaux en cours, aménagements spéciaux..." style={{...S.input,resize:"vertical"}}/>
              </div>
            </div>
            {error&&<div style={{background:"rgba(233,69,96,0.1)",border:"1px solid #e94560",borderRadius:8,padding:14,marginBottom:20,color:"#e94560",fontSize:14}}>{error}</div>}
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>setStep(2)} style={S.btn("ghost")}>← Retour</button>
              <button onClick={generateNotice} disabled={loading} style={{...S.btn("primary"),display:"flex",alignItems:"center",gap:10,opacity:loading?.7:1,cursor:loading?"not-allowed":"pointer"}}>
                {loading?(<><div style={{width:18,height:18,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>Génération en cours…</>):"✨ Générer la notice"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── VUE DÉTAIL ───────────────────────────────────────────────────────────────
  if (view==="detail"&&openNotice) {
    const info = CATEGORIES_ERP[openNotice.typeERP]||{};
    const TABS = [{id:"notice",label:"📄 Notice"},{id:"plan",label:"🗺️ Plan d'évacuation"},{id:"checklist",label:"✅ Checklist"}];
    return (
      <div style={{minHeight:"100vh",background:"#0d1117",fontFamily:"'DM Sans',system-ui,sans-serif",color:"#e6edf3"}}>
        <style>{css}</style>
        <div style={{...S.header,position:"sticky",top:0,zIndex:100}}>
          <div style={{...S.inner,display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <button onClick={()=>setView("home")} style={{background:"transparent",border:"none",color:"#7d8590",cursor:"pointer",fontSize:14}}>← Accueil</button>
              <div style={{width:1,height:20,background:"#30363d"}}/>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>{info.icon||"🏢"}</span>
                <div>
                  <div style={{fontWeight:700,color:"#fff",fontSize:15}}>{openNotice.nomEtablissement}</div>
                  <div style={{fontSize:11,color:"#7d8590"}}>{openNotice.typeERP} · {openNotice.codePostal} {openNotice.ville}</div>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              {detailTab==="plan"&&<button onClick={savePlan} style={{...S.btn("ghost"),fontSize:13,padding:"9px 16px",borderColor:"#22c55e",color:"#22c55e"}}>💾 Sauvegarder le plan</button>}
              <button onClick={()=>exportToPDF(openNotice)} style={{...S.btn("primary"),padding:"9px 18px",fontSize:13}}>📄 Exporter PDF</button>
            </div>
          </div>
          <div style={{...S.inner,display:"flex",gap:0,borderTop:"1px solid #21262d"}}>
            {TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setDetailTab(tab.id)} style={{padding:"12px 20px",background:"transparent",border:"none",borderBottom:`2px solid ${detailTab===tab.id?"#e94560":"transparent"}`,color:detailTab===tab.id?"#fff":"#7d8590",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{maxWidth:1000,margin:"0 auto",padding:"28px 24px"}}>
          {detailTab==="notice"&&(
            <div style={{...S.card,maxHeight:"calc(100vh - 200px)",overflowY:"auto"}}>
              <div style={{padding:"4px 8px"}}>{renderNoticeText(openNotice.noticeText)}</div>
            </div>
          )}
          {detailTab==="plan"&&(
            <div>
              <div style={{marginBottom:20}}>
                <h3 style={{color:"#fff",fontSize:18,fontWeight:700,marginBottom:6}}>Plan d'évacuation schématique</h3>
                <p style={{color:"#7d8590",fontSize:13}}>Dessinez le plan de votre établissement. Pensez à sauvegarder vos modifications.</p>
              </div>
              <div style={S.card}><EvacuationPlan planData={planData} setPlanData={setPlanData}/></div>
            </div>
          )}
          {detailTab==="checklist"&&(
            <div>
              <div style={{marginBottom:20}}>
                <h3 style={{color:"#fff",fontSize:18,fontWeight:700,marginBottom:6}}>Checklist de vérification périodique</h3>
                <p style={{color:"#7d8590",fontSize:13}}>Cochez les vérifications effectuées. La progression est sauvegardée automatiquement.</p>
              </div>
              <ChecklistPanel noticeId={openNotice.id}/>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}
