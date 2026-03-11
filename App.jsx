import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid } from "recharts";
import { CARE_PLAN_RAW } from "./data/carePlanData";
import { SMART_CGM_RAW } from "./data/smartCgmData";

// ─── PARSE TO OBJECTS ────────────────────────────────────────────────────────
const parseCPRow = (r) => ({
  state: r[0], team: r[1], planName: r[2], condition: r[3] || "Other",
  duration: r[4], endorser: r[5], planType: r[6], month: r[7],
  bdm: r[8], am: r[9], discount: r[10]||0, bcaInPlan: r[11]||0,
  cgmCount: r[12]||0, cgmType: r[13]||"None", trackySensors: r[14]||0,
  carepay: r[15]||0, invoice: r[16]||0,
  planCategory: r[2].startsWith("MAMILY") ? "Mamily" : r[2].startsWith("Comprehensive") ? "Comprehensive" : r[2].startsWith("Doctor") ? "Doctor" : "Other",
});

const parseSCRow = (r) => ({
  state: r[0], team: r[1], condition: r[2]||"Other",
  duration: r[3], endorser: r[4], month: r[5],
  bdm: r[6], am: r[7], discount: r[8]||0, bcaInPlan: r[9]||0,
  cgmCount: r[10]||0, cgmType: r[11]||"None", trackySensors: r[12]||0,
  invoice: r[13]||0,
});

const CP = CARE_PLAN_RAW.map(parseCPRow);
const SC = SMART_CGM_RAW.map(parseSCRow);

// ─── COLORS ──────────────────────────────────────────────────────────────────
const PALETTE = {
  teal: "#00C9A7", coral: "#FF6B6B", amber: "#FFD93D",
  blue: "#4ECDC4", purple: "#C084FC", indigo: "#818CF8",
  rose: "#FB7185", lime: "#A3E635", orange: "#FB923C",
};
const CHART_COLORS = Object.values(PALETTE);
const CGM_COLORS = { Abbott: "#3B82F6", Tracky: "#10B981", Libre2: "#F59E0B", None: "#94A3B8" };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`;
const groupBy = (arr, key) => arr.reduce((acc, item) => {
  const k = typeof key === "function" ? key(item) : item[key];
  if (!acc[k]) acc[k] = [];
  acc[k].push(item);
  return acc;
}, {});
const sumBy = (arr, key) => arr.reduce((s, i) => s + (i[key]||0), 0);
const countBy = (arr, key) => {
  const g = groupBy(arr, key);
  return Object.entries(g).map(([name, items]) => ({ name, count: items.length, revenue: sumBy(items, "invoice") })).sort((a,b)=>b.count-a.count);
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${color}30`, borderRadius: 12, padding: "16px 20px", borderLeft: `4px solid ${color}` }}>
    <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
    <div style={{ color: "#F1F5F9", fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ color: color, fontSize: 12, marginTop: 4 }}>{sub}</div>}
  </div>
);

