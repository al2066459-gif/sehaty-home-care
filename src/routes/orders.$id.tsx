import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MessageCircle, MapPin, Star } from "lucide-react";
import { Shell, TopBar, StatusBadge, LYD } from "@/components/sehaty";
import { Button } from "@/components/ui/button";
import { SERVICES, actions, useStore, type OrderStatus } from "@/lib/store";
import doctor from "@/assets/doctor.jpg";

export const Route = createFileRoute("/orders/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `متابعة الطلب #${params.id} - صحتي` },
      { name: "description", content: "تتبع حالة طلبك الطبي خطوة بخطوة." },
      { property: "og:title", content: "متابعة الطلب - صحتي" },
      { property: "og:description", content: "تتبع حالة طلبك." },
    ],
  }),
  component: Track,
});

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "تم الطلب" },
  { key: "accepted", label: "تم القبول" },
  { key: "onway", label: "في الطريق" },
  { key: "done", label: "تم الوصول" },
];

function Track() {
  const { id } = Route.useParams();
  const { orders } = useStore();
  const o = orders.find((x) => x.id === id);
  if (!o) return <Shell><TopBar title="الطلب" back="/orders" /><p className="p-8 text-center text-muted-foreground">الطلب غير موجود</p></Shell>;
  const idx = STEPS.findIndex((s) => s.key === o.status);
  const mapSrc = o.coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${o.coords.lng - 0.01},${o.coords.lat - 0.01},${o.coords.lng + 0.01},${o.coords.lat + 0.01}&marker=${o.coords.lat},${o.coords.lng}`
    : "https://www.openstreetmap.org/export/embed.html?bbox=13.12,32.85,13.24,32.92";
  return (
    <Shell>
      <TopBar title="تفاصيل الطلب" back="/orders" />
      <div className="mx-4 overflow-hidden rounded-3xl shadow-card">
        <iframe title="خريطة" src={mapSrc} className="h-52 w-full border-0" loading="lazy" />
      </div>
      <div className="m-4 space-y-4 rounded-3xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div><p className="font-bold">{SERVICES[o.service].title}</p><p className="text-xs text-muted-foreground">#{o.id} · {o.option}</p></div>
          <StatusBadge status={o.status} />
        </div>

        {o.status !== "pending" && o.status !== "cancelled" && (
          <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
            <img src={doctor} alt="" className="h-12 w-12 rounded-full object-cover" width={48} height={48} loading="lazy" />
            <div className="flex-1">
              <p className="font-bold">{SERVICES[o.service].provider}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-warning text-warning" />4.8</p>
            </div>
            <a href="tel:0910000000" className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="اتصال"><Phone className="h-4 w-4" /></a>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-primary" aria-label="رسالة"><MessageCircle className="h-4 w-4" /></button>
          </div>
        )}

        {o.status !== "cancelled" && (
          <ol className="flex items-start justify-between">
            {STEPS.map((s, i) => (
              <li key={s.key} className="flex flex-1 flex-col items-center gap-1 text-center">
                <span className={`h-4 w-4 rounded-full border-4 ${i <= idx ? "border-primary bg-card" : "border-border bg-muted"}`} />
                <span className={`text-xs ${i <= idx ? "font-bold text-primary" : "text-muted-foreground"}`}>{s.label}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="space-y-2 border-t pt-3 text-sm">
          <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" />{o.address}</p>
          <p className="flex justify-between"><span className="text-muted-foreground">الموعد</span><span>{o.date} · {o.time}</span></p>
          <p className="flex justify-between"><span className="text-muted-foreground">الدفع</span><span>نقداً</span></p>
          <p className="flex justify-between font-bold"><span>الإجمالي</span><span className="text-primary">{LYD(o.price)}</span></p>
        </div>

        {o.status === "pending" && (
          <Button variant="outline" className="w-full text-destructive" onClick={() => actions.setStatus(o.id, "cancelled")}>إلغاء الطلب</Button>
        )}
        <Button asChild variant="secondary" className="w-full"><Link to="/home">العودة للرئيسية</Link></Button>
      </div>
    </Shell>
  );
}
