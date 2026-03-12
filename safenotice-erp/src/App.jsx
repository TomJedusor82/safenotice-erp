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
  3: f => { if(!f.locaux.length) return "Sélectionnez au moins un local."; return null; },
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

// ━━━ PERSISTENT STORAGE (localStorage fallback) ━━━
async function sGet(k,fb){
  try{
    if(window.storage){const r=await window.storage.get(k);return r?JSON.parse(r.value):fb;}
    const v=localStorage.getItem(k);return v?JSON.parse(v):fb;
  }catch{return fb;}
}
async function sSet(k,v){
  try{
    if(window.storage){await window.storage.set(k,JSON.stringify(v));return;}
    localStorage.setItem(k,JSON.stringify(v));
  }catch(e){console.error("storage:",e);}
}

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
@keyframes stepPop{0%{transform:scale(.8);opacity:0}100%{transform:scale(1);opacity:1}}
.sb-col{width:62px!important}.sb-col .sb-h{display:none!important}.sb-col .sb-m{justify-content:center!important;padding:10px 8px!important;font-size:0!important}.sb-col .sb-m span{font-size:16px!important;margin:0!important}
.tip{position:relative;display:inline-flex;align-items:center;gap:4px}
.tip .tip-i{width:15px;height:15px;border-radius:50%;background:var(--b2);color:var(--t3);font-size:9px;display:inline-flex;align-items:center;justify-content:center;cursor:help;font-weight:700;flex-shrink:0}
.tip .tip-b{display:none;position:absolute;left:calc(100% + 8px);top:50%;transform:translateY(-50%);background:var(--bg3);border:1px solid var(--b2);border-radius:var(--r1);padding:8px 12px;font-size:11px;color:var(--t2);width:220px;z-index:50;line-height:1.5;box-shadow:0 4px 16px rgba(0,0,0,.4)}
.tip:hover .tip-b{display:block}
.gs{display:flex;align-items:center;gap:12px;font-size:13px;animation:stepPop .3s ease-out forwards}
.gs-d{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
.gs-a{background:var(--ac);color:#000;box-shadow:0 0 0 4px var(--acs)}
.gs-ok{background:var(--ok);color:#fff}
.gs-w{background:var(--bg3);color:var(--t3)}
.gs-sp{width:24px;height:24px;border:2.5px solid var(--b2);border-top:2.5px solid var(--ac);border-radius:50%;animation:sp .8s linear infinite}
.ob-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:32px}
.ob-s{padding:24px 16px;border-radius:var(--r3);border:1px solid var(--b1);background:var(--bg2);transition:all var(--tr);text-align:center}
.ob-s:hover{border-color:var(--acb);transform:translateY(-2px)}
.ob-n{width:32px;height:32px;border-radius:50%;background:var(--acs);color:var(--ac);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-family:var(--fd)}
@media(max-width:768px){.do{display:none!important}.ms{flex-direction:column!important;gap:12px!important}.mp{padding:14px!important}.gr{grid-template-columns:1fr!important}.g3{grid-template-columns:1fr!important}.sg{grid-template-columns:1fr 1fr!important}.si2{width:100%!important}.si2:focus{width:100%!important}.ob-steps{grid-template-columns:1fr!important}}
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
function SI({label,field,placeholder,type="text",form,upd,req,tip}){return<div className="fl"><label>{label}{req&&<span style={{color:"var(--dg)",marginLeft:2}}>*</span>}{tip&&<span className="tip" style={{marginLeft:4}}><span className="tip-i">?</span><span className="tip-b">{tip}</span></span>}</label><input type={type} value={form[field]||""} onChange={e=>upd(field,e.target.value)} placeholder={placeholder}/></div>}
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
const moyList=Object.entries(n.moyens||{}).filter(([,v])=>v).map(([k])=>MOYENS[k]||k);
const moyRows=moyList.map((m,i)=>`<tr><td>${i+1}</td><td>${m}</td><td>Conforme</td></tr>`).join("");
// Extract chapter titles for TOC
const chapters=[];
const bodyHtml=(n.noticeText||"").split("\n").map((l,i)=>{
if(l.startsWith("## ")){const t=l.slice(3);const id="ch-"+i;chapters.push({id,title:t});return'<h2 id="'+id+'">'+t+'</h2>';}
if(l.startsWith("# "))return"<h1>"+l.slice(2)+"</h1>";
if(l.startsWith("### "))return"<h3>"+l.slice(4)+"</h3>";
if(l.startsWith("---"))return"<hr>";
if(l.startsWith("- "))return'<li>'+l.slice(2)+'</li>';
if(l.trim()==="")return"<br>";
return"<p>"+l.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")+"</p>";
}).join("\n");
const tocHtml=chapters.map((ch,i)=>'<div class="toc-row"><a href="#'+ch.id+'">'+(i+1)+". "+ch.title+'</a><span class="toc-dots"></span></div>').join("");
w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Notice ERP — ${n.nom}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Figtree:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Figtree',sans-serif;color:#1e293b;font-size:10.5pt;line-height:1.75;background:#fff}
@page{margin:20mm 18mm 22mm 18mm;@bottom-center{content:counter(page)" / "counter(pages);font-size:8pt;color:#94a3b8}}

/* COVER */
.cover{padding:60px 50px;border-bottom:3px solid #d97706;page-break-after:always;position:relative}
.cover-logo{display:flex;align-items:center;gap:14px;margin-bottom:50px}
.cover-logo-icon{width:48px;height:48px;background:#d97706;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;font-weight:700}
.cover-logo-text{font-family:'Outfit',sans-serif;font-size:16pt;font-weight:700;letter-spacing:2px;color:#1e293b}
.cover-logo-sub{font-size:9pt;color:#64748b;letter-spacing:1px}
.cover-badge{display:inline-block;border:2px solid #d97706;color:#92400e;padding:5px 16px;border-radius:4px;font-size:8pt;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:24px}
.cover h1{font-family:'Outfit',sans-serif;font-size:28pt;font-weight:800;color:#0f172a;margin-bottom:6px;line-height:1.15}
.cover h2{font-size:12pt;font-weight:400;color:#64748b;margin-bottom:8px}
.cover-line{width:60px;height:3px;background:#d97706;margin:24px 0 36px;border-radius:2px}
.cover-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.cover-item{border-left:3px solid #d97706;padding:10px 16px;background:#fffbeb}
.cover-item .lbl{font-size:7.5pt;color:#92400e;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;margin-bottom:3px}
.cover-item .val{font-size:11pt;font-weight:600;color:#1e293b}
.cover-user-logo{position:absolute;top:60px;right:50px;width:90px;height:90px;border:2px dashed #d1d5db;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:8pt;color:#94a3b8;text-align:center;line-height:1.3}

/* TOC */
.toc{padding:50px;page-break-after:always}
.toc h2{font-family:'Outfit',sans-serif;font-size:18pt;font-weight:700;color:#0f172a;margin-bottom:6px}
.toc-sub{font-size:10pt;color:#64748b;margin-bottom:28px}
.toc-line{width:40px;height:2px;background:#d97706;margin-bottom:24px}
.toc-row{display:flex;align-items:baseline;margin-bottom:8px;font-size:10.5pt}
.toc-row a{color:#1e293b;text-decoration:none;font-weight:500;white-space:nowrap}
.toc-row a:hover{color:#d97706}
.toc-dots{flex:1;border-bottom:1px dotted #cbd5e1;margin:0 8px;min-width:20px}

/* CONTENT */
.content{padding:0 50px 40px}
h1{font-family:'Outfit',sans-serif;font-size:16pt;color:#0f172a;border-bottom:2px solid #d97706;padding-bottom:8px;margin:32px 0 14px;page-break-after:avoid}
h2{font-family:'Outfit',sans-serif;font-size:13pt;color:#1e293b;margin:26px 0 10px;font-weight:700;border-left:3px solid #d97706;padding-left:12px;page-break-after:avoid}
h3{font-size:10.5pt;color:#92400e;margin:14px 0 6px;font-weight:600;page-break-after:avoid}
p{margin-bottom:7px;color:#374151;page-break-inside:avoid}
li{margin-bottom:4px;padding-left:6px;color:#374151;page-break-inside:avoid}
ul{margin:6px 0 10px 14px;list-style:none}
ul li::before{content:"▸ ";color:#d97706;font-weight:700}
hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}
strong{color:#0f172a;font-weight:700}

/* MOYENS TABLE */
.moyens-table{width:100%;border-collapse:collapse;margin:16px 0 20px;font-size:10pt;page-break-inside:avoid}
.moyens-table th{background:#fffbeb;border:1px solid #e5e7eb;padding:8px 12px;text-align:left;font-weight:700;color:#92400e;font-size:9pt;text-transform:uppercase;letter-spacing:.5px}
.moyens-table td{border:1px solid #e5e7eb;padding:7px 12px;color:#374151}
.moyens-table tr:nth-child(even) td{background:#fafafa}
.moyens-table .status{color:#15803d;font-weight:600}

/* HEADER / FOOTER for print */
.page-header{display:flex;justify-content:space-between;align-items:center;padding:0 0 8px;border-bottom:1px solid #e2e8f0;margin-bottom:20px;font-size:8pt;color:#94a3b8}
.page-header .logo-sm{font-family:'Outfit',sans-serif;font-weight:700;font-size:9pt;color:#d97706}

/* Keep titles with their content */
h1+*,h2+*,h3+*{page-break-before:avoid}
h1,h2,h3{page-break-after:avoid;page-break-inside:avoid}
.keep{page-break-inside:avoid}

/* SIGNATURE */
.signature{margin-top:40px;page-break-inside:avoid;border-top:1px solid #e2e8f0;padding-top:24px}
.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:16px}
.sig-box{text-align:center}
.sig-line{border-bottom:1px solid #94a3b8;height:60px;margin-bottom:6px}
.sig-label{font-size:9pt;color:#64748b}

@media print{
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cover-user-logo{border-color:#d1d5db}
  @page{margin:18mm 16mm 20mm 16mm}
}
</style></head><body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-user-logo">Votre<br>logo ici</div>
  <div class="cover-logo">
    <div class="cover-logo-icon">SN</div>
    <div>
      <div class="cover-logo-text">SAFENOTICE ERP</div>
      <div class="cover-logo-sub">Sécurité Incendie</div>
    </div>
  </div>
  <div class="cover-badge">Notice de Sécurité ERP — Art. GE2</div>
  <h1>${n.nom}</h1>
  <h2>Type ${c} · Catégorie ${n.categorie||"N/A"} · ${(n.typeERP||"").split("—")[1]?.trim()||""}</h2>
  <div class="cover-line"></div>
  <div class="cover-grid">
    <div class="cover-item"><div class="lbl">Adresse</div><div class="val">${n.adresse}, ${n.cp} ${n.ville}</div></div>
    <div class="cover-item"><div class="lbl">Responsable / Exploitant</div><div class="val">${n.responsable}</div></div>
    <div class="cover-item"><div class="lbl">Capacité d'accueil</div><div class="val">${n.capacite} personnes</div></div>
    <div class="cover-item"><div class="lbl">Surface</div><div class="val">${n.surface||"—"} m²</div></div>
    <div class="cover-item"><div class="lbl">Niveaux</div><div class="val">${n.niveaux||"—"}</div></div>
    <div class="cover-item"><div class="lbl">Date d'édition</div><div class="val">${d}</div></div>
  </div>
</div>

<!-- SOMMAIRE -->
<div class="toc">
  <h2>Sommaire</h2>
  <div class="toc-sub">Notice de sécurité — ${n.nom}</div>
  <div class="toc-line"></div>
  ${tocHtml}
  <div style="margin-top:24px;padding:14px 18px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;font-size:9.5pt;color:#92400e;page-break-inside:avoid">
    <strong>Rappel réglementaire :</strong> La présente notice est établie conformément à l'article GE 2 de l'arrêté du 25 juin 1980 modifié. Elle doit être jointe à toute demande d'autorisation de construire, d'aménager ou de modifier un ERP (art. R.123-22 du CCH).
  </div>
</div>

<!-- CONTENT -->
<div class="content">
  <div class="page-header">
    <span class="logo-sm">SafeNotice ERP</span>
    <span>${n.nom} — Type ${c} · Cat. ${n.categorie||"N/A"}</span>
  </div>
  ${bodyHtml}

  <!-- TABLEAU RÉCAPITULATIF MOYENS DE SECOURS -->
  ${moyList.length>0?'<div class="keep"><h3>Tableau récapitulatif des moyens de secours</h3><table class="moyens-table"><thead><tr><th>N°</th><th>Moyen de secours</th><th>État</th></tr></thead><tbody>'+moyRows+'</tbody></table></div>':""}

  <!-- SIGNATURE -->
  <div class="signature">
    <h3>Déclaration de l'exploitant</h3>
    <p>Je soussigné(e), <strong>${n.responsable}</strong>, exploitant de l'établissement « ${n.nom} », déclare avoir pris connaissance des obligations de sécurité incendie et m'engage à maintenir les conditions décrites dans la présente notice.</p>
    <div class="sig-grid">
      <div>
        <p style="font-size:10pt;color:#374151">Fait à ${n.ville}, le ${d}</p>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">Signature et cachet de l'exploitant</div>
      </div>
    </div>
  </div>
</div>

<${"script"}>window.onload=()=>window.print()</${"script"}>
</body></html>`);w.document.close();}

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

// ━━━ LAYOUT COMPONENTS (outside main component to prevent re-mount) ━━━
function Side({goNew,navI,view,setView,etabs,showNE,neN,setNeN,neV,setNeV,addEtab,setShowNE,fEtab,setFEtab,collapsed,setCollapsed}){return<div style={{width:collapsed?62:230,background:"var(--bg1)",borderRight:"1px solid var(--b1)",display:"flex",flexDirection:"column",minHeight:"100vh",position:"sticky",top:0,zIndex:10,transition:"width .25s ease"}} className="do">
  <div style={{padding:collapsed?"18px 12px":"26px 20px 22px",borderBottom:"1px solid var(--b1)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    {collapsed?<div style={{width:38,height:38,background:"linear-gradient(135deg,#d97706,#f59e0b)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,margin:"0 auto"}}>🛡️</div>:<><div style={{display:"flex",alignItems:"center",gap:11}}><div style={{width:38,height:38,background:"linear-gradient(135deg,#d97706,#f59e0b)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 20px rgba(245,158,11,.2)",flexShrink:0}}>🛡️</div><div><div style={{fontWeight:700,fontSize:15,color:"var(--t1)",fontFamily:"var(--fd)"}}>SafeNotice</div><div style={{fontSize:10,color:"var(--t3)",fontWeight:500}}>Sécurité ERP</div></div></div></>}
    <button onClick={()=>setCollapsed(!collapsed)} style={{background:"none",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:14,padding:4,flexShrink:0,marginLeft:collapsed?"auto":0}} title={collapsed?"Ouvrir":"Réduire"}>{collapsed?"▸":"◂"}</button>
  </div>
  <nav style={{padding:collapsed?"8px 6px":"16px 12px"}}>
    <button onClick={goNew} className="sb-m" style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 8px":"11px 14px",borderRadius:"var(--r2)",border:"none",cursor:"pointer",marginBottom:12,background:"linear-gradient(135deg,#d97706,#f59e0b)",color:"#000",fontFamily:"var(--fb)",fontSize:collapsed?0:13.5,fontWeight:600,boxShadow:"0 2px 12px rgba(245,158,11,.2)",textAlign:"left",justifyContent:collapsed?"center":"flex-start"}}><span style={{fontSize:collapsed?18:14}}>✚</span>{!collapsed&&" Nouvelle notice"}</button>
    {navI.map(it=><button key={it.id} onClick={()=>setView(it.id)} className="sb-m" style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 8px":"10px 14px",borderRadius:"var(--r1)",border:"none",cursor:"pointer",marginBottom:3,background:view===it.id?"var(--bg3)":"transparent",color:view===it.id?"var(--t1)":"var(--t3)",fontFamily:"var(--fb)",fontSize:collapsed?0:13.5,fontWeight:view===it.id?600:400,transition:"all var(--tr)",textAlign:"left",justifyContent:collapsed?"center":"flex-start"}}><span style={{fontSize:collapsed?18:14,opacity:view===it.id?1:.6}}>{it.icon}</span>{!collapsed&&it.label}</button>)}
    {!collapsed&&<div style={{margin:"14px 14px 6px",fontSize:10,color:"var(--t3)",opacity:.5}}><span className="kbd">Ctrl</span>+<span className="kbd">N</span> Nouvelle · <span className="kbd">Esc</span> Retour</div>}
  </nav>
  {!collapsed&&<div style={{padding:"16px 12px",borderTop:"1px solid var(--b1)",maxHeight:"35vh",overflowY:"auto"}}>
    <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1.2,marginBottom:10,fontFamily:"var(--fd)"}}>Établissements</div>
    {etabs.length===0&&!showNE&&<div style={{fontSize:11.5,color:"var(--t3)",padding:"4px 0 8px",opacity:.7}}>Aucun</div>}
    {etabs.map(e=><div key={e.id} onClick={()=>{setFEtab(e.id);setView("notices");}} style={{padding:"7px 10px",borderRadius:"var(--r1)",cursor:"pointer",background:fEtab===e.id?"var(--bg3)":"transparent",marginBottom:2}}><div style={{fontSize:12.5,color:fEtab===e.id?"var(--t1)":"var(--t3)",fontWeight:fEtab===e.id?600:400}}>{e.nom}</div>{e.ville&&<div style={{fontSize:10,color:"var(--t3)",opacity:.6}}>{e.ville}</div>}</div>)}
    {showNE?<div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}} className="fi"><input autoFocus value={neN} onChange={e=>setNeN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEtab()} placeholder="Nom" style={{padding:"7px 10px",borderRadius:"var(--r1)",border:"1px solid var(--b2)",background:"var(--bg1)",color:"var(--t1)",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/><input value={neV} onChange={e=>setNeV(e.target.value)} placeholder="Ville (opt.)" style={{padding:"7px 10px",borderRadius:"var(--r1)",border:"1px solid var(--b2)",background:"var(--bg1)",color:"var(--t1)",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/><div style={{display:"flex",gap:6}}><button onClick={addEtab} style={{flex:1,padding:6,background:"var(--ac)",color:"#000",border:"none",borderRadius:"var(--r1)",fontSize:12,cursor:"pointer",fontWeight:600}}>OK</button><button onClick={()=>setShowNE(false)} style={{padding:"6px 8px",background:"var(--bg3)",border:"none",borderRadius:"var(--r1)",fontSize:12,cursor:"pointer",color:"var(--t3)"}}>✕</button></div></div>:<button onClick={()=>setShowNE(true)} style={{width:"100%",padding:"7px 10px",borderRadius:"var(--r1)",border:"1px dashed var(--b2)",background:"transparent",color:"var(--t3)",fontSize:12,cursor:"pointer",marginTop:6,fontFamily:"var(--fb)"}}>+ Ajouter</button>}
  </div>}
</div>}

function MobH({title,back,goNew}){return<div style={{background:"var(--bg1)",borderBottom:"1px solid var(--b1)",padding:"12px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:100}}>{back&&<button onClick={back} style={{background:"transparent",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:16,padding:0}}>←</button>}<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,background:"linear-gradient(135deg,#d97706,#f59e0b)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🛡️</div><span style={{fontWeight:700,color:"var(--t1)",fontSize:14,fontFamily:"var(--fd)"}}>{title||"SafeNotice"}</span></div><button onClick={goNew} style={{marginLeft:"auto",padding:"7px 14px",background:"linear-gradient(135deg,#d97706,#f59e0b)",color:"#000",border:"none",borderRadius:"var(--r1)",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Notice</button></div>}

function Lay({children,title,back,sidebarProps,ts,rm,goNew}){return<div style={{display:"flex",minHeight:"100vh",background:"var(--bg0)"}}><style>{CSS}</style><Side {...sidebarProps}/><div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}><div style={{display:"none"}} className="mhw"><MobH title={title} back={back} goNew={goNew}/></div><style>{`@media(max-width:768px){.mhw{display:block!important}}`}</style><div style={{flex:1,padding:"30px 36px",maxWidth:1100,width:"100%"}} className="mp">{children}</div></div><Toasts ts={ts} rm={rm}/></div>}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APP PRINCIPALE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function SafeNotice(){
  const[notices,setNotices]=useState([]);const[etabs,setEtabs]=useState([]);const[view,setView]=useState("dashboard");const[step,setStep]=useState(1);const[form,setForm]=useState(EMPTY_FORM);const[loading,setLoading]=useState(false);const[genStep,setGenStep]=useState(0);const[error,setError]=useState(null);const[open,setOpen]=useState(null);const[tab,setTab]=useState("notice");const[plan,setPlan]=useState({});const[chk,setChk]=useState({});const[fEtab,setFEtab]=useState("all");const[fType,setFType]=useState("all");const[sq,setSq]=useState("");const[showNE,setShowNE]=useState(false);const[neN,setNeN]=useState("");const[neV,setNeV]=useState("");const[ready,setReady]=useState(false);const[hasDraft,setHasDraft]=useState(false);const[dirty,setDirty]=useState(false);const[collapsed,setCollapsed]=useState(false);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const GEN_STEPS=["Analyse du type ERP…","Vérification réglementaire…","Rédaction des chapitres…","Mise en forme…","Finalisation…"];
  const gen=async(r=0)=>{setLoading(true);setError(null);setGenStep(0);
    const adv=()=>new Promise(res=>{setTimeout(()=>{setGenStep(s=>s+1);res();},1200);});
    try{adv();const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:8096,messages:[{role:"user",content:bPrompt(form)}]})});adv();const data=await res.json();if(data.error)throw new Error(data.error.message);await adv();const txt=data.content?.map(i=>i.text||"").join("\n")||"";await adv();const nn={...form,id:Date.now().toString(),noticeText:txt,savedAt:new Date().toLocaleDateString("fr-FR"),planData:{}};setNotices(p=>[nn,...p]);setOpen(nn);setPlan({});setTab("notice");setView("detail");setDirty(false);sSet("sn:draft",null);setHasDraft(false);setGenStep(5);add("Notice générée !","s");}catch(e){if(r<2){add(`Tentative ${r+2}/3…`,"i");setTimeout(()=>gen(r+1),1500);return;}setError(`Erreur : ${e.message||"Inconnue"}`);add("Échec génération","e");}finally{if(r>=2||r===0)setLoading(false);}};

  const del=id=>{setNotices(p=>p.filter(n=>n.id!==id));if(open?.id===id)setView("dashboard");add("Notice supprimée","i");};
  const savePlan=()=>{setNotices(p=>p.map(n=>n.id===open.id?{...n,planData:plan}:n));setOpen(p=>({...p,planData:plan}));add("Plan sauvegardé","s");};

  const fNotices=useMemo(()=>{let l=notices;if(fEtab!=="all")l=l.filter(n=>n.etablissementId===fEtab);if(fType!=="all")l=l.filter(n=>n.typeERP===fType);if(sq.trim()){const q=sq.toLowerCase();l=l.filter(n=>(n.nom||"").toLowerCase().includes(q)||(n.ville||"").toLowerCase().includes(q)||(n.responsable||"").toLowerCase().includes(q)||(n.cp||"").includes(q)||(n.typeERP||"").toLowerCase().includes(q));}return l;},[notices,fEtab,fType,sq]);
  const stats=useMemo(()=>({total:notices.length,month:notices.filter(n=>{if(!n.savedAt)return false;const[,m,y]=n.savedAt.split("/");const now=new Date();return parseInt(m)===now.getMonth()+1&&parseInt(y)===now.getFullYear();}).length,byType:Object.entries(CATEGORIES_ERP).map(([label,{code,icon,desc}])=>({code,icon,label:desc,count:notices.filter(n=>n.typeERP===label).length,full:label})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count),etabs:etabs.length}),[notices,etabs]);

  if(!ready)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"var(--bg0)"}}><style>{CSS}</style><div style={{textAlign:"center"}}><div style={{width:24,height:24,border:"3px solid var(--b2)",borderTop:"3px solid var(--ac)",borderRadius:"50%",animation:"sp .8s linear infinite",margin:"0 auto 16px"}}/><div style={{color:"var(--t3)",fontSize:13}}>Chargement…</div></div></div>;

  const navI=[{id:"dashboard",icon:"◻",label:"Dashboard"},{id:"notices",icon:"📋",label:"Mes notices"}];
  const sidebarProps={goNew,navI,view,setView,etabs,showNE,neN,setNeN,neV,setNeV,addEtab,setShowNE,fEtab,setFEtab,collapsed,setCollapsed};
  const layoutProps={sidebarProps,ts,rm,goNew};

  // ═══ DASHBOARD ═══
  if(view==="dashboard")return<Lay {...layoutProps} title="Dashboard"><div className="fi">
    <div style={{marginBottom:32}}><h1 style={{fontSize:28,fontWeight:800,color:"var(--t1)",margin:"0 0 6px",fontFamily:"var(--fd)"}}>Dashboard</h1><p style={{color:"var(--t3)",fontSize:14,margin:0}}>Vue d'ensemble de vos notices ERP</p></div>
    {hasDraft&&<div className="fi" style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.15)",borderRadius:"var(--r2)",marginBottom:20}}><span className="db">⏳ Brouillon</span><span style={{color:"var(--t2)",fontSize:13,flex:1}}>Formulaire en cours non terminé.</span><button onClick={restDraft} className="ba" style={{padding:"7px 16px",fontSize:12}}>Reprendre</button><button onClick={clrDraft} className="bg" style={{padding:"7px 12px",fontSize:12}}>Supprimer</button></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:30}} className="sg">{[{l:"Notices",v:stats.total,i:"📋",c:"var(--ac)"},{l:"Ce mois",v:stats.month,i:"📅",c:"#fb923c"},{l:"Établissements",v:stats.etabs,i:"🏢",c:"#22d3ee"},{l:"Types ERP",v:stats.byType.length,i:"🏷️",c:"#c084fc"}].map((s,i)=><div key={i} className="card" style={{padding:"20px 22px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>{s.l}</div><div style={{fontSize:32,fontWeight:800,color:s.c,lineHeight:1,fontFamily:"var(--fd)"}}>{s.v}</div></div><div style={{fontSize:22,opacity:.5}}>{s.i}</div></div></div>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}} className="gr">
      <div className="card" style={{padding:22}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><h3 style={{margin:0,fontSize:14,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Dernières notices</h3><button onClick={()=>setView("notices")} style={{background:"transparent",border:"none",color:"var(--ac)",fontSize:12,cursor:"pointer",fontWeight:600}}>Voir tout →</button></div>{notices.length===0?<div style={{textAlign:"center",padding:"30px 0",color:"var(--t3)",fontSize:13}}><div style={{fontSize:28,marginBottom:10,opacity:.5}}>🛡️</div>Aucune notice</div>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{notices.slice(0,4).map(n=>{const info=CATEGORIES_ERP[n.typeERP]||{};return<div key={n.id} onClick={()=>{setOpen(n);setPlan(n.planData||{});setTab("notice");setView("detail");}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:"var(--r1)",border:"1px solid var(--b1)",background:"var(--bg1)",cursor:"pointer",transition:"all var(--tr)"}}><div style={{width:36,height:36,background:"var(--acs)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{info.icon||"🏢"}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"var(--t1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.nom}</div><div style={{fontSize:11,color:"var(--t3)"}}>{((CATEGORIES_ERP[n.typeERP]||{}).desc||n.typeERP||"")} · {n.ville}</div></div><div style={{fontSize:10,color:"var(--t3)",flexShrink:0}}>{n.savedAt}</div></div>;})}</div>}</div>
      <div className="card" style={{padding:22}}><h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Répartition par type</h3>{stats.byType.length===0?<div style={{textAlign:"center",padding:"30px 0",color:"var(--t3)",fontSize:13}}><div style={{fontSize:28,marginBottom:10,opacity:.5}}>📊</div>Aucune donnée</div>:<div style={{display:"flex",flexDirection:"column",gap:12}}>{stats.byType.map((t,i)=>{const p=Math.round(t.count/stats.total*100);return<div key={i} style={{cursor:"pointer"}} onClick={()=>{setFType(t.full);setView("notices");}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12.5,color:"var(--t2)"}}>{t.icon} <b style={{color:"var(--t1)"}}>{t.code}</b> — {t.label}</span><span style={{fontSize:12,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>{t.count}</span></div><div style={{background:"var(--bg0)",borderRadius:99,height:5,overflow:"hidden"}}><div style={{width:`${p}%`,height:"100%",background:"linear-gradient(90deg,#d97706,var(--ac))",borderRadius:99,transition:"width .5s"}}/></div></div>;})}</div>}</div>
    </div>
    {notices.length===0&&<div style={{marginTop:28,textAlign:"center",padding:"48px 24px",border:"1px dashed var(--b2)",borderRadius:"var(--r3)"}}>
      <div style={{fontSize:48,marginBottom:16}}>🛡️</div>
      <h2 style={{fontSize:22,fontWeight:800,color:"var(--t1)",fontFamily:"var(--fd)",margin:"0 0 8px"}}>Bienvenue sur SafeNotice ERP</h2>
      <p style={{color:"var(--t3)",fontSize:14,maxWidth:460,margin:"0 auto 8px"}}>Générez des notices de sécurité ERP conformes à l'article GE2 en quelques minutes grâce à l'IA.</p>
      <div className="ob-steps">
        <div className="ob-s"><div className="ob-n">1</div><div style={{fontSize:22,marginBottom:8}}>📝</div><div style={{fontWeight:600,color:"var(--t1)",fontSize:13,marginBottom:4}}>Remplissez le formulaire</div><div style={{fontSize:12,color:"var(--t3)",lineHeight:1.5}}>Type ERP, identification, construction, moyens de secours</div></div>
        <div className="ob-s"><div className="ob-n">2</div><div style={{fontSize:22,marginBottom:8}}>🤖</div><div style={{fontWeight:600,color:"var(--t1)",fontSize:13,marginBottom:4}}>L'IA génère la notice</div><div style={{fontSize:12,color:"var(--t3)",lineHeight:1.5}}>10 chapitres complets avec articles de loi cités</div></div>
        <div className="ob-s"><div className="ob-n">3</div><div style={{fontSize:22,marginBottom:8}}>🖨️</div><div style={{fontWeight:600,color:"var(--t1)",fontSize:13,marginBottom:4}}>Exportez en PDF</div><div style={{fontSize:12,color:"var(--t3)",lineHeight:1.5}}>Couverture, sommaire, tableaux, zone signature</div></div>
      </div>
      <button className="ba" onClick={goNew} style={{marginTop:28,padding:"13px 32px",fontSize:15}}>+ Créer ma première notice</button>
    </div>}
  </div></Lay>;

  // ═══ NOTICES ═══
  if(view==="notices"){const af=(fEtab!=="all"?1:0)+(fType!=="all"?1:0);return<Lay {...layoutProps} title="Notices"><div className="fi">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}} className="ms"><div><h1 style={{fontSize:24,fontWeight:800,color:"var(--t1)",margin:"0 0 4px",fontFamily:"var(--fd)"}}>{fEtab!=="all"?etabs.find(e=>e.id===fEtab)?.nom||"Notices":"Toutes les notices"}</h1><p style={{color:"var(--t3)",fontSize:13,margin:0}}>{fNotices.length} notice{fNotices.length!==1?"s":""}{sq?` pour "${sq}"`:""}</p></div><button className="ba" onClick={goNew}>+ Nouvelle notice</button></div>
    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}><SB v={sq} onChange={setSq} ph="Rechercher nom, ville, type…"/><select value={fType} onChange={e=>setFType(e.target.value)} style={{padding:"9px 13px",borderRadius:"var(--r2)",border:"1px solid var(--b2)",background:"var(--bg1)",color:fType!=="all"?"var(--ac)":"var(--t3)",fontSize:12.5,fontFamily:"var(--fb)",cursor:"pointer",outline:"none"}}><option value="all">Tous les types</option>{Object.entries(CATEGORIES_ERP).map(([l,{icon,code}])=><option key={l} value={l}>{icon} Type {code}</option>)}</select>{af>0&&<button onClick={()=>{setFEtab("all");setFType("all");setSq("");}} className="bg" style={{fontSize:12,padding:"8px 14px"}}>✕ Filtres ({af})</button>}</div>
    {fNotices.length===0?<Empty icon="🔍" title="Aucun résultat" sub={sq?`Aucune notice pour "${sq}"`:"Aucune notice avec ces filtres"} action={sq||af?()=>{setSq("");setFEtab("all");setFType("all");}:goNew} al={sq||af?"Réinitialiser":"Créer une notice"}/>:<div style={{display:"flex",flexDirection:"column",gap:10}}>{fNotices.map(n=>{const info=CATEGORIES_ERP[n.typeERP]||{};const et=etabs.find(e=>e.id===n.etablissementId);return<div key={n.id} className="nr" onClick={()=>{setOpen(n);setPlan(n.planData||{});setTab("notice");setView("detail");}}><div style={{width:44,height:44,background:"var(--acs)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{info.icon||"🏢"}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:600,color:"var(--t1)",marginBottom:2}}>{n.nom}</div><div style={{fontSize:12,color:"var(--t3)"}}>{((CATEGORIES_ERP[n.typeERP]||{}).desc||n.typeERP||"")} · Cat. {n.categorie} · {n.cp} {n.ville}{et?` · ${et.nom}`:""}</div></div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}><div style={{fontSize:11,color:"var(--t3)"}}>  {n.savedAt}</div><div style={{display:"flex",gap:6}}><button onClick={e=>{e.stopPropagation();xPDF(n);}} className="bg" style={{padding:"4px 10px",fontSize:11}}>PDF</button><button onClick={e=>{e.stopPropagation();if(window.confirm("Supprimer ?"))del(n.id);}} className="bg" style={{padding:"4px 10px",fontSize:11,color:"var(--dg)"}}>✕</button></div></div></div>;})}</div>}
  </div></Lay>;}

  // ═══ FORMULAIRE ═══
  if(view==="form"){const steps=["Type ERP","Identification","Construction","Sécurité"];const locs=LOCAUX_PAR_TYPE[form.typeERP]||[];const risqs=RISQUES_PAR_TYPE[form.typeERP]||[];
  return<Lay {...layoutProps} title="Nouvelle notice" back={()=>{if(dirty&&!window.confirm("Quitter ?\nBrouillon sauvegardé."))return;setView("dashboard");}}><div className="fi">
    <div style={{display:"flex",alignItems:"center",marginBottom:30}}>{steps.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",flex:i<steps.length-1?1:"auto"}}><div style={{display:"flex",alignItems:"center",gap:8,cursor:i+1<step?"pointer":"default"}} onClick={()=>{if(i+1<step)setStep(i+1);}}><div className={`sd ${i+1===step?"sd-a":i+1<step?"sd-d":"sd-i"}`}>{i+1<step?"✓":i+1}</div><span style={{fontSize:12.5,color:i+1===step?"var(--ac)":i+1<step?"var(--ok)":"var(--t3)",fontWeight:i+1===step?700:400,whiteSpace:"nowrap"}} className="do">{s}</span></div>{i<steps.length-1&&<div style={{flex:1,height:1,background:i+1<step?"rgba(34,197,94,.2)":"var(--b1)",margin:"0 14px"}}/>}</div>)}{dirty&&<span className="db" style={{marginLeft:12}}>Auto-save</span>}</div>
    <div className="card" style={{padding:0,overflow:"hidden"}}><div style={{padding:"16px 24px",borderBottom:"1px solid var(--b1)",background:"var(--bg1)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:15,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Étape {step} — {steps[step-1]}</h2><span style={{fontSize:11,color:"var(--t3)"}}><span className="kbd">Ctrl</span>+<span className="kbd">↵</span> Suivant</span></div><div style={{padding:26}}>

      {step===1&&<div className="si"><p style={{color:"var(--t3)",fontSize:13.5,marginBottom:20}}>Sélectionnez le type d'ERP.</p><div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:22}} className="gr">{Object.entries(CATEGORIES_ERP).map(([l,{icon,desc,code}])=><div key={l} onClick={()=>upd("typeERP",l)} style={{padding:"14px 16px",borderRadius:"var(--r2)",cursor:"pointer",border:`1.5px solid ${form.typeERP===l?"var(--ac)":"var(--b2)"}`,background:form.typeERP===l?"var(--acs)":"var(--bg1)",transition:"all var(--tr)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><span style={{fontSize:24}}>{icon}</span><span style={{fontSize:10,fontWeight:700,color:form.typeERP===l?"var(--ac)":"var(--t3)",background:form.typeERP===l?"rgba(245,158,11,.15)":"var(--bg0)",padding:"2px 8px",borderRadius:4,fontFamily:"var(--fd)"}}>Type {code}</span></div><div style={{fontSize:13,fontWeight:600,color:form.typeERP===l?"var(--ac)":"var(--t1)",marginBottom:3}}>{desc}</div></div>)}</div>{etabs.length>0&&<div className="fl" style={{marginBottom:20}}><label>Rattacher à un établissement</label><select value={form.etablissementId} onChange={e=>upd("etablissementId",e.target.value)}><option value="">— Aucun —</option>{etabs.map(e=><option key={e.id} value={e.id}>{e.nom}{e.ville?` (${e.ville})`:""}</option>)}</select></div>}{error&&<div className="fi" style={{background:"var(--dgs)",border:"1px solid rgba(239,68,68,.25)",borderRadius:"var(--r1)",padding:"11px 15px",marginBottom:14,color:"#fca5a5",fontSize:13}}>{error}</div>}<div style={{display:"flex",justifyContent:"flex-end"}}><button className="ba" onClick={tryNext} disabled={!form.typeERP}>Suivant →</button></div></div>}

      {step===2&&<div className="si"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="gr"><SI label="Nom de l'établissement" field="nom" placeholder="Ex : Restaurant Le Moulin" form={form} upd={upd} req tip="Raison sociale ou nom commercial"/><SI label="Responsable / Exploitant" field="responsable" placeholder="Nom et prénom" form={form} upd={upd} req tip="Personne responsable de la sécurité (art. R.123-21 CCH)"/><SI label="Adresse" field="adresse" placeholder="N° et rue" form={form} upd={upd} req/><div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}><SI label="Code postal" field="cp" placeholder="75001" form={form} upd={upd}/><SI label="Ville" field="ville" placeholder="Paris" form={form} upd={upd} req/></div><SI label="Téléphone" field="tel" type="tel" placeholder="01 23 45 67 89" form={form} upd={upd}/><SI label="Email" field="email" type="email" placeholder="contact@erp.fr" form={form} upd={upd}/><div className="fl"><label>Catégorie ERP <span style={{color:"var(--dg)"}}>*</span><span className="tip" style={{marginLeft:4}}><span className="tip-i">?</span><span className="tip-b">1re &gt;1500 · 2e 701-1500 · 3e 301-700 · 4e ≤300 · 5e petit ERP</span></span></label><select value={form.categorie} onChange={e=>upd("categorie",e.target.value)}><option value="">Choisir</option><option value="1">1re (&gt;1500 pers.)</option><option value="2">2e (701-1500)</option><option value="3">3e (301-700)</option><option value="4">4e (≤300)</option><option value="5">5e (petit ERP)</option></select></div><SI label="Capacité max" field="capacite" placeholder="Ex : 120" form={form} upd={upd} tip="Effectif max du public (hors personnel)"/><SI label="Surface (m²)" field="surface" placeholder="Ex : 350" form={form} upd={upd} tip="Surface totale, tous niveaux confondus"/><SI label="Niveaux" field="niveaux" placeholder="Ex : 2" form={form} upd={upd} tip="Incluant sous-sol et mezzanine"/></div>{error&&<div className="fi" style={{background:"var(--dgs)",border:"1px solid rgba(239,68,68,.25)",borderRadius:"var(--r1)",padding:"11px 15px",marginBottom:14,color:"#fca5a5",fontSize:13}}>{error}</div>}<div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="bg" onClick={()=>{setError(null);setStep(1);}}>← Retour</button><button className="ba" onClick={tryNext}>Suivant →</button></div></div>}

      {step===3&&<div className="si">
        {locs.length>0&&<div style={{marginBottom:22}}><div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>Locaux <span style={{color:"var(--dg)"}}>*</span></div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{locs.map(l=><div key={l} onClick={()=>tog("locaux",l)} className={`chip ${form.locaux.includes(l)?"chip-on":"chip-off"}`}>{l}</div>)}</div></div>}
        {risqs.length>0&&<div style={{marginBottom:22}}><div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>Risques identifiés <span style={{fontWeight:400,textTransform:"none",fontSize:10,opacity:.6}}>(optionnel — l'IA les détecte automatiquement)</span></div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{risqs.map(r=><div key={r} onClick={()=>tog("risques",r)} className={`chip ${form.risques.includes(r)?"chip-on":"chip-off"}`}>{r}</div>)}</div></div>}
        <div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>Implantation & desserte</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:18}} className="g3"><SI label="Façades accessibles" field="nbFacadesAccessibles" placeholder="Ex : 2" form={form} upd={upd} tip="Nombre de façades accessibles aux engins de secours (art. CO 1)"/><SI label="Largeur voie (m)" field="largeurVoie" placeholder="Ex : 6" form={form} upd={upd} tip="Largeur minimale de la voie utilisable par les pompiers (art. CO 2)"/><SI label="Résistance au feu" field="resistanceFeu" placeholder="Ex : REI 60" form={form} upd={upd} tip="Ex: R 30, REI 60, REI 120. Dépend de la catégorie (art. CO 12)"/></div>
        <div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>Matériaux</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:18}} className="g3"><SI label="Plafonds" field="natureMateriauxPlafond" placeholder="Ex : Plâtre BA13" form={form} upd={upd}/><SI label="Murs" field="natureMateriauxMurs" placeholder="Ex : Maçonnerie" form={form} upd={upd}/><SI label="Sol" field="natureMateriauxSol" placeholder="Ex : Carrelage" form={form} upd={upd}/></div>
        <div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,fontFamily:"var(--fd)"}}>Dégagements & évacuation</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:14}} className="gr"><SI label="Nb sorties" field="sorties" placeholder="Ex : 3" form={form} upd={upd} tip="Min. 2 si effectif >100 (art. CO 38)"/><SI label="Larg. sorties (m)" field="largeurSorties" placeholder="Ex : 1.40" form={form} upd={upd} tip="1 UP = 0.60m, 2 UP = 1.40m (art. CO 36)"/><SI label="Nb escaliers" field="nbEscaliers" placeholder="Ex : 1" form={form} upd={upd}/><SI label="Larg. escaliers (m)" field="largeurEscaliers" placeholder="Ex : 1.40" form={form} upd={upd}/></div>
        {error&&<div className="fi" style={{background:"var(--dgs)",border:"1px solid rgba(239,68,68,.25)",borderRadius:"var(--r1)",padding:"11px 15px",marginBottom:14,color:"#fca5a5",fontSize:13}}>{error}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="bg" onClick={()=>{setError(null);setStep(2);}}>← Retour</button><button className="ba" onClick={tryNext}>Suivant →</button></div>
      </div>}

      {step===4&&<div className="si">
        <div style={{marginBottom:22}}><div style={{fontSize:11,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:12,fontFamily:"var(--fd)"}}>Moyens de secours</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}} className="gr">{Object.entries(MOYENS).map(([k,label])=><div key={k} onClick={()=>togM(k)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:"var(--r1)",cursor:"pointer",background:form.moyens[k]?"var(--acs)":"var(--bg1)",border:`1px solid ${form.moyens[k]?"var(--acb)":"var(--b2)"}`,transition:"all var(--tr)"}}><div style={{width:18,height:18,borderRadius:4,border:`2px solid ${form.moyens[k]?"var(--ac)":"var(--b3)"}`,background:form.moyens[k]?"var(--ac)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all var(--tr)"}}>{form.moyens[k]&&<CI/>}</div><span style={{fontSize:12,color:form.moyens[k]?"var(--ac)":"var(--t3)",fontWeight:form.moyens[k]?600:400,lineHeight:1.35}}>{label}</span></div>)}</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="gr"><div className="fl"><label>Type d'alarme</label><select value={form.typeAlarme} onChange={e=>upd("typeAlarme",e.target.value)}><option value="">Choisir</option><option>Type 1 (SSI cat. A)</option><option>Type 2a (centralisé)</option><option>Type 2b (simplifié)</option><option>Type 3 (diffusion)</option><option>Type 4 (autonome)</option></select></div><SI label="Chauffage" field="chauffageNature" placeholder="Ex : Gaz, PAC" form={form} upd={upd}/><SI label="Cuisine (kW)" field="cuisinePuissance" placeholder="Ex : 45" form={form} upd={upd}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="gr"><SI label="Dernière visite" field="derniereVisite" type="date" form={form} upd={upd}/><SI label="Prochaine visite" field="prochaineVisite" type="date" form={form} upd={upd}/></div>
        <div className="fl" style={{marginBottom:20}}><label>Observations</label><textarea value={form.observations} onChange={e=>upd("observations",e.target.value)} rows={3} placeholder="Travaux, dérogations…" style={{resize:"vertical"}}/></div>
        {error&&<div className="fi" style={{background:"var(--dgs)",border:"1px solid rgba(239,68,68,.25)",borderRadius:"var(--r1)",padding:"11px 15px",marginBottom:18,color:"#fca5a5",fontSize:13}}>{error}</div>}
        <div style={{display:"flex",gap:10}}><button className="bg" onClick={()=>{setError(null);setStep(3);}}>← Retour</button>{!loading&&<button className="ba" onClick={()=>gen(0)}>Générer la notice →</button>}</div>
        {loading&&<div style={{display:"flex",flexDirection:"column",gap:12,padding:"20px 0"}}>{GEN_STEPS.map((s,i)=><div key={i} className="gs" style={{opacity:i<=genStep?1:.3,animationDelay:`${i*0.1}s`}}>{i<genStep?<div className="gs-d gs-ok">✓</div>:i===genStep?<div className="gs-sp"/>:<div className="gs-d gs-w">{i+1}</div>}<span style={{color:i<=genStep?"var(--t1)":"var(--t3)"}}>{s}</span></div>)}</div>}
      </div>}
    </div></div>
  </div></Lay>;}

  // ═══ DÉTAIL ═══
  if(view==="detail"&&open){const info=CATEGORIES_ERP[open.typeERP]||{};return<Lay {...layoutProps} title={open.nom} back={()=>setView("notices")}><div className="fi">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}} className="ms"><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:50,height:50,background:"var(--acs)",borderRadius:"var(--r2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{info.icon||"🏢"}</div><div><h1 style={{margin:0,fontSize:21,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>{open.nom}</h1><div style={{fontSize:12.5,color:"var(--t3)",marginTop:3}}>{(info.desc||open.typeERP||"")} · Cat. {open.categorie} · {open.cp} {open.ville}</div></div></div><div style={{display:"flex",gap:8}}><button onClick={()=>xPDF(open)} className="bg" style={{fontSize:13}}>🖨️ PDF</button><button onClick={()=>{if(window.confirm("Supprimer ?"))del(open.id);}} style={{padding:"10px 16px",background:"var(--dgs)",border:"1px solid rgba(239,68,68,.2)",color:"var(--dg)",borderRadius:"var(--r1)",fontSize:13,cursor:"pointer",fontFamily:"var(--fb)",fontWeight:600}}>✕ Supprimer</button></div></div>
    <div style={{borderBottom:"1px solid var(--b1)",marginBottom:24,display:"flex",overflowX:"auto"}}>{["notice","plan","checklist"].map(t=><button key={t} onClick={()=>setTab(t)} className={`tb ${tab===t?"ac":""}`}>{t==="notice"?"📄 Notice":t==="plan"?"🗺️ Plan":"✅ Checklist"}</button>)}</div>
    {tab==="notice"&&<div className="card" style={{padding:28}}>{open.noticeText?<RN text={open.noticeText}/>:<p style={{color:"var(--t3)",fontStyle:"italic"}}>Aucun contenu.</p>}</div>}
    {tab==="plan"&&<div className="card" style={{padding:24}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><h3 style={{margin:0,fontSize:14,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Plan d'évacuation</h3><button onClick={savePlan} className="ba" style={{fontSize:12,padding:"8px 16px"}}>💾 Sauvegarder</button></div><Plan plan={plan} setPlan={setPlan}/></div>}
    {tab==="checklist"&&<div className="card" style={{padding:24}}><h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Checklist maintenance</h3><CL checks={gChk(open.id)} setChecks={sChk(open.id)}/></div>}
  </div></Lay>;}
  return null;
}
