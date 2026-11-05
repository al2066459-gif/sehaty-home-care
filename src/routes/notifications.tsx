import { createFileRoute } from "@tanstack/react-router";
import { Shell, TopBar } from "@/components/sehaty";
import { SERVICES, STATUS_LABEL, useStore } from "@/lib/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات - صحتي" },
      { name: "description", content: "آخر التحديثات على طلباتك." },
      { property: "og:title", content: "الإشعارات - صحتي" },
      { property: "og:description", content: "آخر التحديثات." },
    ],
  }),
  component: () => {
    const { orders } = useStore();
    return (
      <Shell>
        <TopBar title="الإشعارات" />
        <ul className="space-y-2 p-4">
          {orders.slice(0, 8).map((o) => (
            <li key={o.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
              <div className="flex-1"><p className="font-bold">{STATUS_LABEL[o.status]}</p><p className="text-xs text-muted-foreground">طلب #{o.id} · {SERVICES[o.service].title}</p></div>
              <span className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" })}</span>
            </li>
          ))}
        </ul>
      </Shell>
    );
  },
});
