import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Wallet, ClipboardCheck, Clock, MapPin, LogOut } from "lucide-react";
import { Logo, StatusBadge, LYD } from "@/components/sehaty";
import { Button } from "@/components/ui/button";
import { SERVICES, actions, totals, useStore, type OrderStatus } from "@/lib/store";
import { splitCommission } from "@/lib/commission";
import doctor from "@/assets/doctor.jpg";

export const Route = createFileRoute("/provider")({
  head: () => ({
    meta: [
      { title: "لوحة مقدم الخدمة - صحتي" },
      { name: "description", content: "استقبل الطلبات وأدر خدماتك وأرباحك في صحتي." },
      { property: "og:title", content: "لوحة مقدم الخدمة - صحتي" },
      { property: "og:description", content: "استقبال الطلبات والأرباح." },
    ],
  }),
  component: Provider,
});

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: "accepted", label: "قبول الطلب" },
  accepted: { to: "onway", label: "أنا في الطريق" },
  onway: { to: "done", label: "إتمام الخدمة" },
};

function Provider() {
  const { user, orders, commissionRate } = useStore();
  const [tab, setTab] = useState<"requests" | "earnings">("requests");
  const t = totals(orders, commissionRate);
  const open = orders.filter((o) => NEXT[o.status]);

  return (
    <div className="mx-auto min-h-screen max-w-md pb-8">
      <header className="flex items-center gap-3 p-5">
        <img src={doctor} alt="" className="h-12 w-12 rounded-full object-cover" width={48} height={48} />
        <div className="flex-1"><p className="font-bold">{user?.role === "provider" ? user.name : "د. أحمد محمد"}</p><p className="text-xs text-muted-foreground">{user?.specialty ?? "طبيب عام"} · متاح الآن</p></div>
        <Link to="/" aria-label="خروج" onClick={() => actions.logout()}><LogOut className="h-5 w-5 text-muted-foreground" /></Link>
      </header>

      <div className="mx-5 grid grid-cols-2 gap-3">
        <Stat icon={ClipboardCheck} label="الطلبات المكتملة" value={String(t.doneCount)} />
        <Stat icon={Clock} label="طلبات جديدة" value={String(open.filter((o) => o.status === "pending").length)} />
        <Stat icon={Wallet} label="صافي الأرباح" value={LYD(t.net)} />
        <Stat icon={Star} label="التقييم" value="4.8" />
      </div>

      <div className="mx-5 mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
        {(["requests", "earnings"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl py-2 text-sm font-bold ${tab === k ? "bg-card text-primary shadow-card" : "text-muted-foreground"}`}>
            {k === "requests" ? "الطلبات" : "أرباحي وعمولاتي"}
          </button>
        ))}
      </div>

      {tab === "requests" ? (
        <div className="space-y-3 p-5">
          {open.length === 0 && <p className="py-8 text-center text-muted-foreground">لا توجد طلبات حالياً</p>}
          {open.map((o) => {
            const n = NEXT[o.status]!;
            return (
              <div key={o.id} className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div><p className="font-bold">{o.patient}</p><p className="text-xs text-muted-foreground">{SERVICES[o.service].title} · {o.option}</p></div>
                  <StatusBadge status={o.status} />
                </div>
                <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{o.address}</p>
                <div className="flex items-center justify-between text-sm"><span>{o.date} · {o.time}</span><span className="font-bold text-primary">{LYD(o.price)}</span></div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => actions.setStatus(o.id, n.to)}>{n.label}</Button>
                  {o.status === "pending" && <Button variant="outline" onClick={() => actions.setStatus(o.id, "cancelled")}>رفض</Button>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3 p-5">
          <div className="rounded-3xl bg-gradient-brand p-5 text-primary-foreground">
            <p className="text-sm opacity-90">الرصيد المستحق</p>
            <p className="text-3xl font-extrabold">{LYD(t.net)}</p>
            <p className="mt-1 text-xs opacity-90">إجمالي {LYD(t.revenue)} − عمولة المنصة {commissionRate}% ({LYD(t.commission)})</p>
          </div>
          <Button className="w-full" variant="secondary">طلب سحب</Button>
          {orders.filter((o) => o.status === "done").map((o) => {
            const c = splitCommission(o.price, commissionRate);
            return (
              <div key={o.id} className="flex items-center justify-between rounded-2xl bg-card p-4 text-sm shadow-card">
                <div><p className="font-bold">#{o.id} · {o.patient}</p><p className="text-xs text-muted-foreground">عمولة: {LYD(c.commission)}</p></div>
                <span className="font-bold text-primary">{LYD(c.providerNet)}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex justify-center"><Logo size="sm" /></div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-2 text-xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
