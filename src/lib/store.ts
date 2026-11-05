import { useSyncExternalStore } from "react";
import { splitCommission } from "./commission";

export type ServiceKey = "doctor" | "nurse" | "lab" | "ambulance";
export type OrderStatus = "pending" | "accepted" | "onway" | "done" | "cancelled";

export const SERVICES: Record<
  ServiceKey,
  { title: string; subtitle: string; price: number; options: string[]; provider: string }
> = {
  doctor: {
    title: "طبيب للمنزل",
    subtitle: "استشارة وفحص في منزلك",
    price: 100,
    options: ["طب عام", "باطنة", "أطفال", "نساء وولادة", "قلب", "كبار السن"],
    provider: "د. أحمد محمد",
  },
  nurse: {
    title: "تمريض منزلي",
    subtitle: "رعاية تمريضية في منزلك",
    price: 60,
    options: ["حقن وإبر", "تغيير ضماد", "تركيب محلول", "رعاية مسنين", "قياس ضغط وسكر"],
    provider: "م. سارة علي",
  },
  lab: {
    title: "تحاليل وسحب عينات",
    subtitle: "سحب العينة في منزلك ونتائج سريعة",
    price: 50,
    options: ["تحليل دم شامل", "سكر تراكمي", "وظائف كبد", "وظائف كلى", "فيتامين د", "غدة درقية"],
    provider: "مختبر الشفاء",
  },
  ambulance: {
    title: "إسعاف ونقل طبي",
    subtitle: "استجابة سريعة على مدار الساعة",
    price: 150,
    options: ["حالة طارئة", "نقل إلى مستشفى", "نقل بين المستشفيات", "نقل مريض مُقعد"],
    provider: "إسعاف طرابلس",
  },
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "بانتظار القبول",
  accepted: "تم القبول",
  onway: "في الطريق",
  done: "مكتمل",
  cancelled: "ملغي",
};

export type Order = {
  id: string;
  service: ServiceKey;
  option: string;
  patient: string;
  phone: string;
  address: string;
  coords?: { lat: number; lng: number };
  date: string;
  time: string;
  notes: string;
  payment: "cash" | "online";
  price: number;
  status: OrderStatus;
  createdAt: number;
};

export type User = { name: string; phone: string; role: "patient" | "provider"; specialty?: string };

type State = { user: User | null; orders: Order[]; commissionRate: number };

const seed: Order[] = [
  { id: "1254", service: "doctor", option: "طب عام", patient: "أحمد علي", phone: "0912345678", address: "طرابلس - حي الأندلس", date: "اليوم", time: "10:00", notes: "", payment: "cash", price: 100, status: "onway", createdAt: Date.now() - 3600e3 },
  { id: "1253", service: "lab", option: "تحليل دم شامل", patient: "مريم سالم", phone: "0923456789", address: "بنغازي - الكيش", date: "اليوم", time: "12:30", notes: "", payment: "cash", price: 50, status: "pending", createdAt: Date.now() - 7200e3 },
  { id: "1252", service: "nurse", option: "تركيب محلول", patient: "علي حسن", phone: "0918887766", address: "مصراتة - وسط المدينة", date: "أمس", time: "18:00", notes: "", payment: "cash", price: 60, status: "done", createdAt: Date.now() - 86400e3 },
  { id: "1251", service: "ambulance", option: "نقل إلى مستشفى", patient: "خالد منصور", phone: "0945556677", address: "طرابلس - سوق الجمعة", date: "أمس", time: "21:15", notes: "", payment: "cash", price: 150, status: "done", createdAt: Date.now() - 90000e3 },
];

const KEY = "sehaty-state-v1";
let state: State = { user: null, orders: seed, commissionRate: 15 };
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch {}
}
function set(p: Partial<State>) {
  state = { ...state, ...p };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((l) => l());
}

const serverState = state;
export function useStore() {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); l(); return () => listeners.delete(l); },
    () => { load(); return state; },
    () => serverState,
  );
}

export const actions = {
  login: (user: User) => set({ user }),
  logout: () => set({ user: null }),
  createOrder: (o: Omit<Order, "id" | "status" | "createdAt">) => {
    const id = String(1255 + state.orders.length);
    set({ orders: [{ ...o, id, status: "pending", createdAt: Date.now() }, ...state.orders] });
    return id;
  },
  setStatus: (id: string, status: OrderStatus) =>
    set({ orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)) }),
  setCommission: (commissionRate: number) => set({ commissionRate }),
};

export function totals(orders: Order[], rate: number) {
  const done = orders.filter((o) => o.status === "done");
  const revenue = done.reduce((s, o) => s + o.price, 0);
  const commission = done.reduce((s, o) => s + splitCommission(o.price, rate).commission, 0);
  return { revenue, commission, net: revenue - commission, doneCount: done.length };
}
