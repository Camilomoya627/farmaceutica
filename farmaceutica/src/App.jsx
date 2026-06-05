import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const C = {
  primary: "#1a6fb5", primaryLight: "#e8f3fc", primaryMid: "#378add",
  success: "#1d9e75", successLight: "#e1f5ee",
  warning: "#ba7517", warningLight: "#faeeda",
  danger: "#a32d2d", dangerLight: "#fcebeb",
  gray: "#888780", grayLight: "#f1efe8",
  text: "#1a1a2e", textMuted: "#5f5e5a",
  border: "rgba(0,0,0,0.08)", white: "#ffffff", surface: "#f8fafb",
};

const CATEGORIAS = ["Penicilinas","Cefalosporinas","Macrólidos","Quinolonas","Aminoglucósidos","Tetraciclinas","Otros"];

const initMeds = [
  { id:"m1", nombre:"Amoxicilina 500mg", lote:"LOT-2024-001", categoria:"Penicilinas", cantidad:320, vencimiento:"2026-08-15", proveedor:"Pfizer Colombia", precio:4500, registro:"2024-01-10", stockMinimo:50 },
  { id:"m2", nombre:"Azitromicina 250mg", lote:"LOT-2024-002", categoria:"Macrólidos", cantidad:18, vencimiento:"2025-12-20", proveedor:"Bayer", precio:8200, registro:"2024-02-05", stockMinimo:30 },
  { id:"m3", nombre:"Ciprofloxacino 500mg", lote:"LOT-2024-003", categoria:"Quinolonas", cantidad:0, vencimiento:"2026-03-10", proveedor:"Genfar", precio:6800, registro:"2024-01-20", stockMinimo:40 },
  { id:"m4", nombre:"Cefalexina 500mg", lote:"LOT-2024-004", categoria:"Cefalosporinas", cantidad:245, vencimiento:"2026-11-30", proveedor:"MK", precio:5200, registro:"2024-03-01", stockMinimo:40 },
  { id:"m5", nombre:"Doxiciclina 100mg", lote:"LOT-2024-005", categoria:"Tetraciclinas", cantidad:12, vencimiento:"2025-09-15", proveedor:"Lafrancol", precio:3800, registro:"2024-02-15", stockMinimo:30 },
  { id:"m6", nombre:"Amikacina 500mg/2ml", lote:"LOT-2024-006", categoria:"Aminoglucósidos", cantidad:89, vencimiento:"2026-06-20", proveedor:"Baxter", precio:28500, registro:"2024-03-10", stockMinimo:20 },
  { id:"m7", nombre:"Eritromicina 500mg", lote:"LOT-2024-007", categoria:"Macrólidos", cantidad:156, vencimiento:"2026-04-25", proveedor:"Novartis", precio:7100, registro:"2024-01-30", stockMinimo:35 },
  { id:"m8", nombre:"Ampicilina 500mg", lote:"LOT-2024-008", categoria:"Penicilinas", cantidad:0, vencimiento:"2025-07-10", proveedor:"Pfizer Colombia", precio:3200, registro:"2024-04-05", stockMinimo:50 },
  { id:"m9", nombre:"Levofloxacino 500mg", lote:"LOT-2024-009", categoria:"Quinolonas", cantidad:72, vencimiento:"2026-10-05", proveedor:"Sanofi", precio:12400, registro:"2024-02-20", stockMinimo:25 },
  { id:"m10", nombre:"Clindamicina 300mg", lote:"LOT-2024-010", categoria:"Otros", cantidad:8, vencimiento:"2025-11-15", proveedor:"Genfar", precio:9600, registro:"2024-03-25", stockMinimo:30 },
];

const ventasMensuales = [
  { mes:"Ene", ventas:3400000 }, { mes:"Feb", ventas:2900000 },
  { mes:"Mar", ventas:4100000 }, { mes:"Abr", ventas:3750000 }, { mes:"May", ventas:4800000 },
];