// ─── CHART CARD ───────────────────────────────────────────────────────────────
const ChartCard = ({ title, children }) => (
  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 16px" }}>
    <div style={{ color: "#CBD5E1", fontSize: 13, fontWeight: 700, letterSpacing: 0.5, marginBottom: 16, textTransform: "uppercase" }}>{title}</div>
    {children}
  </div>
);

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: "#94A3B8", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || "#F1F5F9" }}>{p.name}: {p.name?.includes("revenue") || p.name?.includes("Revenue") || p.name?.includes("Invoice") ? fmt(p.value) : p.value?.toLocaleString()}</div>)}
    </div>
  );
};

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSheet, setActiveSheet] = useState("carePlan");
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterState, setFilterState] = useState("All");
  const [filterAM, setFilterAM] = useState("All");

  const data = activeSheet === "carePlan" ? CP : SC;

  const filtered = useMemo(() => {
    return data.filter(d =>
      (filterMonth === "All" || d.month === filterMonth) &&
      (filterState === "All" || d.state === filterState) &&
      (filterAM === "All" || d.am === filterAM)
    );
  }, [data, filterMonth, filterState, filterAM]);

  const months = [...new Set(data.map(d => d.month))].sort();
  const states = [...new Set(data.map(d => d.state))].sort();
  const ams = [...new Set(data.map(d => d.am).filter(Boolean))].sort();

  // KPIs
  const totalRevenue = sumBy(filtered, "invoice");
  const totalCarepay = activeSheet === "carePlan" ? sumBy(filtered, "carepay") : 0;
  const totalDiscount = sumBy(filtered, "discount");
  const totalCGM = sumBy(filtered, "cgmCount");
  const withBCA = filtered.filter(d => d.bcaInPlan > 0).length;
  const bcaPct = filtered.length ? Math.round(withBCA / filtered.length * 100) : 0;
  const avgInvoice = filtered.length ? Math.round(totalRevenue / filtered.filter(d=>d.invoice>0).length) : 0;
  const janData = filtered.filter(d=>d.month==="Jan_26");
  const febData = filtered.filter(d=>d.month==="Feb_26");
  const growthPct = janData.length ? Math.round((febData.length - janData.length)/janData.length*100) : 0;

  // Chart data
  const byState = countBy(filtered, "state").slice(0, 10);
  const byCondition = countBy(filtered, "condition");
  const byAM = countBy(filtered, "am").filter(d=>d.name).slice(0, 10);
  const byMonth = months.map(m => {
    const md = filtered.filter(d => d.month === m);
    return { month: m.replace("_26",""), count: md.length, revenue: sumBy(md, "invoice") };
  });
  const cgmDist = (() => {
    const g = groupBy(filtered.filter(d=>d.cgmType && d.cgmType !== "None" && d.cgmType !== ""), "cgmType");
    return Object.entries(g).map(([n,v]) => ({ name: n, value: v.length }));
  })();
  const byDuration = (() => {
    const g = groupBy(filtered, "duration");
    return Object.entries(g).map(([n,v]) => ({ duration: n+"M", count: v.length, revenue: sumBy(v,"invoice") })).sort((a,b)=>Number(a.duration)-Number(b.duration));
  })();
  const byTeam = countBy(filtered, "team");
  const byBDM = countBy(filtered, "bdm").filter(d=>d.name).slice(0,10);
  const byPlanType = activeSheet === "carePlan" ? countBy(filtered, "planType") : [];
  const byPlanCat = activeSheet === "carePlan" ? countBy(filtered, "planCategory") : [];

  const tabs = [
    { id:"overview", label:"Overview" },
    { id:"geo", label:"Geography" },
    { id:"sales", label:"Sales Team" },
    { id:"product", label:"Product Mix" },
    { id:"cgm", label:"CGM Analysis" },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans', 'Segoe UI', sans-serif", background:"#0F172A", minHeight:"100vh", color:"#F1F5F9", padding: "0 0 40px" }}>
      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"20px 28px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16 }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#F8FAFC", letterSpacing:-0.5 }}>
              <span style={{ color: PALETTE.teal }}>●</span> Health Analytics Dashboard
            </h1>
            <p style={{ margin:"4px 0 0", fontSize:12, color:"#64748B" }}>Jan 2026 – Feb 2026 · Live Data</p>
          </div>
          {/* Sheet toggle */}
          <div style={{ display:"flex", gap:8 }}>
            {["carePlan","smartCGM"].map(s => (
              <button key={s} onClick={()=>{ setActiveSheet(s); setFilterState("All"); setFilterMonth("All"); setFilterAM("All"); }}
                style={{ padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                  background: activeSheet===s ? PALETTE.teal : "rgba(255,255,255,0.07)",
                  color: activeSheet===s ? "#0F172A" : "#94A3B8" }}>
                {s==="carePlan" ? "Care Plan" : "Smart CGM"}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", paddingBottom:16 }}>
          {[
            { label:"Month", val:filterMonth, set:setFilterMonth, opts:["All",...months] },
            { label:"State", val:filterState, set:setFilterState, opts:["All",...states] },
            { label:"AM", val:filterAM, set:setFilterAM, opts:["All",...ams] },
          ].map(f => (
            <select key={f.label} value={f.val} onChange={e=>f.set(e.target.value)}
              style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#CBD5E1", padding:"6px 12px", fontSize:12, cursor:"pointer" }}>
              {f.opts.map(o => <option key={o} value={o} style={{background:"#1E293B"}}>{f.label==="Month"&&o!=="All"?o.replace("_26",""):o}</option>)}
            </select>
          ))}
          <span style={{ marginLeft:"auto", color:"#64748B", fontSize:12, alignSelf:"center" }}>{filtered.length} records</span>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{ padding:"10px 18px", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, borderRadius:"8px 8px 0 0",
                background: activeTab===t.id ? "rgba(0,201,167,0.15)" : "transparent",
                color: activeTab===t.id ? PALETTE.teal : "#64748B",
                borderBottom: activeTab===t.id ? `2px solid ${PALETTE.teal}` : "2px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"24px 28px" }}>
        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div>
            {/* KPI Cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))", gap:14, marginBottom:24 }}>
              <StatCard label="Total Records" value={filtered.length.toLocaleString()} sub={`+${growthPct}% MoM`} color={PALETTE.teal} />
              <StatCard label="Total Revenue" value={fmt(totalRevenue)} sub="Invoice amount" color={PALETTE.coral} />
              {activeSheet==="carePlan" && <StatCard label="Carepay Amount" value={fmt(totalCarepay)} sub="3rd party financed" color={PALETTE.purple} />}
              <StatCard label="Total Discount" value={fmt(totalDiscount)} sub="Given to patients" color={PALETTE.amber} />
              <StatCard label="Total CGMs" value={totalCGM.toLocaleString()} sub="Sensors issued" color={PALETTE.blue} />
              <StatCard label="BCA Attachment" value={`${bcaPct}%`} sub={`${withBCA} plans`} color={PALETTE.indigo} />
              <StatCard label="Avg Invoice" value={fmt(avgInvoice)} sub="Per patient" color={PALETTE.rose} />
            </div>

            {/* Month trend + Condition */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
              <ChartCard title="Monthly Trend – Count & Revenue">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill:"#64748B", fontSize:11 }} />
                    <YAxis yAxisId="left" tick={{ fill:"#64748B", fontSize:10 }} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={v=>fmt(v)} tick={{ fill:"#64748B", fontSize:10 }} />
                    <Tooltip content={<TT/>} />
                    <Legend wrapperStyle={{ fontSize:11, color:"#94A3B8" }} />
                    <Line yAxisId="left" type="monotone" dataKey="count" name="Count" stroke={PALETTE.teal} strokeWidth={2} dot={{ r:5, fill:PALETTE.teal }} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke={PALETTE.coral} strokeWidth={2} dot={{ r:5, fill:PALETTE.coral }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="By Condition">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byCondition} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill:"#64748B", fontSize:10 }} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fill:"#94A3B8", fontSize:11 }} />
                    <Tooltip content={<TT/>} />
                    <Bar dataKey="count" name="Patients" radius={[0,4,4,0]}>
                      {byCondition.map((_, i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Plan type & B2B/B2C */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              <ChartCard title="Team Split">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={byTeam} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="name" label={({name,count})=>`${name}: ${count}`} labelLine={false} fontSize={10}>
                      {byTeam.map((_, i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<TT/>} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {activeSheet === "carePlan" && (
                <ChartCard title="B2B vs B2C">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={byPlanType} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="name"
                        label={({ name, count, percent }) => `${name}: ${(percent*100).toFixed(0)}%`} labelLine fontSize={10}>
                        {byPlanType.map((_, i) => <Cell key={i} fill={[PALETTE.teal, PALETTE.coral][i%2]} />)}
                      </Pie>
                      <Tooltip content={<TT/>} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              <ChartCard title="Plan Category">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={activeSheet==="carePlan" ? byPlanCat : [{name:"Smart CGM", count:filtered.length}]}
                      cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="name"
                      label={({name,count})=>`${name}: ${count}`} labelLine fontSize={9}>
                      {(activeSheet==="carePlan" ? byPlanCat : [{name:"Smart CGM"}]).map((_, i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<TT/>} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* ── GEOGRAPHY ── */}
        {activeTab === "geo" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
              <ChartCard title="Top States – Patient Count">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byState}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill:"#64748B", fontSize:9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fill:"#64748B", fontSize:10 }} />
                    <Tooltip content={<TT/>} />
                    <Bar dataKey="count" name="Patients" radius={[4,4,0,0]}>
                      {byState.map((_, i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Top States – Revenue">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byState.sort((a,b)=>b.revenue-a.revenue).slice(0,10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tickFormatter={fmt} tick={{ fill:"#64748B", fontSize:9 }} />
                    <YAxis type="category" dataKey="name" width={95} tick={{ fill:"#94A3B8", fontSize:10 }} />
                    <Tooltip content={<TT/>} />
                    <Bar dataKey="revenue" name="Revenue" radius={[0,4,4,0]}>
                      {byState.map((_, i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* State table */}
            <ChartCard title="State Breakdown – Full Table">
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
                      {["State","Count","Revenue","Avg Invoice","Total CGM","With Discount"].map(h=>(
                        <th key={h} style={{ textAlign:"left", padding:"8px 12px", color:"#64748B", fontWeight:700, fontSize:11, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {countBy(filtered,"state").map((r,i) => {
                      const sd = filtered.filter(d=>d.state===r.name);
                      const cgm = sumBy(sd,"cgmCount");
                      const disc = sd.filter(d=>d.discount>0).length;
                      const avg = sd.filter(d=>d.invoice>0).length ? Math.round(sumBy(sd,"invoice")/sd.filter(d=>d.invoice>0).length) : 0;
                      return (
                        <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background: i%2===0?"transparent":"rgba(255,255,255,0.02)" }}>
                          <td style={{ padding:"9px 12px", color:"#CBD5E1", fontWeight:500 }}>{r.name}</td>
                          <td style={{ padding:"9px 12px", color: PALETTE.teal, fontWeight:700 }}>{r.count}</td>
                          <td style={{ padding:"9px 12px", color:"#F1F5F9" }}>{fmt(r.revenue)}</td>
                          <td style={{ padding:"9px 12px", color:"#94A3B8" }}>{fmt(avg)}</td>
                          <td style={{ padding:"9px 12px", color:"#94A3B8" }}>{cgm}</td>
                          <td style={{ padding:"9px 12px", color: disc>0?PALETTE.amber:"#475569" }}>{disc}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}

        {/* ── SALES TEAM ── */}
        {activeTab === "sales" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
              <ChartCard title="AM Performance – Count">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byAM} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill:"#64748B", fontSize:10 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill:"#94A3B8", fontSize:9 }} />
                    <Tooltip content={<TT/>} />
                    <Bar dataKey="count" name="Patients" radius={[0,4,4,0]}>
                      {byAM.map((_, i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="BDM Performance – Top 10">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byBDM} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill:"#64748B", fontSize:10 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fill:"#94A3B8", fontSize:9 }} />
                    <Tooltip content={<TT/>} />
                    <Bar dataKey="count" name="Patients" radius={[0,4,4,0]}>
                      {byBDM.map((_,i)=><Cell key={i} fill={CHART_COLORS[(i+3)%CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* AM Revenue Table */}
            <ChartCard title="AM Revenue Leaderboard">
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
                      {["Rank","AM Name","Patients","Revenue","Avg Invoice","Carepay","Discount Given","BCA %"].map(h=>(
                        <th key={h} style={{ textAlign:"left", padding:"8px 12px", color:"#64748B", fontWeight:700, fontSize:11, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {countBy(filtered,"am").filter(r=>r.name).sort((a,b)=>b.revenue-a.revenue).map((r,i)=>{
                      const ad = filtered.filter(d=>d.am===r.name);
                      const avg = ad.filter(d=>d.invoice>0).length ? Math.round(sumBy(ad,"invoice")/ad.filter(d=>d.invoice>0).length):0;
                      const cp = activeSheet==="carePlan" ? sumBy(ad,"carepay") : 0;
                      const disc = sumBy(ad,"discount");
                      const bca = Math.round(ad.filter(d=>d.bcaInPlan>0).length/ad.length*100);
                      return (
                        <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background: i%2===0?"transparent":"rgba(255,255,255,0.02)" }}>
                          <td style={{ padding:"9px 12px", color: i<3?PALETTE.amber:"#475569", fontWeight:700 }}>#{i+1}</td>
                          <td style={{ padding:"9px 12px", color:"#CBD5E1", fontWeight:500 }}>{r.name}</td>
                          <td style={{ padding:"9px 12px", color:PALETTE.teal, fontWeight:700 }}>{r.count}</td>
                          <td style={{ padding:"9px 12px", color:"#F1F5F9", fontWeight:600 }}>{fmt(r.revenue)}</td>
                          <td style={{ padding:"9px 12px", color:"#94A3B8" }}>{fmt(avg)}</td>
                          <td style={{ padding:"9px 12px", color:PALETTE.purple }}>{fmt(cp)}</td>
                          <td style={{ padding:"9px 12px", color:cp>0?PALETTE.rose:"#475569" }}>{fmt(disc)}</td>
                          <td style={{ padding:"9px 12px", color: bca>50?PALETTE.lime:"#94A3B8" }}>{bca}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}

        {/* ── PRODUCT MIX ── */}
        {activeTab === "product" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
              <ChartCard title="Plan Duration Mix">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byDuration}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="duration" tick={{ fill:"#94A3B8", fontSize:11 }} />
                    <YAxis tick={{ fill:"#64748B", fontSize:10 }} />
                    <Tooltip content={<TT/>} />
                    <Legend wrapperStyle={{ fontSize:11, color:"#94A3B8" }} />
                    <Bar dataKey="count" name="Patients" fill={PALETTE.teal} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Revenue by Duration">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byDuration}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="duration" tick={{ fill:"#94A3B8", fontSize:11 }} />
                    <YAxis tickFormatter={fmt} tick={{ fill:"#64748B", fontSize:10 }} />
                    <Tooltip content={<TT/>} />
                    <Bar dataKey="revenue" name="Revenue" radius={[4,4,0,0]}>
                      {byDuration.map((_,i) => <Cell key={i} fill={CHART_COLORS[(i+2)%CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {activeSheet === "carePlan" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <ChartCard title="Plan Name Distribution">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={countBy(filtered,"planName").slice(0,8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" tick={{ fill:"#64748B", fontSize:10 }} />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fill:"#94A3B8", fontSize:9 }} />
                      <Tooltip content={<TT/>} />
                      <Bar dataKey="count" name="Plans" radius={[0,4,4,0]}>
                        {countBy(filtered,"planName").slice(0,8).map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Carepay vs Direct Revenue">
                  <div style={{ display:"flex", flexDirection:"column", gap:12, padding:"20px 0" }}>
                    {[
                      { label:"Total Invoice", val:totalRevenue, color:PALETTE.teal },
                      { label:"Carepay (3rd Party)", val:totalCarepay, color:PALETTE.purple },
                      { label:"Direct Patient Pay", val:totalRevenue-totalCarepay, color:PALETTE.coral },
                      { label:"Total Discount", val:totalDiscount, color:PALETTE.amber },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ color:"#94A3B8", fontSize:12 }}>{item.label}</span>
                          <span style={{ color:item.color, fontWeight:700, fontSize:14 }}>{fmt(item.val)}</span>
                        </div>
                        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:4, height:8 }}>
                          <div style={{ background:item.color, width:`${Math.min(100,item.val/totalRevenue*100)}%`, height:8, borderRadius:4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>
            )}
          </div>
        )}

        {/* ── CGM ANALYSIS ── */}
        {activeTab === "cgm" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
              <StatCard label="Total CGMs Issued" value={totalCGM} color={PALETTE.teal} />
              <StatCard label="Abbott" value={filtered.filter(d=>d.cgmType==="Abbott").length} sub="devices" color={PALETTE.blue} />
              <StatCard label="Tracky" value={filtered.filter(d=>d.cgmType==="Tracky").length} sub="devices" color={PALETTE.lime} />
              <StatCard label="Libre2" value={filtered.filter(d=>d.cgmType==="Libre2").length} sub="devices" color={PALETTE.amber} />
              <StatCard label="Total Tracky Sensors" value={sumBy(filtered,"trackySensors")} color={PALETTE.coral} />
              <StatCard label="No CGM" value={filtered.filter(d=>!d.cgmType||d.cgmType==="None"||d.cgmType==="").length} color="#475569" />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <ChartCard title="CGM Type Distribution">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={cgmDist} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name"
                      label={({name,value,percent})=>`${name}: ${value} (${(percent*100).toFixed(0)}%)`} fontSize={11}>
                      {cgmDist.map((d,i)=><Cell key={i} fill={CGM_COLORS[d.name]||CHART_COLORS[i%CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<TT/>} />
                    <Legend wrapperStyle={{ fontSize:11, color:"#94A3B8" }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="CGM Type by State – Top 8">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={
                    countBy(filtered.filter(d=>d.cgmType&&d.cgmType!=="None"&&d.cgmType!==""),"state")
                    .slice(0,8).map(s=>{
                      const sd = filtered.filter(d=>d.state===s.name);
                      return {
                        state: s.name.split(" ")[0],
                        Abbott: sd.filter(d=>d.cgmType==="Abbott").length,
                        Tracky: sd.filter(d=>d.cgmType==="Tracky").length,
                        Libre2: sd.filter(d=>d.cgmType==="Libre2").length,
                      };
                    })
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="state" tick={{ fill:"#64748B", fontSize:9 }} />
                    <YAxis tick={{ fill:"#64748B", fontSize:10 }} />
                    <Tooltip content={<TT/>} />
                    <Legend wrapperStyle={{ fontSize:11, color:"#94A3B8" }} />
                    <Bar dataKey="Abbott" stackId="a" fill={CGM_COLORS.Abbott} />
                    <Bar dataKey="Tracky" stackId="a" fill={CGM_COLORS.Tracky} />
                    <Bar dataKey="Libre2" stackId="a" fill={CGM_COLORS.Libre2} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="CGM Attachment by Condition">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={
                    [...new Set(filtered.map(d=>d.condition))].filter(Boolean).map(cond => {
                      const cd = filtered.filter(d=>d.condition===cond);
                      return {
                        cond: cond.length>10?cond.slice(0,10):cond,
                        Abbott: cd.filter(d=>d.cgmType==="Abbott").length,
                        Tracky: cd.filter(d=>d.cgmType==="Tracky").length,
                        Libre2: cd.filter(d=>d.cgmType==="Libre2").length,
                      };
                    })
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="cond" tick={{ fill:"#64748B", fontSize:9 }} />
                    <YAxis tick={{ fill:"#64748B", fontSize:10 }} />
                    <Tooltip content={<TT/>} />
                    <Legend wrapperStyle={{ fontSize:11, color:"#94A3B8" }} />
                    <Bar dataKey="Abbott" stackId="a" fill={CGM_COLORS.Abbott} />
                    <Bar dataKey="Tracky" stackId="a" fill={CGM_COLORS.Tracky} />
                    <Bar dataKey="Libre2" stackId="a" fill={CGM_COLORS.Libre2} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Revenue by CGM Type">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={
                    ["Abbott","Tracky","Libre2","None"].map(t=>({
                      type: t,
                      revenue: sumBy(filtered.filter(d=>(d.cgmType||"None")===t),"invoice"),
                      count: filtered.filter(d=>(d.cgmType||"None")===t).length
                    }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="type" tick={{ fill:"#64748B", fontSize:11 }} />
                    <YAxis tickFormatter={fmt} tick={{ fill:"#64748B", fontSize:10 }} />
                    <Tooltip content={<TT/>} />
                    <Bar dataKey="revenue" name="Revenue" radius={[4,4,0,0]}>
                      {["Abbott","Tracky","Libre2","None"].map((t,i)=><Cell key={i} fill={CGM_COLORS[t]||"#475569"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
