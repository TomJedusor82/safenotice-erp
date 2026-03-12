import { useState, useMemo, useCallback, useEffect, useRef } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DONNÉES RÉFÉRENTIELLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CATEGORIES_ERP = {
  "N — Restauration / Débits de boissons": { icon: "🍽️", code: "N", desc: "Restaurants, cafés, brasseries", articles: "GC, GE, N" },
  "M — Magasins / Centres commerciaux":    { icon: "🛍️", code: "M", desc: "Commerces, grandes surfaces", articles: "GC, GE, M" },
  "R — Enseignement / Formation":          { icon: "🎓", code: "R", desc: "Écoles, collèges, lycées, universités", articles: "GC, GE, R" },
  "O — Hôtels / Hébergements":             { icon: "🏨", code: "O", desc: "Hôtels, résidences, pensions", articles: "GC, GE, O" },
  "L — Salles de spectacles / Conférences": { icon: "🎭", code: "L", desc: "Salles de réunion, conférences, spectacles", articles: "GC, GE, L" },
  "W — Administration / Bureaux":          { icon: "🏢", code: "W", desc: "Banques, bureaux ouverts au public", articles: "GC, GE, W" },
  "X — Établissements sportifs couverts":  { icon: "🏋️", code: "X", desc: "Gymnases, salles de sport", articles: "GC, GE, X" },
  "U — Établissements sanitaires":         { icon: "🏥", code: "U", desc: "Cliniques, cabinets médicaux", articles: "GC, GE, U" },
};
const LOCAUX_PAR_TYPE = {
  "N — Restauration / Débits de boissons": ["Salle de restauration","Cuisine","Bar / Comptoir","Cave / Réserve","Sanitaires","Office","Terrasse couverte","Vestiaires personnel"],
  "M — Magasins / Centres commerciaux": ["Zone de vente","Réserve / Stockage","Caisse / Accueil","Vestiaires","Sanitaires","Parking couvert","Quai de livraison","Local technique"],
  "R — Enseignement / Formation": ["Salles de classe","Gymnase / Salle de sport","Bibliothèque / CDI","Réfectoire","Sanitaires","Laboratoires","Ateliers","Administration"],
  "O — Hôtels / Hébergements": ["Chambres","Hall / Réception","Restaurant / Bar","Salles de conférence","Parking couvert","Piscine / Spa","Buanderie","Locaux techniques"],
  "L — Salles de spectacles / Conférences": ["Salle principale","Coulisses / Loge","Foyer / Hall","Sanitaires","Régie technique","Réserves décors","Parking","Administration"],
  "W — Administration / Bureaux": ["Bureaux ouverts","Salles de réunion","Hall d'accueil","Archives","Sanitaires","Local serveur","Parking","Cafétéria"],
  "X — Établissements sportifs couverts": ["Aire de jeux","Vestiaires","Tribunes","Sanitaires","Local matériel","Salle de musculation","Accueil","Bar / Buvette"],
  "U — Établissements sanitaires": ["Salles de soins","Salle d'attente","Secrétariat","Pharmacie / Réserve médicaments","Sanitaires","Local déchets médicaux","Archives","Parking"],
};
const RISQUES_PAR_TYPE = {
  "N — Restauration / Débits de boissons": ["Incendie cuisine (friteuses, feux vifs)","Explosion gaz","Intoxication alimentaire","Glissades (sols humides)","Brûlures personnel","Risque électrique"],
  "M — Magasins / Centres commerciaux": ["Effondrement rayonnages","Incendie stocks inflammables","Vol / Agression","Glissades","Risque électrique","Bousculades foule"],
  "R — Enseignement / Formation": ["Incendie","Intrusion / Attentat","Chutes d'élèves","Risque chimique (labos)","Accidents sportifs","Risque électrique"],
  "O — Hôtels / Hébergements": ["Incendie nocturne (occupants endormis)","Noyade (piscine)","Chutes escaliers","Intoxication CO","Légionellose","Risque électrique"],
  "L — Salles de spectacles / Conférences": ["Mouvement de foule / panique","Incendie décors","Risque électrique (installations scéniques)","Chutes de hauteur","Risque acoustique","Incendie"],
  "W — Administration / Bureaux": ["Incendie archives","Risque électrique","Risque sismique (serveurs)","Vol / Intrusion","Chutes","Incendie"],
  "X — Établissements sportifs couverts": ["Blessures sportives","Incendie","Accidents sur équipements","Chutes de hauteur (tribunes)","Risque électrique","Noyade (piscine)"],
  "U — Établissements sanitaires": ["Infection nosocomiale","Risque chimique","Risque biologique","Incendie","Risque électrique (appareils médicaux)","Agression"],
};
const MOYENS = {
  extincteurs: "Extincteurs portatifs (art. MS 38 à MS 40)",
  robinetIncendie: "Robinets d'incendie armés — RIA (art. MS 14-17)",
  sprinklers: "Extinction auto. sprinklers (art. MS 25-29)",
  detecteurFumee: "Détection incendie — SDI (art. MS 56-60)",
  ssi: "SSI cat. A (art. MS 53-55)",
  eclairageSecours: "Éclairage sécurité BAES/BAEH (art. EC 7-15)",
  desenfumage: "Désenfumage naturel/mécanique (art. DF 1-10)",
  portesCoupe: "Portes coupe-feu PF/CF (art. CO 47-48)",
  exutoires: "Exutoires de toiture (art. DF 5-7)",
  colonneSeche: "Colonne sèche / humide (art. MS 18-24)",
};
const CHECKLIST = {
  "Mensuel": [
    { id:"m1", label:"Vérification visuelle extincteurs (pression, goupille, sceau)" },
    { id:"m2", label:"Test des blocs d'éclairage de sécurité (BAES)" },
    { id:"m3", label:"Contrôle signalétique d'évacuation et balisage" },
    { id:"m4", label:"Essai sirène / alarme incendie" },
    { id:"m5", label:"Vérification dégagement des issues de secours" },
    { id:"m6", label:"Contrôle du registre de sécurité" },
  ],
  "Trimestriel": [
    { id:"t1", label:"Exercice d'évacuation (2 fois/an obligatoire cat. 1-4)" },
    { id:"t2", label:"Contrôle portes coupe-feu (fermeture auto)" },
    { id:"t3", label:"Vérification colonnes sèches / humides" },
    { id:"t4", label:"Contrôle TSI/SSI" },
    { id:"t5", label:"Test déclencheurs manuels d'alarme" },
  ],
  "Annuel": [
    { id:"a1", label:"Vérification extincteurs par technicien agréé (art. MS 38)" },
    { id:"a2", label:"Maintenance SDI / SSI (art. MS 56)" },
    { id:"a3", label:"Vérif. installations électriques organisme agréé (art. EL 19)" },
    { id:"a4", label:"Vérif. installations gaz (art. GZ 30)" },
    { id:"a5", label:"Contrôle désenfumage / exutoires (art. DF 10)" },
    { id:"a6", label:"Vérif. BAES test 8h autonomie (art. EC 14-15)" },
    { id:"a7", label:"Formation personnel sécurité incendie (art. MS 46)" },
    { id:"a8", label:"Mise à jour plan d'évacuation affiché" },
    { id:"a9", label:"Mise à jour registre de sécurité (art. GE 3)" },
  ],
  "Périodique (≥ 3 ans)": [
    { id:"p1", label:"Visite commission sécurité cat. 1-4 (art. GE 4)" },
    { id:"p2", label:"Vérif. moyens de secours par bureau de contrôle" },
    { id:"p3", label:"Audit conformité réglementaire ERP" },
    { id:"p4", label:"Renouvellement autorisation si travaux" },
  ],
};
const EMPTY_FORM = {
  typeERP:"", nom:"", adresse:"", ville:"", cp:"",
  responsable:"", tel:"", email:"", categorie:"", capacite:"",
  niveaux:"1", surface:"", locaux:[], risques:[],
  moyens:{ extincteurs:true, robinetIncendie:false, sprinklers:false, detecteurFumee:true, ssi:false, eclairageSecours:true, desenfumage:false, portesCoupe:false, exutoires:false, colonneSeche:false },
  nbFacadesAccessibles:"", largeurVoie:"", resistanceFeu:"",
  natureMateriauxPlafond:"", natureMateriauxMurs:"", natureMateriauxSol:"",
  sorties:"", largeurSorties:"", nbEscaliers:"", largeurEscaliers:"",
  chauffageNature:"", cuisinePuissance:"",
  typeAlarme:"", derniereVisite:"", prochaineVisite:"", observations:"",
  etablissementId:"",
};
const VALIDATIONS = {
  1: f => !f.typeERP ? "Sélectionnez un type d'ERP." : null,
  2: f => { const m=[]; if(!f.nom.trim()) m.push("Nom"); if(!f.responsable.trim()) m.push("Responsable"); if(!f.adresse.trim()) m.push("Adresse"); if(!f.ville.trim()) m.push("Ville"); if(!f.categorie) m.push("Catégorie"); return m.length ? `Champs obligatoires : ${m.join(", ")}` : null; },
  3: f => { if(!f.locaux.length) return "Sélectionnez au moins un local."; if(!f.risques.length) return "Sélectionnez au moins un risque."; return null; },
  4: () => null,
};