const initVentas = [
  { id:"v1", medicamentoId:"m1", medicamentoNombre:"Amoxicilina 500mg", cantidad:24, precio:4500, total:108000, fecha:new Date().toISOString() },
  { id:"v2", medicamentoId:"m4", medicamentoNombre:"Cefalexina 500mg", cantidad:18, precio:5200, total:93600, fecha:new Date().toISOString() },
  { id:"v3", medicamentoId:"m7", medicamentoNombre:"Eritromicina 500mg", cantidad:12, precio:7100, total:85200, fecha:new Date().toISOString() },
  { id:"v4", medicamentoId:"m9", medicamentoNombre:"Levofloxacino 500mg", cantidad:8, precio:12400, total:99200, fecha:new Date(Date.now()-86400000*32).toISOString() },
  { id:"v5", medicamentoId:"m6", medicamentoNombre:"Amikacina 500mg/2ml", cantidad:5, precio:28500, total:142500, fecha:new Date(Date.now()-86400000*35).toISOString() },
];

const fmt = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0}).format(n);
const fmtDate = d => new Date(d).toLocaleDateString("es-CO",{day:"2-digit",month:"2-digit",year:"numeric"});
const isLow = m => m.cantidad > 0 && m.cantidad <= m.stockMinimo;
const isOut = m => m.cantidad === 0;
const isExp = m => { const d=(new Date(m.vencimiento)-new Date())/86400000; return d<=90&&d>0; };
const genId = () => "id-"+Math.random().toString(36).slice(2,9);

const Badge = ({children, color="gray"}) => {
  const s = {blue:{bg:C.primaryLight,c:C.primary},green:{bg:C.successLight,c:C.success},yellow:{bg:C.warningLight,c:C.warning},red:{bg:C.dangerLight,c:C.danger},gray:{bg:C.grayLight,c:C.gray}}[color]||{bg:C.grayLight,c:C.gray};
  return <span style={{background:s.bg,color:s.c,fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:20,display:"inline-block",whiteSpace:"nowrap"}}>{children}</span>;
};

const StatCard = ({icon,label,value,sub,color="blue"}) => {
  const bg={blue:C.primaryLight,green:C.successLight,yellow:C.warningLight,red:C.dangerLight}[color];
  const ic={blue:C.primary,green:C.success,yellow:C.warning,red:C.danger}[color];
  return (
    <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:"16px 18px",display:"flex",flexDirection:"column",gap:8}}>
      <div style={{width:36,height:36,borderRadius:10,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:ic}}>{icon}</div>
      <div>
        <div style={{fontSize:20,fontWeight:600,color:C.text,lineHeight:1.2}}>{value}</div>
        <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{label}</div>
        {sub&&<div style={{fontSize:11,color:ic,marginTop:4}}>{sub}</div>}
      </div>
    </div>
  );
};

const Modal = ({title,onClose,children}) => (
  <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
    <div style={{background:C.white,borderRadius:16,width:"100%",maxWidth:540,maxHeight:"85vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:C.white}}>
        <h3 style={{margin:0,fontSize:15,fontWeight:600,color:C.text}}>{title}</h3>
        <button onClick={onClose} style={{border:"none",background:C.grayLight,cursor:"pointer",borderRadius:8,width:30,height:30,fontSize:15,color:C.textMuted}}>✕</button>
      </div>
      <div style={{padding:22}}>{children}</div>
    </div>
  </div>
);

const Inp = ({label,...p}) => (
  <div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label&&<label style={{fontSize:12,fontWeight:500,color:C.textMuted}}>{label}</label>}
    <input {...p} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:C.text,background:C.white,outline:"none",width:"100%",...p.style}}/>
  </div>
);

const Sel = ({label,children,...p}) => (
  <div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label&&<label style={{fontSize:12,fontWeight:500,color:C.textMuted}}>{label}</label>}
    <select {...p} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:C.text,background:C.white,outline:"none",width:"100%"}}>{children}</select>
  </div>
);

const Btn = ({children,variant="primary",size="md",onClick,disabled,style:ext}) => {
  const v={primary:{background:C.primary,color:"#fff",border:"none"},success:{background:C.success,color:"#fff",border:"none"},danger:{background:C.danger,color:"#fff",border:"none"},ghost:{background:"transparent",color:C.textMuted,border:`1px solid ${C.border}`},outline:{background:"transparent",color:C.primary,border:`1px solid ${C.primary}`}}[variant];
  const sz={sm:{padding:"5px 12px",fontSize:12},md:{padding:"8px 16px",fontSize:13},lg:{padding:"10px 22px",fontSize:14}}[size];
  return <button disabled={disabled} onClick={onClick} style={{borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontWeight:500,display:"inline-flex",alignItems:"center",gap:6,opacity:disabled?0.6:1,...v,...sz,...ext}}>{children}</button>;
};

