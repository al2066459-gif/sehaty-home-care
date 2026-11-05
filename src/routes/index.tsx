import { createFileRoute, Link } from "@tanstack/react-router";
import splash from "@/assets/splash.jpg";
import { Logo } from "@/components/sehaty";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "صحتي - خدمات طبية منزلية في ليبيا" },
      { name: "description", content: "احجز طبيباً أو ممرضاً أو تحاليل أو إسعافاً إلى منزلك في ليبيا." },
      { property: "og:title", content: "صحتي - خدمات طبية منزلية" },
      { property: "og:description", content: "خدماتك الطبية في مكان واحد، حتى باب منزلك." },
    ],
  }),
  component: Splash,
});

function Splash() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-card">
      <div className="pt-14 pb-6">
        <Logo size="lg" tagline="خدماتك الطبية في مكان واحد" />
      </div>
      <div className="relative flex-1 overflow-hidden">
        <img src={splash} alt="رعاية طبية" className="h-full w-full object-cover" width={768} height={1024} />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
      </div>
      <div className="space-y-3 p-6">
        <Button asChild size="lg" className="w-full text-base">
          <Link to="/login">ابدأ الآن</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full text-base text-primary">
          <Link to="/login" search={{ mode: "register" }}>إنشاء حساب جديد</Link>
        </Button>
        <div className="flex justify-center gap-4 pt-2 text-xs text-muted-foreground">
          <Link to="/provider" className="underline">دخول مقدمي الخدمة</Link>
          <Link to="/admin" className="underline">لوحة الإدارة</Link>
        </div>
      </div>
    </div>
  );
}
