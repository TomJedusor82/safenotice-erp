import { useState, useMemo } from "react";

// ─── DONNÉES ──────────────────────────────────────────────────────────────────
const CATEGORIES_ERP = {
  "N — Restauration / Débits de boissons": { icon:"🍽️", code:"N", desc:"Restaurants, cafés, brasseries" },
  "M — Magasins / Centres commerciaux":    { icon:"🛍️", code:"M", desc:"Commerces, grandes surfaces" },
  "R — Enseignement / Formation":          { icon:"🎓", code:"R", desc:"Écoles, collèges, lycées, universités" },
  "O — Hôtels / Hébergements":             { icon:"🏨", code:"O", desc:"Hôtels, résidences, pensions" },
  "L — Salles de spectacles / Conférences":{ icon:"🎭", code:"L", desc:"Salles de réunion, conférences, spectacles" },
  "W — Administration / Bureaux":          { icon:"🏢", code:"W", desc:"Banques, bureaux ouverts au public" },
  "X — Établissements sportifs couverts":  { icon:"🏋️", code:"X", desc:"Gymnases, salles de sport" },
  "U — Établissements sanitaires":         { icon:"🏥", code:"U", desc:"Cliniques, cabinets médicaux" },
};

const LOCAUX_PAR_TYPE = {
  "N — Restauration / Débits de boissons": ["Salle de restauration","Cuisine","Bar / Comptoir","Cave / Réserve","Sanitaires","Office","Terrasse couverte","Vestiaires personnel"],
  "M — Magasins / Centres commerciaux":    ["Zone de vente","Réserve / Stockage","Caisse / Accueil","Vestiaires","Sanitaires","Parking couvert","Quai de livraison","Local technique"],
  "R — Enseignement / Formation":          ["Salles de classe","Gymnase / Salle de sport","Bibliothèque / CDI","Réfectoire","Sanitaires","Laboratoires","Ateliers","Administration"],
  "O — Hôtels / Hébergements":             ["Chambres","Hall / Réception","Restaurant / Bar","Salles de conférence","Parking couvert","Piscine / Spa","Buanderie","Locaux techniques"],
  "L — Salles de spectacles / Conférences":["Salle principale","Coulisses / Loge","Foyer / Hall","Sanitaires","Régie technique","Réserves décors","Parking","Administration"],
  "W — Administration / Bureaux":          ["Bureaux ouverts","Salles de réunion","Hall d'accueil","Archives","Sanitaires","Local serveur","Parking","Cafétéria"],
  "X — Établissements sportifs couverts":  ["Aire de jeux","Vestiaires","Tribunes","Sanitaires","Local matériel","Salle de musculation","Accueil","Bar / Buvette"],
  "U — Établissements sanitaires":         ["Salles de soins","Salle d'attente","Secrétariat","Pharmacie / Réserve médicaments","Sanitaires","Local déchets médicaux","Archives","Parking"],
};

const RISQUES_PAR_TYPE = {
  "N — Restauration / Débits de boissons": ["Incendie cuisine (friteuses, feux vifs)","Explosion gaz","Intoxication alimentaire","Glissades (sols humides)","Brûlures personnel","Risque électrique"],
  "M — Magasins / Centres commerciaux":    ["Effondrement rayonnages","Incendie stocks inflammables","Vol / Agression","Glissades","Risque électrique","Bousculades foule"],
  "R — Enseignement / Formation":          ["Incendie","Intrusion / Attentat","Chutes d'élèves","Risque chimique (labos)","Accidents sportifs","Risque électrique"],
  "O — Hôtels / Hébergements":             ["Incendie nocturne (occupants endormis)","Noyade (piscine)","Chutes escaliers","Intoxication CO","Légionellose","Risque électrique"],
  "L — Salles de spectacles / Conférences":["Mouvement de foule / panique","Incendie décors","Risque électrique (installations scéniques)","Chutes de hauteur","Risque acoustique","Incendie"],
  "W — Administration / Bureaux":          ["Incendie archives","Risque électrique","Risque sismique (serveurs)","Vol / Intrusion","Chutes","Incendie"],
  "X — Établissements sportifs couverts":  ["Blessures sportives","Incendie","Accidents sur équipements","Chutes de hauteur (tribunes)","Risque électrique","Noyade (piscine)"],
  "U — Établissements sanitaires":         ["Infection nosocomiale","Risque chimique","Risque biologique","Incendie","Risque électrique (appareils médicaux)","Agression"],
};

const MOYENS = {
  extincteurs:      "Extincteurs portatifs",
  robinetIncendie:  "Robinets d'incendie armés (RIA ø 19/6)",
  sprinklers:       "Installation fixe extinction automatique (sprinklers)",
  detecteurFumee:   "Système de détection incendie (SDI)",
  ssi:              "Système de sécurité incendie (SSI cat. A)",
  eclairageSecours: "Éclairage de sécurité (BAES/BAEH)",
  desenfumage:      "Désenfumage naturel ou mécanique",
  portesCoupe:      "Portes coupe-feu (PF/CF)",
  exutoires:        "Exutoires de toiture (désenfumage)",
  colonneSeche:     "Colonne sèche / humide",
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
    { id:"t2", label:"Contrôle des portes coupe-feu (fermeture automatique)" },
    { id:"t3", label:"Vérification des colonnes sèches / humides" },
    { id:"t4", label:"Contrôle tableau de signalisation incendie (TSI/SSI)" },
    { id:"t5", label:"Test déclencheurs manuels d'alarme incendie" },
  ],
  "Annuel": [
    { id:"a1", label:"Vérification extincteurs par technicien agréé" },
    { id:"a2", label:"Maintenance système de détection / SSI" },
    { id:"a3", label:"Vérification des installations électriques par organisme agréé" },
    { id:"a4", label:"Vérification installations gaz (si applicable)" },
    { id:"a5", label:"Contrôle désenfumage / exutoires (ouverture, étanchéité)" },
    { id:"a6", label:"Vérification BAES (test 8h autonomie)" },
    { id:"a7", label:"Formation ou recyclage du personnel à la sécurité incendie" },
    { id:"a8", label:"Révision et mise à jour du plan d'évacuation affiché" },
    { id:"a9", label:"Mise à jour du registre de sécurité" },
  ],
  "Périodique (≥ 3 ans)": [
    { id:"p1", label:"Visite de la commission de sécurité (ERP cat. 1 à 4)" },
    { id:"p2", label:"Vérification moyens de secours par bureau de contrôle agréé" },
    { id:"p3", label:"Audit complet de conformité réglementaire ERP" },
    { id:"p4", label:"Renouvellement de l'autorisation d'ouverture si travaux importants" },
  ],
};