const Toast = ({msg,type,onClose}) => {
  useEffect(()=>{const t=setTimeout(onClose,3000);return()=>clearTimeout(t);},[]);
  const c={success:C.success,error:C.danger,warning:C.warning}[type]||C.primary;
  return <div style={{position:"fixed",bottom:20,right:20,background:C.white,borderRadius:10,padding:"12px 16px",boxShadow:"0 8px 30px rgba(0,0,0,0.15)",borderLeft:`4px solid ${c}`,display:"flex",alignItems:"center",gap:10,zIndex:9999,maxWidth:300,fontSize:13}}><span>{type==="success"?"✓":type==="error"?"✕":"⚠"}</span><span style={{color:C.text}}>{msg}</span></div>;
};

const emptyMed = {nombre:"",lote:"",categoria:"Penicilinas",cantidad:"",vencimiento:"",proveedor:"",precio:"",stockMinimo:30};

const MedForm = ({initial,onSave,onClose}) => {
  const [f,setF] = useState(initial||emptyMed);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const valid = f.nombre&&f.lote&&f.cantidad!==""&&f.vencimiento&&f.precio!=="";
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{gridColumn:"1/-1"}}><Inp label="Nombre *" value={f.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Ej: Amoxicilina 500mg"/></div>
        <Inp label="Lote *" value={f.lote} onChange={e=>set("lote",e.target.value)} placeholder="LOT-2024-XXX"/>
        <Sel label="Categoría" value={f.categoria} onChange={e=>set("categoria",e.target.value)}>{CATEGORIAS.map(c=><option key={c}>{c}</option>)}</Sel>
        <Inp label="Cantidad *" type="number" min="0" value={f.cantidad} onChange={e=>set("cantidad",e.target.value)}/>
        <Inp label="Stock mínimo" type="number" min="1" value={f.stockMinimo} onChange={e=>set("stockMinimo",+e.target.value)}/>
        <Inp label="Vencimiento *" type="date" value={f.vencimiento} onChange={e=>set("vencimiento",e.target.value)}/>
        <Inp label="Precio (COP) *" type="number" min="0" value={f.precio} onChange={e=>set("precio",e.target.value)}/>
        <div style={{gridColumn:"1/-1"}}><Inp label="Proveedor" value={f.proveedor} onChange={e=>set("proveedor",e.target.value)} placeholder="Nombre del proveedor"/></div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" disabled={!valid} onClick={()=>onSave({...f,cantidad:+f.cantidad,precio:+f.precio})}>{initial?"Guardar cambios":"Agregar medicamento"}</Btn>
      </div>
    </>
  );
};