// Plan
const CELL=22, COLS=30, ROWS=16;
const PLAN_TOOLS=[
  {id:"wall",label:"Mur",color:"#f87171"},
  {id:"exit",label:"Sortie",color:"#4ade80",icon:"🚪"},
  {id:"fire",label:"Extincteur",color:"#fb923c",icon:"🧯"},
  {id:"alarm",label:"Déclencheur",color:"#facc15",icon:"🔔"},
  {id:"rally",label:"Rassemblement",color:"#22d3ee",icon:"🟢"},
  {id:"stair",label:"Escalier",color:"#c084fc",icon:"🔼"},
  {id:"room",label:"Local",color:"#94a3b8"},
];
const gtc=t=>PLAN_TOOLS.find(x=>x.id===t)?.color||"#000";
const ck=(r,c)=>`${r}-${c}`;

// ━━━ PERSISTENT STORAGE ━━━
async function sGet(k,fb){try{const r=await window.storage.get(k);return r?JSON.parse(r.value):fb;}catch{return fb;}}
async function sSet(k,v){try{await window.storage.set(k,JSON.stringify(v));}catch(e){console.error("storage:",e);}}

// ━━━ CSS ━━━
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Figtree:wght@300;400;500;600;700&display=swap');
:root{--bg0:#07070e;--bg1:#0e0e1a;--bg2:#141422;--bg3:#1a1a2e;--b1:#1c1c30;--b2:#252540;--b3:#35355a;--t1:#eef0f6;--t2:#8b8fad;--t3:#4e5175;--ac:#f59e0b;--acs:rgba(245,158,11,.08);--acb:rgba(245,158,11,.25);--dg:#ef4444;--dgs:rgba(239,68,68,.08);--ok:#22c55e;--oks:rgba(34,197,94,.1);--fd:'Outfit',sans-serif;--fb:'Figtree',sans-serif;--r1:6px;--r2:10px;--r3:14px;--tr:.2s cubic-bezier(.4,0,.2,1)}
*{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg0);font-family:var(--fb);color:var(--t1)}
@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes si{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes sp{to{transform:rotate(360deg)}}
@keyframes ti{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes to2{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(20px) scale(.9)}}
.fi{animation:fi .35s ease-out forwards}.si{animation:si .3s ease-out forwards}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:var(--bg0)}::-webkit-scrollbar-thumb{background:var(--b2);border-radius:3px}
input:focus,textarea:focus,select:focus{border-color:var(--ac)!important;box-shadow:0 0 0 3px var(--acs)!important;outline:none}
.card{background:var(--bg2);border:1px solid var(--b1);border-radius:var(--r3);box-shadow:0 1px 3px rgba(0,0,0,.4);transition:border-color var(--tr)}.card:hover{border-color:var(--b2)}
.ba{background:linear-gradient(135deg,#d97706,#f59e0b);color:#000;border:none;border-radius:var(--r2);padding:11px 24px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:var(--fb);transition:all var(--tr);box-shadow:0 2px 12px rgba(245,158,11,.25)}.ba:hover{transform:translateY(-1px);box-shadow:0 0 24px rgba(245,158,11,.12)}.ba:disabled{opacity:.4;cursor:not-allowed;transform:none}
.bg{background:var(--bg2);border:1px solid var(--b2);color:var(--t2);border-radius:var(--r2);padding:11px 18px;font-size:13.5px;font-weight:500;cursor:pointer;font-family:var(--fb);transition:all var(--tr)}.bg:hover{border-color:var(--b3);color:var(--t1);background:var(--bg3)}
.chip{padding:7px 14px;border-radius:20px;font-size:12.5px;cursor:pointer;transition:all .15s;user-select:none;font-family:var(--fb)}.chip-on{background:var(--acs);border:1.5px solid var(--ac);color:var(--ac);font-weight:600}.chip-off{background:var(--bg1);border:1.5px solid var(--b2);color:var(--t3)}.chip:hover{transform:translateY(-1px)}
.fl label{display:block;font-size:11px;font-weight:600;color:var(--t3);margin-bottom:6px;text-transform:uppercase;letter-spacing:.8px;font-family:var(--fb)}
.fl input,.fl textarea,.fl select{width:100%;padding:10px 13px;border:1px solid var(--b2);border-radius:var(--r1);font-size:13.5px;color:var(--t1);font-family:var(--fb);background:var(--bg1);transition:border-color var(--tr),box-shadow var(--tr)}.fl select option{background:var(--bg3)}
.tb{padding:11px 18px;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--t3);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--fb);transition:all var(--tr);white-space:nowrap}.tb:hover{color:var(--t2)}.tb.ac{border-bottom-color:var(--ac);color:var(--ac)}
.nr{background:var(--bg2);border:1px solid var(--b1);border-radius:var(--r2);padding:16px 20px;display:flex;align-items:center;gap:16px;transition:all var(--tr);cursor:pointer}.nr:hover{border-color:var(--acb);box-shadow:0 2px 16px rgba(245,158,11,.06);transform:translateY(-1px)}
.sd{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;transition:all .3s;font-family:var(--fd)}.sd-a{background:var(--ac);color:#000;box-shadow:0 0 0 4px var(--acs)}.sd-d{background:var(--ok);color:#fff}.sd-i{background:var(--bg3);color:var(--t3);border:1px solid var(--b2)}
.si2{background:var(--bg1);border:1px solid var(--b2);border-radius:var(--r2);padding:9px 14px 9px 36px;font-size:13px;color:var(--t1);font-family:var(--fb);width:260px;transition:all var(--tr);outline:none}.si2:focus{border-color:var(--ac);box-shadow:0 0 0 3px var(--acs);width:320px}.si2::placeholder{color:var(--t3)}
.tc{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:flex-end}
.tt{padding:14px 20px;border-radius:var(--r2);font-size:13.5px;font-weight:500;font-family:var(--fb);box-shadow:0 8px 32px rgba(0,0,0,.5);backdrop-filter:blur(12px);animation:ti .3s ease-out forwards;display:flex;align-items:center;gap:10px;max-width:380px}
.tt-x{animation:to2 .25s ease-in forwards}
.tt-s{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);color:var(--ok)}
.tt-e{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#fca5a5}
.tt-i{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);color:var(--ac)}
.db{display:inline-flex;align-items:center;gap:6px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);color:var(--ac);font-size:11px;font-weight:600;padding:4px 10px;border-radius:99px}
.kbd{display:inline-block;background:var(--bg3);border:1px solid var(--b2);border-radius:4px;padding:1px 6px;font-size:10px;font-family:monospace;color:var(--t3);font-weight:600}
@media(max-width:768px){.do{display:none!important}.ms{flex-direction:column!important;gap:12px!important}.mp{padding:14px!important}.gr{grid-template-columns:1fr!important}.g3{grid-template-columns:1fr!important}.sg{grid-template-columns:1fr 1fr!important}.si2{width:100%!important}.si2:focus{width:100%!important}}
`;

// ━━━ TOAST ━━━
let _tid=0;
function Toasts({ts,rm}){return<div className="tc">{ts.map(t=><div key={t.id} className={`tt tt-${t.type} ${t.ex?"tt-x":""}`} onClick={()=>rm(t.id)}><span style={{fontSize:16}}>{t.type==="s"?"✓":t.type==="e"?"✕":"ℹ"}</span><span>{t.msg}</span></div>)}</div>}
function useToast(){
  const[ts,setTs]=useState([]);
  const add=useCallback((msg,type="i",dur=3500)=>{const id=++_tid;setTs(p=>[...p,{id,msg,type,ex:false}]);setTimeout(()=>{setTs(p=>p.map(t=>t.id===id?{...t,ex:true}:t));setTimeout(()=>setTs(p=>p.filter(t=>t.id!==id)),300);},dur);},[]);
  const rm=useCallback(id=>{setTs(p=>p.map(t=>t.id===id?{...t,ex:true}:t));setTimeout(()=>setTs(p=>p.filter(t=>t.id!==id)),300);},[]);
  return{ts,add,rm};
}

// ━━━ UTILS ━━━
function SI({label,field,placeholder,type="text",form,upd,req}){return<div className="fl"><label>{label}{req&&<span style={{color:"var(--dg)",marginLeft:2}}>*</span>}</label><input type={type} value={form[field]||""} onChange={e=>upd(field,e.target.value)} placeholder={placeholder}/></div>}
function CI({s=10}){return<svg width={s} height={s} viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
function Empty({icon,title,sub,action,al}){return<div style={{padding:"48px 24px",textAlign:"center",border:"1px dashed var(--b2)",borderRadius:"var(--r3)"}}><div style={{fontSize:40,marginBottom:14,filter:"grayscale(.3)"}}>{icon}</div><h3 style={{color:"var(--t1)",fontFamily:"var(--fd)",fontWeight:700,fontSize:17,marginBottom:6}}>{title}</h3>{sub&&<p style={{color:"var(--t3)",fontSize:13.5,marginBottom:22,maxWidth:340,margin:"0 auto 22px"}}>{sub}</p>}{action&&<button className="ba" onClick={action}>{al}</button>}</div>}
function SB({v,onChange,ph}){return<div style={{position:"relative",display:"inline-block"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"var(--t3)",pointerEvents:"none"}}>🔍</span><input className="si2" type="text" value={v} onChange={e=>onChange(e.target.value)} placeholder={ph||"Rechercher…"}/>{v&&<button onClick={()=>onChange("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:12,padding:4}}>✕</button>}</div>}

// ━━━ PLAN ━━━
function Plan({plan,setPlan}){
  const[tool,setTool]=useState("wall");const[dr,setDr]=useState(false);const[st,setSt]=useState(null);const[sl,setSl]=useState(false);const[pd,setPd]=useState(null);const[rn,setRn]=useState("");
  const paint=useCallback((r,c)=>{if(r<0||r>=ROWS||c<0||c>=COLS)return;if(tool==="room"){setPd({r,c});setSl(true);return;}setPlan(p=>{const k=ck(r,c);if(p[k]?.type===tool){const{[k]:_,...rest}=p;return rest;}return{...p,[k]:{type:tool}};});},[tool,setPlan]);
  const fill=useCallback((r1,c1,r2,c2)=>{const[a,b]=[Math.min(r1,r2),Math.max(r1,r2)];const[c,d]=[Math.min(c1,c2),Math.max(c1,c2)];setPlan(p=>{const n={...p};for(let r=a;r<=b;r++)for(let cc=c;cc<=d;cc++)n[ck(r,cc)]={type:"wall"};return n;});},[setPlan]);
  const conf=()=>{if(!pd)return;setPlan(p=>({...p,[ck(pd.r,pd.c)]:{type:"room",label:rn||"Local"}}));setRn("");setSl(false);setPd(null);};
  return<div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>{PLAN_TOOLS.map(t=><button key={t.id} onClick={()=>setTool(t.id)} style={{padding:"6px 13px",borderRadius:"var(--r1)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--fb)",border:`1.5px solid ${tool===t.id?t.color:"var(--b2)"}`,background:tool===t.id?`${t.color}18`:"var(--bg1)",color:tool===t.id?t.color:"var(--t3)",transition:"all .15s"}}>{t.label}</button>)}<button onClick={()=>setPlan({})} style={{marginLeft:"auto",padding:"6px 13px",borderRadius:"var(--r1)",fontSize:12,background:"var(--bg1)",border:"1px solid var(--b2)",color:"var(--t3)",cursor:"pointer",fontFamily:"var(--fb)"}}>Effacer</button></div>
    {sl&&<div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}} className="fi"><input autoFocus value={rn} onChange={e=>setRn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&conf()} placeholder="Nom du local" style={{padding:"8px 12px",border:"1.5px solid var(--b2)",borderRadius:"var(--r1)",fontSize:13,width:180,background:"var(--bg1)",color:"var(--t1)",fontFamily:"var(--fb)",outline:"none"}}/><button onClick={conf} className="ba" style={{padding:"8px 16px",fontSize:12}}>OK</button><button onClick={()=>{setSl(false);setPd(null);}} className="bg" style={{padding:"8px 12px",fontSize:12}}>✕</button></div>}
    <div style={{overflowX:"auto",userSelect:"none"}}><div style={{display:"grid",gridTemplateColumns:`repeat(${COLS},${CELL}px)`,border:"1px solid var(--b2)",borderRadius:"var(--r2)",background:"var(--bg1)",width:"fit-content"}} onMouseLeave={()=>{setDr(false);setSt(null);}}>{Array.from({length:ROWS},(_,r)=>Array.from({length:COLS},(_,c)=>{const k=ck(r,c),cell=plan[k];return<div key={k} onMouseDown={()=>{setDr(true);if(tool==="wall")setSt({r,c});else paint(r,c);}} onMouseUp={()=>{if(dr&&tool==="wall"&&st)fill(st.r,st.c,r,c);setDr(false);setSt(null);}} onMouseEnter={()=>{if(dr&&tool!=="wall")paint(r,c);}} style={{width:CELL,height:CELL,boxSizing:"border-box",border:"1px solid var(--bg0)",background:cell?(cell.type==="wall"?gtc("wall"):`${gtc(cell.type)}30`):"transparent",cursor:"crosshair",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,transition:"background .08s"}}>{cell&&cell.type!=="wall"&&<span style={{fontSize:cell.type==="room"?7:11,lineHeight:1}}>{cell.type==="room"?(cell.label?.slice(0,4)||"▪"):PLAN_TOOLS.find(t=>t.id===cell.type)?.icon}</span>}</div>;}))}</div></div>
    <div style={{display:"flex",flexWrap:"wrap",gap:14,marginTop:12}}>{PLAN_TOOLS.map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--t3)"}}><div style={{width:10,height:10,borderRadius:2,background:t.color}}/>{t.label}</div>)}</div>
    <p style={{fontSize:11,color:"var(--t3)",marginTop:6,opacity:.6}}>Clic = placer · Glisser = murs · Re-clic = effacer</p>
  </div>;
}

// ━━━ CHECKLIST ━━━
function CL({checks,setChecks}){
  const tog=id=>setChecks(p=>({...p,[id]:!p[id]}));
  const total=Object.values(CHECKLIST).flat().length;const done=Object.values(checks).filter(Boolean).length;const pct=Math.round(done/total*100);
  const sc=pct===100?"var(--ok)":pct>=75?"#f97316":pct>=40?"var(--ac)":"var(--t3)";
  return<div>
    <div style={{display:"flex",alignItems:"center",gap:18,marginBottom:26,background:"var(--bg1)",borderRadius:"var(--r2)",padding:"18px 22px",border:"1px solid var(--b2)"}}>
      <div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>Progression</span><span style={{fontSize:13,fontWeight:700,color:sc}}>{done}/{total}</span></div><div style={{background:"var(--bg0)",borderRadius:99,height:8,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,var(--ac),${sc})`,borderRadius:99,transition:"width .5s ease"}}/></div></div>
      <div style={{textAlign:"center",minWidth:56}}><div style={{fontSize:28,fontWeight:800,color:sc,lineHeight:1,fontFamily:"var(--fd)"}}>{pct}%</div><div style={{fontSize:10,color:sc,marginTop:3,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{pct===100?"Conforme":pct>=75?"Presque":"En cours"}</div></div>
    </div>
    {Object.entries(CHECKLIST).map(([fr,items])=><div key={fr} style={{marginBottom:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h4 style={{fontSize:11,fontWeight:700,color:"var(--ac)",textTransform:"uppercase",letterSpacing:1.2,margin:0,fontFamily:"var(--fd)"}}>{fr}</h4><span style={{fontSize:11,color:"var(--t3)",background:"var(--bg1)",padding:"2px 10px",borderRadius:99,border:"1px solid var(--b2)"}}>{items.filter(i=>checks[i.id]).length}/{items.length}</span></div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>{items.map(it=><div key={it.id} onClick={()=>tog(it.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:"var(--r1)",cursor:"pointer",background:checks[it.id]?"var(--oks)":"var(--bg1)",border:`1px solid ${checks[it.id]?"rgba(34,197,94,.25)":"var(--b2)"}`,transition:"all var(--tr)"}}><div style={{width:18,height:18,borderRadius:4,flexShrink:0,border:`2px solid ${checks[it.id]?"var(--ok)":"var(--b3)"}`,background:checks[it.id]?"var(--ok)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all var(--tr)"}}>{checks[it.id]&&<CI/>}</div><span style={{fontSize:13,lineHeight:1.4,color:checks[it.id]?"var(--ok)":"var(--t2)",textDecoration:checks[it.id]?"line-through":"none"}}>{it.label}</span></div>)}</div>
    </div>)}
    {pct===100&&<div className="fi" style={{background:"var(--oks)",border:"1px solid rgba(34,197,94,.25)",borderRadius:"var(--r2)",padding:"16px 20px",color:"var(--ok)",fontSize:14,fontWeight:600,textAlign:"center",marginTop:8}}>✓ Vérification complète — À archiver au registre de sécurité</div>}
  </div>;
}

// ━━━ RENDER NOTICE ━━━
function RN({text}){if(!text)return null;return text.split("\n").map((l,i)=>{
  if(l.startsWith("# "))return<h1 key={i} style={{fontSize:19,fontWeight:700,color:"var(--t1)",borderBottom:"2px solid var(--ac)",paddingBottom:10,margin:"30px 0 14px",fontFamily:"var(--fd)"}}>{l.slice(2)}</h1>;
  if(l.startsWith("## "))return<h2 key={i} style={{fontSize:15,fontWeight:700,color:"var(--t1)",margin:"22px 0 8px",fontFamily:"var(--fd)"}}>{l.slice(3)}</h2>;
  if(l.startsWith("### "))return<h3 key={i} style={{fontSize:13,fontWeight:600,color:"var(--ac)",margin:"14px 0 6px"}}>{l.slice(4)}</h3>;
  if(l.startsWith("---"))return<hr key={i} style={{border:"none",borderTop:"1px solid var(--b2)",margin:"18px 0"}}/>;
  if(l.startsWith("- "))return<div key={i} style={{paddingLeft:18,marginBottom:5,color:"var(--t2)",fontSize:13.5,display:"flex",gap:8,alignItems:"flex-start"}}><span style={{color:"var(--ac)",marginTop:2,flexShrink:0}}>▸</span>{l.slice(2)}</div>;
  if(l.trim()==="")return<div key={i} style={{height:7}}/>;
  return<p key={i} style={{marginBottom:7,color:"var(--t2)",fontSize:13.5,lineHeight:1.75}}>{l.replace(/\*\*(.+?)\*\*/g,"$1")}</p>;
});}

// ━━━ PDF EXPORT ━━━
function xPDF(n){const w=window.open("","_blank");if(!w)return;const c=CATEGORIES_ERP[n.typeERP]?.code||"";const d=new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"});
w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Notice — ${n.nom}</title><style>@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Figtree:wght@400;500;600&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Figtree',sans-serif;color:#1e293b;font-size:11pt;line-height:1.7}.cover{background:linear-gradient(145deg,#07070e,#0e0e1a 40%,#1a1520);color:#fff;padding:70px 60px;page-break-after:always}.cover h1{font-family:'Outfit';font-size:30pt;font-weight:700;margin-bottom:8px;line-height:1.2}.cover h2{font-size:13pt;opacity:.6;margin-bottom:12px}.cover-div{width:60px;height:3px;background:linear-gradient(90deg,#d97706,#f59e0b);margin:20px 0 36px;border-radius:2px}.cover-g{display:grid;grid-template-columns:1fr 1fr;gap:14px}.cover-i{background:rgba(255,255,255,.04);border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 6px 6px 0}.cover-i .l{font-size:8pt;opacity:.5;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}.cover-i .v{font-size:11pt;font-weight:600}.ct{padding:50px 60px}h1{font-family:'Outfit';font-size:17pt;color:#0a0a1a;border-bottom:2px solid #f59e0b;padding-bottom:8px;margin:30px 0 14px}h2{font-family:'Outfit';font-size:12pt;margin:20px 0 9px;font-weight:700}h3{font-size:11pt;color:#d97706;margin:14px 0 6px;font-weight:600}p{margin-bottom:8px;color:#374151}li{margin-bottom:5px;color:#374151}ul{margin:8px 0 8px 16px;list-style:none}ul li::before{content:"▸ ";color:#f59e0b}hr{border:none;border-top:1px solid #e2e8f0;margin:18px 0}strong{color:#0f172a}.ft{background:#07070e;color:rgba(255,255,255,.3);display:flex;justify-content:space-between;padding:14px 60px;font-size:8pt}@media print{.cover,.ft{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="cover"><div style="display:flex;align-items:center;gap:12px;margin-bottom:48px;opacity:.9"><div style="width:44px;height:44px;background:linear-gradient(135deg,#d97706,#f59e0b);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">🛡️</div><div style="font-size:15pt;font-weight:700;letter-spacing:2px;font-family:'Outfit'">SAFENOTICE ERP</div></div><div style="display:inline-block;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.35);color:#fbbf24;padding:5px 14px;border-radius:3px;font-size:8pt;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px">Notice de Sécurité — Art. GE2</div><h1>${n.nom}</h1><h2>Type ${c} · Cat. ${n.categorie||"N/A"}</h2><div class="cover-div"></div><div class="cover-g"><div class="cover-i"><div class="l">Adresse</div><div class="v">${n.adresse}, ${n.cp} ${n.ville}</div></div><div class="cover-i"><div class="l">Responsable</div><div class="v">${n.responsable}</div></div><div class="cover-i"><div class="l">Capacité</div><div class="v">${n.capacite} pers.</div></div><div class="cover-i"><div class="l">Édition</div><div class="v">${d}</div></div></div></div><div class="ct">${(n.noticeText||"").replace(/^# (.+)$/gm,"<h1>$1</h1>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/^---$/gm,"<hr>").split("\n").map(l=>{if(l.startsWith("<h")||l.startsWith("<hr"))return l;if(l.startsWith("- "))return"<li>"+l.slice(2)+"</li>";if(l.trim()==="")return"<br>";return"<p>"+l+"</p>";}).join("\n")}</div><div class="ft"><span>SafeNotice ERP</span><span>Registre de sécurité</span><span>${new Date().toLocaleDateString("fr-FR")}</span></div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();}

// ━━━ PROMPT ━━━
function bPrompt(f){const ma=Object.entries(f.moyens).filter(([,v])=>v).map(([k])=>MOYENS[k]).join(", ");const c=CATEGORIES_ERP[f.typeERP]?.code||"";const ar=CATEGORIES_ERP[f.typeERP]?.articles||"";
return`Tu es un expert en sécurité incendie ERP France. Génère une notice conforme art. GE2, arrêté 25 juin 1980 modifié.

CITE les articles réglementaires pour CHAQUE chapitre : GN 1-10, GE 1-8, CO 1-57, AM 1-18, DF 1-10, CH 1-58, GZ 1-30, EL 1-23, EC 1-15, AS 1-11, MS 1-73, ${ar} (type ${c}).

ÉTABLISSEMENT : ${f.nom} | Type ${f.typeERP} (${c}) | Cat. ${f.categorie}
Adresse : ${f.adresse}, ${f.cp} ${f.ville} | Resp. : ${f.responsable} | Tél : ${f.tel} | Email : ${f.email}
Cap. : ${f.capacite} pers. | Niveaux : ${f.niveaux} | Surface : ${f.surface} m²
Locaux : ${f.locaux.join(", ")} | Risques : ${f.risques.join(", ")}
Moyens : ${ma}
Façades : ${f.nbFacadesAccessibles} | Voie : ${f.largeurVoie} m | Résistance : ${f.resistanceFeu}
Matériaux : plafonds ${f.natureMateriauxPlafond}, murs ${f.natureMateriauxMurs}, sol ${f.natureMateriauxSol}
Sorties : ${f.sorties} (${f.largeurSorties} m) | Escaliers : ${f.nbEscaliers} (${f.largeurEscaliers} m)
Chauffage : ${f.chauffageNature} | Cuisine : ${f.cuisinePuissance} kW | Alarme : ${f.typeAlarme}
Visite : ${f.derniereVisite} | Prochaine : ${f.prochaineVisite} | Obs. : ${f.observations||"Aucune"}

# NOTICE DE SÉCURITÉ ERP — ${f.nom}
## Type ${c} — Catégorie ${f.categorie}
---
## CHAPITRE I — CLASSEMENT ET IDENTIFICATION (art. GN 1-10, R.123-2 CCH)
## CHAPITRE II — IMPLANTATION, DESSERTE, ACCESSIBILITÉ (art. CO 1-6)
## CHAPITRE III — CONSTRUCTION, DISTRIBUTION, RÉSISTANCE AU FEU (art. CO 7-28, AM 1-18)
## CHAPITRE IV — DÉGAGEMENTS ET ÉVACUATION (art. CO 34-57)
## CHAPITRE V — DÉSENFUMAGE (art. DF 1-10)
## CHAPITRE VI — CHAUFFAGE, VENTILATION, INSTALLATIONS TECHNIQUES (art. CH 1-58, GZ 1-30)
## CHAPITRE VII — INSTALLATIONS ÉLECTRIQUES, ÉCLAIRAGE DE SÉCURITÉ (art. EL 1-23, EC 1-15)
## CHAPITRE VIII — MOYENS DE SECOURS ET ALARME (art. MS 1-73)
## CHAPITRE IX — OBLIGATIONS EXPLOITANT, REGISTRE DE SÉCURITÉ (art. GE 1-8, R.123-51 CCH)
## CHAPITRE X — ORGANISATION DES SECOURS
## DÉCLARATION DU RESPONSABLE

Contenu détaillé, articles cités, adapté type ${c} cat. ${f.categorie}.`;}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APP PRINCIPALE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function SafeNotice(){
  const[notices,setNotices]=useState([]);const[etabs,setEtabs]=useState([]);const[view,setView]=useState("dashboard");const[step,setStep]=useState(1);const[form,setForm]=useState(EMPTY_FORM);const[loading,setLoading]=useState(false);const[error,setError]=useState(null);const[open,setOpen]=useState(null);const[tab,setTab]=useState("notice");const[plan,setPlan]=useState({});const[chk,setChk]=useState({});const[fEtab,setFEtab]=useState("all");const[fType,setFType]=useState("all");const[sq,setSq]=useState("");const[showNE,setShowNE]=useState(false);const[neN,setNeN]=useState("");const[neV,setNeV]=useState("");const[ready,setReady]=useState(false);const[hasDraft,setHasDraft]=useState(false);const[dirty,setDirty]=useState(false);
  const{ts,add,rm}=useToast();const dtRef=useRef(null);

  // Load
  useEffect(()=>{(async()=>{try{const[n,e,c,d]=await Promise.all([sGet("sn:notices",[]),sGet("sn:etabs",[]),sGet("sn:checks",{}),sGet("sn:draft",null)]);setNotices(n);setEtabs(e);setChk(c);if(d?.typeERP)setHasDraft(true);}catch{}setReady(true);})();},[]);
  // Save
  useEffect(()=>{if(ready)sSet("sn:notices",notices);},[notices,ready]);
  useEffect(()=>{if(ready)sSet("sn:etabs",etabs);},[etabs,ready]);
  useEffect(()=>{if(ready)sSet("sn:checks",chk);},[chk,ready]);
  // Draft autosave
  useEffect(()=>{if(view!=="form"||!dirty)return;if(dtRef.current)clearTimeout(dtRef.current);dtRef.current=setTimeout(()=>sSet("sn:draft",{...form,_step:step,_t:Date.now()}),2000);return()=>{if(dtRef.current)clearTimeout(dtRef.current);};},[form,step,view,dirty]);
  // Keyboard
  useEffect(()=>{const h=e=>{if(["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName))return;if(e.key==="Escape"){if(view==="form"){if(dirty&&!window.confirm("Quitter ? Le brouillon est sauvegardé."))return;setView("dashboard");}else if(view==="detail")setView("notices");}if(e.key==="n"&&(e.ctrlKey||e.metaKey)){e.preventDefault();goNew();}};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[view,dirty]);
  useEffect(()=>{if(view!=="form")return;const h=e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();if(step<4)tryNext();else if(!loading)gen();}};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[view,step,form,loading]);

  const upd=(f,v)=>{setForm(p=>({...p,[f]:v}));setDirty(true);};
  const tog=(f,v)=>{setForm(p=>({...p,[f]:p[f].includes(v)?p[f].filter(x=>x!==v):[...p[f],v]}));setDirty(true);};
  const togM=k=>{setForm(p=>({...p,moyens:{...p.moyens,[k]:!p.moyens[k]}}));setDirty(true);};
  const addEtab=()=>{if(!neN.trim())return;setEtabs(p=>[...p,{id:"e-"+Date.now(),nom:neN.trim(),ville:neV.trim()}]);setNeN("");setNeV("");setShowNE(false);add("Établissement ajouté","s");};
  const gChk=id=>chk[id]||{};
  const sChk=id=>fn=>setChk(p=>({...p,[id]:typeof fn==="function"?fn(p[id]||{}):fn}));
  const tryNext=()=>{const e=VALIDATIONS[step]?.(form);if(e){setError(e);add(e,"e");return;}setError(null);setStep(step+1);};
  const goNew=()=>{setForm(EMPTY_FORM);setStep(1);setError(null);setDirty(false);setView("form");};
  const restDraft=async()=>{try{const d=await sGet("sn:draft",null);if(d){const{_step,_t,...fd}=d;setForm(fd);setStep(_step||1);setView("form");setDirty(true);setHasDraft(false);add("Brouillon restauré","i");}}catch{add("Erreur restauration","e");}};
  const clrDraft=async()=>{try{await sSet("sn:draft",null);}catch{}setHasDraft(false);};

  const gen=async(r=0)=>{setLoading(true);setError(null);try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:bPrompt(form)}]})});const data=await res.json();if(data.error)throw new Error(data.error.message);const txt=data.content?.map(i=>i.text||"").join("\n")||"";const nn={...form,id:Date.now().toString(),noticeText:txt,savedAt:new Date().toLocaleDateString("fr-FR"),planData:{}};setNotices(p=>[nn,...p]);setOpen(nn);setPlan({});setTab("notice");setView("detail");setDirty(false);sSet("sn:draft",null);setHasDraft(false);add("Notice générée !","s");}catch(e){if(r<2){add(`Tentative ${r+2}/3…`,"i");setTimeout(()=>gen(r+1),1500);return;}setError(`Erreur : ${e.message||"Inconnue"}`);add("Échec génération","e");}finally{if(r>=2||r===0)setLoading(false);}};

  const del=id=>{setNotices(p=>p.filter(n=>n.id!==id));if(open?.id===id)setView("dashboard");add("Notice supprimée","i");};
  const savePlan=()=>{setNotices(p=>p.map(n=>n.id===open.id?{...n,planData:plan}:n));setOpen(p=>({...p,planData:plan}));add("Plan sauvegardé","s");};

  const fNotices=useMemo(()=>{let l=notices;if(fEtab!=="all")l=l.filter(n=>n.etablissementId===fEtab);if(fType!=="all")l=l.filter(n=>n.typeERP===fType);if(sq.trim()){const q=sq.toLowerCase();l=l.filter(n=>(n.nom||"").toLowerCase().includes(q)||(n.ville||"").toLowerCase().includes(q)||(n.responsable||"").toLowerCase().includes(q)||(n.cp||"").includes(q)||(n.typeERP||"").toLowerCase().includes(q));}return l;},[notices,fEtab,fType,sq]);
  const stats=useMemo(()=>({total:notices.length,month:notices.filter(n=>{if(!n.savedAt)return false;const[,m,y]=n.savedAt.split("/");const now=new Date();return parseInt(m)===now.getMonth()+1&&parseInt(y)===now.getFullYear();}).length,byType:Object.entries(CATEGORIES_ERP).map(([label,{code,icon}])=>({code,icon,label:label.split("—")[0].trim(),count:notices.filter(n=>n.typeERP===label).length,full:label})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count),etabs:etabs.length}),[notices,etabs]);

  if(!ready)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"var(--bg0)"}}><style>{CSS}</style><div style={{textAlign:"center"}}><div style={{width:24,height:24,border:"3px solid var(--b2)",borderTop:"3px solid var(--ac)",borderRadius:"50%",animation:"sp .8s linear infinite",margin:"0 auto 16px"}}/><div style={{color:"var(--t3)",fontSize:13}}>Chargement…</div></div></div>;

  const navI=[{id:"dashboard",icon:"◻",label:"Dashboard"},{id:"notices",icon:"📋",label:"Mes notices"}];
  function Side(){return<div style={{width:230,background:"var(--bg1)",borderRight:"1px solid var(--b1)",display:"flex",flexDirection:"column",minHeight:"100vh",position:"sticky",top:0,zIndex:10}} className="do">
    <div style={{padding:"26px 20px 22px",borderBottom:"1px solid var(--b1)"}}><div style={{display:"flex",alignItems:"center",gap:11}}><div style={{width:38,height:38,background:"linear-gradient(135deg,#d97706,#f59e0b)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 20px rgba(245,158,11,.2)"}}>🛡️</div><div><div style={{fontWeight:700,fontSize:15,color:"var(--t1)",fontFamily:"var(--fd)"}}>SafeNotice</div><div style={{fontSize:10,color:"var(--t3)",fontWeight:500}}>Sécurité ERP</div></div></div></div>
    <nav style={{padding:"16px 12px",flex:1}}>
      <button onClick={goNew} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:"var(--r2)",border:"none",cursor:"pointer",marginBottom:12,background:"linear-gradient(135deg,#d97706,#f59e0b)",color:"#000",fontFamily:"var(--fb)",fontSize:13.5,fontWeight:600,boxShadow:"0 2px 12px rgba(245,158,11,.2)",textAlign:"left"}}><span>✚</span> Nouvelle notice</button>
      {navI.map(it=><button key={it.id} onClick={()=>setView(it.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:"var(--r1)",border:"none",cursor:"pointer",marginBottom:3,background:view===it.id?"var(--bg3)":"transparent",color:view===it.id?"var(--t1)":"var(--t3)",fontFamily:"var(--fb)",fontSize:13.5,fontWeight:view===it.id?600:400,transition:"all var(--tr)",textAlign:"left"}}><span style={{fontSize:14,opacity:view===it.id?1:.6}}>{it.icon}</span>{it.label}</button>)}
      <div style={{margin:"14px 14px 6px",fontSize:10,color:"var(--t3)",opacity:.5}}><span className="kbd">Ctrl</span>+<span className="kbd">N</span> Nouvelle · <span className="kbd">Esc</span> Retour</div>
    </nav>
    <div style={{padding:"16px 12px",borderTop:"1px solid var(--b1)"}}>
      <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1.2,marginBottom:10,fontFamily:"var(--fd)"}}>Établissements</div>
      {etabs.length===0&&!showNE&&<div style={{fontSize:11.5,color:"var(--t3)",padding:"4px 0 8px",opacity:.7}}>Aucun</div>}
      {etabs.map(e=><div key={e.id} onClick={()=>{setFEtab(e.id);setView("notices");}} style={{padding:"7px 10px",borderRadius:"var(--r1)",cursor:"pointer",background:fEtab===e.id?"var(--bg3)":"transparent",marginBottom:2}}><div style={{fontSize:12.5,color:fEtab===e.id?"var(--t1)":"var(--t3)",fontWeight:fEtab===e.id?600:400}}>{e.nom}</div>{e.ville&&<div style={{fontSize:10,color:"var(--t3)",opacity:.6}}>{e.ville}</div>}</div>)}
      {showNE?<div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}} className="fi"><input autoFocus value={neN} onChange={e=>setNeN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEtab()} placeholder="Nom" style={{padding:"7px 10px",borderRadius:"var(--r1)",border:"1px solid var(--b2)",background:"var(--bg1)",color:"var(--t1)",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/><input value={neV} onChange={e=>setNeV(e.target.value)} placeholder="Ville (opt.)" style={{padding:"7px 10px",borderRadius:"var(--r1)",border:"1px solid var(--b2)",background:"var(--bg1)",color:"var(--t1)",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/><div style={{display:"flex",gap:6}}><button onClick={addEtab} style={{flex:1,padding:6,background:"var(--ac)",color:"#000",border:"none",borderRadius:"var(--r1)",fontSize:12,cursor:"pointer",fontWeight:600}}>Ajouter</button><button onClick={()=>setShowNE(false)} style={{padding:"6px 8px",background:"var(--bg3)",border:"none",borderRadius:"var(--r1)",fontSize:12,cursor:"pointer",color:"var(--t3)"}}>✕</button></div></div>:<button onClick={()=>setShowNE(true)} style={{width:"100%",padding:"7px 10px",borderRadius:"var(--r1)",border:"1px dashed var(--b2)",background:"transparent",color:"var(--t3)",fontSize:12,cursor:"pointer",marginTop:6,fontFamily:"var(--fb)"}}>+ Ajouter</button>}
    </div>
  </div>}

  function MH({title,back}){return<div style={{background:"var(--bg1)",borderBottom:"1px solid var(--b1)",padding:"12px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:100}}>{back&&<button onClick={back} style={{background:"transparent",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:16,padding:0}}>←</button>}<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,background:"linear-gradient(135deg,#d97706,#f59e0b)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🛡️</div><span style={{fontWeight:700,color:"var(--t1)",fontSize:14,fontFamily:"var(--fd)"}}>{title||"SafeNotice"}</span></div><button onClick={goNew} style={{marginLeft:"auto",padding:"7px 14px",background:"linear-gradient(135deg,#d97706,#f59e0b)",color:"#000",border:"none",borderRadius:"var(--r1)",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Notice</button></div>}

  function L({children,title,back}){return<div style={{display:"flex",minHeight:"100vh",background:"var(--bg0)"}}><style>{CSS}</style><Side/><div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}><div style={{display:"none"}} className="mhw"><MH title={title} back={back}/></div><style>{`@media(max-width:768px){.mhw{display:block!important}}`}</style><div style={{flex:1,padding:"30px 36px",maxWidth:1100,width:"100%"}} className="mp">{children}</div></div><Toasts ts={ts} rm={rm}/></div>}

  // ═══ DASHBOARD ═══
  if(view==="dashboard")return<L title="Dashboard"><div className="fi">
    <div style={{marginBottom:32}}><h1 style={{fontSize:28,fontWeight:800,color:"var(--t1)",margin:"0 0 6px",fontFamily:"var(--fd)"}}>Dashboard</h1><p style={{color:"var(--t3)",fontSize:14,margin:0}}>Vue d'ensemble de vos notices ERP</p></div>
    {hasDraft&&<div className="fi" style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.15)",borderRadius:"var(--r2)",marginBottom:20}}><span className="db">⏳ Brouillon</span><span style={{color:"var(--t2)",fontSize:13,flex:1}}>Formulaire en cours non terminé.</span><button onClick={restDraft} className="ba" style={{padding:"7px 16px",fontSize:12}}>Reprendre</button><button onClick={clrDraft} className="bg" style={{padding:"7px 12px",fontSize:12}}>Supprimer</button></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:30}} className="sg">{[{l:"Notices",v:stats.total,i:"📋",c:"var(--ac)"},{l:"Ce mois",v:stats.month,i:"📅",c:"#fb923c"},{l:"Établissements",v:stats.etabs,i:"🏢",c:"#22d3ee"},{l:"Types ERP",v:stats.byType.length,i:"🏷️",c:"#c084fc"}].map((s,i)=><div key={i} className="card" style={{padding:"20px 22px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>{s.l}</div><div style={{fontSize:32,fontWeight:800,color:s.c,lineHeight:1,fontFamily:"var(--fd)"}}>{s.v}</div></div><div style={{fontSize:22,opacity:.5}}>{s.i}</div></div></div>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}} className="gr">
      <div className="card" style={{padding:22}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><h3 style={{margin:0,fontSize:14,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Dernières notices</h3><button onClick={()=>setView("notices")} style={{background:"transparent",border:"none",color:"var(--ac)",fontSize:12,cursor:"pointer",fontWeight:600}}>Voir tout →</button></div>{notices.length===0?<div style={{textAlign:"center",padding:"30px 0",color:"var(--t3)",fontSize:13}}><div style={{fontSize:28,marginBottom:10,opacity:.5}}>🛡️</div>Aucune notice</div>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{notices.slice(0,4).map(n=>{const info=CATEGORIES_ERP[n.typeERP]||{};return<div key={n.id} onClick={()=>{setOpen(n);setPlan(n.planData||{});setTab("notice");setView("detail");}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:"var(--r1)",border:"1px solid var(--b1)",background:"var(--bg1)",cursor:"pointer",transition:"all var(--tr)"}}><div style={{width:36,height:36,background:"var(--acs)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{info.icon||"🏢"}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"var(--t1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.nom}</div><div style={{fontSize:11,color:"var(--t3)"}}>{n.typeERP?.split("—")[0]?.trim()} · {n.ville}</div></div><div style={{fontSize:10,color:"var(--t3)",flexShrink:0}}>{n.savedAt}</div></div>;})}</div>}</div>
      <div className="card" style={{padding:22}}><h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Répartition par type</h3>{stats.byType.length===0?<div style={{textAlign:"center",padding:"30px 0",color:"var(--t3)",fontSize:13}}><div style={{fontSize:28,marginBottom:10,opacity:.5}}>📊</div>Aucune donnée</div>:<div style={{display:"flex",flexDirection:"column",gap:12}}>{stats.byType.map((t,i)=>{const p=Math.round(t.count/stats.total*100);return<div key={i} style={{cursor:"pointer"}} onClick={()=>{setFType(t.full);setView("notices");}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12.5,color:"var(--t2)"}}>{t.icon} {t.label}</span><span style={{fontSize:12,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>{t.count}</span></div><div style={{background:"var(--bg0)",borderRadius:99,height:5,overflow:"hidden"}}><div style={{width:`${p}%`,height:"100%",background:"linear-gradient(90deg,#d97706,var(--ac))",borderRadius:99,transition:"width .5s"}}/></div></div>;})}</div>}</div>
    </div>
    {notices.length===0&&<div style={{marginTop:28}}><Empty icon="🛡️" title="Créez votre première notice" sub="Générez une notice ERP complète et conforme en quelques minutes" action={goNew} al="+ Créer ma première notice"/></div>}
  </div></L>;

  // ═══ NOTICES ═══
  if(view==="notices"){const af=(fEtab!=="all"?1:0)+(fType!=="all"?1:0);return<L title="Notices"><div className="fi">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}} className="ms"><div><h1 style={{fontSize:24,fontWeight:800,color:"var(--t1)",margin:"0 0 4px",fontFamily:"var(--fd)"}}>{fEtab!=="all"?etabs.find(e=>e.id===fEtab)?.nom||"Notices":"Toutes les notices"}</h1><p style={{color:"var(--t3)",fontSize:13,margin:0}}>{fNotices.length} notice{fNotices.length!==1?"s":""}{sq?` pour "${sq}"`:""}</p></div><button className="ba" onClick={goNew}>+ Nouvelle notice</button></div>
    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}><SB v={sq} onChange={setSq} ph="Rechercher nom, ville, type…"/><select value={fType} onChange={e=>setFType(e.target.value)} style={{padding:"9px 13px",borderRadius:"var(--r2)",border:"1px solid var(--b2)",background:"var(--bg1)",color:fType!=="all"?"var(--ac)":"var(--t3)",fontSize:12.5,fontFamily:"var(--fb)",cursor:"pointer",outline:"none"}}><option value="all">Tous les types</option>{Object.entries(CATEGORIES_ERP).map(([l,{icon,code}])=><option key={l} value={l}>{icon} Type {code}</option>)}</select>{af>0&&<button onClick={()=>{setFEtab("all");setFType("all");setSq("");}} className="bg" style={{fontSize:12,padding:"8px 14px"}}>✕ Filtres ({af})</button>}</div>
    {fNotices.length===0?<Empty icon="🔍" title="Aucun résultat" sub={sq?`Aucune notice pour "${sq}"`:"Aucune notice avec ces filtres"} action={sq||af?()=>{setSq("");setFEtab("all");setFType("all");}:goNew} al={sq||af?"Réinitialiser":"Créer une notice"}/>:<div style={{display:"flex",flexDirection:"column",gap:10}}>{fNotices.map(n=>{const info=CATEGORIES_ERP[n.typeERP]||{};const et=etabs.find(e=>e.id===n.etablissementId);return<div key={n.id} className="nr" onClick={()=>{setOpen(n);setPlan(n.planData||{});setTab("notice");setView("detail");}}><div style={{width:44,height:44,background:"var(--acs)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{info.icon||"🏢"}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:600,color:"var(--t1)",marginBottom:2}}>{n.nom}</div><div style={{fontSize:12,color:"var(--t3)"}}>{n.typeERP?.split("—")[0]?.trim()} · Cat. {n.categorie} · {n.cp} {n.ville}{et?` · ${et.nom}`:""}</div></div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}><div style={{fontSize:11,color:"var(--t3)"}}>  {n.savedAt}</div><div style={{display:"flex",gap:6}}><button onClick={e=>{e.stopPropagation();xPDF(n);}} className="bg" style={{padding:"4px 10px",fontSize:11}}>PDF</button><button onClick={e=>{e.stopPropagation();if(window.confirm("Supprimer ?"))del(n.id);}} className="bg" style={{padding:"4px 10px",fontSize:11,color:"var(--dg)"}}>✕</button></div></div></div>;})}</div>}
  </div></L>;}

  // ═══ FORMULAIRE ═══
  if(view==="form"){const steps=["Type ERP","Identification","Construction","Sécurité"];const locs=LOCAUX_PAR_TYPE[form.typeERP]||[];const risqs=RISQUES_PAR_TYPE[form.typeERP]||[];
  return<L title="Nouvelle notice" back={()=>{if(dirty&&!window.confirm("Quitter ?\nBrouillon sauvegardé."))return;setView("dashboard");}}><div className="fi">
    <div style={{display:"flex",alignItems:"center",marginBottom:30}}>{steps.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",flex:i<steps.length-1?1:"auto"}}><div style={{display:"flex",alignItems:"center",gap:8,cursor:i+1<step?"pointer":"default"}} onClick={()=>{if(i+1<step)setStep(i+1);}}><div className={`sd ${i+1===step?"sd-a":i+1<step?"sd-d":"sd-i"}`}>{i+1<step?"✓":i+1}</div><span style={{fontSize:12.5,color:i+1===step?"var(--ac)":i+1<step?"var(--ok)":"var(--t3)",fontWeight:i+1===step?700:400,whiteSpace:"nowrap"}} className="do">{s}</span></div>{i<steps.length-1&&<div style={{flex:1,height:1,background:i+1<step?"rgba(34,197,94,.2)":"var(--b1)",margin:"0 14px"}}/>}</div>)}{dirty&&<span className="db" style={{marginLeft:12}}>Auto-save</span>}</div>
    <div className="card" style={{padding:0,overflow:"hidden"}}><div style={{padding:"16px 24px",borderBottom:"1px solid var(--b1)",background:"var(--bg1)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:15,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Étape {step} — {steps[step-1]}</h2><span style={{fontSize:11,color:"var(--t3)"}}><span className="kbd">Ctrl</span>+<span className="kbd">↵</span> Suivant</span></div><div style={{padding:26}}>

      {step===1&&<div className="si"><p style={{color:"var(--t3)",fontSize:13.5,marginBottom:20}}>Sélectionnez le type d'ERP.</p><div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:22}} className="gr">{Object.entries(CATEGORIES_ERP).map(([l,{icon,desc}])=><div key={l} onClick={()=>upd("typeERP",l)} style={{padding:"14px 16px",borderRadius:"var(--r2)",cursor:"pointer",border:`1.5px solid ${form.typeERP===l?"var(--ac)":"var(--b2)"}`,background:form.typeERP===l?"var(--acs)":"var(--bg1)",transition:"all var(--tr)"}}><div style={{fontSize:24,marginBottom:8}}>{icon}</div><div style={{fontSize:13,fontWeight:600,color:form.typeERP===l?"var(--ac)":"var(--t1)",marginBottom:3}}>{l.split("—")[0].trim()}</div><div style={{fontSize:11,color:"var(--t3)",lineHeight:1.4}}>{desc}</div></div>)}</div>{etabs.length>0&&<div className="fl" style={{marginBottom:20}}><label>Rattacher à un établissement</label><select value={form.etablissementId} onChange={e=>upd("etablissementId",e.target.value)}><option value="">— Aucun —</option>{etabs.map(e=><option key={e.id} value={e.id}>{e.nom}{e.ville?` (${e.ville})`:""}</option>)}</select></div>}{error&&<div className="fi" style={{background:"var(--dgs)",border:"1px solid rgba(239,68,68,.25)",borderRadius:"var(--r1)",padding:"11px 15px",marginBottom:14,color:"#fca5a5",fontSize:13}}>{error}</div>}<div style={{display:"flex",justifyContent:"flex-end"}}><button className="ba" onClick={tryNext} disabled={!form.typeERP}>Suivant →</button></div></div>}

      {step===2&&<div className="si"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="gr"><SI label="Nom de l'établissement" field="nom" placeholder="Ex : Restaurant Le Moulin" form={form} upd={upd} req/><SI label="Responsable / Exploitant" field="responsable" placeholder="Nom et prénom" form={form} upd={upd} req/><SI label="Adresse" field="adresse" placeholder="N° et rue" form={form} upd={upd} req/><div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}><SI label="Code postal" field="cp" placeholder="75001" form={form} upd={upd}/><SI label="Ville" field="ville" placeholder="Paris" form={form} upd={upd} req/></div><SI label="Téléphone" field="tel" type="tel" placeholder="01 23 45 67 89" form={form} upd={upd}/><SI label="Email" field="email" type="email" placeholder="contact@erp.fr" form={form} upd={upd}/><div className="fl"><label>Catégorie ERP <span style={{color:"var(--dg)"}}>*</span></label><select value={form.categorie} onChange={e=>upd("categorie",e.target.value)}><option value="">Choisir</option><option value="1">1re (&gt;1500 pers.)</option><option value="2">2e (701-1500)</option><option value="3">3e (301-700)</option><option value="4">4e (≤300)</option><option value="5">5e (petit ERP)</option></select></div><SI label="Capacité max" field="capacite" placeholder="Ex : 120" form={form} upd={upd}/><SI label="Surface (m²)" field="surface" placeholder="Ex : 350" form={form} upd={upd}/><SI label="Niveaux" field="niveaux" placeholder="Ex : 2" form={form} upd={upd}/></div>{error&&<div className="fi" style={{background:"var(--dgs)",border:"1px solid rgba(239,68,68,.25)",borderRadius:"var(--r1)",padding:"11px 15px",marginBottom:14,color:"#fca5a5",fontSize:13}}>{error}</div>}<div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="bg" onClick={()=>{setError(null);setStep(1);}}>← Retour</button><button className="ba" onClick={tryNext}>Suivant →</button></div></div>}

      {step===3&&<div className="si">
        {locs.length>0&&<div style={{marginBottom:22}}><div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>Locaux <span style={{color:"var(--dg)"}}>*</span></div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{locs.map(l=><div key={l} onClick={()=>tog("locaux",l)} className={`chip ${form.locaux.includes(l)?"chip-on":"chip-off"}`}>{l}</div>)}</div></div>}
        {risqs.length>0&&<div style={{marginBottom:22}}><div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>Risques <span style={{color:"var(--dg)"}}>*</span></div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{risqs.map(r=><div key={r} onClick={()=>tog("risques",r)} className={`chip ${form.risques.includes(r)?"chip-on":"chip-off"}`}>{r}</div>)}</div></div>}
        <div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>Implantation & desserte</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:18}} className="g3"><SI label="Façades accessibles" field="nbFacadesAccessibles" placeholder="Ex : 2" form={form} upd={upd}/><SI label="Largeur voie (m)" field="largeurVoie" placeholder="Ex : 6" form={form} upd={upd}/><SI label="Résistance au feu" field="resistanceFeu" placeholder="Ex : REI 60" form={form} upd={upd}/></div>
        <div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>Matériaux</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:18}} className="g3"><SI label="Plafonds" field="natureMateriauxPlafond" placeholder="Ex : Plâtre BA13" form={form} upd={upd}/><SI label="Murs" field="natureMateriauxMurs" placeholder="Ex : Maçonnerie" form={form} upd={upd}/><SI label="Sol" field="natureMateriauxSol" placeholder="Ex : Carrelage" form={form} upd={upd}/></div>
        <div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>Dégagements & évacuation</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:14}} className="gr"><SI label="Nb sorties" field="sorties" placeholder="Ex : 3" form={form} upd={upd}/><SI label="Larg. sorties (m)" field="largeurSorties" placeholder="Ex : 1.40" form={form} upd={upd}/><SI label="Nb escaliers" field="nbEscaliers" placeholder="Ex : 1" form={form} upd={upd}/><SI label="Larg. escaliers (m)" field="largeurEscaliers" placeholder="Ex : 1.40" form={form} upd={upd}/></div>
        {error&&<div className="fi" style={{background:"var(--dgs)",border:"1px solid rgba(239,68,68,.25)",borderRadius:"var(--r1)",padding:"11px 15px",marginBottom:14,color:"#fca5a5",fontSize:13}}>{error}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="bg" onClick={()=>{setError(null);setStep(2);}}>← Retour</button><button className="ba" onClick={tryNext}>Suivant →</button></div>
      </div>}

      {step===4&&<div className="si">
        <div style={{marginBottom:22}}><div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:12,fontFamily:"var(--fd)"}}>Moyens de secours</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}} className="gr">{Object.entries(MOYENS).map(([k,label])=><div key={k} onClick={()=>togM(k)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:"var(--r1)",cursor:"pointer",background:form.moyens[k]?"var(--acs)":"var(--bg1)",border:`1px solid ${form.moyens[k]?"var(--acb)":"var(--b2)"}`,transition:"all var(--tr)"}}><div style={{width:18,height:18,borderRadius:4,border:`2px solid ${form.moyens[k]?"var(--ac)":"var(--b3)"}`,background:form.moyens[k]?"var(--ac)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all var(--tr)"}}>{form.moyens[k]&&<CI/>}</div><span style={{fontSize:12,color:form.moyens[k]?"var(--ac)":"var(--t3)",fontWeight:form.moyens[k]?600:400,lineHeight:1.35}}>{label}</span></div>)}</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="gr"><div className="fl"><label>Type d'alarme</label><select value={form.typeAlarme} onChange={e=>upd("typeAlarme",e.target.value)}><option value="">Choisir</option><option>Type 1 (SSI cat. A)</option><option>Type 2a (centralisé)</option><option>Type 2b (simplifié)</option><option>Type 3 (diffusion)</option><option>Type 4 (autonome)</option></select></div><SI label="Chauffage" field="chauffageNature" placeholder="Ex : Gaz, PAC" form={form} upd={upd}/><SI label="Cuisine (kW)" field="cuisinePuissance" placeholder="Ex : 45" form={form} upd={upd}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="gr"><SI label="Dernière visite" field="derniereVisite" type="date" form={form} upd={upd}/><SI label="Prochaine visite" field="prochaineVisite" type="date" form={form} upd={upd}/></div>
        <div className="fl" style={{marginBottom:20}}><label>Observations</label><textarea value={form.observations} onChange={e=>upd("observations",e.target.value)} rows={3} placeholder="Travaux, dérogations…" style={{resize:"vertical"}}/></div>
        {error&&<div className="fi" style={{background:"var(--dgs)",border:"1px solid rgba(239,68,68,.25)",borderRadius:"var(--r1)",padding:"11px 15px",marginBottom:18,color:"#fca5a5",fontSize:13}}>{error}</div>}
        <div style={{display:"flex",gap:10}}><button className="bg" onClick={()=>{setError(null);setStep(3);}}>← Retour</button><button className="ba" onClick={()=>gen(0)} disabled={loading} style={{display:"flex",alignItems:"center",gap:10,opacity:loading?.7:1,cursor:loading?"not-allowed":"pointer"}}>{loading?<><div style={{width:15,height:15,border:"2px solid rgba(0,0,0,.2)",borderTop:"2px solid #000",borderRadius:"50%",animation:"sp .8s linear infinite"}}/>Génération…</>:"Générer la notice →"}</button></div>
      </div>}
    </div></div>
  </div></L>;}

  // ═══ DÉTAIL ═══
  if(view==="detail"&&open){const info=CATEGORIES_ERP[open.typeERP]||{};return<L title={open.nom} back={()=>setView("notices")}><div className="fi">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}} className="ms"><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:50,height:50,background:"var(--acs)",borderRadius:"var(--r2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{info.icon||"🏢"}</div><div><h1 style={{margin:0,fontSize:21,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>{open.nom}</h1><div style={{fontSize:12.5,color:"var(--t3)",marginTop:3}}>{open.typeERP?.split("—")[0]?.trim()} · Cat. {open.categorie} · {open.cp} {open.ville}</div></div></div><div style={{display:"flex",gap:8}}><button onClick={()=>xPDF(open)} className="bg" style={{fontSize:13}}>🖨️ PDF</button><button onClick={()=>{if(window.confirm("Supprimer ?"))del(open.id);}} style={{padding:"10px 16px",background:"var(--dgs)",border:"1px solid rgba(239,68,68,.2)",color:"var(--dg)",borderRadius:"var(--r1)",fontSize:13,cursor:"pointer",fontFamily:"var(--fb)",fontWeight:600}}>✕ Supprimer</button></div></div>
    <div style={{borderBottom:"1px solid var(--b1)",marginBottom:24,display:"flex",overflowX:"auto"}}>{["notice","plan","checklist"].map(t=><button key={t} onClick={()=>setTab(t)} className={`tb ${tab===t?"ac":""}`}>{t==="notice"?"📄 Notice":t==="plan"?"🗺️ Plan":"✅ Checklist"}</button>)}</div>
    {tab==="notice"&&<div className="card" style={{padding:28}}>{open.noticeText?<RN text={open.noticeText}/>:<p style={{color:"var(--t3)",fontStyle:"italic"}}>Aucun contenu.</p>}</div>}
    {tab==="plan"&&<div className="card" style={{padding:24}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><h3 style={{margin:0,fontSize:14,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Plan d'évacuation</h3><button onClick={savePlan} className="ba" style={{fontSize:12,padding:"8px 16px"}}>💾 Sauvegarder</button></div><Plan plan={plan} setPlan={setPlan}/></div>}
    {tab==="checklist"&&<div className="card" style={{padding:24}}><h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Checklist maintenance</h3><CL checks={gChk(open.id)} setChecks={sChk(open.id)}/></div>}
  </div></L>;}
  return null;
}
