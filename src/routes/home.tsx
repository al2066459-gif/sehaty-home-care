import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, Building2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shell, Logo, StatusBadge, SERVICE_ICON } from "@/components/sehaty";
import { SERVICES, useStore, type ServiceKey } from "@/lib/store";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "الرئيسية - صحتي" },
      { name: "description", content: "اختر الخدمة الطبية المنزلية التي تحتاجها." },
      { property: "og:title", content: "الرئيسية - صحتي" },
      { property: "og:description", content: "طبيب، تمريض، تحاليل، إسعاف." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});


function Home() {
  const { user, orders } = useStore();
  const active = orders.filter((o) => o.status !== "done" && o.status !== "cancelled").slice(0, 2);
  return (
    <Shell>
      <header className="flex items-center justify-between px-5 pt-5">
        <div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" />طرابلس، ليبيا</p>
          <h1 className="mt-1 text-xl font-extrabold">مرحباً، {user?.name ?? "ضيفنا"} 👋</h1>
          <p className="text-sm text-muted-foreground">كيف يمكننا مساعدتك اليوم؟</p>
        </div>
        <Logo size="sm" />
      </header>

      <div className="mx-5 mt-4 flex h-12 items-center gap-2 rounded-2xl bg-card px-4 shadow-card">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input placeholder="ابحث عن خدمة أو تخصص" className="flex-1 bg-transparent text-sm outline-none" />
      </div>

      <section className="mx-5 mt-5 overflow-hidden rounded-3xl bg-gradient-brand p-5 text-primary-foreground">
        <p className="text-sm opacity-90">رعاية صحية أسهل .. لحياة أفضل</p>
        <h2 className="mt-1 text-xl font-extrabold">طبيبك يصل إلى منزلك</h2>
        <Link to="/request/$service" params={{ service: "doctor" }} className="mt-3 inline-block rounded-xl bg-card px-4 py-2 text-sm font-bold text-primary">احجز الآن</Link>
      </section>

      <section className="mx-5 mt-5 border-y py-4">
        <Button asChild variant="ghost" className="h-auto w-full justify-between whitespace-normal px-0 py-2 text-right hover:bg-transparent">
          <Link to="/directory">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-primary"><Building2 className="h-6 w-6" /></span>
              <span className="min-w-0"><span className="block text-base font-bold text-brand-blue">دليل المصحات الطبية</span><span className="mt-1 block text-xs font-normal text-muted-foreground">مصحات وعيادات ومراكز طرابلس</span></span>
            </span>
            <ChevronLeft className="h-5 w-5 shrink-0 text-primary" />
          </Link>
        </Button>
      </section>

      <h2 className="mx-5 mt-6 text-lg font-bold">خدماتنا</h2>
      <div className="mx-5 mt-3 grid grid-cols-2 gap-3">
        {(Object.keys(SERVICES) as ServiceKey[]).map((k) => {
          const Icon = SERVICE_ICON[k];
          const emergency = k === "ambulance";
          return (
            <Link key={k} to="/request/$service" params={{ service: k }} className="rounded-2xl bg-card p-4 shadow-card">
              <div className={`grid h-12 w-12 place-items-center rounded-2xl ${emergency ? "bg-destructive/10 text-destructive" : "bg-brand-soft text-primary"}`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="mt-3 font-bold">{SERVICES[k].title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{SERVICES[k].subtitle}</p>
            </Link>
          );
        })}
      </div>

      {active.length > 0 && (
        <>
          <div className="mx-5 mt-6 flex items-center justify-between">
            <h2 className="text-lg font-bold">طلباتي الحالية</h2>
            <Link to="/orders" className="text-sm text-primary">عرض الكل</Link>
          </div>
          <div className="mx-5 mt-3 space-y-2">
            {active.map((o) => (
              <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
                <div><p className="font-bold">{SERVICES[o.service].title}</p><p className="text-xs text-muted-foreground">#{o.id} · {o.option}</p></div>
                <StatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
