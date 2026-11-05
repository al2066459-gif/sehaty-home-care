import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, ClipboardList, Users, Wallet, BarChart3, Settings, Home } from "lucide-react";
import logo from "@/assets/logo.png";
import { StatusBadge, LYD } from "@/components/sehaty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SERVICES, actions, totals, useStore, type OrderStatus, type ServiceKey } from "@/lib/store";
import { splitCommission } from "@/lib/commission";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة - صحتي" },
      { name: "description", content: "إدارة المستخدمين والطلبات والمالية والعمولات في صحتي." },
      { property: "og:title", content: "لوحة الإدارة - صحتي" },
      { property: "og:description", content: "كل شيء تحت سيطرتك." },
    ],
  }),
  component: Admin,
});

type Tab = "dash" | "orders" | "users" | "finance" | "reports" | "settings";
const TABS: { k: Tab; label: string; icon: typeof Home }[] = [
  { k: "dash", label: "الرئيسية", icon: LayoutDashboard },
  { k: "orders", label: "الطلبات", icon: ClipboardList },
  { k: "users", label: "المستخدمون", icon: Users },
  { k: "finance", label: "المالية", icon: Wallet },
  { k: "reports", label: "التقارير", icon: BarChart3 },
  { k: "settings", label: "الإعدادات", icon: Settings },
];

const PROVIDERS = [
  { name: "د. أحمد محمد", type: "طبيب", status: "نشط" },
  { name: "م. سارة علي", type: "ممرضة", status: "نشط" },
  { name: "د. خالد منصور", type: "طبيب", status: "بانتظار التوثيق" },
  { name: "مختبر الشفاء", type: "مختبر", status: "نشط" },
  { name: "إسعاف طرابلس", type: "إسعاف", status: "نشط" },
];

function Admin() {
  const { orders, commissionRate } = useStore();
  const [tab, setTab] = useState<Tab>("dash");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [rate, setRate] = useState(String(commissionRate));
  const t = totals(orders, commissionRate);
  const byService = (Object.keys(SERVICES) as ServiceKey[]).map((k) => ({ k, n: orders.filter((o) => o.service === k).length }));
  const max = Math.max(1, ...byService.map((b) => b.n));

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="bg-sidebar text-sidebar-foreground md:min-h-screen md:w-60">
        <div className="flex items-center gap-2 p-4"><img src={logo} alt="" className="h-8 w-8" width={32} height={32} /><span className="text-xl font-extrabold">صحتي</span></div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col">
          {TABS.map((x) => (
            <button key={x.k} onClick={() => setTab(x.k)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${tab === x.k ? "bg-sidebar-primary text-sidebar-primary-foreground font-bold" : "hover:bg-sidebar-accent"}`}>
              <x.icon className="h-4 w-4" />{x.label}
            </button>
          ))}
          <Link to="/" className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-sidebar-accent"><Home className="h-4 w-4" />التطبيق</Link>
        </nav>
      </aside>

      <main className="flex-1 space-y-5 p-4 md:p-8">
        <h1 className="text-2xl font-extrabold">{TABS.find((x) => x.k === tab)!.label}</h1>

        {(tab === "dash" || tab === "reports") && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card label="إجمالي الطلبات" value={String(orders.length)} />
              <Card label="طلبات مكتملة" value={String(t.doneCount)} />
              <Card label="إجمالي الإيرادات" value={LYD(t.revenue)} />
              <Card label="عمولات المنصة" value={LYD(t.commission)} accent />
            </div>
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <p className="mb-4 font-bold">الطلبات حسب الخدمة</p>
              <div className="flex h-40 items-end gap-4">
                {byService.map((b) => (
                  <div key={b.k} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-bold">{b.n}</span>
                    <div className="w-full rounded-t-lg bg-gradient-brand" style={{ height: `${(b.n / max) * 100}%`, minHeight: 4 }} />
                    <span className="text-center text-xs text-muted-foreground">{SERVICES[b.k].title}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {(tab === "dash" || tab === "orders") && (
          <div className="rounded-2xl bg-card p-4 shadow-card">
            {tab === "orders" && (
              <div className="mb-3 flex flex-wrap gap-2">
                {(["all", "pending", "accepted", "onway", "done", "cancelled"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {f === "all" ? "الكل" : <StatusLabel s={f} />}
                  </button>
                ))}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground"><tr className="text-right"><th className="p-2">#</th><th className="p-2">المريض</th><th className="p-2">الخدمة</th><th className="p-2">المبلغ</th><th className="p-2">الحالة</th>{tab === "orders" && <th className="p-2">إجراء</th>}</tr></thead>
                <tbody>
                  {orders.filter((o) => filter === "all" || tab === "dash" || o.status === filter).slice(0, tab === "dash" ? 5 : 100).map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="p-2">{o.id}</td><td className="p-2">{o.patient}</td><td className="p-2">{SERVICES[o.service].title}</td><td className="p-2">{LYD(o.price)}</td>
                      <td className="p-2"><StatusBadge status={o.status} /></td>
                      {tab === "orders" && <td className="p-2">{o.status !== "done" && o.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => actions.setStatus(o.id, "cancelled")}>إلغاء</Button>}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="divide-y rounded-2xl bg-card shadow-card">
            {PROVIDERS.map((p) => (
              <div key={p.name} className="flex items-center gap-3 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft font-bold text-primary">{p.name[0]}</div>
                <div className="flex-1"><p className="font-bold">{p.name}</p><p className="text-xs text-muted-foreground">{p.type}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.status === "نشط" ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning"}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "finance" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card label="إجمالي الإيرادات" value={LYD(t.revenue)} />
              <Card label="عمولات المنصة" value={LYD(t.commission)} accent />
            </div>
            <div className="divide-y rounded-2xl bg-card shadow-card">
              {orders.filter((o) => o.status === "done").map((o) => {
                const c = splitCommission(o.price, commissionRate);
                return (
                  <div key={o.id} className="flex justify-between p-4 text-sm">
                    <span>#{o.id} · {SERVICES[o.service].provider}</span>
                    <span>مستحق: <b>{LYD(c.providerNet)}</b> · عمولة: <b className="text-primary">{LYD(c.commission)}</b></span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "settings" && (
          <div className="max-w-md space-y-4 rounded-2xl bg-card p-5 shadow-card">
            <label className="block font-bold">نسبة عمولة المنصة (%)</label>
            <div className="flex gap-2">
              <Input type="number" min={0} max={50} value={rate} onChange={(e) => setRate(e.target.value)} />
              <Button onClick={() => { const n = Number(rate); if (n >= 0 && n <= 50) actions.setCommission(n); }}>حفظ</Button>
            </div>
            <p className="text-sm text-muted-foreground">النسبة الحالية: {commissionRate}%</p>
            <div className="border-t pt-4">
              <p className="font-bold">طرق الدفع</p>
              <p className="mt-2 text-sm">✓ الدفع النقدي — مفعّل</p>
              <p className="text-sm text-muted-foreground">○ الدفع الإلكتروني — قريباً</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusLabel({ s }: { s: OrderStatus }) {
  return <>{({ pending: "بانتظار القبول", accepted: "مقبول", onway: "في الطريق", done: "مكتمل", cancelled: "ملغي" })[s]}</>;
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-card ${accent ? "bg-gradient-brand text-primary-foreground" : "bg-card"}`}>
      <p className={`text-xs ${accent ? "opacity-90" : "text-muted-foreground"}`}>{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}
