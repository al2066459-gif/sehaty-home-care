import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home, ClipboardList, User, Bell, Stethoscope, Syringe, FlaskConical, Ambulance } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { STATUS_LABEL, type OrderStatus, type ServiceKey } from "@/lib/store";

export function Logo({ size = "md", tagline }: { size?: "sm" | "md" | "lg"; tagline?: string }) {
  const s = { sm: "h-8 w-8", md: "h-12 w-12", lg: "h-20 w-20" }[size];
  const t = { sm: "text-xl", md: "text-3xl", lg: "text-5xl" }[size];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <img src={logo} alt="شعار صحتي" className={s} width={80} height={80} />
        <span className={`${t} font-display font-extrabold text-brand-blue`}>صحتي</span>
      </div>
      {tagline && <p className="text-xs text-muted-foreground">{tagline}</p>}
    </div>
  );
}

export function Shell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <div className={nav ? "pb-24" : ""}>{children}</div>
      {nav && <BottomNav />}
    </div>
  );
}

export function TopBar({ title, back = "/home", action }: { title: string; back?: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-background/90 px-4 py-3 backdrop-blur">
      <Link to={back} className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-card" aria-label="رجوع">
        <ChevronRight className="h-5 w-5" />
      </Link>
      <h1 className="text-lg font-bold">{title}</h1>
      <div className="h-9 w-9">{action}</div>
    </header>
  );
}

function BottomNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const items = [
    { to: "/home", label: "الرئيسية", icon: Home },
    { to: "/orders", label: "طلباتي", icon: ClipboardList },
    { to: "/notifications", label: "الإشعارات", icon: Bell },
    { to: "/profile", label: "حسابي", icon: User },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t bg-card px-2 pb-2 pt-2">
      <ul className="grid grid-cols-4">
        {items.map((i) => {
          const active = path.startsWith(i.to);
          return (
            <li key={i.to}>
              <Link to={i.to} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-xs ${active ? "text-primary font-bold" : "text-muted-foreground"}`}>
                <i.icon className="h-5 w-5" />
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cls: Record<OrderStatus, string> = {
    pending: "bg-warning/15 text-warning",
    accepted: "bg-accent/15 text-accent",
    onway: "bg-brand-blue/10 text-brand-blue",
    done: "bg-primary/15 text-primary",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls[status]}`}>{STATUS_LABEL[status]}</span>;
}

export const LYD = (n: number) => `${n.toLocaleString("ar-LY")} د.ل`;

export const SERVICE_ICON: Record<ServiceKey, typeof Stethoscope> = {
  doctor: Stethoscope, nurse: Syringe, lab: FlaskConical, ambulance: Ambulance,
};
