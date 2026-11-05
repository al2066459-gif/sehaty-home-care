import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, LocateFixed, Banknote, CreditCard, Phone } from "lucide-react";
import { Shell, TopBar, LYD } from "@/components/sehaty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SERVICES, actions, useStore, type ServiceKey } from "@/lib/store";
import doctor from "@/assets/doctor.jpg";
import nurse from "@/assets/nurse.jpg";
import splash from "@/assets/splash.jpg";

const IMG: Record<ServiceKey, string> = { doctor, nurse, lab: splash, ambulance: splash };

export const Route = createFileRoute("/request/$service")({
  loader: ({ params }) => {
    if (!(params.service in SERVICES)) throw notFound();
    return { service: params.service as ServiceKey };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? SERVICES[loaderData.service].title : "طلب خدمة";
    return {
      meta: [
        { title: `${t} - صحتي` },
        { name: "description", content: `اطلب ${t} إلى منزلك عبر صحتي.` },
        { property: "og:title", content: `${t} - صحتي` },
        { property: "og:description", content: `اطلب ${t} إلى منزلك.` },
      ],
    };
  },
  component: RequestPage,
});

function RequestPage() {
  const { service } = Route.useLoaderData();
  const s = SERVICES[service];
  const { user } = useStore();
  const nav = useNavigate();
  const [option, setOption] = useState(s.options[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>();
  const [locating, setLocating] = useState(false);
  const [notes, setNotes] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [err, setErr] = useState("");
  const emergency = service === "ambulance";

  const locate = () => {
    if (!navigator.geolocation) return setErr("المتصفح لا يدعم تحديد الموقع");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        if (!address) setAddress(`الموقع الحالي (${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)})`);
        setLocating(false);
      },
      () => { setErr("تعذّر تحديد الموقع، اكتب العنوان يدوياً"); setLocating(false); },
    );
  };

  const submit = () => {
    if (name.trim().length < 3) return setErr("أدخل اسم المريض");
    if (!/^09\d{8}$/.test(phone)) return setErr("أدخل رقم هاتف صحيح يبدأ بـ 09");
    if (address.trim().length < 4) return setErr("حدّد الموقع أو اكتب العنوان");
    const id = actions.createOrder({ service, option, patient: name.trim(), phone, address: address.trim(), coords, date: emergency ? "الآن" : date, time: emergency ? "فوري" : time, notes, payment: "cash", price: s.price });
    nav({ to: "/orders/$id", params: { id } });
  };

  return (
    <Shell nav={false}>
      <TopBar title={s.title} />
      <div className="mx-4 overflow-hidden rounded-3xl bg-card shadow-card">
        <img src={IMG[service]} alt={s.title} className="h-44 w-full object-cover object-top" width={768} height={768} />
        <div className="p-4 text-center">
          <h2 className="text-xl font-extrabold">{s.title}</h2>
          <p className="text-sm text-primary">{s.subtitle}</p>
        </div>
      </div>

      {emergency && (
        <a href="tel:1415" className="mx-4 mt-4 flex items-center justify-center gap-2 rounded-2xl bg-destructive p-3 font-bold text-destructive-foreground">
          <Phone className="h-5 w-5" /> حالة حرجة؟ اتصل بالإسعاف مباشرة
        </a>
      )}

      <div className="space-y-5 p-4">
        <Field label={service === "doctor" ? "اختر التخصص" : service === "lab" ? "اختر التحليل" : "نوع الخدمة"}>
          <div className="flex flex-wrap gap-2">
            {s.options.map((o) => (
              <button key={o} onClick={() => setOption(o)} className={`rounded-full border px-3.5 py-2 text-sm ${option === o ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{o}</button>
            ))}
          </div>
        </Field>

        {!emergency && (
          <Field label="اختر الموعد المناسب">
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 bg-card" />
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-12 bg-card" />
            </div>
          </Field>
        )}

        <Field label="الموقع والعنوان">
          <button onClick={locate} className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary bg-brand-soft p-3 text-sm font-bold text-primary">
            <LocateFixed className="h-4 w-4" /> {locating ? "جارٍ التحديد..." : coords ? "تم تحديد موقعك ✓" : "استخدم موقعي الحالي"}
          </button>
          <div className="flex items-center gap-2 rounded-md border bg-card px-3">
            <MapPin className="h-4 w-4 text-primary" />
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="المدينة - الحي - أقرب معلم" className="h-12 flex-1 bg-transparent text-sm outline-none" />
          </div>
        </Field>

        <Field label="بيانات المريض">
          <div className="space-y-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المريض" className="h-12 bg-card" />
            <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="09XXXXXXXX" className="h-12 bg-card text-right" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات أو أعراض (اختياري)" className="min-h-20 w-full rounded-md border bg-card p-3 text-sm outline-none" />
          </div>
        </Field>

        <Field label="طريقة الدفع">
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-card p-3">
              <Banknote className="h-5 w-5 text-primary" /><span className="flex-1 font-bold">الدفع نقداً عند الخدمة</span><span className="h-4 w-4 rounded-full border-4 border-primary" />
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-muted p-3 opacity-60">
              <CreditCard className="h-5 w-5" /><span className="flex-1">الدفع الإلكتروني</span><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">قريباً</span>
            </div>
          </div>
        </Field>

        <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
          <span className="text-muted-foreground">التكلفة التقديرية</span>
          <span className="text-lg font-extrabold text-primary">{LYD(s.price)}</span>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button size="lg" variant={emergency ? "destructive" : "default"} className="w-full text-base" onClick={submit}>
          {emergency ? "اطلب الإسعاف الآن" : "تأكيد الطلب"}
        </Button>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-2 font-bold">{label}</p>{children}</div>;
}
