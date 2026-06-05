import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

// ─── Paleta de colores ────────────────────────────────────────────────────────
const COLORS = {
  primary: "#1a6fb5",
  primaryLight: "#e8f3fc",
  primaryMid: "#378add",
  success: "#1d9e75",
  successLight: "#e1f5ee",
  warning: "#ba7517",
  warningLight: "#faeeda",
  danger: "#a32d2d",
  dangerLight: "#fcebeb",
  gray: "#888780",
  grayLight: "#f1efe8",
  text: "#1a1a2e",
  textMuted: "#5f5e5a",
  border: "rgba(0,0,0,0.08)",
  white: "#ffffff",
  surface: "#f8fafb",
};

// ─── Datos iniciales ──────────────────────────────────────────────────────────
const CATEGORIAS = ["Penicilinas", "Cefalosporinas", "Macrólidos", "Quinolonas", "Aminoglucósidos", "Tetraciclinas", "Otros"];

const initialMedicamentos = [
  { id: "m1", nombre: "Amoxicilina 500mg", lote: "LOT-2024-001", categoria: "Penicilinas", cantidad: 320, vencimiento: "2026-08-15", proveedor: "Pfizer Colombia", precio: 4500, registro: "2024-01-10", stockMinimo: 50 },
  { id: "m2", nombre: "Azitromicina 250mg", lote: "LOT-2024-002", categoria: "Macrólidos", cantidad: 18, vencimiento: "2025-12-20", proveedor: "Bayer", precio: 8200, registro: "2024-02-05", stockMinimo: 30 },
  { id: "m3", nombre: "Ciprofloxacino 500mg", lote: "LOT-2024-003", categoria: "Quinolonas", cantidad: 0, vencimiento: "2026-03-10", proveedor: "Genfar", precio: 6800, registro: "2024-01-20", stockMinimo: 40 },
  { id: "m4", nombre: "Cefalexina 500mg", lote: "LOT-2024-004", categoria: "Cefalosporinas", cantidad: 245, vencimiento: "2026-11-30", proveedor: "MK", precio: 5200, registro: "2024-03-01", stockMinimo: 40 },
  { id: "m5", nombre: "Doxiciclina 100mg", lote: "LOT-2024-005", categoria: "Tetraciclinas", cantidad: 12, vencimiento: "2025-09-15", proveedor: "Lafrancol", precio: 3800, registro: "2024-02-15", stockMinimo: 30 },
  { id: "m6", nombre: "Amikacina 500mg/2ml", lote: "LOT-2024-006", categoria: "Aminoglucósidos", cantidad: 89, vencimiento: "2026-06-20", proveedor: "Baxter", precio: 28500, registro: "2024-03-10", stockMinimo: 20 },
  { id: "m7", nombre: "Eritromicina 500mg", lote: "LOT-2024-007", categoria: "Macrólidos", cantidad: 156, vencimiento: "2026-04-25", proveedor: "Novartis", precio: 7100, registro: "2024-01-30", stockMinimo: 35 },
  { id: "m8", nombre: "Ampicilina 500mg", lote: "LOT-2024-008", categoria: "Penicilinas", cantidad: 0, vencimiento: "2025-07-10", proveedor: "Pfizer Colombia", precio: 3200, registro: "2024-04-05", stockMinimo: 50 },
  { id: "m9", nombre: "Levofloxacino 500mg", lote: "LOT-2024-009", categoria: "Quinolonas", cantidad: 72, vencimiento: "2026-10-05", proveedor: "Sanofi", precio: 12400, registro: "2024-02-20", stockMinimo: 25 },
  { id: "m10", nombre: "Clindamicina 300mg", lote: "LOT-2024-010", categoria: "Otros", cantidad: 8, vencimiento: "2025-11-15", proveedor: "Genfar", precio: 9600, registro: "2024-03-25", stockMinimo: 30 },
];

