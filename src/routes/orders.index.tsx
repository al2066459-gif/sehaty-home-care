import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, TopBar, StatusBadge, LYD, SERVICE_ICON } from "@/components/sehaty";
import { SERVICES, useStore } from "@/lib/store";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "طلباتي - صحتي" },
      { name: "description", content: "متابعة طلباتك وحجوزاتك الطبية." },
      { property: "og:title", content: "طلباتي - صحتي" },
      { property: "og:description", content: "متابعة الطلبات والحجوزات." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { orders } = useStore();
  const [tab, setTab] = useState<"current" | "past">("current");
  const list = orders.filter((o) => (tab === "current") === (o.status !== "done" && o.status !== "cancelled"));
  return (
    <Shell>
      <TopBar title="طلباتي" />
      <div className="mx-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
        {(["current", "past"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl py-2 text-sm font-bold ${tab === t ? "bg-card text-primary shadow-card" : "text-muted-foreground"}`}>
            {t === "current" ? "الحالية" : "السابقة"}
          </button>
        ))}
      </div>
      <div className="space-y-3 p-4">
        {list.length === 0 && <p className="py-12 text-center text-muted-foreground">لا توجد طلبات</p>}
        {list.map((o) => {
          const Icon = SERVICE_ICON[o.service];
          return (
            <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-primary"><Icon className="h-6 w-6" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{SERVICES[o.service].title}</p>
                <p className="truncate text-xs text-muted-foreground">#{o.id} · {o.option} · {o.date} {o.time}</p>
                <p className="mt-1 text-sm font-bold text-primary">{LYD(o.price)}</p>
              </div>
              <StatusBadge status={o.status} />
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