const EMPTY = {
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

// ─── PLAN D'ÉVACUATION ────────────────────────────────────────────────────────
const CELL=20, COLS=32, ROWS=18;
const PLAN_TOOLS=[
  {id:"wall",  label:"Mur",             color:"#ef4444"},
  {id:"exit",  label:"Sortie secours",  color:"#22c55e", icon:"🚪"},
  {id:"fire",  label:"Extincteur",      color:"#f97316", icon:"🧯"},
  {id:"alarm", label:"Déclencheur",     color:"#eab308", icon:"🔔"},
  {id:"rally", label:"Rassemblement",   color:"#06b6d4", icon:"🟢"},
  {id:"stair", label:"Escalier",        color:"#a855f7", icon:"🔼"},
  {id:"room",  label:"Local",           color:"#64748b"},
];
const gc=(t)=>PLAN_TOOLS.find(x=>x.id===t)?.color||"#000";
const ck=(r,c)=>`${r}-${c}`;

function PlanEvacuation({plan,setPlan}){
  const [tool,setTool]=useState("wall");
  const [drawing,setDrawing]=useState(false);
  const [start,setStart]=useState(null);
  const [showLabel,setShowLabel]=useState(false);
  const [pending,setPending]=useState(null);
  const [roomName,setRoomName]=useState("");

  const paint=(r,c)=>{
    if(r<0||r>=ROWS||c<0||c>=COLS)return;
    if(tool==="room"){setPending({r,c});setShowLabel(true);return;}
    setPlan(prev=>{
      const key=ck(r,c);
      if(prev[key]?.type===tool){const{[key]:_,...rest}=prev;return rest;}
      return{...prev,[key]:{type:tool}};
    });
  };
  const fillRect=(r1,c1,r2,c2)=>{
    const[minR,maxR]=[Math.min(r1,r2),Math.max(r1,r2)];
    const[minC,maxC]=[Math.min(c1,c2),Math.max(c1,c2)];
    setPlan(prev=>{const n={...prev};for(let r=minR;r<=maxR;r++)for(let c=minC;c<=maxC;c++)n[ck(r,c)]={type:"wall"};return n;});
  };
  const confirmRoom=()=>{
    if(!pending)return;
    setPlan(prev=>({...prev,[ck(pending.r,pending.c)]:{type:"room",label:roomName||"Local"}}));
    setRoomName("");setShowLabel(false);setPending(null);
  };

  return(
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {PLAN_TOOLS.map(t=>(
          <button key={t.id} onClick={()=>setTool(t.id)} style={{padding:"5px 11px",borderRadius:5,fontSize:12,fontWeight:600,cursor:"pointer",border:`1.5px solid ${tool===t.id?t.color:"#2a2a3a"}`,background:tool===t.id?`${t.color}22`:"#13131f",color:tool===t.id?t.color:"#64748b",transition:"all .15s"}}>{t.label}</button>
        ))}
        <button onClick={()=>setPlan({})} style={{marginLeft:"auto",padding:"5px 11px",borderRadius:5,fontSize:12,background:"#13131f",border:"1px solid #2a2a3a",color:"#64748b",cursor:"pointer"}}>Effacer</button>
      </div>
      {showLabel&&(
        <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
          <input autoFocus value={roomName} onChange={e=>setRoomName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&confirmRoom()} placeholder="Nom du local" style={{padding:"7px 12px",border:"1.5px solid #2a2a3a",borderRadius:6,fontSize:13,outline:"none",width:180,background:"#1a1a2e",color:"#e2e8f0"}}/>
          <button onClick={confirmRoom} style={{padding:"7px 14px",background:"#ef4444",color:"#fff",border:"none",borderRadius:6,fontSize:13,cursor:"pointer",fontWeight:600}}>Ajouter</button>
          <button onClick={()=>{setShowLabel(false);setPending(null);}} style={{padding:"7px 11px",background:"#1a1a2e",border:"1px solid #2a2a3a",borderRadius:6,fontSize:13,cursor:"pointer",color:"#64748b"}}>✕</button>
        </div>
      )}
      <div style={{overflowX:"auto",userSelect:"none"}}>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${COLS},${CELL}px)`,border:"1px solid #2a2a3a",borderRadius:8,background:"#0d0d1a",width:"fit-content"}}
          onMouseLeave={()=>{setDrawing(false);setStart(null);}}>
          {Array.from({length:ROWS},(_,r)=>Array.from({length:COLS},(_,c)=>{
            const key=ck(r,c),cell=plan[key];
            return(
              <div key={key}
                onMouseDown={()=>{setDrawing(true);if(tool==="wall")setStart({r,c});else paint(r,c);}}
                onMouseUp={()=>{if(drawing&&tool==="wall"&&start)fillRect(start.r,start.c,r,c);setDrawing(false);setStart(null);}}
                onMouseEnter={()=>{if(drawing&&tool!=="wall")paint(r,c);}}
                style={{width:CELL,height:CELL,boxSizing:"border-box",border:"1px solid #1a1a2e",background:cell?(cell.type==="wall"?gc("wall"):`${gc(cell.type)}33`):"transparent",cursor:"crosshair",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>
                {cell&&cell.type!=="wall"&&(
                  <span style={{fontSize:cell.type==="room"?7:10}}>
                    {cell.type==="room"?(cell.label?.slice(0,4)||"▪"):PLAN_TOOLS.find(t=>t.id===cell.type)?.icon}
                  </span>
                )}
              </div>
            );
          }))}
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:12,marginTop:10}}>
        {PLAN_TOOLS.map(t=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#64748b"}}>
            <div style={{width:9,height:9,borderRadius:2,background:t.color}}/>{t.label}
          </div>
        ))}
      </div>
      <p style={{fontSize:11,color:"#3a3a4a",marginTop:6}}>Clic pour placer · Glisser pour tracer des murs · Re-cliquer pour effacer</p>
    </div>
  );
}

// ─── CHECKLIST ────────────────────────────────────────────────────────────────
function Checklist({noticeId}){
  const ck2=`ns_check_${noticeId}`;
  const [checks,setChecks]=useState(()=>{try{return JSON.parse(localStorage.getItem(ck2)||"{}");}catch{return{};}});
  const toggle=(id)=>{const n={...checks,[id]:!checks[id]};setChecks(n);try{localStorage.setItem(ck2,JSON.stringify(n));}catch{}};
  const total=Object.values(CHECKLIST).flat().length;
  const done=Object.values(checks).filter(Boolean).length;
  const pct=Math.round((done/total)*100);
  const sc=pct===100?"#22c55e":pct>=75?"#f97316":pct>=40?"#ef4444":"#3a3a5a";

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24,background:"#13131f",borderRadius:10,padding:"16px 20px",border:"1px solid #2a2a3a"}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>Progression</span>
            <span style={{fontSize:13,fontWeight:700,color:sc}}>{done}/{total} vérifications</span>
          </div>
          <div style={{background:"#1a1a2e",borderRadius:99,height:8,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,#ef4444,${sc})`,borderRadius:99,transition:"width .4s ease"}}/>
          </div>
        </div>
        <div style={{textAlign:"center",minWidth:60}}>
          <div style={{fontSize:26,fontWeight:800,color:sc,lineHeight:1}}>{pct}%</div>
          <div style={{fontSize:10,color:sc,marginTop:2,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{pct===100?"Conforme":pct>=75?"Presque":"En cours"}</div>
        </div>
      </div>
      {Object.entries(CHECKLIST).map(([freq,items])=>(
        <div key={freq} style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h4 style={{fontSize:11,fontWeight:700,color:"#ef4444",textTransform:"uppercase",letterSpacing:1.2,margin:0}}>{freq}</h4>
            <span style={{fontSize:11,color:"#64748b",background:"#13131f",padding:"2px 8px",borderRadius:99,border:"1px solid #2a2a3a"}}>{items.filter(i=>checks[i.id]).length}/{items.length}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {items.map(item=>(
              <div key={item.id} onClick={()=>toggle(item.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:8,cursor:"pointer",background:checks[item.id]?"#0f2a1a":"#13131f",border:`1px solid ${checks[item.id]?"#22c55e44":"#2a2a3a"}`,transition:"all .2s"}}>
                <div style={{width:18,height:18,borderRadius:4,flexShrink:0,border:`2px solid ${checks[item.id]?"#22c55e":"#3a3a5a"}`,background:checks[item.id]?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
                  {checks[item.id]&&<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{fontSize:13,color:checks[item.id]?"#22c55e":"#94a3b8",textDecoration:checks[item.id]?"line-through":"none",lineHeight:1.4}}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {pct===100&&(
        <div style={{background:"#0f2a1a",border:"1px solid #22c55e44",borderRadius:10,padding:"14px 18px",color:"#22c55e",fontSize:14,fontWeight:600,textAlign:"center",marginTop:8}}>
          ✓ Vérification complète — À archiver dans le registre de sécurité
        </div>
      )}
    </div>
  );
}

// ─── RENDER NOTICE ────────────────────────────────────────────────────────────
function RenderNotice({text}){
  if(!text)return null;
  return text.split("\n").map((line,i)=>{
    if(line.startsWith("# "))  return <h1 key={i} style={{fontSize:20,fontWeight:700,color:"#f1f5f9",borderBottom:"2px solid #ef4444",paddingBottom:10,margin:"28px 0 14px",fontFamily:"'Space Grotesk',sans-serif"}}>{line.slice(2)}</h1>;
    if(line.startsWith("## ")) return <h2 key={i} style={{fontSize:15,fontWeight:700,color:"#e2e8f0",margin:"20px 0 8px"}}>{line.slice(3)}</h2>;
    if(line.startsWith("### "))return <h3 key={i} style={{fontSize:13,fontWeight:600,color:"#ef4444",margin:"14px 0 6px"}}>{line.slice(4)}</h3>;
    if(line.startsWith("---"))return <hr key={i} style={{border:"none",borderTop:"1px solid #2a2a3a",margin:"16px 0"}}/>;
    if(line.startsWith("- ")) return <div key={i} style={{paddingLeft:18,marginBottom:5,color:"#94a3b8",fontSize:13.5,display:"flex",gap:8,alignItems:"flex-start"}}><span style={{color:"#ef4444",marginTop:2,flexShrink:0}}>▸</span>{line.slice(2)}</div>;
    if(line.trim()==="")      return <div key={i} style={{height:7}}/>;
    return <p key={i} style={{marginBottom:7,color:"#94a3b8",fontSize:13.5,lineHeight:1.7}}>{line.replace(/\*\*(.+?)\*\*/g,"$1")}</p>;
  });
}

// ─── EXPORT PDF ───────────────────────────────────────────────────────────────
function exportPDF(n){
  const win=window.open("","_blank");
  const code=CATEGORIES_ERP[n.typeERP]?.code||"";
  const html=`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Notice de Sécurité ERP — ${n.nom}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;color:#1e293b;font-size:11pt;line-height:1.7;background:#fff}
.cover{background:linear-gradient(135deg,#0d0d1a 0%,#1a0a0a 50%,#2a0a0a 100%);color:#fff;padding:70px 60px;page-break-after:always}
.cover-logo{display:flex;align-items:center;gap:12px;margin-bottom:48px;opacity:.9}
.cover-logo-icon{width:42px;height:42px;background:#ef4444;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px}
.cover-logo-name{font-size:15pt;font-weight:700;letter-spacing:2px;font-family:'Space Grotesk',sans-serif}
.cover-badge{display:inline-block;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.4);color:#fca5a5;padding:5px 14px;border-radius:3px;font-size:8pt;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px}
.cover h1{font-family:'Space Grotesk',sans-serif;font-size:30pt;font-weight:700;margin-bottom:8px;line-height:1.2;color:#f1f5f9}
.cover h2{font-size:13pt;font-weight:400;opacity:.6;margin-bottom:12px;color:#e2e8f0}
.cover-divider{width:60px;height:3px;background:#ef4444;margin:20px 0 36px;border-radius:2px}
.cover-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.cover-item{background:rgba(255,255,255,.05);border-left:3px solid #ef4444;padding:12px 16px;border-radius:0 6px 6px 0}
.cover-item .lbl{font-size:8pt;opacity:.5;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}.cover-item .val{font-size:11pt;font-weight:600}
.content{padding:50px 60px}
h1{font-family:'Space Grotesk',sans-serif;font-size:17pt;color:#0a0a1a;border-bottom:2px solid #ef4444;padding-bottom:8px;margin:30px 0 14px}
h2{font-family:'Space Grotesk',sans-serif;font-size:12pt;color:#1e293b;margin:20px 0 9px;font-weight:700}
h3{font-size:11pt;color:#dc2626;margin:14px 0 6px;font-weight:600}
p{margin-bottom:8px;color:#374151}li{margin-bottom:5px;padding-left:4px;color:#374151}
ul{margin:8px 0 8px 16px;list-style:none}ul li::before{content:"▸ ";color:#ef4444}
hr{border:none;border-top:1px solid #e2e8f0;margin:18px 0}
strong{color:#0f172a;font-weight:700}
.footer{background:#0d0d1a;color:rgba(255,255,255,.35);display:flex;justify-content:space-between;padding:14px 60px;font-size:8pt}
@media print{.cover,.footer{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-size:10pt}}
</style></head><body>
<div class="cover">
  <div class="cover-logo"><div class="cover-logo-icon">🛡️</div><div class="cover-logo-name">SAFENOTICE ERP</div></div>
  <div class="cover-badge">Notice de Sécurité ERP — Art. GE2</div>
  <h1>${n.nom}</h1>
  <h2>Type ${code} · Catégorie ${n.categorie||"N/A"} · ${n.typeERP?.split("—")[0]?.trim()||""}</h2>
  <div class="cover-divider"></div>
  <div class="cover-grid">
    <div class="cover-item"><div class="lbl">Adresse</div><div class="val">${n.adresse}, ${n.cp} ${n.ville}</div></div>
    <div class="cover-item"><div class="lbl">Responsable</div><div class="val">${n.responsable}</div></div>
    <div class="cover-item"><div class="lbl">Capacité d'accueil</div><div class="val">${n.capacite} personnes</div></div>
    <div class="cover-item"><div class="lbl">Date d'édition</div><div class="val">${new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</div></div>
  </div>
</div>
<div class="content">
${(n.noticeText||"").replace(/^# (.+)$/gm,"<h1>$1</h1>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/^---$/gm,"<hr>").split("\n").map(l=>{if(l.startsWith("<h")||l.startsWith("<hr"))return l;if(l.startsWith("- "))return`<li>${l.slice(2)}</li>`;if(l.trim()==="")return"<br>";return`<p>${l}</p>`;}).join("\n")}
</div>
<div class="footer"><span>SafeNotice ERP</span><span>Document à verser au registre de sécurité ERP</span><span>Édité le ${new Date().toLocaleDateString("fr-FR")}</span></div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
  win.document.write(html);win.document.close();
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const LS_NOTICES="sn_notices_v3";
const LS_ETABS="sn_etabs_v3";
const loadItem=(k,def)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(def));}catch{return def;}};
const saveItem=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

// ─── COMPOSANTS FIXES ─────────────────────────────────────────────────────────
function SInput({label,field,placeholder,type="text",form,upd}){
  return(
    <div className="field">
      <label>{label}</label>
      <input type={type} value={form[field]||""} onChange={e=>upd(field,e.target.value)} placeholder={placeholder}/>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function SafeNotice(){
  const [notices,setNotices]=useState(()=>loadItem(LS_NOTICES,[]));
  const [etabs,setEtabs]=useState(()=>loadItem(LS_ETABS,[]));
  const [view,setView]=useState("dashboard");
  const [step,setStep]=useState(1);
  const [form,setForm]=useState(EMPTY);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [open,setOpen]=useState(null);
  const [tab,setTab]=useState("notice");
  const [plan,setPlan]=useState({});
  const [filterEtab,setFilterEtab]=useState("all");
  const [showNewEtab,setShowNewEtab]=useState(false);
  const [newEtabName,setNewEtabName]=useState("");
  const [newEtabVille,setNewEtabVille]=useState("");

  const upd=(f,v)=>setForm(p=>({...p,[f]:v}));
  const tog=(f,v)=>setForm(p=>({...p,[f]:p[f].includes(v)?p[f].filter(x=>x!==v):[...p[f],v]}));
  const togM=(k)=>setForm(p=>({...p,moyens:{...p.moyens,[k]:!p.moyens[k]}}));

  const saveNotices=(u)=>{setNotices(u);saveItem(LS_NOTICES,u);};
  const saveEtabs=(u)=>{setEtabs(u);saveItem(LS_ETABS,u);};

  const addEtab=()=>{
    if(!newEtabName.trim())return;
    const ne={id:"etab-"+Date.now(),nom:newEtabName.trim(),ville:newEtabVille.trim()};
    saveEtabs([...etabs,ne]);
    setNewEtabName("");setNewEtabVille("");setShowNewEtab(false);
  };

  const generate=async()=>{
    setLoading(true);setError(null);
    const ma=Object.entries(form.moyens).filter(([,v])=>v).map(([k])=>MOYENS[k]).join(", ");
    const code=CATEGORIES_ERP[form.typeERP]?.code||"";
    const prompt=`Tu es un expert en sécurité incendie et réglementation ERP en France. Génère une notice de sécurité ERP professionnelle et très détaillée, conforme à l'article GE2 de l'arrêté du 25 juin 1980.

DONNÉES DE L'ÉTABLISSEMENT :
- Raison sociale : ${form.nom}
- Type ERP : ${form.typeERP} (code ${code}) | Catégorie : ${form.categorie}
- Adresse : ${form.adresse}, ${form.cp} ${form.ville}
- Responsable : ${form.responsable} | Tél : ${form.tel} | Email : ${form.email}
- Capacité max : ${form.capacite} personnes | Niveaux : ${form.niveaux} | Surface : ${form.surface} m²
- Locaux : ${form.locaux.join(", ")}
- Risques identifiés : ${form.risques.join(", ")}
- Moyens de secours : ${ma}
- Façades accessibles pompiers : ${form.nbFacadesAccessibles}
- Largeur voie desserte : ${form.largeurVoie} m
- Résistance au feu : ${form.resistanceFeu}
- Matériaux : plafonds ${form.natureMateriauxPlafond}, murs ${form.natureMateriauxMurs}, sol ${form.natureMateriauxSol}
- Sorties de secours : ${form.sorties} | Largeur : ${form.largeurSorties} m
- Escaliers : ${form.nbEscaliers} | Largeur : ${form.largeurEscaliers} m
- Chauffage : ${form.chauffageNature}
- Cuisine (puissance) : ${form.cuisinePuissance} kW
- Type d'alarme : ${form.typeAlarme}
- Dernière visite commission : ${form.derniereVisite} | Prochaine : ${form.prochaineVisite}
- Observations : ${form.observations||"Aucune"}

Génère la notice COMPLÈTE et très détaillée selon l'article GE2 :

# NOTICE DE SÉCURITÉ ERP
## Établissement Recevant du Public — Type ${code}
---
## CHAPITRE I — CLASSEMENT ET IDENTIFICATION
## CHAPITRE II — IMPLANTATION ET DESSERTE
## CHAPITRE III — CONSTRUCTION ET RÉSISTANCE AU FEU
## CHAPITRE IV — DÉGAGEMENTS ET ÉVACUATION
## CHAPITRE V — VENTILATION ET DÉSENFUMAGE
## CHAPITRE VI — CHAUFFAGE ET INSTALLATIONS TECHNIQUES
## CHAPITRE VII — INSTALLATIONS ÉLECTRIQUES ET ÉCLAIRAGE DE SÉCURITÉ
## CHAPITRE VIII — MOYENS DE SECOURS ET ALARME
## CHAPITRE IX — ORGANISATION DES SECOURS
## DÉCLARATION DU RESPONSABLE

Pour chaque chapitre : contenu riche et professionnel, adapté précisément aux données fournies. Mentionne les articles réglementaires uniquement quand c'est pertinent pour le contenu technique.`;
    try{
      const apiKey=process.env.REACT_APP_ANTHROPIC_API_KEY||"";
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-6",max_tokens:6000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      if(data.error)throw new Error(data.error.message);
      const text=data.content?.map(i=>i.text||"").join("\n")||"";
      const nn={...form,id:Date.now().toString(),noticeText:text,savedAt:new Date().toLocaleDateString("fr-FR"),planData:{}};
      const u=[nn,...notices];saveNotices(u);
      setOpen(nn);setPlan({});setTab("notice");setView("detail");
    }catch(e){setError(`Erreur : ${e.message||"Veuillez réessayer."}`);}
    finally{setLoading(false);}
  };

  const del=(id)=>{const u=notices.filter(n=>n.id!==id);saveNotices(u);if(open?.id===id)setView("dashboard");};
  const savePlan=()=>{const u=notices.map(n=>n.id===open.id?{...n,planData:plan}:n);saveNotices(u);setOpen(p=>({...p,planData:plan}));};

  const filteredNotices=useMemo(()=>filterEtab==="all"?notices:notices.filter(n=>n.etablissementId===filterEtab),[notices,filterEtab]);

  // ── STATS ──
  const stats=useMemo(()=>({
    total:notices.length,
    thisMonth:notices.filter(n=>{
      if(!n.savedAt)return false;
      const[d,m,y]=n.savedAt.split("/");
      const now=new Date();
      return parseInt(m)===now.getMonth()+1&&parseInt(y)===now.getFullYear();
    }).length,
    byType:Object.entries(CATEGORIES_ERP).map(([label,{code,icon}])=>({
      code,icon,label:label.split("—")[0].trim(),
      count:notices.filter(n=>n.typeERP===label).length
    })).filter(x=>x.count>0).sort((a,b)=>b.count-a.count),
    etabsActifs:etabs.length,
  }),[notices,etabs]);

  // CSS GLOBAL
  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *{box-sizing:border-box;}
    body{margin:0;background:#080810;font-family:'DM Sans',system-ui,sans-serif;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
    .fade-up{animation:fadeUp .3s ease forwards;}
    input:focus,textarea:focus,select:focus{border-color:#ef4444!important;box-shadow:0 0 0 3px rgba(239,68,68,.12)!important;outline:none;}
    ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#0d0d1a;}::-webkit-scrollbar-thumb{background:#2a2a3a;border-radius:3px;}
    .card{background:#13131f;border:1px solid #1e1e2e;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.4);}
    .btn-primary{background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;border:none;border-radius:8px;padding:11px 24px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;letter-spacing:.2px;transition:all .2s;box-shadow:0 2px 12px rgba(239,68,68,.3);}
    .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(239,68,68,.45);}
    .btn-ghost{background:#13131f;border:1px solid #2a2a3a;color:#94a3b8;border-radius:8px;padding:11px 18px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .2s;}
    .btn-ghost:hover{border-color:#3a3a5a;color:#e2e8f0;background:#1a1a2e;}
    .chip{padding:6px 13px;border-radius:20px;font-size:12.5px;cursor:pointer;transition:all .15s;user-select:none;}
    .chip-on{background:rgba(239,68,68,.15);border:1.5px solid #ef4444;color:#ef4444;font-weight:600;}
    .chip-off{background:#13131f;border:1.5px solid #2a2a3a;color:#64748b;}
    .chip:hover{transform:translateY(-1px);}
    .field label{display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px;text-transform:uppercase;letter-spacing:.7px;}
    .field input,.field textarea,.field select{width:100%;padding:10px 13px;border:1px solid #2a2a3a;border-radius:8px;font-size:13.5px;color:#e2e8f0;font-family:inherit;background:#0d0d1a;transition:border-color .2s,box-shadow .2s;}
    .field select option{background:#1a1a2e;}
    .tab-btn{padding:11px 18px;background:transparent;border:none;border-bottom:2px solid transparent;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap;}
    .tab-btn.active{border-bottom-color:#ef4444;color:#ef4444;}
    .notice-card{background:#13131f;border:1px solid #1e1e2e;border-radius:12px;padding:18px 22px;display:flex;align-items:center;gap:18px;transition:all .2s;cursor:pointer;}
    .notice-card:hover{border-color:#ef444433;box-shadow:0 4px 20px rgba(239,68,68,.08);transform:translateY(-1px);}
    .step-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;transition:all .3s;}
    .step-active{background:#ef4444;color:#fff;box-shadow:0 0 0 4px rgba(239,68,68,.2);}
    .step-done{background:#22c55e;color:#fff;}
    .step-idle{background:#1a1a2e;color:#64748b;border:1px solid #2a2a3a;}
    @media(max-width:768px){
      .desktop-only{display:none!important;}
      .mobile-stack{flex-direction:column!important;}
      .mobile-full{width:100%!important;}
      .mobile-pad{padding:16px!important;}
      .grid-2{grid-template-columns:1fr!important;}
    }
  `;

  // ── NAV LATÉRALE ──────────────────────────────────────────────────────────
  function Sidebar(){
    const items=[
      {id:"dashboard",icon:"⬛",label:"Dashboard"},
      {id:"notices",icon:"📋",label:"Mes notices"},
      {id:"new",icon:"✚",label:"Nouvelle notice",primary:true},
    ];
    return(
      <div style={{width:220,background:"#0d0d1a",borderRight:"1px solid #1e1e2e",display:"flex",flexDirection:"column",minHeight:"100vh",position:"sticky",top:0,zIndex:10}} className="desktop-only">
        {/* Logo */}
        <div style={{padding:"24px 20px 20px",borderBottom:"1px solid #1e1e2e"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,background:"linear-gradient(135deg,#dc2626,#ef4444)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 20px rgba(239,68,68,.3)"}}>🛡️</div>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:"#f1f5f9",fontFamily:"'Space Grotesk',sans-serif",letterSpacing:.5}}>SafeNotice</div>
              <div style={{fontSize:10,color:"#3a3a5a",letterSpacing:.3}}>ERP Security</div>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{padding:"16px 12px",flex:1}}>
          {items.map(it=>(
            <button key={it.id} onClick={()=>{if(it.id==="new"){setForm(EMPTY);setStep(1);setError(null);setView("form");}else setView(it.id);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:4,background:it.primary?"linear-gradient(135deg,#dc2626,#ef4444)":view===it.id?"#1a1a2e":"transparent",color:it.primary?"#fff":view===it.id?"#e2e8f0":"#64748b",fontFamily:"inherit",fontSize:13.5,fontWeight:it.primary||view===it.id?600:400,transition:"all .2s",textAlign:"left",boxShadow:it.primary?"0 2px 12px rgba(239,68,68,.3)":"none"}}>
              <span style={{fontSize:14}}>{it.icon}</span>{it.label}
            </button>
          ))}
        </nav>
        {/* Établissements */}
        <div style={{padding:"16px 12px",borderTop:"1px solid #1e1e2e"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#3a3a5a",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Établissements</div>
          {etabs.map(e=>(
            <div key={e.id} onClick={()=>{setFilterEtab(e.id);setView("notices");}} style={{padding:"7px 10px",borderRadius:6,cursor:"pointer",background:filterEtab===e.id?"#1a1a2e":"transparent",marginBottom:2,transition:"all .15s"}}>
              <div style={{fontSize:12.5,color:filterEtab===e.id?"#e2e8f0":"#64748b",fontWeight:filterEtab===e.id?600:400}}>{e.nom}</div>
              {e.ville&&<div style={{fontSize:10,color:"#3a3a5a"}}>{e.ville}</div>}
            </div>
          ))}
          {showNewEtab?(
            <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
              <input autoFocus value={newEtabName} onChange={e=>setNewEtabName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEtab()} placeholder="Nom de l'établissement" style={{padding:"7px 10px",borderRadius:6,border:"1px solid #2a2a3a",background:"#0d0d1a",color:"#e2e8f0",fontSize:12,fontFamily:"inherit",outline:"none"}}/>
              <input value={newEtabVille} onChange={e=>setNewEtabVille(e.target.value)} placeholder="Ville (optionnel)" style={{padding:"7px 10px",borderRadius:6,border:"1px solid #2a2a3a",background:"#0d0d1a",color:"#e2e8f0",fontSize:12,fontFamily:"inherit",outline:"none"}}/>
              <div style={{display:"flex",gap:6}}>
                <button onClick={addEtab} style={{flex:1,padding:"6px",background:"#ef4444",color:"#fff",border:"none",borderRadius:6,fontSize:12,cursor:"pointer",fontWeight:600}}>Ajouter</button>
                <button onClick={()=>setShowNewEtab(false)} style={{padding:"6px 8px",background:"#1a1a2e",border:"none",borderRadius:6,fontSize:12,cursor:"pointer",color:"#64748b"}}>✕</button>
              </div>
            </div>
          ):(
            <button onClick={()=>setShowNewEtab(true)} style={{width:"100%",padding:"7px 10px",borderRadius:6,border:"1px dashed #2a2a3a",background:"transparent",color:"#3a3a5a",fontSize:12,cursor:"pointer",marginTop:6,fontFamily:"inherit",transition:"all .2s"}}>+ Ajouter</button>
          )}
        </div>
      </div>
    );
  }

  // ── HEADER MOBILE ─────────────────────────────────────────────────────────
  function MobileHeader({title,back}){
    return(
      <div style={{background:"#0d0d1a",borderBottom:"1px solid #1e1e2e",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:100}}>
        {back&&<button onClick={back} style={{background:"transparent",border:"none",color:"#64748b",cursor:"pointer",fontSize:13,padding:0}}>←</button>}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,background:"linear-gradient(135deg,#dc2626,#ef4444)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🛡️</div>
          <span style={{fontWeight:700,color:"#f1f5f9",fontSize:14,fontFamily:"'Space Grotesk',sans-serif"}}>{title||"SafeNotice ERP"}</span>
        </div>
        <button onClick={()=>{setForm(EMPTY);setStep(1);setError(null);setView("form");}} style={{marginLeft:"auto",padding:"7px 14px",background:"linear-gradient(135deg,#dc2626,#ef4444)",color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ Notice</button>
      </div>
    );
  }

  // ── LAYOUT ────────────────────────────────────────────────────────────────
  function Layout({children,title,back}){
    return(
      <div style={{display:"flex",minHeight:"100vh",background:"#080810"}}>
        <style>{css}</style>
        <Sidebar/>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <div style={{display:"none"}} className="mobile-header-wrapper">
            <MobileHeader title={title} back={back}/>
          </div>
          <style>{`@media(max-width:768px){.mobile-header-wrapper{display:block!important;}}`}</style>
          <div style={{flex:1,padding:"28px 32px",maxWidth:1100,width:"100%"}} className="mobile-pad">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ── VUE DASHBOARD ─────────────────────────────────────────────────────────
  if(view==="dashboard"){
    return(
      <Layout title="Dashboard">
        <div className="fade-up">
          {/* Header */}
          <div style={{marginBottom:32}}>
            <h1 style={{fontSize:26,fontWeight:700,color:"#f1f5f9",margin:"0 0 6px",fontFamily:"'Space Grotesk',sans-serif"}}>Dashboard</h1>
            <p style={{color:"#64748b",fontSize:14,margin:0}}>Vue d'ensemble de vos notices de sécurité ERP</p>
          </div>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28}} className="grid-2">
            {[
              {label:"Notices totales",value:stats.total,icon:"📋",color:"#ef4444"},
              {label:"Ce mois-ci",value:stats.thisMonth,icon:"📅",color:"#f97316"},
              {label:"Établissements",value:stats.etabsActifs,icon:"🏢",color:"#06b6d4"},
              {label:"Types ERP couverts",value:stats.byType.length,icon:"🏷️",color:"#a855f7"},
            ].map((s,i)=>(
              <div key={i} className="card" style={{padding:"20px 22px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>{s.label}</div>
                    <div style={{fontSize:30,fontWeight:800,color:s.color,lineHeight:1,fontFamily:"'Space Grotesk',sans-serif"}}>{s.value}</div>
                  </div>
                  <div style={{fontSize:22,opacity:.6}}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}} className="grid-2">
            {/* Dernières notices */}
            <div className="card" style={{padding:22}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <h3 style={{margin:0,fontSize:14,fontWeight:700,color:"#e2e8f0",fontFamily:"'Space Grotesk',sans-serif"}}>Dernières notices</h3>
                <button onClick={()=>setView("notices")} style={{background:"transparent",border:"none",color:"#ef4444",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Voir tout →</button>
              </div>
              {notices.length===0?(
                <div style={{textAlign:"center",padding:"28px 0",color:"#3a3a5a",fontSize:13}}>
                  <div style={{fontSize:28,marginBottom:10}}>🛡️</div>
                  Aucune notice pour le moment
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {notices.slice(0,4).map(n=>{
                    const info=CATEGORIES_ERP[n.typeERP]||{};
                    return(
                      <div key={n.id} onClick={()=>{setOpen(n);setPlan(n.planData||{});setTab("notice");setView("detail");}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:8,border:"1px solid #1e1e2e",background:"#0d0d1a",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#ef444433";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e1e2e";}}>
                        <div style={{width:34,height:34,background:"rgba(239,68,68,.1)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{info.icon||"🏢"}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.nom}</div>
                          <div style={{fontSize:11,color:"#64748b"}}>{n.typeERP?.split("—")[0]?.trim()} · {n.ville}</div>
                        </div>
                        <div style={{fontSize:10,color:"#3a3a5a",flexShrink:0}}>{n.savedAt}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Répartition par type */}
            <div className="card" style={{padding:22}}>
              <h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:"#e2e8f0",fontFamily:"'Space Grotesk',sans-serif"}}>Répartition par type ERP</h3>
              {stats.byType.length===0?(
                <div style={{textAlign:"center",padding:"28px 0",color:"#3a3a5a",fontSize:13}}>
                  <div style={{fontSize:28,marginBottom:10}}>📊</div>
                  Aucune donnée
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {stats.byType.map((t,i)=>{
                    const pct=Math.round((t.count/stats.total)*100);
                    return(
                      <div key={i}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <span style={{fontSize:12.5,color:"#94a3b8"}}>{t.icon} {t.label}</span>
                          <span style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{t.count}</span>
                        </div>
                        <div style={{background:"#1a1a2e",borderRadius:99,height:5,overflow:"hidden"}}>
                          <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#dc2626,#ef4444)",borderRadius:99,transition:"width .5s ease"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CTA si vide */}
          {notices.length===0&&(
            <div className="card" style={{padding:40,textAlign:"center",marginTop:24,border:"1px dashed #2a2a3a",background:"transparent"}}>
              <div style={{fontSize:40,marginBottom:14}}>🛡️</div>
              <h3 style={{color:"#e2e8f0",fontFamily:"'Space Grotesk',sans-serif",marginBottom:8}}>Créez votre première notice</h3>
              <p style={{color:"#64748b",fontSize:14,marginBottom:22}}>Générez une notice de sécurité ERP complète en quelques minutes</p>
              <button className="btn-primary" onClick={()=>{setForm(EMPTY);setStep(1);setError(null);setView("form");}}>+ Créer ma première notice</button>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ── VUE NOTICES ───────────────────────────────────────────────────────────
  if(view==="notices"){
    return(
      <Layout title="Mes notices">
        <div className="fade-up">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}} className="mobile-stack">
            <div>
              <h1 style={{fontSize:22,fontWeight:700,color:"#f1f5f9",margin:"0 0 4px",fontFamily:"'Space Grotesk',sans-serif"}}>
                {filterEtab==="all"?"Toutes les notices":etabs.find(e=>e.id===filterEtab)?.nom||"Notices"}
              </h1>
              <p style={{color:"#64748b",fontSize:13,margin:0}}>{filteredNotices.length} notice{filteredNotices.length!==1?"s":""}</p>
            </div>
            <div style={{display:"flex",gap:10",alignItems:"center"}}>
              {filterEtab!=="all"&&<button onClick={()=>setFilterEtab("all")} className="btn-ghost" style={{fontSize:12,padding:"8px 14px"}}>✕ Retirer filtre</button>}
              <button className="btn-primary" onClick={()=>{setForm(EMPTY);setStep(1);setError(null);setView("form");}}>+ Nouvelle notice</button>
            </div>
          </div>

          {filteredNotices.length===0?(
            <div className="card" style={{padding:48,textAlign:"center",border:"1px dashed #2a2a3a",background:"transparent"}}>
              <div style={{fontSize:36,marginBottom:12}}>📋</div>
              <p style={{color:"#64748b",marginBottom:20}}>Aucune notice{filterEtab!=="all"?" pour cet établissement":""}</p>
              <button className="btn-primary" onClick={()=>{setForm(EMPTY);setStep(1);setError(null);setView("form");}}>Créer une notice</button>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filteredNotices.map(n=>{
                const info=CATEGORIES_ERP[n.typeERP]||{};
                const etab=etabs.find(e=>e.id===n.etablissementId);
                return(
                  <div key={n.id} className="notice-card" onClick={()=>{setOpen(n);setPlan(n.planData||{});setTab("notice");setView("detail");}}>
                    <div style={{width:44,height:44,background:"rgba(239,68,68,.1)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{info.icon||"🏢"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:600,color:"#e2e8f0",marginBottom:2}}>{n.nom}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>{n.typeERP?.split("—")[0]?.trim()} · {n.cp} {n.ville}{etab?` · ${etab.nom}`:""}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                      <div style={{fontSize:11,color:"#3a3a5a"}}>{n.savedAt}</div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={e=>{e.stopPropagation();exportPDF(n);}} style={{padding:"5px 11px",borderRadius:5,border:"1px solid #2a2a3a",background:"transparent",color:"#94a3b8",fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#ef4444"} onMouseLeave={e=>e.currentTarget.style.borderColor="#2a2a3a"}>PDF</button>
                        <button onClick={e=>{e.stopPropagation();if(confirm("Supprimer ?"))del(n.id);}} style={{padding:"5px 11px",borderRadius:5,border:"1px solid #2a2a3a",background:"transparent",color:"#64748b",fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#64748b"}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ── VUE FORMULAIRE ────────────────────────────────────────────────────────
  if(view==="form"){
    const steps=["Type ERP","Identification","Construction","Sécurité"];
    const locaux=LOCAUX_PAR_TYPE[form.typeERP]||[];
    const risques=RISQUES_PAR_TYPE[form.typeERP]||[];

    return(
      <Layout title="Nouvelle notice" back={()=>setView("dashboard")}>
        <div className="fade-up">
          {/* Stepper */}
          <div style={{display:"flex",alignItems:"center",marginBottom:28,gap:0}}>
            {steps.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",flex:i<steps.length-1?1:"auto"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div className={`step-dot ${i+1===step?"step-active":i+1<step?"step-done":"step-idle"}`}>
                    {i+1<step?"✓":i+1}
                  </div>
                  <span style={{fontSize:12.5,color:i+1===step?"#ef4444":i+1<step?"#22c55e":"#3a3a5a",fontWeight:i+1===step?700:400,whiteSpace:"nowrap"}} className="desktop-only">{s}</span>
                </div>
                {i<steps.length-1&&<div style={{flex:1,height:1,background:i+1<step?"#22c55e22":"#1e1e2e",margin:"0 12px"}}/>}
              </div>
            ))}
          </div>

          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"16px 22px",borderBottom:"1px solid #1e1e2e",background:"#0d0d1a"}}>
              <h2 style={{margin:0,fontSize:15,fontWeight:700,color:"#e2e8f0",fontFamily:"'Space Grotesk',sans-serif"}}>Étape {step} — {steps[step-1]}</h2>
            </div>
            <div style={{padding:24}}>

              {step===1&&(
                <div>
                  <p style={{color:"#64748b",fontSize:13,marginBottom:20}}>Sélectionnez le type d'ERP de votre établissement.</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:22}} className="grid-2">
                    {Object.entries(CATEGORIES_ERP).map(([label,{icon,desc}])=>(
                      <div key={label} onClick={()=>upd("typeERP",label)} style={{padding:"14px 16px",borderRadius:9,cursor:"pointer",border:`1.5px solid ${form.typeERP===label?"#ef4444":"#2a2a3a"}`,background:form.typeERP===label?"rgba(239,68,68,.08)":"#0d0d1a",transition:"all .2s"}}>
                        <div style={{fontSize:22,marginBottom:7}}>{icon}</div>
                        <div style={{fontSize:13,fontWeight:600,color:form.typeERP===label?"#ef4444":"#e2e8f0",marginBottom:3}}>{label.split("—")[0].trim()}</div>
                        <div style={{fontSize:11,color:"#64748b"}}>{desc}</div>
                      </div>
                    ))}
                  </div>
                  {etabs.length>0&&(
                    <div className="field" style={{marginBottom:20}}>
                      <label>Rattacher à un établissement (optionnel)</label>
                      <select value={form.etablissementId} onChange={e=>upd("etablissementId",e.target.value)}>
                        <option value="">— Aucun —</option>
                        {etabs.map(e=><option key={e.id} value={e.id}>{e.nom}{e.ville?` (${e.ville})`:""}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <button className="btn-primary" onClick={()=>{if(form.typeERP)setStep(2);}} disabled={!form.typeERP} style={{opacity:form.typeERP?1:.4,cursor:form.typeERP?"pointer":"not-allowed"}}>Suivant →</button>
                  </div>
                </div>
              )}

              {step===2&&(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="grid-2">
                    <SInput label="Nom de l'établissement *" field="nom" placeholder="Ex : Restaurant Le Moulin" form={form} upd={upd}/>
                    <SInput label="Responsable / Exploitant *" field="responsable" placeholder="Nom et prénom" form={form} upd={upd}/>
                    <SInput label="Adresse *" field="adresse" placeholder="N° et rue" form={form} upd={upd}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
                      <SInput label="Code postal" field="cp" placeholder="75001" form={form} upd={upd}/>
                      <SInput label="Ville *" field="ville" placeholder="Paris" form={form} upd={upd}/>
                    </div>
                    <SInput label="Téléphone" field="tel" type="tel" placeholder="01 23 45 67 89" form={form} upd={upd}/>
                    <SInput label="Email" field="email" type="email" placeholder="contact@etablissement.fr" form={form} upd={upd}/>
                    <div className="field">
                      <label>Catégorie ERP</label>
                      <select value={form.categorie} onChange={e=>upd("categorie",e.target.value)} style={{padding:"10px 13px",border:"1px solid #2a2a3a",borderRadius:8,fontSize:13.5,width:"100%",fontFamily:"inherit",background:"#0d0d1a",color:"#e2e8f0"}}>
                        <option value="">Choisir</option>
                        <option value="1">1re catégorie (&gt; 1 500 personnes)</option>
                        <option value="2">2e catégorie (701 à 1 500)</option>
                        <option value="3">3e catégorie (301 à 700)</option>
                        <option value="4">4e catégorie (jusqu'à 300)</option>
                        <option value="5">5e catégorie (petit ERP)</option>
                      </select>
                    </div>
                    <SInput label="Capacité maximale (personnes)" field="capacite" placeholder="Ex : 120" form={form} upd={upd}/>
                    <SInput label="Surface totale (m²)" field="surface" placeholder="Ex : 350" form={form} upd={upd}/>
                    <SInput label="Nombre de niveaux" field="niveaux" placeholder="Ex : 2" form={form} upd={upd}/>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                    <button className="btn-ghost" onClick={()=>setStep(1)}>← Retour</button>
                    <button className="btn-primary" onClick={()=>setStep(3)}>Suivant →</button>
                  </div>
                </div>
              )}

              {step===3&&(
                <div>
                  {locaux.length>0&&(
                    <div style={{marginBottom:22}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>Locaux de l'établissement</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                        {locaux.map(l=><div key={l} onClick={()=>tog("locaux",l)} className={`chip ${form.locaux.includes(l)?"chip-on":"chip-off"}`}>{l}</div>)}
                      </div>
                    </div>
                  )}
                  {risques.length>0&&(
                    <div style={{marginBottom:22}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>Risques identifiés</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                        {risques.map(r=><div key={r} onClick={()=>tog("risques",r)} className={`chip ${form.risques.includes(r)?"chip-on":"chip-off"}`}>{r}</div>)}
                      </div>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}} className="grid-2">
                    <SInput label="Façades accessibles pompiers" field="nbFacadesAccessibles" placeholder="Ex : 2" form={form} upd={upd}/>
                    <SInput label="Largeur voie desserte (m)" field="largeurVoie" placeholder="Ex : 6" form={form} upd={upd}/>
                    <SInput label="Résistance au feu structure" field="resistanceFeu" placeholder="Ex : REI 60" form={form} upd={upd}/>
                    <SInput label="Matériaux plafonds" field="natureMateriauxPlafond" placeholder="Ex : Plâtre BA13" form={form} upd={upd}/>
                    <SInput label="Matériaux murs" field="natureMateriauxMurs" placeholder="Ex : Maçonnerie" form={form} upd={upd}/>
                    <SInput label="Matériaux sol" field="natureMateriauxSol" placeholder="Ex : Carrelage" form={form} upd={upd}/>
                    <SInput label="Nombre de sorties" field="sorties" placeholder="Ex : 3" form={form} upd={upd}/>
                    <SInput label="Largeur sorties (m)" field="largeurSorties" placeholder="Ex : 1.40" form={form} upd={upd}/>
                    <SInput label="Nombre d'escaliers" field="nbEscaliers" placeholder="Ex : 1" form={form} upd={upd}/>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                    <button className="btn-ghost" onClick={()=>setStep(2)}>← Retour</button>
                    <button className="btn-primary" onClick={()=>setStep(4)}>Suivant →</button>
                  </div>
                </div>
              )}

              {step===4&&(
                <div>
                  <div style={{marginBottom:22}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.8,marginBottom:12}}>Moyens de secours</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}} className="grid-2">
                      {Object.entries(MOYENS).map(([k,label])=>(
                        <div key={k} onClick={()=>togM(k)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,cursor:"pointer",background:form.moyens[k]?"rgba(239,68,68,.08)":"#0d0d1a",border:`1px solid ${form.moyens[k]?"#ef4444":"#2a2a3a"}`,transition:"all .2s"}}>
                          <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${form.moyens[k]?"#ef4444":"#3a3a5a"}`,background:form.moyens[k]?"#ef4444":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
                            {form.moyens[k]&&<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{fontSize:12.5,color:form.moyens[k]?"#ef4444":"#64748b",fontWeight:form.moyens[k]?600:400}}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="grid-2">
                    <div className="field">
                      <label>Type d'alarme</label>
                      <select value={form.typeAlarme} onChange={e=>upd("typeAlarme",e.target.value)} style={{padding:"10px 13px",border:"1px solid #2a2a3a",borderRadius:8,fontSize:13.5,width:"100%",fontFamily:"inherit",background:"#0d0d1a",color:"#e2e8f0"}}>
                        <option value="">Choisir</option>
                        <option>Type 1 (SSI catégorie A)</option>
                        <option>Type 2a (centralisé)</option>
                        <option>Type 2b (centralisé simplifié)</option>
                        <option>Type 3 (diffusion)</option>
                        <option>Type 4 (autonome)</option>
                      </select>
                    </div>
                    <SInput label="Chauffage (nature)" field="chauffageNature" placeholder="Ex : Gaz naturel, PAC" form={form} upd={upd}/>
                    <SInput label="Puissance cuisine (kW)" field="cuisinePuissance" placeholder="Ex : 45" form={form} upd={upd}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="grid-2">
                    <SInput label="Dernière visite commission" field="derniereVisite" type="date" form={form} upd={upd}/>
                    <SInput label="Prochaine visite prévue" field="prochaineVisite" type="date" form={form} upd={upd}/>
                  </div>
                  <div className="field" style={{marginBottom:20}}>
                    <label>Observations complémentaires</label>
                    <textarea value={form.observations} onChange={e=>upd("observations",e.target.value)} rows={3} placeholder="Travaux en cours, dérogations, observations…" style={{resize:"vertical"}}/>
                  </div>
                  {error&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid #ef444444",borderRadius:8,padding:"11px 15px",marginBottom:18,color:"#fca5a5",fontSize:13}}>{error}</div>}
                  <div style={{display:"flex",gap:10}}>
                    <button className="btn-ghost" onClick={()=>setStep(3)}>← Retour</button>
                    <button className="btn-primary" onClick={generate} disabled={loading} style={{display:"flex",alignItems:"center",gap:10,opacity:loading?.7:1,cursor:loading?"not-allowed":"pointer"}}>
                      {loading?(<><div style={{width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>Génération Opus 4.6…</>):"Générer la notice →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── VUE DÉTAIL ────────────────────────────────────────────────────────────
  if(view==="detail"&&open){
    const info=CATEGORIES_ERP[open.typeERP]||{};
    return(
      <Layout title={open.nom} back={()=>setView("notices")}>
        <div className="fade-up">
          {/* Header notice */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}} className="mobile-stack">
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:48,height:48,background:"rgba(239,68,68,.12)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{info.icon||"🏢"}</div>
              <div>
                <h1 style={{margin:0,fontSize:20,fontWeight:700,color:"#f1f5f9",fontFamily:"'Space Grotesk',sans-serif"}}>{open.nom}</h1>
                <div style={{fontSize:12,color:"#64748b",marginTop:3}}>{open.typeERP?.split("—")[0]?.trim()} · Cat. {open.categorie} · {open.cp} {open.ville}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8"}}>
              <button onClick={()=>exportPDF(open)} className="btn-ghost" style={{fontSize:13}}>🖨️ Imprimer / PDF</button>
              <button onClick={()=>{if(confirm("Supprimer cette notice ?"))del(open.id);}} style={{padding:"10px 16px",background:"rgba(239,68,68,.1)",border:"1px solid #ef444433",color:"#ef4444",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600,transition:"all .2s"}}>✕ Supprimer</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{borderBottom:"1px solid #1e1e2e",marginBottom:22,display:"flex",gap:0,overflowX:"auto"}}>
            {["notice","plan","checklist"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} className={`tab-btn ${tab===t?"active":""}`}>
                {t==="notice"?"📄 Notice":t==="plan"?"🗺️ Plan d'évacuation":"✅ Checklist"}
              </button>
            ))}
          </div>

          {tab==="notice"&&(
            <div className="card" style={{padding:28}}>
              {open.noticeText?<RenderNotice text={open.noticeText}/>:<p style={{color:"#64748b",fontStyle:"italic"}}>Aucun contenu généré.</p>}
            </div>
          )}

          {tab==="plan"&&(
            <div className="card" style={{padding:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <h3 style={{margin:0,fontSize:14,fontWeight:700,color:"#e2e8f0",fontFamily:"'Space Grotesk',sans-serif"}}>Plan d'évacuation interactif</h3>
                <button onClick={savePlan} className="btn-primary" style={{fontSize:12,padding:"8px 16px"}}>💾 Sauvegarder</button>
              </div>
              <PlanEvacuation plan={plan} setPlan={setPlan}/>
            </div>
          )}

          {tab==="checklist"&&(
            <div className="card" style={{padding:24}}>
              <h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:"#e2e8f0",fontFamily:"'Space Grotesk',sans-serif"}}>Checklist de maintenance périodique</h3>
              <Checklist noticeId={open.id}/>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return null;
}