const ventasMensualesData = [
  { mes: "Ene", ventas: 3400000, unidades: 520 },
  { mes: "Feb", ventas: 2900000, unidades: 445 },
  { mes: "Mar", ventas: 4100000, unidades: 618 },
  { mes: "Abr", ventas: 3750000, unidades: 572 },
  { mes: "May", ventas: 4800000, unidades: 730 },
];

const initialVentas = [
  { id: "v1", medicamentoId: "m1", medicamentoNombre: "Amoxicilina 500mg", cantidad: 24, precio: 4500, total: 108000, fecha: new Date().toISOString(), mes: new Date().getMonth() },
  { id: "v2", medicamentoId: "m4", medicamentoNombre: "Cefalexina 500mg", cantidad: 18, precio: 5200, total: 93600, fecha: new Date().toISOString(), mes: new Date().getMonth() },
  { id: "v3", medicamentoId: "m7", medicamentoNombre: "Eritromicina 500mg", cantidad: 12, precio: 7100, total: 85200, fecha: new Date().toISOString(), mes: new Date().getMonth() },
  { id: "v4", medicamentoId: "m9", medicamentoNombre: "Levofloxacino 500mg", cantidad: 8, precio: 12400, total: 99200, fecha: new Date(Date.now() - 86400000 * 32).toISOString(), mes: new Date().getMonth() - 1 },
  { id: "v5", medicamentoId: "m6", medicamentoNombre: "Amikacina 500mg/2ml", cantidad: 5, precio: 28500, total: 142500, fecha: new Date(Date.now() - 86400000 * 35).toISOString(), mes: new Date().getMonth() - 1 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
const isLowStock = (m) => m.cantidad > 0 && m.cantidad <= m.stockMinimo;
const isOutOfStock = (m) => m.cantidad === 0;
const isExpiringSoon = (m) => {
  const days = (new Date(m.vencimiento) - new Date()) / 86400000;
  return days <= 90 && days > 0;
};
const genId = () => "id-" + Math.random().toString(36).slice(2, 9);

// ─── Componentes UI ───────────────────────────────────────────────────────────

const Badge = ({ children, color = "gray" }) => {
  const styles = {
    blue: { bg: COLORS.primaryLight, color: COLORS.primary },
    green: { bg: COLORS.successLight, color: COLORS.success },
    yellow: { bg: COLORS.warningLight, color: COLORS.warning },
    red: { bg: COLORS.dangerLight, color: COLORS.danger },
    gray: { bg: COLORS.grayLight, color: COLORS.gray },
  };
  const s = styles[color] || styles.gray;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 500, padding: "2px 8px",
      borderRadius: 20, display: "inline-block", whiteSpace: "nowrap"
    }}>{children}</span>
  );
};

