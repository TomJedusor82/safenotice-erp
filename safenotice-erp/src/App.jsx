import { useState } from "react";

// ─── DONNÉES RÉGLEMENTAIRES (source: arrêté 25 juin 1980 + service-public.fr) ──
const CATEGORIES_ERP = {
  "N — Restauration / Débits de boissons": { icon: "🍽️", code: "N", desc: "Restaurants, cafés, brasseries" },
  "M — Magasins / Centres commerciaux":    { icon: "🛍️", code: "M", desc: "Commerces, grandes surfaces" },
  "R — Enseignement / Formation":          { icon: "🎓", code: "R", desc: "Écoles, collèges, lycées, universités" },
  "O — Hôtels / Hébergements":             { icon: "🏨", code: "O", desc: "Hôtels, résidences, pensions" },
  "L — Salles de spectacles / Conférences":{ icon: "🎭", code: "L", desc: "Salles de réunion, conférences, spectacles" },
  "W — Administration / Bureaux":          { icon: "🏢", code: "W", desc: "Banques, bureaux ouverts au public" },
  "X — Établissements sportifs couverts":  { icon: "🏋️", code: "X", desc: "Gymnases, salles de sport" },
  "U — Établissements sanitaires":         { icon: "🏥", code: "U", desc: "Cliniques, cabinets médicaux" },
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

// Chapitres officiels art. GE2 / modèle préfectoral
const MOYENS = {
  extincteurs:         "Extincteurs portatifs",
  robinetIncendie:     "Robinets d'incendie armés (RIA ø 19/6)",
  sprinklers:          "Installation fixe extinction automatique (sprinklers)",
  detecteurFumee:      "Système de détection incendie (SDI)",
  ssi:                 "Système de sécurité incendie (SSI cat. A)",
  eclairageSecours:    "Éclairage de sécurité (BAES/BAEH)",
  desenfumage:         "Désenfumage naturel ou mécanique",
  portesCoupe:         "Portes coupe-feu (PF/CF)",
  exutoires:           "Exutoires de toiture (désenfumage)",
  colonneSeche:        "Colonne sèche / humide",
};

// Checklist basée sur obligations réglementaires ERP
const CHECKLIST = {
  "Mensuel": [
    { id:"m1", label:"Vérification visuelle extincteurs (pression manomètre, goupille, sceau)" },
    { id:"m2", label:"Test des blocs autonomes d'éclairage de sécurité (BAES) — 1h en mode secours" },
    { id:"m3", label:"Contrôle signalétique d'évacuation et balisage (lisibilité, fixation)" },
    { id:"m4", label:"Essai sirène / alarme incendie (hors présence public si possible)" },
    { id:"m5", label:"Vérification dégagement des issues de secours (aucun obstacle)" },
    { id:"m6", label:"Contrôle du registre de sécurité (mise à jour, présence)" },
  ],
  "Trimestriel": [
    { id:"t1", label:"Exercice d'évacuation (obligatoire : 2 fois/an pour ERP cat. 1-4)" },
    { id:"t2", label:"Contrôle des portes coupe-feu (fermeture automatique, absence de calage)" },
    { id:"t3", label:"Vérification des colonnes sèches / humides (bouchons, état)" },
    { id:"t4", label:"Contrôle tableau de signalisation incendie — TSI / SSI" },
    { id:"t5", label:"Test déclencheurs manuels d'alarme incendie (tous les DM)" },
  ],
  "Annuel": [
    { id:"a1", label:"Vérification extincteurs par technicien agréé (NF EN 3 / NFS 61-919)" },
    { id:"a2", label:"Maintenance système de détection / SSI par organisme compétent" },
    { id:"a3", label:"Vérification des installations électriques par organisme agréé" },
    { id:"a4", label:"Vérification installations gaz (si applicable — arrêté 25/06/1980 art. GZ)" },
    { id:"a5", label:"Contrôle désenfumage / exutoires (ouverture, étanchéité)" },
    { id:"a6", label:"Vérification BAES (test 8h autonomie conforme NFC 71-800)" },
    { id:"a7", label:"Formation ou recyclage du personnel à la sécurité incendie" },
    { id:"a8", label:"Révision et mise à jour du plan d'évacuation affiché" },
    { id:"a9", label:"Mise à jour du registre de sécurité (synthèse annuelle)" },
  ],
  "Périodique (≥ 3 ans)": [
    { id:"p1", label:"Visite de la commission de sécurité (ERP cat. 1 à 4 — fréquence selon catégorie)" },
    { id:"p2", label:"Vérification moyens de secours par bureau de contrôle agréé" },
    { id:"p3", label:"Audit complet de conformité réglementaire ERP (CCH art. R143-2 à R143-47)" },
    { id:"p4", label:"Renouvellement de l'autorisation d'ouverture si travaux importants" },
  ],
};

const EMPTY = {
  typeERP:"", nom:"", adresse:"", ville:"", cp:"",
  responsable:"", tel:"", email:"", categorie:"", capacite:"",
  niveaux:"1", surface:"", locaux:[], risques:[],
  moyens:{ extincteurs:true, robinetIncendie:false, sprinklers:false, detecteurFumee:true, ssi:false, eclairageSecours:true, desenfumage:false, portesCoupe:false, exutoires:false, colonneSeche:false },
  nbFacadesAccessibles:"", largeurVoie:"", typeIsolement:"",
  resistanceFeu:"", natureMateriauxPlafond:"", natureMateriauxMurs:"", natureMateriauxSol:"",
  sorties:"", largeurSorties:"", nbEscaliers:"", largeurEscaliers:"",
  chauffageNature:"", cuisinePuissance:"",
  typeAlarme:"", derniereVisite:"", prochaineVisite:"", observations:"",
};

// ─── PLAN D'ÉVACUATION ─────────────────────────────────────────────────────────
const CELL=22, COLS=34, ROWS=20;
const PLAN_TOOLS=[
  {id:"wall",  label:"Mur",            color:"#1e3a5f"},
  {id:"exit",  label:"Sortie secours", color:"#16a34a", icon:"🚪"},
  {id:"fire",  label:"Extincteur",     color:"#dc2626", icon:"🧯"},
  {id:"alarm", label:"Déclencheur",    color:"#d97706", icon:"🔔"},
  {id:"rally", label:"Point de rassemblement", color:"#0369a1", icon:"🟢"},
  {id:"stair", label:"Escalier",       color:"#7c3aed", icon:"🔼"},
  {id:"room",  label:"Local",          color:"#475569"},
];
const gc=(type)=>PLAN_TOOLS.find(t=>t.id===type)?.color||"#000";
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
          <button key={t.id} onClick={()=>setTool(t.id)} style={{padding:"5px 12px",borderRadius:4,fontSize:12,fontWeight:600,cursor:"pointer",border:`1.5px solid ${tool===t.id?t.color:"#cbd5e1"}`,background:tool===t.id?`${t.color}15`:"#fff",color:tool===t.id?t.color:"#64748b",transition:"all .15s"}}>{t.label}</button>
        ))}
        <button onClick={()=>setPlan({})} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:4,fontSize:12,background:"#fff",border:"1.5px solid #e2e8f0",color:"#94a3b8",cursor:"pointer"}}>Effacer tout</button>
      </div>
      {showLabel&&(
        <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
          <input autoFocus value={roomName} onChange={e=>setRoomName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&confirmRoom()} placeholder="Nom du local" style={{padding:"8px 12px",border:"1.5px solid #cbd5e1",borderRadius:6,fontSize:13,outline:"none",width:200}}/>
          <button onClick={confirmRoom} style={{padding:"8px 16px",background:"#0a2342",color:"#fff",border:"none",borderRadius:6,fontSize:13,cursor:"pointer"}}>Ajouter</button>
          <button onClick={()=>{setShowLabel(false);setPending(null);}} style={{padding:"8px 12px",background:"#f1f5f9",border:"none",borderRadius:6,fontSize:13,cursor:"pointer",color:"#64748b"}}>✕</button>
        </div>
      )}
      <div style={{overflowX:"auto",userSelect:"none"}}>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${COLS},${CELL}px)`,border:"1.5px solid #e2e8f0",borderRadius:8,background:"#f8fafc",width:"fit-content"}}
          onMouseLeave={()=>{setDrawing(false);setStart(null);}}>
          {Array.from({length:ROWS},(_,r)=>Array.from({length:COLS},(_,c)=>{
            const key=ck(r,c),cell=plan[key];
            return(
              <div key={key}
                onMouseDown={()=>{setDrawing(true);if(tool==="wall")setStart({r,c});else paint(r,c);}}
                onMouseUp={()=>{if(drawing&&tool==="wall"&&start)fillRect(start.r,start.c,r,c);setDrawing(false);setStart(null);}}
                onMouseEnter={()=>{if(drawing&&tool!=="wall")paint(r,c);}}
                style={{width:CELL,height:CELL,boxSizing:"border-box",border:"1px solid #e8eef4",background:cell?(cell.type==="wall"?gc("wall"):`${gc(cell.type)}22`):"transparent",cursor:"crosshair",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>
                {cell&&cell.type!=="wall"&&(
                  <span style={{fontSize:cell.type==="room"?7:11}}>
                    {cell.type==="room"?(cell.label?.slice(0,5)||"▪"):PLAN_TOOLS.find(t=>t.id===cell.type)?.icon}
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
            <div style={{width:10,height:10,borderRadius:2,background:t.color}}/>{t.label}
          </div>
        ))}
      </div>
      <p style={{fontSize:11,color:"#94a3b8",marginTop:6}}>Clic pour placer · Glisser pour tracer des murs · Re-cliquer pour effacer</p>
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
  const sc=pct===100?"#16a34a":pct>=75?"#d97706":pct>=40?"#2563eb":"#94a3b8";

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24,background:"#f8fafc",borderRadius:10,padding:"16px 20px",border:"1px solid #e2e8f0"}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:600,color:"#0a2342"}}>Progression globale</span>
            <span style={{fontSize:13,fontWeight:700,color:sc}}>{done}/{total} vérifications</span>
          </div>
          <div style={{background:"#e2e8f0",borderRadius:99,height:8,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,#1e40af,${sc})`,borderRadius:99,transition:"width .4s ease"}}/>
          </div>
        </div>
        <div style={{textAlign:"center",minWidth:64}}>
          <div style={{fontSize:26,fontWeight:800,color:sc,lineHeight:1}}>{pct}%</div>
          <div style={{fontSize:10,color:sc,marginTop:2,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{pct===100?"Conforme":pct>=75?"Presque":"En cours"}</div>
        </div>
      </div>
      {Object.entries(CHECKLIST).map(([freq,items])=>(
        <div key={freq} style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h4 style={{fontSize:12,fontWeight:700,color:"#1e40af",textTransform:"uppercase",letterSpacing:1,margin:0}}>{freq}</h4>
            <span style={{fontSize:11,color:"#94a3b8",background:"#f1f5f9",padding:"2px 8px",borderRadius:99}}>{items.filter(i=>checks[i.id]).length}/{items.length}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {items.map(item=>(
              <div key={item.id} onClick={()=>toggle(item.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderRadius:8,cursor:"pointer",background:checks[item.id]?"#f0fdf4":"#fff",border:`1px solid ${checks[item.id]?"#86efac":"#e2e8f0"}`,transition:"all .2s",boxShadow:"0 1px 2px rgba(0,0,0,.04)"}}>
                <div style={{width:20,height:20,borderRadius:4,flexShrink:0,border:`2px solid ${checks[item.id]?"#16a34a":"#cbd5e1"}`,background:checks[item.id]?"#16a34a":"#fff",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
                  {checks[item.id]&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{fontSize:13,color:checks[item.id]?"#15803d":"#374151",textDecoration:checks[item.id]?"line-through":"none",lineHeight:1.4}}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {pct===100&&(
        <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:"16px 20px",color:"#15803d",fontSize:14,fontWeight:600,textAlign:"center",marginTop:8}}>
          ✓ Vérification complète — À archiver dans le registre de sécurité (CCH art. R143-47)
        </div>
      )}
      <div style={{marginTop:16,padding:"12px 16px",background:"#eff6ff",borderRadius:8,border:"1px solid #bfdbfe",fontSize:11,color:"#1e40af"}}>
        <strong>Référence :</strong> Arrêté du 25 juin 1980 modifié (dernière mise à jour : arrêté du 29 juillet 2025) — CCH art. R143-2 à R143-47 — Service-public.fr
      </div>
    </div>
  );
}

// ─── RENDU NOTICE ─────────────────────────────────────────────────────────────
function RenderNotice({text}){
  if(!text)return null;
  return text.split("\n").map((line,i)=>{
    if(line.startsWith("# "))  return <h1 key={i} style={{fontSize:22,fontWeight:700,color:"#0a2342",borderBottom:"2px solid #1e40af",paddingBottom:10,margin:"28px 0 14px",fontFamily:"'Playfair Display',Georgia,serif"}}>{line.slice(2)}</h1>;
    if(line.startsWith("## ")) return <h2 key={i} style={{fontSize:16,fontWeight:700,color:"#1e3a5f",margin:"22px 0 8px",fontFamily:"'Playfair Display',Georgia,serif"}}>{line.slice(3)}</h2>;
    if(line.startsWith("### "))return <h3 key={i} style={{fontSize:14,fontWeight:600,color:"#1e40af",margin:"16px 0 6px"}}>{line.slice(4)}</h3>;
    if(line.startsWith("---"))return <hr key={i} style={{border:"none",borderTop:"1px solid #e2e8f0",margin:"18px 0"}}/>;
    if(line.startsWith("- ")) return <div key={i} style={{paddingLeft:20,marginBottom:5,color:"#374151",fontSize:14,display:"flex",gap:8,alignItems:"flex-start"}}><span style={{color:"#1e40af",marginTop:2,flexShrink:0}}>▸</span>{line.slice(2)}</div>;
    if(line.trim()==="")      return <div key={i} style={{height:8}}/>;
    return <p key={i} style={{marginBottom:7,color:"#374151",fontSize:14,lineHeight:1.7}}>{line.replace(/\*\*(.+?)\*\*/g,"$1")}</p>;
  });
}

// ─── EXPORT PDF ───────────────────────────────────────────────────────────────
function exportPDF(n){
  const win=window.open("","_blank");
  const code=CATEGORIES_ERP[n.typeERP]?.code||"";
  const html=`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Notice de Sécurité ERP — ${n.nom}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;color:#1e293b;font-size:11pt;line-height:1.7;background:#fff}
.cover{background:linear-gradient(135deg,#0a2342 0%,#1e3a5f 60%,#1e40af 100%);color:#fff;padding:70px 60px;page-break-after:always}
.cover-logo{display:flex;align-items:center;gap:12px;margin-bottom:48px;opacity:.9}.cover-logo-icon{width:40px;height:40px;background:rgba(255,255,255,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px}.cover-logo-name{font-size:14pt;font-weight:700;letter-spacing:1px}
.cover-badge{display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);color:rgba(255,255,255,.85);padding:5px 14px;border-radius:3px;font-size:8pt;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px}
.cover h1{font-family:'Playfair Display',Georgia,serif;font-size:30pt;font-weight:700;margin-bottom:8px;line-height:1.2}
.cover h2{font-size:13pt;font-weight:400;opacity:.7;margin-bottom:12px}
.cover-ref{font-size:9pt;opacity:.5;margin-bottom:40px}
.cover-divider{width:60px;height:3px;background:#60a5fa;margin-bottom:40px;border-radius:2px}
.cover-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.cover-item{background:rgba(255,255,255,.07);border-left:3px solid #60a5fa;padding:12px 16px;border-radius:0 6px 6px 0}
.cover-item .lbl{font-size:8pt;opacity:.55;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}.cover-item .val{font-size:11pt;font-weight:600}
.content{padding:50px 60px}
h1{font-family:'Playfair Display',Georgia,serif;font-size:18pt;color:#0a2342;border-bottom:2px solid #1e40af;padding-bottom:8px;margin:32px 0 14px}
h2{font-family:'Playfair Display',Georgia,serif;font-size:13pt;color:#1e3a5f;margin:22px 0 10px}
h3{font-size:11pt;color:#1e40af;margin:14px 0 7px;font-weight:600}
p{margin-bottom:8px}li{margin-bottom:5px;padding-left:4px}
ul{margin:8px 0 8px 16px;list-style:none}ul li::before{content:"▸ ";color:#1e40af}
hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}
strong{color:#0a2342;font-weight:600}
.footer{background:#0a2342;color:rgba(255,255,255,.45);display:flex;justify-content:space-between;padding:16px 60px;font-size:8pt;margin-top:60px}
.legal-note{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;margin-top:32px;font-size:9pt;color:#64748b}
@media print{.cover,.footer{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-size:10pt}}
</style></head><body>
<div class="cover">
  <div class="cover-logo"><div class="cover-logo-icon">🛡️</div><div class="cover-logo-name">NOTICESECUR</div></div>
  <div class="cover-badge">Notice de Sécurité ERP — Art. GE2</div>
  <h1>${n.nom}</h1>
  <h2>Type ${code} · Catégorie ${n.categorie||"N/A"} · ${n.typeERP?.split("—")[0]?.trim()||""}</h2>
  <div class="cover-ref">Réf. : Arrêté du 25 juin 1980 modifié · CCH art. R143-22 · Cerfa n°13824</div>
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
<div class="legal-note">
  <strong>Références réglementaires :</strong> Code de la Construction et de l'Habitation (CCH) art. R143-2 à R143-47 · Arrêté du 25 juin 1980 modifié portant approbation des dispositions générales du règlement de sécurité ERP (dernière modification : arrêté du 29 juillet 2025) · Service-public.fr · mon-erp.fr
</div>
</div>
<div class="footer"><span>NoticeSecur · noticesecur.fr</span><span>Document à verser au registre de sécurité ERP</span><span>Édité le ${new Date().toLocaleDateString("fr-FR")}</span></div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
  win.document.write(html);win.document.close();
}

// ─── APP ──────────────────────────────────────────────────────────────────────
const LS="ns_v2_notices";
const load=()=>{try{return JSON.parse(localStorage.getItem(LS)||"[]");}catch{return[];}};
const save=(n)=>{try{localStorage.setItem(LS,JSON.stringify(n));}catch{}};

// ─── COMPOSANTS SORTIS DU RENDER POUR ÉVITER RE-MOUNT AU KEYSTROKE ────────────
function SInput({label, field, placeholder, type="text", form, upd}){
  return(
    <div className="field">
      <label>{label}</label>
      <input type={type} value={form[field]} onChange={e=>upd(field,e.target.value)} placeholder={placeholder}/>
    </div>
  );
}

function Header({title, sub, back, onNew}){
  return(
    <div style={{background:"linear-gradient(135deg,#0a2342 0%,#1e3a5f 100%)",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
      <div style={{maxWidth:1080,margin:"0 auto",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:68}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {back&&<button onClick={back} style={{background:"transparent",border:"none",color:"rgba(255,255,255,.55)",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:5}}>← Accueil</button>}
          {back&&<div style={{width:1,height:18,background:"rgba(255,255,255,.15)"}}/>}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,background:"rgba(255,255,255,.1)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>🛡️</div>
            <div><div style={{fontWeight:700,fontSize:title?15:17,color:"#fff",letterSpacing:.5,fontFamily:title?"inherit":"'Playfair Display',Georgia,serif"}}>{title||"NoticeSecur"}</div><div style={{fontSize:11,color:"rgba(255,255,255,.45)",letterSpacing:.3}}>{sub||"Notices de sécurité ERP"}</div></div>
          </div>
        </div>
        {!back&&<button className="btn-primary" onClick={onNew}>+ Nouvelle notice</button>}
      </div>
    </div>
  );
}

export default function NoticeSecur(){
  const [notices,setNotices]=useState(load);
  const [view,setView]=useState("home");
  const [step,setStep]=useState(1);
  const [form,setForm]=useState(EMPTY);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [open,setOpen]=useState(null);
  const [tab,setTab]=useState("notice");
  const [plan,setPlan]=useState({});

  const upd=(f,v)=>setForm(p=>({...p,[f]:v}));
  const tog=(f,v)=>setForm(p=>({...p,[f]:p[f].includes(v)?p[f].filter(x=>x!==v):[...p[f],v]}));
  const togM=(k)=>setForm(p=>({...p,moyens:{...p.moyens,[k]:!p.moyens[k]}}));

  const generate=async()=>{
    setLoading(true);setError(null);
    const ma=Object.entries(form.moyens).filter(([,v])=>v).map(([k])=>MOYENS[k]).join(", ");
    const code=CATEGORIES_ERP[form.typeERP]?.code||"";
    const prompt=`Tu es un expert en sécurité incendie et réglementation ERP en France (arrêté du 25 juin 1980 modifié, CCH art. R143-2 à R143-47). Génère une notice de sécurité ERP professionnelle, conforme à l'article GE2 de l'arrêté du 25 juin 1980.

DONNÉES DE L'ÉTABLISSEMENT :
- Raison sociale : ${form.nom}
- Type ERP : ${form.typeERP} (code ${code}) | Catégorie : ${form.categorie}
- Adresse : ${form.adresse}, ${form.cp} ${form.ville}
- Responsable/exploitant : ${form.responsable} | Tél : ${form.tel} | Email : ${form.email}
- Capacité maximale : ${form.capacite} personnes | Niveaux : ${form.niveaux} | Surface totale : ${form.surface} m²
- Locaux : ${form.locaux.join(", ")}
- Risques identifiés : ${form.risques.join(", ")}
- Moyens de secours : ${ma}
- Façades accessibles engins pompiers : ${form.nbFacadesAccessibles}
- Largeur voie de desserte : ${form.largeurVoie} m
- Résistance au feu structure : ${form.resistanceFeu}
- Natures matériaux : plafonds ${form.natureMateriauxPlafond}, murs ${form.natureMateriauxMurs}, sol ${form.natureMateriauxSol}
- Sorties de secours : ${form.sorties} | Largeur sorties : ${form.largeurSorties} m
- Escaliers : ${form.nbEscaliers} | Largeur escaliers : ${form.largeurEscaliers} m
- Chauffage : ${form.chauffageNature}
- Cuisine (puissance) : ${form.cuisinePuissance} kW
- Type d'alarme : ${form.typeAlarme}
- Dernière visite commission : ${form.derniereVisite} | Prochaine : ${form.prochaineVisite}
- Observations : ${form.observations||"Aucune"}

Génère la notice COMPLÈTE selon la structure obligatoire de l'article GE2 :

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

Pour chaque chapitre, cite les articles du règlement de sécurité applicables (CO, DF, CH, GZ, EL, EC, MS…). Sois précis et professionnel.`;
    try{
      const apiKey=process.env.REACT_APP_ANTHROPIC_API_KEY||"";
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      if(data.error)throw new Error(data.error.message);
      const text=data.content?.map(i=>i.text||"").join("\n")||"";
      const nn={...form,id:Date.now().toString(),noticeText:text,savedAt:new Date().toLocaleDateString("fr-FR"),planData:{}};
      const u=[nn,...notices];setNotices(u);save(u);
      setOpen(nn);setPlan({});setTab("notice");setView("detail");
    }catch(e){setError(`Erreur : ${e.message||"Veuillez réessayer."}`);}
    finally{setLoading(false);}
  };

  const del=(id)=>{const u=notices.filter(n=>n.id!==id);setNotices(u);save(u);if(open?.id===id)setView("home");};
  const savePlan=()=>{const u=notices.map(n=>n.id===open.id?{...n,planData:plan}:n);setNotices(u);save(u);setOpen(p=>({...p,planData:plan}));};

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *{box-sizing:border-box;}body{margin:0;background:#f0f4f8;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
    @keyframes spin{to{transform:rotate(360deg);}}
    .fade-up{animation:fadeUp .35s ease forwards;}
    input:focus,textarea:focus,select:focus{border-color:#1e40af!important;box-shadow:0 0 0 3px rgba(30,64,175,.1)!important;outline:none;}
    ::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:#f1f5f9;}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px;}
    .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);}
    .btn-primary{background:linear-gradient(135deg,#1e3a5f,#1e40af);color:#fff;border:none;border-radius:8px;padding:11px 28px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;letter-spacing:.2px;transition:all .2s;box-shadow:0 2px 8px rgba(30,64,175,.25);}
    .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(30,64,175,.35);}
    .btn-ghost{background:#fff;border:1.5px solid #e2e8f0;color:#475569;border-radius:8px;padding:11px 20px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .2s;}
    .btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc;}
    .chip{padding:6px 14px;border-radius:20px;font-size:13px;cursor:pointer;transition:all .15s;user-select:none;}
    .chip-on{background:#eff6ff;border:1.5px solid #1e40af;color:#1e40af;font-weight:600;}
    .chip-off{background:#fff;border:1.5px solid #e2e8f0;color:#64748b;}
    .chip:hover{transform:translateY(-1px);}
    .field label{display:block;font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;letter-spacing:.7px;}
    .field input,.field textarea,.field select{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;color:#1e293b;font-family:inherit;background:#fff;transition:border-color .2s,box-shadow .2s;}
    .notice-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;display:flex;align-items:center;gap:20px;box-shadow:0 1px 4px rgba(0,0,0,.05);transition:all .2s;}
    .notice-card:hover{border-color:#bfdbfe;box-shadow:0 4px 16px rgba(30,64,175,.08);transform:translateY(-1px);}
    .tab-btn{padding:12px 20px;background:transparent;border:none;border-bottom:2px solid transparent;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap;}
    .tab-btn.active{border-bottom-color:#1e40af;color:#1e40af;}
    .section-title{font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;}
  `;

  // ── ACCUEIL ────────────────────────────────────────────────────────────────
  if(view==="home") return(
    <div style={{minHeight:"100vh",background:"#f0f4f8",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{css}</style>
      <Header onNew={()=>{setForm(EMPTY);setStep(1);setView("new");}}/>
      <div style={{maxWidth:1080,margin:"0 auto",padding:"36px 32px"}}>
        {!process.env.REACT_APP_ANTHROPIC_API_KEY&&(
          <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:10,padding:"14px 20px",marginBottom:24,color:"#92400e",fontSize:13,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span>⚠️</span><span>Variable <code style={{background:"#fef3c7",padding:"1px 6px",borderRadius:3}}>REACT_APP_ANTHROPIC_API_KEY</code> non configurée. Ajoutez votre clé dans les variables d'environnement Vercel pour activer la génération IA.</span>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:700,color:"#0a2342",margin:"0 0 4px",fontFamily:"'Playfair Display',Georgia,serif"}}>Mes notices de sécurité</h1>
            <p style={{color:"#64748b",margin:0,fontSize:14}}>{notices.length} notice{notices.length!==1?"s":""} enregistrée{notices.length!==1?"s":""} — Réf. Arrêté 25 juin 1980 modifié</p>
          </div>
        </div>
        {notices.length===0?(
          <div className="card fade-up" style={{padding:"64px 32px",textAlign:"center"}}>
            <div style={{width:72,height:72,background:"#eff6ff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 20px"}}>🛡️</div>
            <h3 style={{fontSize:18,fontWeight:700,color:"#0a2342",margin:"0 0 10px",fontFamily:"'Playfair Display',Georgia,serif"}}>Aucune notice pour le moment</h3>
            <p style={{color:"#64748b",margin:"0 0 6px",fontSize:14}}>Créez votre première notice de sécurité ERP conforme à l'article GE2.</p>
            <p style={{color:"#94a3b8",margin:"0 0 24px",fontSize:12}}>Sources : Légifrance · service-public.fr · mon-erp.fr</p>
            <button className="btn-primary" onClick={()=>{setForm(EMPTY);setStep(1);setView("new");}}>Créer ma première notice</button>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {notices.map(n=>{
              const info=CATEGORIES_ERP[n.typeERP]||{};
              return(
                <div key={n.id} className="notice-card">
                  <div style={{width:48,height:48,background:"#eff6ff",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{info.icon||"🏢"}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:16,color:"#0a2342",marginBottom:3,fontFamily:"'Playfair Display',Georgia,serif"}}>{n.nom||"Sans nom"}</div>
                    <div style={{fontSize:13,color:"#64748b"}}>{n.typeERP}{n.adresse?` · ${n.adresse}`:""}{n.ville?`, ${n.ville}`:""} · {n.savedAt}</div>
                    <div style={{display:"flex",gap:6,marginTop:7,flexWrap:"wrap"}}>
                      {n.categorie&&<span style={{background:"#eff6ff",color:"#1e40af",padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:600}}>Cat. {n.categorie}</span>}
                      {n.capacite&&<span style={{background:"#f8fafc",color:"#475569",padding:"2px 9px",borderRadius:99,fontSize:11,border:"1px solid #e2e8f0"}}>{n.capacite} pers.</span>}
                      {info.code&&<span style={{background:"#faf5ff",color:"#7c3aed",padding:"2px 9px",borderRadius:99,fontSize:11,border:"1px solid #e9d5ff"}}>Type {info.code}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <button className="btn-ghost" onClick={()=>{setOpen(n);setPlan(n.planData||{});setTab("notice");setView("detail");}} style={{fontSize:13,padding:"8px 16px"}}>Ouvrir</button>
                    <button onClick={()=>exportPDF(n)} style={{background:"#eff6ff",border:"1.5px solid #bfdbfe",color:"#1e40af",borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer",fontWeight:600}}>PDF</button>
                    <button onClick={()=>del(n.id)} style={{background:"#fff",border:"1.5px solid #e2e8f0",color:"#cbd5e1",borderRadius:8,padding:"8px 12px",fontSize:13,cursor:"pointer"}}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── CRÉATION ───────────────────────────────────────────────────────────────
  if(view==="new"){
    const steps=["Type ERP","Identification","Construction & Dégagements","Sécurité"];
    return(
      <div style={{minHeight:"100vh",background:"#f0f4f8",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
        <style>{css}</style>
        <div style={{background:"linear-gradient(135deg,#0a2342 0%,#1e3a5f 100%)",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{maxWidth:820,margin:"0 auto",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:68}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <button onClick={()=>setView("home")} style={{background:"transparent",border:"none",color:"rgba(255,255,255,.55)",cursor:"pointer",fontSize:13}}>← Accueil</button>
              <div style={{width:1,height:18,background:"rgba(255,255,255,.15)"}}/>
              <div style={{fontWeight:600,fontSize:15,color:"#fff"}}>Nouvelle notice — Art. GE2</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              {steps.map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,background:step>i+1?"#60a5fa":step===i+1?"rgba(255,255,255,.15)":"transparent",border:`2px solid ${step>=i+1?"#60a5fa":"rgba(255,255,255,.2)"}`,color:step>=i+1?"#fff":"rgba(255,255,255,.3)"}}>
                    {step>i+1?"✓":i+1}
                  </div>
                  <span style={{fontSize:10,color:step===i+1?"#fff":"rgba(255,255,255,.3)",fontWeight:step===i+1?600:400,display:step===i+1?"block":"none"}}>{s}</span>
                  {i<steps.length-1&&<div style={{width:12,height:1,background:"rgba(255,255,255,.15)"}}/>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{maxWidth:820,margin:"0 auto",padding:"36px 32px"}} className="fade-up">

          {/* ── ÉTAPE 1 : TYPE ERP ── */}
          {step===1&&(
            <div>
              <div style={{marginBottom:24}}>
                <h2 style={{fontSize:24,fontWeight:700,color:"#0a2342",margin:"0 0 6px",fontFamily:"'Playfair Display',Georgia,serif"}}>Type d'établissement (art. GN1)</h2>
                <p style={{color:"#64748b",margin:0,fontSize:14}}>Classification selon l'arrêté du 25 juin 1980 — Livre Ier, article GN 1.</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:32}}>
                {Object.entries(CATEGORIES_ERP).map(([type,info])=>(
                  <div key={type} onClick={()=>upd("typeERP",type)} style={{background:"#fff",border:`2px solid ${form.typeERP===type?"#1e40af":"#e2e8f0"}`,borderRadius:12,padding:"18px 20px",cursor:"pointer",transition:"all .2s",boxShadow:form.typeERP===type?"0 4px 16px rgba(30,64,175,.15)":"0 1px 3px rgba(0,0,0,.04)"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                      <span style={{fontSize:24,flexShrink:0}}>{info.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#0a2342",marginBottom:3}}>{type}</div>
                        <div style={{fontSize:11,color:"#64748b"}}>{info.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={()=>form.typeERP&&setStep(2)} style={{opacity:form.typeERP?1:.4}}>Continuer →</button>
            </div>
          )}

          {/* ── ÉTAPE 2 : IDENTIFICATION ── */}
          {step===2&&(
            <div>
              <h2 style={{fontSize:24,fontWeight:700,color:"#0a2342",margin:"0 0 6px",fontFamily:"'Playfair Display',Georgia,serif"}}>Renseignements administratifs</h2>
              <p style={{color:"#64748b",fontSize:14,marginBottom:24}}>Chapitre I de la notice réglementaire — identité de l'établissement.</p>
              <div className="card" style={{padding:24,marginBottom:14}}>
                <div className="section-title">Identification</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <SInput label="Raison sociale *" field="nom" placeholder="Ex : Restaurant Le Mistral" form={form} upd={upd}/>
                  <SInput label="Responsable / Exploitant *" field="responsable" placeholder="Nom et prénom" form={form} upd={upd}/>
                  <SInput label="Téléphone" field="tel" placeholder="06 00 00 00 00" form={form} upd={upd}/>
                  <SInput label="Email" field="email" placeholder="contact@etablissement.fr" form={form} upd={upd}/>
                </div>
              </div>
              <div className="card" style={{padding:24,marginBottom:14}}>
                <div className="section-title">Adresse</div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:14}}>
                  <SInput label="Adresse *" field="adresse" placeholder="12 rue de la Paix" form={form} upd={upd}/>
                  <SInput label="Code postal *" field="cp" placeholder="75001" form={form} upd={upd}/>
                  <SInput label="Ville *" field="ville" placeholder="Paris" form={form} upd={upd}/>
                </div>
              </div>
              <div className="card" style={{padding:24,marginBottom:24}}>
                <div className="section-title">Classement ERP</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:18}}>
                  <div className="field"><label>Catégorie ERP</label><select value={form.categorie} onChange={e=>upd("categorie",e.target.value)} style={{padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:14,width:"100%",fontFamily:"inherit"}}><option value="">Choisir</option><option value="1ère (+ 1500 pers.)">1ère (+ 1500 pers.)</option><option value="2ème (701 à 1500)">2ème (701 à 1500)</option><option value="3ème (301 à 700)">3ème (301 à 700)</option><option value="4ème (200 à 300)">4ème (200 à 300)</option><option value="5ème (seuils bas)">5ème (seuils bas)</option></select></div>
                  <SInput label="Capacité (pers.) *" field="capacite" placeholder="150" form={form} upd={upd}/>
                  <SInput label="Niveaux" field="niveaux" placeholder="2" form={form} upd={upd}/>
                  <SInput label="Surface totale (m²)" field="surface" placeholder="450" form={form} upd={upd}/>
                </div>
                <div className="section-title">Locaux concernés (art. GN1)</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {(LOCAUX_PAR_TYPE[form.typeERP]||[]).map(l=>(
                    <div key={l} className={`chip ${form.locaux.includes(l)?"chip-on":"chip-off"}`} onClick={()=>tog("locaux",l)}>{l}</div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:10}}><button className="btn-ghost" onClick={()=>setStep(1)}>← Retour</button><button className="btn-primary" onClick={()=>setStep(3)}>Continuer →</button></div>
            </div>
          )}

          {/* ── ÉTAPE 3 : CONSTRUCTION & DÉGAGEMENTS ── */}
          {step===3&&(
            <div>
              <h2 style={{fontSize:24,fontWeight:700,color:"#0a2342",margin:"0 0 6px",fontFamily:"'Playfair Display',Georgia,serif"}}>Construction, implantation & dégagements</h2>
              <p style={{color:"#64748b",fontSize:14,marginBottom:24}}>Chapitres II, III et IV de la notice — données techniques essentielles.</p>
              <div className="card" style={{padding:24,marginBottom:14}}>
                <div className="section-title">Chap. II — Implantation & desserte (art. CO 1-5)</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                  <SInput label="Façades accessibles (pompiers)" field="nbFacadesAccessibles" placeholder="Ex : 2" form={form} upd={upd}/>
                  <SInput label="Largeur voie desserte (m)" field="largeurVoie" placeholder="Ex : 6" form={form} upd={upd}/>
                  <div className="field"><label>Isolement par rapport aux tiers</label><select value={form.typeIsolement} onChange={e=>upd("typeIsolement",e.target.value)} style={{padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:14,width:"100%",fontFamily:"inherit"}}><option value="">Choisir</option><option>Bâtiment isolé</option><option>Contigu habitation</option><option>Contigu commerce</option><option>En vis-à-vis moins de 4m</option><option>En vis-à-vis 4-8m</option></select></div>
                </div>
              </div>
              <div className="card" style={{padding:24,marginBottom:14}}>
                <div className="section-title">Chap. III — Résistance au feu (art. CO 12-15)</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:14}}>
                  <div className="field"><label>Stabilité au feu structure</label><select value={form.resistanceFeu} onChange={e=>upd("resistanceFeu",e.target.value)} style={{padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:14,width:"100%",fontFamily:"inherit"}}><option value="">Choisir</option><option>SF 1/2h</option><option>SF 1h</option><option>SF 1h30</option><option>Non exigée</option></select></div>
                  <SInput label="Matériaux plafonds (M0-M4)" field="natureMateriauxPlafond" placeholder="Ex : M0 — BA13" form={form} upd={upd}/>
                  <SInput label="Matériaux murs (M0-M4)" field="natureMateriauxMurs" placeholder="Ex : M1 — enduit" form={form} upd={upd}/>
                  <SInput label="Matériaux sol (M0-M4)" field="natureMateriauxSol" placeholder="Ex : M3 — moquette" form={form} upd={upd}/>
                </div>
              </div>
              <div className="card" style={{padding:24,marginBottom:24}}>
                <div className="section-title">Chap. IV — Dégagements (art. CO 34-45)</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
                  <SInput label="Nombre de sorties" field="sorties" placeholder="Ex : 3" form={form} upd={upd}/>
                  <SInput label="Largeur sorties (m)" field="largeurSorties" placeholder="Ex : 1.40" form={form} upd={upd}/>
                  <SInput label="Nombre d'escaliers" field="nbEscaliers" placeholder="Ex : 2" form={form} upd={upd}/>
                  <SInput label="Largeur escaliers (m)" field="largeurEscaliers" placeholder="Ex : 1.20" form={form} upd={upd}/>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}><button className="btn-ghost" onClick={()=>setStep(2)}>← Retour</button><button className="btn-primary" onClick={()=>setStep(4)}>Continuer →</button></div>
            </div>
          )}

          {/* ── ÉTAPE 4 : SÉCURITÉ ── */}
          {step===4&&(
            <div>
              <h2 style={{fontSize:24,fontWeight:700,color:"#0a2342",margin:"0 0 6px",fontFamily:"'Playfair Display',Georgia,serif"}}>Risques & moyens de secours</h2>
              <p style={{color:"#64748b",fontSize:14,marginBottom:24}}>Chapitres V à IX — installations techniques et moyens de protection.</p>
              <div className="card" style={{padding:24,marginBottom:14}}>
                <div className="section-title">Risques identifiés</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {(RISQUES_PAR_TYPE[form.typeERP]||[]).map(r=>(
                    <div key={r} className={`chip ${form.risques.includes(r)?"chip-on":"chip-off"}`} onClick={()=>tog("risques",r)}>⚠ {r}</div>
                  ))}
                </div>
              </div>
              <div className="card" style={{padding:24,marginBottom:14}}>
                <div className="section-title">Chap. IX — Moyens de secours (art. MS)</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
                  {Object.entries(MOYENS).map(([k,label])=>(
                    <div key={k} onClick={()=>togM(k)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderRadius:8,cursor:"pointer",background:form.moyens[k]?"#eff6ff":"#f8fafc",border:`1.5px solid ${form.moyens[k]?"#bfdbfe":"#e2e8f0"}`,transition:"all .2s"}}>
                      <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${form.moyens[k]?"#1e40af":"#cbd5e1"}`,background:form.moyens[k]?"#1e40af":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
                        {form.moyens[k]&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{fontSize:13,color:form.moyens[k]?"#1e3a5f":"#64748b",fontWeight:form.moyens[k]?600:400}}>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div className="field"><label>Type d'alarme (art. MS 62)</label><select value={form.typeAlarme} onChange={e=>upd("typeAlarme",e.target.value)} style={{padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:14,width:"100%",fontFamily:"inherit"}}><option value="">Choisir</option><option>Type 1 (SSI catégorie A)</option><option>Type 2a (centralisé)</option><option>Type 2b (centralisé simplifié)</option><option>Type 3 (diffusion)</option><option>Type 4 (autonome)</option></select></div>
                  <SInput label="Chap. VI — Chauffage (nature combustible)" field="chauffageNature" placeholder="Ex : Gaz naturel, PAC, fioul" form={form} upd={upd}/>
                  <SInput label="Chap. VII — Cuisine (puissance kW)" field="cuisinePuissance" placeholder="Ex : 45 (si > 20 kW : art. GC)" form={form} upd={upd}/>
                </div>
              </div>
              <div className="card" style={{padding:24,marginBottom:24}}>
                <div className="section-title">Commission de sécurité</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                  <SInput label="Dernière visite commission" field="derniereVisite" type="date" form={form} upd={upd}/>
                  <SInput label="Prochaine visite prévue" field="prochaineVisite" type="date" form={form} upd={upd}/>
                </div>
                <div className="field"><label>Observations complémentaires</label><textarea value={form.observations} onChange={e=>upd("observations",e.target.value)} rows={3} placeholder="Travaux en cours, dérogations accordées, observations particulières…" style={{resize:"vertical"}}/></div>
              </div>
              {error&&<div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:8,padding:"12px 16px",marginBottom:20,color:"#dc2626",fontSize:13}}>{error}</div>}
              <div style={{display:"flex",gap:10}}>
                <button className="btn-ghost" onClick={()=>setStep(3)}>← Retour</button>
                <button className="btn-primary" onClick={generate} disabled={loading} style={{display:"flex",alignItems:"center",gap:10,opacity:loading?.7:1,cursor:loading?"not-allowed":"pointer"}}>
                  {loading?(<><div style={{width:17,height:17,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>Génération en cours…</>):"Générer la notice →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DÉTAIL ─────────────────────────────────────────────────────────────────
  if(view==="detail"&&open){
    const info=CATEGORIES_ERP[open.typeERP]||{};
    return(
      <div style={{minHeight:"100vh",background:"#f0f4f8",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
        <style>{css}</style>
        <div style={{background:"linear-gradient(135deg,#0a2342 0%,#1e3a5f 100%)",position:"sticky",top:0,zIndex:100}}>
          <div style={{maxWidth:1080,margin:"0 auto",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:68}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <button onClick={()=>setView("home")} style={{background:"transparent",border:"none",color:"rgba(255,255,255,.55)",cursor:"pointer",fontSize:13}}>← Accueil</button>
              <div style={{width:1,height:18,background:"rgba(255,255,255,.15)"}}/>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>{info.icon||"🏢"}</span>
                <div><div style={{fontWeight:700,color:"#fff",fontSize:15,fontFamily:"'Playfair Display',Georgia,serif"}}>{open.nom}</div><div style={{fontSize:11,color:"rgba(255,255,255,.45)"}}>{open.typeERP?.split("—")[0]?.trim()} · {open.cp} {open.ville}</div></div>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              {tab==="plan"&&<button className="btn-ghost" onClick={savePlan} style={{fontSize:13,padding:"8px 16px",background:"transparent",border:"1px solid rgba(255,255,255,.2)",color:"rgba(255,255,255,.7)"}}>💾 Sauvegarder le plan</button>}
              <button className="btn-primary" onClick={()=>exportPDF(open)} style={{fontSize:13,padding:"9px 20px"}}>Exporter PDF</button>
            </div>
          </div>
          <div style={{maxWidth:1080,margin:"0 auto",padding:"0 32px",display:"flex",borderTop:"1px solid rgba(255,255,255,.06)"}}>
            {[{id:"notice",label:"📄 Notice GE2"},{id:"plan",label:"🗺 Plan d'évacuation"},{id:"checklist",label:"✅ Vérifications réglementaires"}].map(t=>(
              <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)} style={{color:tab===t.id?"#60a5fa":"rgba(255,255,255,.4)",borderBottomColor:tab===t.id?"#60a5fa":"transparent"}}>{t.label}</button>
            ))}
          </div>
        </div>
        <div style={{maxWidth:1080,margin:"0 auto",padding:"32px"}}>
          {tab==="notice"&&<div className="card fade-up" style={{padding:"32px 40px",maxHeight:"calc(100vh - 200px)",overflowY:"auto"}}><RenderNotice text={open.noticeText}/></div>}
          {tab==="plan"&&(
            <div className="fade-up">
              <div style={{marginBottom:16}}><h3 style={{fontSize:18,fontWeight:700,color:"#0a2342",margin:"0 0 4px",fontFamily:"'Playfair Display',Georgia,serif"}}>Plan d'évacuation schématique</h3><p style={{color:"#64748b",fontSize:13,margin:0}}>Art. MS 40 — plan schématique inaltérable obligatoire à chaque niveau.</p></div>
              <div className="card" style={{padding:24}}><PlanEvacuation plan={plan} setPlan={setPlan}/></div>
            </div>
          )}
          {tab==="checklist"&&(
            <div className="fade-up">
              <div style={{marginBottom:16}}><h3 style={{fontSize:18,fontWeight:700,color:"#0a2342",margin:"0 0 4px",fontFamily:"'Playfair Display',Georgia,serif"}}>Vérifications périodiques réglementaires</h3><p style={{color:"#64748b",fontSize:13,margin:0}}>Arrêté du 25 juin 1980 modifié — CCH art. R143-2 à R143-47 — sauvegarde automatique.</p></div>
              <div className="card" style={{padding:24}}><Checklist noticeId={open.id}/></div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}
