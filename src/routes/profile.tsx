import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ClipboardList, MapPin, CreditCard, Bell, Headphones, LogOut, ChevronLeft } from "lucide-react";
import { Shell, TopBar } from "@/components/sehaty";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "حسابي - صحتي" },
      { name: "description", content: "إدارة ملفك الشخصي في صحتي." },
      { property: "og:title", content: "حسابي - صحتي" },
      { property: "og:description", content: "الملف الشخصي." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user } = useStore();
  const nav = useNavigate();
  const items = [
    { icon: ClipboardList, label: "طلباتي السابقة", to: "/orders" },
    { icon: MapPin, label: "العناوين", to: "/profile" },
    { icon: CreditCard, label: "وسائل الدفع", to: "/profile" },
    { icon: Bell, label: "الإشعارات", to: "/notifications" },
    { icon: Headphones, label: "مساعدة ودعم", to: "/profile" },
  ] as const;
  return (
    <Shell>
      <TopBar title="حسابي" />
      <div className="flex flex-col items-center py-4">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-brand text-3xl font-bold text-primary-foreground">{(user?.name ?? "ض")[0]}</div>
        <p className="mt-2 text-lg font-bold">{user?.name ?? "ضيف"}</p>
        <p dir="ltr" className="text-sm text-muted-foreground">{user ? `+218 ${user.phone.slice(1)}` : ""}</p>
        {!user && <Link to="/login" className="mt-2 text-sm font-bold text-primary">تسجيل الدخول</Link>}
      </div>
      <ul className="mx-4 divide-y rounded-3xl bg-card shadow-card">
        {items.map((i) => (
          <li key={i.label}>
            <Link to={i.to} className="flex items-center gap-3 p-4"><i.icon className="h-5 w-5 text-primary" /><span className="flex-1">{i.label}</span><ChevronLeft className="h-4 w-4 text-muted-foreground" /></Link>
          </li>
        ))}
        {user && (
          <li><button onClick={() => { actions.logout(); nav({ to: "/" }); }} className="flex w-full items-center gap-3 p-4 text-destructive"><LogOut className="h-5 w-5" />تسجيل الخروج</button></li>
        )}
      </ul>
    </Shell>
  );
}