const StatCard = ({ icon, label, value, sub, color = "blue", pulse }) => {
  const colorMap = { blue: COLORS.primaryLight, green: COLORS.successLight, yellow: COLORS.warningLight, red: COLORS.dangerLight };
  const iconColor = { blue: COLORS.primary, green: COLORS.success, yellow: COLORS.warning, red: COLORS.danger };
  return (
    <div style={{
      background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8,
      position: "relative", overflow: "hidden"
    }}>
      {pulse && <span style={{
        position: "absolute", top: 12, right: 12, width: 8, height: 8,
        borderRadius: "50%", background: iconColor[color],
        boxShadow: `0 0 0 4px ${colorMap[color]}`
      }} />}
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: colorMap[color],
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, color: iconColor[color]
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, color: COLORS.text, lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: iconColor[color], marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16
  }} onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div style={{
      background: COLORS.white, borderRadius: 16, width: "100%", maxWidth: 560,
      maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`, position: "sticky", top: 0, background: COLORS.white
      }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: COLORS.text }}>{title}</h3>
        <button onClick={onClose} style={{
          border: "none", background: COLORS.grayLight, cursor: "pointer",
          borderRadius: 8, width: 32, height: 32, fontSize: 16, color: COLORS.textMuted
        }}>✕</button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted }}>{label}</label>}
    <input {...props} style={{
      border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px",
      fontSize: 13, color: COLORS.text, background: COLORS.white, outline: "none",
      width: "100%", boxSizing: "border-box", ...props.style
    }} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted }}>{label}</label>}
    <select {...props} style={{
      border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px",
      fontSize: 13, color: COLORS.text, background: COLORS.white, outline: "none",
      width: "100%", boxSizing: "border-box"
    }}>{children}</select>
  </div>
);

const Btn = ({ children, variant = "primary", size = "md", onClick, disabled, style: ext }) => {
  const variants = {
    primary: { background: COLORS.primary, color: "#fff", border: "none" },
    success: { background: COLORS.success, color: "#fff", border: "none" },
    danger: { background: COLORS.danger, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: COLORS.textMuted, border: `1px solid ${COLORS.border}` },
    outline: { background: "transparent", color: COLORS.primary, border: `1px solid ${COLORS.primary}` },
  };
  const sizes = { sm: { padding: "5px 12px", fontSize: 12 }, md: { padding: "8px 16px", fontSize: 13 }, lg: { padding: "10px 22px", fontSize: 14 } };
  return (
    <button disabled={disabled} onClick={onClick} style={{
      borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 500,
      display: "inline-flex", alignItems: "center", gap: 6, opacity: disabled ? 0.6 : 1,
      transition: "opacity 0.15s", ...variants[variant], ...sizes[size], ...ext
    }}>{children}</button>
  );
};

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const colors = { success: COLORS.success, error: COLORS.danger, warning: COLORS.warning };
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, background: COLORS.white,
      borderRadius: 10, padding: "12px 18px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
      borderLeft: `4px solid ${colors[type] || COLORS.primary}`,
      display: "flex", alignItems: "center", gap: 10, zIndex: 9999, maxWidth: 320, fontSize: 13
    }}>
      <span>{type === "success" ? "✓" : type === "error" ? "✕" : "⚠"}</span>
      <span style={{ color: COLORS.text }}>{msg}</span>
    </div>
  );
};

// ─── Formulario de Medicamento ────────────────────────────────────────────────
const emptyMed = { nombre: "", lote: "", categoria: "Penicilinas", cantidad: "", vencimiento: "", proveedor: "", precio: "", stockMinimo: 30 };

const MedForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial || emptyMed);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const valid = form.nombre && form.lote && form.cantidad !== "" && form.vencimiento && form.precio !== "";

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Input label="Nombre del medicamento *" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Amoxicilina 500mg" />
        </div>
        <Input label="Lote *" value={form.lote} onChange={e => set("lote", e.target.value)} placeholder="LOT-2024-XXX" />
        <Select label="Categoría" value={form.categoria} onChange={e => set("categoria", e.target.value)}>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </Select>
        <Input label="Cantidad disponible *" type="number" min="0" value={form.cantidad} onChange={e => set("cantidad", e.target.value)} />
        <Input label="Stock mínimo de alerta" type="number" min="1" value={form.stockMinimo} onChange={e => set("stockMinimo", +e.target.value)} />
        <Input label="Fecha de vencimiento *" type="date" value={form.vencimiento} onChange={e => set("vencimiento", e.target.value)} />
        <Input label="Precio unitario (COP) *" type="number" min="0" value={form.precio} onChange={e => set("precio", e.target.value)} />
        <div style={{ gridColumn: "1/-1" }}>
          <Input label="Proveedor" value={form.proveedor} onChange={e => set("proveedor", e.target.value)} placeholder="Nombre del proveedor" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" disabled={!valid} onClick={() => onSave({ ...form, cantidad: +form.cantidad, precio: +form.precio })}>
          {initial ? "Guardar cambios" : "Agregar medicamento"}
        </Btn>
      </div>
    </>
  );
};

// ─── Formulario de Venta ──────────────────────────────────────────────────────
const SaleForm = ({ medicamentos, onSave, onClose }) => {
  const [medId, setMedId] = useState("");
  const [cant, setCant] = useState(1);
  const med = medicamentos.find(m => m.id === medId);
  const total = med ? med.precio * cant : 0;
  const valid = med && cant >= 1 && cant <= med.cantidad;

  return (
    <>
      <Select label="Medicamento" value={medId} onChange={e => setMedId(e.target.value)}>
        <option value="">— Seleccionar —</option>
        {medicamentos.filter(m => m.cantidad > 0).map(m => (
          <option key={m.id} value={m.id}>{m.nombre} (Disp: {m.cantidad})</option>
        ))}
      </Select>
      {med && (
        <div style={{ marginTop: 12, padding: 12, background: COLORS.primaryLight, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>Categoría: <strong>{med.categoria}</strong> · Precio: <strong>{fmt(med.precio)}</strong></div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Disponible: <strong>{med.cantidad} unidades</strong></div>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <Input label="Cantidad a vender" type="number" min="1" max={med?.cantidad || 999} value={cant} onChange={e => setCant(+e.target.value)} />
      </div>
      {total > 0 && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: COLORS.successLight, borderRadius: 8, fontWeight: 600, color: COLORS.success, fontSize: 15 }}>
          Total: {fmt(total)}
        </div>
      )}
      {med && cant > med.cantidad && (
        <div style={{ marginTop: 8, color: COLORS.danger, fontSize: 12 }}>⚠ Cantidad supera el stock disponible</div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="success" disabled={!valid} onClick={() => onSave({ medicamentoId: medId, medicamentoNombre: med.nombre, cantidad: cant, precio: med.precio, total })}>
          Registrar venta
        </Btn>
      </div>
    </>
  );
};

// ─── VISTAS ───────────────────────────────────────────────────────────────────

const Dashboard = ({ medicamentos, ventas }) => {
  const mesActual = new Date().getMonth();
  const mesAnterior = mesActual - 1;

  const totalActual = ventas.filter(v => new Date(v.fecha).getMonth() === mesActual).reduce((a, v) => a + v.total, 0);
  const totalAnterior = ventas.filter(v => new Date(v.fecha).getMonth() === mesAnterior).reduce((a, v) => a + v.total, 0);
  const diff = totalAnterior > 0 ? Math.round(((totalActual - totalAnterior) / totalAnterior) * 100) : 0;

  const agotados = medicamentos.filter(isOutOfStock).length;
  const stockBajo = medicamentos.filter(isLowStock).length;
  const proxVencer = medicamentos.filter(isExpiringSoon).length;

  const porCategoria = CATEGORIAS.map(c => ({
    name: c, value: medicamentos.filter(m => m.categoria === c).reduce((s, m) => s + m.cantidad, 0)
  })).filter(d => d.value > 0);

  const masVendidos = [...medicamentos]
    .map(m => ({
      name: m.nombre.split(" ")[0],
      vendidas: ventas.filter(v => v.medicamentoId === m.id).reduce((a, v) => a + v.cantidad, 0)
    }))
    .filter(m => m.vendidas > 0)
    .sort((a, b) => b.vendidas - a.vendidas)
    .slice(0, 5);

  const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, "#7f77dd", "#d4537e", "#1d6b8f", "#639922"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Alertas */}
      {(agotados > 0 || stockBajo > 0 || proxVencer > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {agotados > 0 && (
            <div style={{ background: COLORS.dangerLight, border: `1px solid #f09595`, borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{ fontSize: 16 }}>🚫</span>
              <span style={{ color: COLORS.danger, fontWeight: 500 }}>{agotados} medicamento{agotados > 1 ? "s" : ""} agotado{agotados > 1 ? "s" : ""} — requiere reabastecimiento urgente</span>
            </div>
          )}
          {stockBajo > 0 && (
            <div style={{ background: COLORS.warningLight, border: `1px solid #ef9f27`, borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ color: COLORS.warning, fontWeight: 500 }}>{stockBajo} medicamento{stockBajo > 1 ? "s" : ""} con stock bajo</span>
            </div>
          )}
          {proxVencer > 0 && (
            <div style={{ background: "#fff8e6", border: "1px solid #fac775", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{ fontSize: 16 }}>📅</span>
              <span style={{ color: "#ba7517", fontWeight: 500 }}>{proxVencer} medicamento{proxVencer > 1 ? "s" : ""} por vencer en los próximos 90 días</span>
            </div>
          )}
        </div>
      )}

      {/* Tarjetas estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        <StatCard icon="💊" label="Total en inventario" value={medicamentos.reduce((s, m) => s + m.cantidad, 0).toLocaleString()} color="blue" pulse />
        <StatCard icon="🚫" label="Agotados" value={agotados} color="red" />
        <StatCard icon="⚠️" label="Stock bajo" value={stockBajo} color="yellow" />
        <StatCard icon="💰" label="Ventas mes actual" value={fmt(totalActual)} sub={diff !== 0 ? `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)}% vs mes anterior` : undefined} color="green" />
        <StatCard icon="📅" label="Ventas mes anterior" value={fmt(totalAnterior)} color="blue" />
        <StatCard icon="📋" label="Total productos" value={medicamentos.length} color="green" />
      </div>

      {/* Gráficas */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20 }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: COLORS.text }}>Ventas mensuales (COP)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ventasMensualesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => [fmt(v), "Ventas"]} contentStyle={{ borderRadius: 8, fontSize: 12, border: `1px solid ${COLORS.border}` }} />
              <Bar dataKey="ventas" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20 }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: COLORS.text }}>Por categoría</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={porCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name.split("s")[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {porCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {masVendidos.length > 0 && (
        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20 }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: COLORS.text }}>Medicamentos más vendidos</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={masVendidos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: COLORS.text }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="vendidas" fill={COLORS.success} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// ─── Vista Inventario ─────────────────────────────────────────────────────────
const Inventario = ({ medicamentos, onAdd, onEdit, onDelete }) => {
  const [busqueda, setBusqueda] = useState("");
  const [filtCat, setFiltCat] = useState("Todas");
  const [filtDisp, setFiltDisp] = useState("Todos");
  const [modal, setModal] = useState(null); // null | "add" | {med}
  const [delConf, setDelConf] = useState(null);
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 8;

  const filtrados = useMemo(() => {
    return medicamentos.filter(m => {
      const q = busqueda.toLowerCase();
      if (q && !m.nombre.toLowerCase().includes(q) && !m.lote.toLowerCase().includes(q) && !m.proveedor.toLowerCase().includes(q)) return false;
      if (filtCat !== "Todas" && m.categoria !== filtCat) return false;
      if (filtDisp === "Disponible" && m.cantidad === 0) return false;
      if (filtDisp === "Agotado" && m.cantidad > 0) return false;
      if (filtDisp === "Stock bajo" && !(m.cantidad > 0 && m.cantidad <= m.stockMinimo)) return false;
      return true;
    });
  }, [medicamentos, busqueda, filtCat, filtDisp]);

  const paginas = Math.ceil(filtrados.length / POR_PAGINA);
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const getEstado = (m) => {
    if (isOutOfStock(m)) return <Badge color="red">Agotado</Badge>;
    if (isLowStock(m)) return <Badge color="yellow">Stock bajo</Badge>;
    return <Badge color="green">Disponible</Badge>;
  };

  return (
    <div>
      {/* Controles */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
          placeholder="🔍  Buscar por nombre, lote o proveedor..."
          style={{
            flex: 1, minWidth: 200, border: `1px solid ${COLORS.border}`, borderRadius: 8,
            padding: "8px 14px", fontSize: 13, outline: "none", color: COLORS.text
          }}
        />
        <select value={filtCat} onChange={e => { setFiltCat(e.target.value); setPagina(1); }} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, background: COLORS.white }}>
          <option>Todas</option>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filtDisp} onChange={e => { setFiltDisp(e.target.value); setPagina(1); }} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, background: COLORS.white }}>
          {["Todos", "Disponible", "Agotado", "Stock bajo"].map(o => <option key={o}>{o}</option>)}
        </select>
        <Btn variant="primary" onClick={() => setModal("add")}>+ Agregar medicamento</Btn>
      </div>

      {/* Tabla */}
      <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.surface }}>
                {["Medicamento", "Lote", "Categoría", "Cantidad", "Vencimiento", "Precio", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginados.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>No se encontraron medicamentos</td></tr>
              ) : paginados.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.surface }}>
                  <td style={{ padding: "10px 14px", fontWeight: 500, color: COLORS.text }}>
                    {m.nombre}
                    {isExpiringSoon(m) && <span style={{ marginLeft: 6, fontSize: 10, color: COLORS.warning }}>📅 Por vencer</span>}
                    <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 400 }}>{m.proveedor}</div>
                  </td>
                  <td style={{ padding: "10px 14px", color: COLORS.textMuted, fontFamily: "monospace", fontSize: 12 }}>{m.lote}</td>
                  <td style={{ padding: "10px 14px" }}><Badge color="blue">{m.categoria}</Badge></td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: m.cantidad === 0 ? COLORS.danger : m.cantidad <= m.stockMinimo ? COLORS.warning : COLORS.text }}>{m.cantidad}</td>
                  <td style={{ padding: "10px 14px", color: COLORS.textMuted, whiteSpace: "nowrap" }}>{fmtDate(m.vencimiento)}</td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{fmt(m.precio)}</td>
                  <td style={{ padding: "10px 14px" }}>{getEstado(m)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn variant="outline" size="sm" onClick={() => setModal(m)}>Editar</Btn>
                      <Btn variant="ghost" size="sm" onClick={() => setDelConf(m)} style={{ color: COLORS.danger, borderColor: COLORS.dangerLight }}>Eliminar</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {paginas > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>{filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}</span>
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: paginas }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPagina(p)} style={{
                  width: 30, height: 30, borderRadius: 6, border: `1px solid ${p === pagina ? COLORS.primary : COLORS.border}`,
                  background: p === pagina ? COLORS.primary : "transparent", color: p === pagina ? "#fff" : COLORS.textMuted,
                  fontSize: 12, cursor: "pointer"
                }}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {modal === "add" && (
        <Modal title="Agregar medicamento" onClose={() => setModal(null)}>
          <MedForm onSave={(data) => { onAdd(data); setModal(null); }} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal && modal !== "add" && (
        <Modal title="Editar medicamento" onClose={() => setModal(null)}>
          <MedForm initial={modal} onSave={(data) => { onEdit({ ...modal, ...data }); setModal(null); }} onClose={() => setModal(null)} />
        </Modal>
      )}

      {delConf && (
        <Modal title="Confirmar eliminación" onClose={() => setDelConf(null)}>
          <p style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 20 }}>
            ¿Estás seguro de que deseas eliminar <strong style={{ color: COLORS.text }}>{delConf.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setDelConf(null)}>Cancelar</Btn>
            <Btn variant="danger" onClick={() => { onDelete(delConf.id); setDelConf(null); }}>Eliminar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Vista Ventas ─────────────────────────────────────────────────────────────
const Ventas = ({ ventas, medicamentos, onVenta }) => {
  const [modal, setModal] = useState(false);
  const mesActual = new Date().getMonth();

  const ventasOrdenadas = [...ventas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: COLORS.text }}>Historial de ventas</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.textMuted }}>{ventas.length} transacciones registradas</p>
        </div>
        <Btn variant="success" onClick={() => setModal(true)}>+ Registrar venta</Btn>
      </div>

      {/* Resumen mes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Ventas este mes", value: fmt(ventas.filter(v => new Date(v.fecha).getMonth() === mesActual).reduce((a, v) => a + v.total, 0)), icon: "💰", color: "green" },
          { label: "Transacciones", value: ventas.filter(v => new Date(v.fecha).getMonth() === mesActual).length, icon: "📋", color: "blue" },
          { label: "Unidades vendidas", value: ventas.filter(v => new Date(v.fecha).getMonth() === mesActual).reduce((a, v) => a + v.cantidad, 0), icon: "💊", color: "blue" },
        ].map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: COLORS.surface }}>
              {["Medicamento", "Cantidad", "Precio unit.", "Total", "Fecha"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ventasOrdenadas.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>No hay ventas registradas</td></tr>
            ) : ventasOrdenadas.map((v, i) => (
              <tr key={v.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.surface }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: COLORS.text }}>{v.medicamentoNombre}</td>
                <td style={{ padding: "10px 14px" }}>{v.cantidad} uds.</td>
                <td style={{ padding: "10px 14px", color: COLORS.textMuted }}>{fmt(v.precio)}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: COLORS.success }}>{fmt(v.total)}</td>
                <td style={{ padding: "10px 14px", color: COLORS.textMuted, fontSize: 12 }}>{fmtDate(v.fecha)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Registrar venta" onClose={() => setModal(false)}>
          <SaleForm medicamentos={medicamentos} onSave={(data) => { onVenta(data); setModal(false); }} onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
};

// ─── Vista Alertas ────────────────────────────────────────────────────────────
const Alertas = ({ medicamentos }) => {
  const criticos = medicamentos.filter(isOutOfStock);
  const bajos = medicamentos.filter(isLowStock);
  const porVencer = medicamentos.filter(isExpiringSoon);

  const AlertRow = ({ m, type }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "12px 0",
      borderBottom: `1px solid ${COLORS.border}`
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: type === "red" ? COLORS.dangerLight : type === "yellow" ? COLORS.warningLight : "#fff8e6",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
      }}>
        {type === "red" ? "🚫" : type === "yellow" ? "⚠️" : "📅"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 13, color: COLORS.text }}>{m.nombre}</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>{m.categoria} · {m.proveedor}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        {type !== "expire" ? (
          <div style={{ fontSize: 13, fontWeight: 600, color: type === "red" ? COLORS.danger : COLORS.warning }}>{m.cantidad} uds.</div>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.warning }}>{fmtDate(m.vencimiento)}</div>
        )}
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{type === "red" ? "Sin stock" : type === "yellow" ? `Mín: ${m.stockMinimo}` : "Por vencer"}</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {criticos.length === 0 && bajos.length === 0 && porVencer.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: COLORS.success }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Todo en orden</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>No hay alertas activas en este momento</div>
        </div>
      )}

      {criticos.length > 0 && (
        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20 }}>
          <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: COLORS.danger }}>🚫 Medicamentos agotados ({criticos.length})</h4>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: COLORS.textMuted }}>Requieren reabastecimiento urgente</p>
          {criticos.map(m => <AlertRow key={m.id} m={m} type="red" />)}
        </div>
      )}

      {bajos.length > 0 && (
        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20 }}>
          <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: COLORS.warning }}>⚠️ Stock bajo ({bajos.length})</h4>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: COLORS.textMuted }}>Por debajo del stock mínimo configurado</p>
          {bajos.map(m => <AlertRow key={m.id} m={m} type="yellow" />)}
        </div>
      )}

      {porVencer.length > 0 && (
        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20 }}>
          <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: COLORS.warning }}>📅 Por vencer en 90 días ({porVencer.length})</h4>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: COLORS.textMuted }}>Planifica la rotación o devolución de estos productos</p>
          {porVencer.map(m => <AlertRow key={m.id} m={m} type="expire" />)}
        </div>
      )}
    </div>
  );
};

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function FarmaciaApp() {
  const [vista, setVista] = useState("dashboard");
  const [medicamentos, setMedicamentos] = useState(initialMedicamentos);
  const [ventas, setVentas] = useState(initialVentas);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const addMed = (data) => {
    setMedicamentos(p => [...p, { ...data, id: genId(), registro: new Date().toISOString().split("T")[0] }]);
    showToast("Medicamento agregado correctamente");
  };

  const editMed = (data) => {
    setMedicamentos(p => p.map(m => m.id === data.id ? data : m));
    showToast("Medicamento actualizado");
  };

  const deleteMed = (id) => {
    setMedicamentos(p => p.filter(m => m.id !== id));
    showToast("Medicamento eliminado", "warning");
  };

  const registrarVenta = (data) => {
    const nuevaVenta = { ...data, id: genId(), fecha: new Date().toISOString(), mes: new Date().getMonth() };
    setVentas(p => [...p, nuevaVenta]);
    setMedicamentos(p => p.map(m => m.id === data.medicamentoId ? { ...m, cantidad: m.cantidad - data.cantidad } : m));
    showToast(`Venta de ${data.cantidad} unidades registrada — ${fmt(data.total)}`, "success");
  };

  const alertasCount = medicamentos.filter(m => isOutOfStock(m) || isLowStock(m) || isExpiringSoon(m)).length;

  const navItems = [
    { key: "dashboard", icon: "📊", label: "Dashboard" },
    { key: "inventario", icon: "💊", label: "Inventario" },
    { key: "ventas", icon: "💰", label: "Ventas" },
    { key: "alertas", icon: "🔔", label: "Alertas", badge: alertasCount },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: COLORS.surface, color: COLORS.text, overflow: "hidden" }}>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 220 : 60, flexShrink: 0, background: COLORS.white,
        borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column",
        transition: "width 0.25s ease", overflow: "hidden"
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: COLORS.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0, color: "#fff"
          }}>⚕</div>
          {sidebarOpen && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text, whiteSpace: "nowrap" }}>MediStock</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, whiteSpace: "nowrap" }}>Sistema de farmacia</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setVista(item.key)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 10px", borderRadius: 8, border: "none", cursor: "pointer",
              background: vista === item.key ? COLORS.primaryLight : "transparent",
              color: vista === item.key ? COLORS.primary : COLORS.textMuted,
              fontWeight: vista === item.key ? 600 : 400, fontSize: 13,
              marginBottom: 2, textAlign: "left", transition: "all 0.15s", position: "relative"
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              {item.badge > 0 && (
                <span style={{
                  position: "absolute", top: 6, right: sidebarOpen ? 10 : 6,
                  background: COLORS.danger, color: "#fff",
                  fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 16,
                  height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px"
                }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Toggle */}
        <button onClick={() => setSidebarOpen(p => !p)} style={{
          margin: 8, padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 8,
          background: "transparent", cursor: "pointer", color: COLORS.textMuted, fontSize: 14
        }}>{sidebarOpen ? "◀" : "▶"}</button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`,
          padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: COLORS.text }}>
              {navItems.find(n => n.key === vista)?.icon}{" "}
              {navItems.find(n => n.key === vista)?.label}
            </h2>
            <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted }}>
              {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: COLORS.success,
              boxShadow: `0 0 0 3px ${COLORS.successLight}`
            }} />
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Sincronizado</span>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: COLORS.primaryLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: COLORS.primary, fontWeight: 600
            }}>F</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {vista === "dashboard" && <Dashboard medicamentos={medicamentos} ventas={ventas} />}
          {vista === "inventario" && <Inventario medicamentos={medicamentos} onAdd={addMed} onEdit={editMed} onDelete={deleteMed} />}
          {vista === "ventas" && <Ventas ventas={ventas} medicamentos={medicamentos} onVenta={registrarVenta} />}
          {vista === "alertas" && <Alertas medicamentos={medicamentos} />}
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
