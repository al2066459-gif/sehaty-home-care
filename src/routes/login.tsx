import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo, Shell } from "@/components/sehaty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: s["mode"] === "register" ? "register" : "login" }) as { mode?: "login" | "register" },
  head: () => ({
    meta: [
      { title: "تسجيل الدخول - صحتي" },
      { name: "description", content: "سجّل دخولك أو أنشئ حساب مريض أو مقدم خدمة في صحتي." },
      { property: "og:title", content: "تسجيل الدخول - صحتي" },
      { property: "og:description", content: "حساب مريض أو مقدم خدمة طبية." },
    ],
  }),
  component: Login,
});

function Login() {
  const { mode } = Route.useSearch();
  const nav = useNavigate();
  const [role, setRole] = useState<"patient" | "provider">("patient");
  const [reg, setReg] = useState(mode === "register");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^09\d{8}$/.test(phone)) return setErr("أدخل رقم هاتف ليبي صحيح يبدأ بـ 09");
    if (reg && name.trim().length < 3) return setErr("أدخل الاسم الكامل");
    actions.login({ name: name.trim() || "أحمد علي", phone, role, specialty: specialty || undefined });
    nav({ to: role === "provider" ? "/provider" : "/home" });
  };

  return (
    <Shell nav={false}>
      <div className="px-6 pt-12">
        <Logo size="md" />
        <h1 className="mt-8 text-2xl font-extrabold">{reg ? "إنشاء حساب جديد" : "مرحباً بك في صحتي"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{reg ? "اختر نوع الحساب وأكمل بياناتك" : "سجّل دخولك للمتابعة"}</p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
          {(["patient", "provider"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`rounded-xl py-2.5 text-sm font-bold ${role === r ? "bg-card text-primary shadow-card" : "text-muted-foreground"}`}>
              {r === "patient" ? "مريض" : "مقدم خدمة"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {reg && <Input placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />}
          <div className="flex h-12 items-center gap-2 rounded-md border bg-card px-3">
            <span dir="ltr" className="text-sm font-bold text-muted-foreground">🇱🇾 +218</span>
            <input dir="ltr" inputMode="numeric" placeholder="09XXXXXXXX" value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="flex-1 bg-transparent text-right outline-none" aria-label="رقم الهاتف" />
          </div>
          {reg && role === "provider" && (
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="h-12 w-full rounded-md border bg-card px-3">
              <option value="">اختر نوع الخدمة / التخصص</option>
              <option>طبيب</option><option>ممرض / ممرضة</option><option>مختبر تحاليل</option><option>إسعاف ونقل طبي</option>
            </select>
          )}
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" size="lg" className="w-full text-base">{reg ? "تسجيل" : "إرسال الرمز"}</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {reg ? "لديك حساب؟ " : "ليس لديك حساب؟ "}
          <button className="font-bold text-primary" onClick={() => setReg(!reg)}>{reg ? "تسجيل الدخول" : "سجّل الآن"}</button>
        </p>
      </div>
    </Shell>
  );
}