const SaleForm = ({medicamentos,onSave,onClose}) => {
  const [medId,setMedId] = useState("");
  const [cant,setCant] = useState(1);
  const med = medicamentos.find(m=>m.id===medId);
  const total = med?med.precio*cant:0;
  const valid = med&&cant>=1&&cant<=med.cantidad;
  return (
    <>
      <Sel label="Medicamento" value={medId} onChange={e=>setMedId(e.target.value)}>
        <option value="">— Seleccionar —</option>
        {medicamentos.filter(m=>m.cantidad>0).map(m=><option key={m.id} value={m.id}>{m.nombre} (Disp: {m.cantidad})</option>)}
      </Sel>
      {med&&<div style={{marginTop:10,padding:10,background:C.primaryLight,borderRadius:8,fontSize:12,color:C.textMuted}}>Categoría: <strong>{med.categoria}</strong> · Precio: <strong>{fmt(med.precio)}</strong> · Disponible: <strong>{med.cantidad} uds.</strong></div>}
      <div style={{marginTop:12}}><Inp label="Cantidad" type="number" min="1" max={med?.cantidad||999} value={cant} onChange={e=>setCant(+e.target.value)}/></div>
      {total>0&&<div style={{marginTop:10,padding:"10px 14px",background:C.successLight,borderRadius:8,fontWeight:600,color:C.success,fontSize:14}}>Total: {fmt(total)}</div>}
      {med&&cant>med.cantidad&&<div style={{marginTop:6,color:C.danger,fontSize:12}}>⚠ Supera el stock disponible</div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="success" disabled={!valid} onClick={()=>onSave({medicamentoId:medId,medicamentoNombre:med.nombre,cantidad:cant,precio:med.precio,total})}>Registrar venta</Btn>
      </div>
    </>
  );
};

const Dashboard = ({medicamentos,ventas}) => {
  const mes = new Date().getMonth();
  const totalAct = ventas.filter(v=>new Date(v.fecha).getMonth()===mes).reduce((a,v)=>a+v.total,0);
  const totalAnt = ventas.filter(v=>new Date(v.fecha).getMonth()===mes-1).reduce((a,v)=>a+v.total,0);
  const diff = totalAnt>0?Math.round(((totalAct-totalAnt)/totalAnt)*100):0;
  const agotados = medicamentos.filter(isOut).length;
  const bajos = medicamentos.filter(isLow).length;
  const proxV = medicamentos.filter(isExp).length;
  const porCat = CATEGORIAS.map(c=>({name:c,value:medicamentos.filter(m=>m.categoria===c).reduce((s,m)=>s+m.cantidad,0)})).filter(d=>d.value>0);
  const masV = [...medicamentos].map(m=>({name:m.nombre.split(" ")[0],vendidas:ventas.filter(v=>v.medicamentoId===m.id).reduce((a,v)=>a+v.cantidad,0)})).filter(m=>m.vendidas>0).sort((a,b)=>b.vendidas-a.vendidas).slice(0,5);
  const PIE_COLORS = [C.primary,C.success,C.warning,"#7f77dd","#d4537e","#1d6b8f","#639922"];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {(agotados>0||bajos>0||proxV>0)&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {agotados>0&&<div style={{background:C.dangerLight,border:`1px solid #f09595`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,fontSize:13}}><span>🚫</span><span style={{color:C.danger,fontWeight:500}}>{agotados} medicamento{agotados>1?"s":""} agotado{agotados>1?"s":""} — requiere reabastecimiento urgente</span></div>}
          {bajos>0&&<div style={{background:C.warningLight,border:`1px solid #ef9f27`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,fontSize:13}}><span>⚠️</span><span style={{color:C.warning,fontWeight:500}}>{bajos} medicamento{bajos>1?"s":""} con stock bajo</span></div>}
          {proxV>0&&<div style={{background:"#fff8e6",border:"1px solid #fac775",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,fontSize:13}}><span>📅</span><span style={{color:"#ba7517",fontWeight:500}}>{proxV} medicamento{proxV>1?"s":""} por vencer en 90 días</span></div>}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
        <StatCard icon="💊" label="Total en inventario" value={medicamentos.reduce((s,m)=>s+m.cantidad,0).toLocaleString()} color="blue"/>
        <StatCard icon="🚫" label="Agotados" value={agotados} color="red"/>
        <StatCard icon="⚠️" label="Stock bajo" value={bajos} color="yellow"/>
        <StatCard icon="💰" label="Ventas mes actual" value={fmt(totalAct)} sub={diff!==0?`${diff>0?"▲":"▼"} ${Math.abs(diff)}% vs mes anterior`:undefined} color="green"/>
        <StatCard icon="📅" label="Mes anterior" value={fmt(totalAnt)} color="blue"/>
        <StatCard icon="📋" label="Total productos" value={medicamentos.length} color="green"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,2fr) minmax(0,1fr)",gap:14}}>
        <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
          <h4 style={{margin:"0 0 14px",fontSize:13,fontWeight:600,color:C.text}}>Ventas mensuales (COP)</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ventasMensuales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="mes" tick={{fontSize:11,fill:C.textMuted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:C.textMuted}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000000).toFixed(1)}M`}/>
              <Tooltip formatter={v=>[fmt(v),"Ventas"]} contentStyle={{borderRadius:8,fontSize:12,border:`1px solid ${C.border}`}}/>
              <Bar dataKey="ventas" fill={C.primary} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
          <h4 style={{margin:"0 0 14px",fontSize:13,fontWeight:600,color:C.text}}>Por categoría</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={porCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({name,percent})=>`${name.split("s")[0]} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {porCat.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{borderRadius:8,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {masV.length>0&&(
        <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
          <h4 style={{margin:"0 0 14px",fontSize:13,fontWeight:600,color:C.text}}>Más vendidos</h4>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={masV} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
              <XAxis type="number" tick={{fontSize:10,fill:C.textMuted}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:C.text}} axisLine={false} tickLine={false} width={80}/>
              <Tooltip contentStyle={{borderRadius:8,fontSize:12}}/>
              <Bar dataKey="vendidas" fill={C.success} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const Inventario = ({medicamentos,onAdd,onEdit,onDelete}) => {
  const [busq,setBusq] = useState("");
  const [filtCat,setFiltCat] = useState("Todas");
  const [filtDisp,setFiltDisp] = useState("Todos");
  const [modal,setModal] = useState(null);
  const [delConf,setDelConf] = useState(null);
  const [pag,setPag] = useState(1);
  const POR_PAG = 8;

  const filtrados = useMemo(()=>medicamentos.filter(m=>{
    const q=busq.toLowerCase();
    if(q&&!m.nombre.toLowerCase().includes(q)&&!m.lote.toLowerCase().includes(q)&&!m.proveedor.toLowerCase().includes(q))return false;
    if(filtCat!=="Todas"&&m.categoria!==filtCat)return false;
    if(filtDisp==="Disponible"&&m.cantidad===0)return false;
    if(filtDisp==="Agotado"&&m.cantidad>0)return false;
    if(filtDisp==="Stock bajo"&&!(m.cantidad>0&&m.cantidad<=m.stockMinimo))return false;
    return true;
  }),[medicamentos,busq,filtCat,filtDisp]);

  const pags = Math.ceil(filtrados.length/POR_PAG);
  const paginados = filtrados.slice((pag-1)*POR_PAG,pag*POR_PAG);
  const getEst = m => isOut(m)?<Badge color="red">Agotado</Badge>:isLow(m)?<Badge color="yellow">Stock bajo</Badge>:<Badge color="green">Disponible</Badge>;

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <input value={busq} onChange={e=>{setBusq(e.target.value);setPag(1);}} placeholder="🔍 Buscar por nombre, lote o proveedor..." style={{flex:1,minWidth:180,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",color:C.text}}/>
        <select value={filtCat} onChange={e=>{setFiltCat(e.target.value);setPag(1);}} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,color:C.text,background:C.white}}>
          <option>Todas</option>{CATEGORIAS.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={filtDisp} onChange={e=>{setFiltDisp(e.target.value);setPag(1);}} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,color:C.text,background:C.white}}>
          {["Todos","Disponible","Agotado","Stock bajo"].map(o=><option key={o}>{o}</option>)}
        </select>
        <Btn variant="primary" onClick={()=>setModal("add")}>+ Agregar</Btn>
      </div>
      <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",fontSize:13,minWidth:700,borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:C.surface}}>
                {["Medicamento","Lote","Categoría","Cant.","Vencimiento","Precio","Estado","Acciones"].map(h=>(
                  <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.04em",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginados.length===0?(
                <tr><td colSpan={8} style={{textAlign:"center",padding:36,color:C.textMuted}}>No se encontraron medicamentos</td></tr>
              ):paginados.map((m,i)=>(
                <tr key={m.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.white:C.surface}}>
                  <td style={{padding:"9px 12px",fontWeight:500,color:C.text}}>
                    {m.nombre}{isExp(m)&&<span style={{marginLeft:6,fontSize:10,color:C.warning}}>📅</span>}
                    <div style={{fontSize:11,color:C.textMuted,fontWeight:400}}>{m.proveedor}</div>
                  </td>
                  <td style={{padding:"9px 12px",color:C.textMuted,fontFamily:"monospace",fontSize:11}}>{m.lote}</td>
                  <td style={{padding:"9px 12px"}}><Badge color="blue">{m.categoria}</Badge></td>
                  <td style={{padding:"9px 12px",fontWeight:600,color:m.cantidad===0?C.danger:m.cantidad<=m.stockMinimo?C.warning:C.text}}>{m.cantidad}</td>
                  <td style={{padding:"9px 12px",color:C.textMuted,whiteSpace:"nowrap",fontSize:12}}>{fmtDate(m.vencimiento)}</td>
                  <td style={{padding:"9px 12px",whiteSpace:"nowrap",fontSize:12}}>{fmt(m.precio)}</td>
                  <td style={{padding:"9px 12px"}}>{getEst(m)}</td>
                  <td style={{padding:"9px 12px"}}>
                    <div style={{display:"flex",gap:5}}>
                      <Btn variant="outline" size="sm" onClick={()=>setModal(m)}>Editar</Btn>
                      <Btn variant="ghost" size="sm" onClick={()=>setDelConf(m)} style={{color:C.danger,borderColor:C.dangerLight}}>Eliminar</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pags>1&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderTop:`1px solid ${C.border}`}}>
            <span style={{fontSize:12,color:C.textMuted}}>{filtrados.length} resultado{filtrados.length!==1?"s":""}</span>
            <div style={{display:"flex",gap:5}}>
              {Array.from({length:pags},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPag(p)} style={{width:28,height:28,borderRadius:6,border:`1px solid ${p===pag?C.primary:C.border}`,background:p===pag?C.primary:"transparent",color:p===pag?"#fff":C.textMuted,fontSize:12,cursor:"pointer"}}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      {modal==="add"&&<Modal title="Agregar medicamento" onClose={()=>setModal(null)}><MedForm onSave={d=>{onAdd(d);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal&&modal!=="add"&&<Modal title="Editar medicamento" onClose={()=>setModal(null)}><MedForm initial={modal} onSave={d=>{onEdit({...modal,...d});setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {delConf&&<Modal title="Confirmar eliminación" onClose={()=>setDelConf(null)}>
        <p style={{color:C.textMuted,fontSize:14,marginBottom:18}}>¿Eliminar <strong style={{color:C.text}}>{delConf.nombre}</strong>? Esta acción no se puede deshacer.</p>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setDelConf(null)}>Cancelar</Btn>
          <Btn variant="danger" onClick={()=>{onDelete(delConf.id);setDelConf(null);}}>Eliminar</Btn>
        </div>
      </Modal>}
    </div>
  );
};

const Ventas = ({ventas,medicamentos,onVenta}) => {
  const [modal,setModal] = useState(false);
  const mes = new Date().getMonth();
  const ventasOrd = [...ventas].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h3 style={{margin:0,fontSize:15,fontWeight:600,color:C.text}}>Historial de ventas</h3>
          <p style={{margin:"2px 0 0",fontSize:12,color:C.textMuted}}>{ventas.length} transacciones registradas</p>
        </div>
        <Btn variant="success" onClick={()=>setModal(true)}>+ Registrar venta</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
        <StatCard label="Ventas este mes" value={fmt(ventas.filter(v=>new Date(v.fecha).getMonth()===mes).reduce((a,v)=>a+v.total,0))} icon="💰" color="green"/>
        <StatCard label="Transacciones" value={ventas.filter(v=>new Date(v.fecha).getMonth()===mes).length} icon="📋" color="blue"/>
        <StatCard label="Unidades vendidas" value={ventas.filter(v=>new Date(v.fecha).getMonth()===mes).reduce((a,v)=>a+v.cantidad,0)} icon="💊" color="blue"/>
      </div>
      <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",fontSize:13,minWidth:500,borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:C.surface}}>
                {["Medicamento","Cantidad","Precio unit.","Total","Fecha"].map(h=>(
                  <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.04em",borderBottom:`1px solid ${C.border}`}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventasOrd.length===0?(
                <tr><td colSpan={5} style={{textAlign:"center",padding:36,color:C.textMuted}}>No hay ventas registradas</td></tr>
              ):ventasOrd.map((v,i)=>(
                <tr key={v.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.white:C.surface}}>
                  <td style={{padding:"9px 12px",fontWeight:500,color:C.text}}>{v.medicamentoNombre}</td>
                  <td style={{padding:"9px 12px"}}>{v.cantidad} uds.</td>
                  <td style={{padding:"9px 12px",color:C.textMuted}}>{fmt(v.precio)}</td>
                  <td style={{padding:"9px 12px",fontWeight:600,color:C.success}}>{fmt(v.total)}</td>
                  <td style={{padding:"9px 12px",color:C.textMuted,fontSize:12}}>{fmtDate(v.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal&&<Modal title="Registrar venta" onClose={()=>setModal(false)}><SaleForm medicamentos={medicamentos} onSave={d=>{onVenta(d);setModal(false);}} onClose={()=>setModal(false)}/></Modal>}
    </div>
  );
};

const Alertas = ({medicamentos}) => {
  const criticos = medicamentos.filter(isOut);
  const bajos = medicamentos.filter(isLow);
  const porVencer = medicamentos.filter(isExp);
  const AlertRow = ({m,type}) => (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
      <div style={{width:34,height:34,borderRadius:8,flexShrink:0,background:type==="red"?C.dangerLight:type==="yellow"?C.warningLight:"#fff8e6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>
        {type==="red"?"🚫":type==="yellow"?"⚠️":"📅"}
      </div>
      <div style={{flex:1}}>
        <div style={{fontWeight:500,fontSize:13,color:C.text}}>{m.nombre}</div>
        <div style={{fontSize:12,color:C.textMuted}}>{m.categoria} · {m.proveedor}</div>
      </div>
      <div style={{textAlign:"right"}}>
        {type!=="expire"?<div style={{fontSize:13,fontWeight:600,color:type==="red"?C.danger:C.warning}}>{m.cantidad} uds.</div>:<div style={{fontSize:13,fontWeight:600,color:C.warning}}>{fmtDate(m.vencimiento)}</div>}
        <div style={{fontSize:11,color:C.textMuted}}>{type==="red"?"Sin stock":type==="yellow"?`Mín: ${m.stockMinimo}`:"Por vencer"}</div>
      </div>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      {criticos.length===0&&bajos.length===0&&porVencer.length===0&&(
        <div style={{textAlign:"center",padding:60,color:C.success}}>
          <div style={{fontSize:40,marginBottom:12}}>✅</div>
          <div style={{fontWeight:600,fontSize:15}}>Todo en orden</div>
          <div style={{fontSize:13,color:C.textMuted,marginTop:4}}>No hay alertas activas</div>
        </div>
      )}
      {criticos.length>0&&<div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
        <h4 style={{margin:"0 0 4px",fontSize:13,fontWeight:600,color:C.danger}}>🚫 Agotados ({criticos.length})</h4>
        <p style={{margin:"0 0 10px",fontSize:12,color:C.textMuted}}>Requieren reabastecimiento urgente</p>
        {criticos.map(m=><AlertRow key={m.id} m={m} type="red"/>)}
      </div>}
      {bajos.length>0&&<div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
        <h4 style={{margin:"0 0 4px",fontSize:13,fontWeight:600,color:C.warning}}>⚠️ Stock bajo ({bajos.length})</h4>
        <p style={{margin:"0 0 10px",fontSize:12,color:C.textMuted}}>Por debajo del stock mínimo</p>
        {bajos.map(m=><AlertRow key={m.id} m={m} type="yellow"/>)}
      </div>}
      {porVencer.length>0&&<div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
        <h4 style={{margin:"0 0 4px",fontSize:13,fontWeight:600,color:C.warning}}>📅 Por vencer en 90 días ({porVencer.length})</h4>
        <p style={{margin:"0 0 10px",fontSize:12,color:C.textMuted}}>Planifica la rotación o devolución</p>
        {porVencer.map(m=><AlertRow key={m.id} m={m} type="expire"/>)}
      </div>}
    </div>
  );
};

// ─── Estilos globales del layout ──────────────────────────────────────────────
// CORRECCIÓN PRINCIPAL: se reemplazó height:"100vh" + overflow:"hidden" por
// minHeight:"100vh" en el contenedor raíz, y se usa overflow:"auto" en el
// área de contenido. Esto evita el espacio negro a la derecha en el iframe.
const appShellStyle = {
  display:"flex",
  flexDirection:"row",
  minHeight:"100vh",        // ← era height:"100vh"
  width:"100%",
  fontFamily:"'Segoe UI', system-ui, sans-serif",
  background:C.surface,
  color:C.text,
};

const mainStyle = {
  flex:1,
  minWidth:0,               // ← evita que flex desborde el contenedor
  display:"flex",
  flexDirection:"column",
  overflow:"hidden",
};

export default function FarmaciaApp() {
  const [vista,setVista] = useState("dashboard");
  const [meds,setMeds] = useState(initMeds);
  const [ventas,setVentas] = useState(initVentas);
  const [toast,setToast] = useState(null);
  const [sidebarOpen,setSidebarOpen] = useState(true);

  const showToast = (msg,type="success") => setToast({msg,type});
  const addMed = d => { setMeds(p=>[...p,{...d,id:genId(),registro:new Date().toISOString().split("T")[0]}]); showToast("Medicamento agregado"); };
  const editMed = d => { setMeds(p=>p.map(m=>m.id===d.id?d:m)); showToast("Medicamento actualizado"); };
  const deleteMed = id => { setMeds(p=>p.filter(m=>m.id!==id)); showToast("Medicamento eliminado","warning"); };
  const registrarVenta = d => {
    setVentas(p=>[...p,{...d,id:genId(),fecha:new Date().toISOString(),mes:new Date().getMonth()}]);
    setMeds(p=>p.map(m=>m.id===d.medicamentoId?{...m,cantidad:m.cantidad-d.cantidad}:m));
    showToast(`Venta registrada — ${fmt(d.total)}`);
  };

  const alertCount = meds.filter(m=>isOut(m)||isLow(m)||isExp(m)).length;
  const navItems = [
    {key:"dashboard",icon:"📊",label:"Panel de control"},
    {key:"inventario",icon:"💊",label:"Inventario"},
    {key:"ventas",icon:"💰",label:"Ventas"},
    {key:"alertas",icon:"🔔",label:"Alertas",badge:alertCount},
  ];

  return (
    <div style={appShellStyle}>
      {/* Sidebar */}
      <div style={{
        width:sidebarOpen?210:56,
        flexShrink:0,
        background:C.white,
        borderRight:`1px solid ${C.border}`,
        display:"flex",
        flexDirection:"column",
        transition:"width 0.25s ease",
        overflow:"hidden",
      }}>
        <div style={{padding:"16px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,color:"#fff"}}>⚕</div>
          {sidebarOpen&&<div style={{overflow:"hidden"}}><div style={{fontWeight:700,fontSize:13,color:C.text,whiteSpace:"nowrap"}}>MediStock</div><div style={{fontSize:10,color:C.textMuted,whiteSpace:"nowrap"}}>Sistema de farmacia</div></div>}
        </div>
        <nav style={{flex:1,padding:"10px 6px"}}>
          {navItems.map(item=>(
            <button key={item.key} onClick={()=>setVista(item.key)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 8px",borderRadius:8,border:"none",cursor:"pointer",background:vista===item.key?C.primaryLight:"transparent",color:vista===item.key?C.primary:C.textMuted,fontWeight:vista===item.key?600:400,fontSize:13,marginBottom:2,textAlign:"left",position:"relative"}}>
              <span style={{fontSize:15,flexShrink:0}}>{item.icon}</span>
              {sidebarOpen&&<span style={{whiteSpace:"nowrap"}}>{item.label}</span>}
              {item.badge>0&&<span style={{position:"absolute",top:5,right:sidebarOpen?8:4,background:C.danger,color:"#fff",fontSize:10,fontWeight:700,borderRadius:10,minWidth:15,height:15,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <button onClick={()=>setSidebarOpen(p=>!p)} style={{margin:6,padding:8,border:`1px solid ${C.border}`,borderRadius:8,background:"transparent",cursor:"pointer",color:C.textMuted,fontSize:13}}>{sidebarOpen?"◀":"▶"}</button>
      </div>

      {/* Main */}
      <div style={mainStyle}>
        {/* Header */}
        <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <h2 style={{margin:0,fontSize:15,fontWeight:600,color:C.text}}>{navItems.find(n=>n.key===vista)?.icon} {navItems.find(n=>n.key===vista)?.label}</h2>
            <p style={{margin:0,fontSize:11,color:C.textMuted}}>{new Date().toLocaleDateString("es-CO",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.success,boxShadow:`0 0 0 3px ${C.successLight}`}}/>
            <span style={{fontSize:12,color:C.textMuted}}>Sincronizado</span>
            <div style={{width:30,height:30,borderRadius:"50%",background:C.primaryLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.primary,fontWeight:600}}>F</div>
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:24}}>
          {vista==="dashboard"&&<Dashboard medicamentos={meds} ventas={ventas}/>}
          {vista==="inventario"&&<Inventario medicamentos={meds} onAdd={addMed} onEdit={editMed} onDelete={deleteMed}/>}
          {vista==="ventas"&&<Ventas ventas={ventas} medicamentos={meds} onVenta={registrarVenta}/>}
          {vista==="alertas"&&<Alertas medicamentos={meds}/>}
        </div>
      </div>

      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
