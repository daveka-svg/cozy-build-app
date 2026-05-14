import { create } from "zustand";
import { addDays, format } from "date-fns";

export type Role = "Vet" | "Nurse" | "Reception";
export type ShiftStatus = "Open" | "New applicants" | "Booked" | "Completed" | "Cancelled";
export type AppStatus = "Applied" | "Booked" | "Not selected" | "Withdrawn" | "Cancelled";

export interface Practice {
  id: string;
  tradingName: string;
  legalName: string;
  shareSlug: string;
  website: string;
  email: string;
  whatsapp: string;
  profileUrl?: string;
  locations: { id: string; name: string; address: string; postcode: string }[];
}

export interface Locum {
  id: string;
  displayName: string;
  legalName: string;
  role: Role;
  postcodeArea: string;
  rating: number;
  completedShifts: number;
  rcvs?: string;
  email: string;
  whatsapp: string;
  cvAttached: boolean;
  bio: string;
  experienceYears: number;
  hourlyRate: number;
  documents: { name: string; status: "supplied" | "missing" }[];
}

export interface Shift {
  id: string;
  practiceId: string;
  locationId: string;
  role: Role;
  date: string; // ISO date (yyyy-MM-dd)
  start: string; // HH:mm
  end: string;
  lunchMinutes: number;
  lunchPaid: boolean;
  hourlyRate: number;
  positionsNeeded: number;
  area: string;
  notes: string;
  status: ShiftStatus;
  createdAt: number;
}

export interface Application {
  id: string;
  shiftId: string;
  locumId: string;
  status: AppStatus;
  note?: string;
  createdAt: number;
}

export interface Timesheet {
  id: string;
  shiftId: string;
  locumId: string;
  actualStart: string;
  actualEnd: string;
  lunchMinutes: number;
  expense?: string;
  status: "Submitted" | "Approved" | "Queried";
}

export interface Invoice {
  id: string;
  number: string;
  shiftId: string;
  locumId: string;
  practiceId: string;
  hours: number;
  rate: number;
  total: number;
  status: "Draft" | "Issued" | "Paid outside platform";
}

export type ViewerRole = "practice" | "locum";

export interface PublicShiftRequest {
  shiftId: string;
  practiceSlug: string;
  displayName: string;
  email: string;
  whatsapp: string;
  role: Role;
  note?: string;
}

const today = new Date();
const iso = (d: Date) => format(d, "yyyy-MM-dd");

const seedPractices: Practice[] = [
  {
    id: "p1",
    tradingName: "Riverside Vets",
    legalName: "Riverside Veterinary Ltd",
    shareSlug: "riverside-vets",
    website: "https://riversidevets.example.com",
    email: "manager@riversidevets.example.com",
    whatsapp: "+447700900111",
    profileUrl: "https://riversidevets.example.com/about",
    locations: [
      { id: "l1", name: "Riverside Main", address: "12 Mill Lane", postcode: "BS1 4AB" },
      { id: "l2", name: "Riverside North", address: "44 Park Rd", postcode: "BS7 9PP" },
    ],
  },
  {
    id: "p2",
    tradingName: "Oakfield Animal Hospital",
    legalName: "Oakfield Vets Ltd",
    shareSlug: "oakfield-animal-hospital",
    website: "https://oakfield.example.com",
    email: "ops@oakfield.example.com",
    whatsapp: "+447700900222",
    locations: [{ id: "l3", name: "Oakfield HQ", address: "1 Oak St", postcode: "CB2 1JT" }],
  },
];

const seedLocums: Locum[] = [
  {
    id: "u1",
    displayName: "Dr. Aisha Khan",
    legalName: "Aisha Khan",
    role: "Vet",
    postcodeArea: "BS5",
    rating: 4.9,
    completedShifts: 32,
    rcvs: "1234567",
    email: "aisha@example.com",
    whatsapp: "+447700900321",
    cvAttached: true,
    bio: "Small animal vet with surgery experience. Calm under pressure.",
    experienceYears: 7,
    hourlyRate: 65,
    documents: [
      { name: "Professional cover", status: "supplied" },
      { name: "Insurance", status: "supplied" },
      { name: "Right to work", status: "supplied" },
    ],
  },
  {
    id: "u2",
    displayName: "Tom Reilly",
    legalName: "Thomas Reilly",
    role: "Nurse",
    postcodeArea: "BS3",
    rating: 4.7,
    completedShifts: 18,
    rcvs: "RVN-77821",
    email: "tom@example.com",
    whatsapp: "+447700900432",
    cvAttached: true,
    bio: "RVN, strong in nurse clinics and consults.",
    experienceYears: 4,
    hourlyRate: 28,
    documents: [
      { name: "Insurance", status: "supplied" },
      { name: "Reference", status: "supplied" },
    ],
  },
  {
    id: "u3",
    displayName: "Maya Patel",
    legalName: "Maya Patel",
    role: "Reception",
    postcodeArea: "BS1",
    rating: 4.8,
    completedShifts: 41,
    email: "maya@example.com",
    whatsapp: "+447700900543",
    cvAttached: true,
    bio: "Friendly front desk. Phones, payments, busy waiting rooms.",
    experienceYears: 6,
    hourlyRate: 16,
    documents: [{ name: "Right to work", status: "supplied" }],
  },
];

const seedShifts: Shift[] = [
  {
    id: "s1",
    practiceId: "p1",
    locationId: "l1",
    role: "Vet",
    date: iso(addDays(today, 2)),
    start: "09:00",
    end: "18:00",
    lunchMinutes: 30,
    lunchPaid: false,
    hourlyRate: 65,
    positionsNeeded: 1,
    area: "Small animals",
    notes: "Consults only. No sole charge.",
    status: "New applicants",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "s2",
    practiceId: "p1",
    locationId: "l1",
    role: "Nurse",
    date: iso(addDays(today, 4)),
    start: "08:30",
    end: "17:00",
    lunchMinutes: 30,
    lunchPaid: false,
    hourlyRate: 28,
    positionsNeeded: 2,
    area: "Nurse clinics",
    notes: "Two nurses needed.",
    status: "Open",
    createdAt: Date.now() - 43200000,
  },
  {
    id: "s3",
    practiceId: "p2",
    locationId: "l3",
    role: "Reception",
    date: iso(addDays(today, 1)),
    start: "09:00",
    end: "17:30",
    lunchMinutes: 30,
    lunchPaid: true,
    hourlyRate: 16,
    positionsNeeded: 1,
    area: "Front desk",
    notes: "Busy reception. Phones and payments.",
    status: "New applicants",
    createdAt: Date.now() - 7200000,
  },
  {
    id: "s4",
    practiceId: "p1",
    locationId: "l2",
    role: "Vet",
    date: iso(addDays(today, 7)),
    start: "10:00",
    end: "19:00",
    lunchMinutes: 60,
    lunchPaid: false,
    hourlyRate: 70,
    positionsNeeded: 1,
    area: "Surgery",
    notes: "One dental in the morning.",
    status: "Open",
    createdAt: Date.now() - 3600000,
  },
  {
    id: "s5",
    practiceId: "p2",
    locationId: "l3",
    role: "Nurse",
    date: iso(addDays(today, -3)),
    start: "09:00",
    end: "17:00",
    lunchMinutes: 30,
    lunchPaid: false,
    hourlyRate: 26,
    positionsNeeded: 1,
    area: "Nurse clinics",
    notes: "",
    status: "Booked",
    createdAt: Date.now() - 7 * 86400000,
  },
  {
    id: "s6",
    practiceId: "p1",
    locationId: "l1",
    role: "Reception",
    date: iso(addDays(today, -7)),
    start: "09:00",
    end: "17:00",
    lunchMinutes: 30,
    lunchPaid: false,
    hourlyRate: 16,
    positionsNeeded: 1,
    area: "Front desk",
    notes: "",
    status: "Completed",
    createdAt: Date.now() - 14 * 86400000,
  },
];

const seedApplications: Application[] = [
  {
    id: "a1",
    shiftId: "s1",
    locumId: "u1",
    status: "Applied",
    note: "Available, can do consults.",
    createdAt: Date.now() - 3600000,
  },
  { id: "a2", shiftId: "s3", locumId: "u3", status: "Applied", createdAt: Date.now() - 1800000 },
  {
    id: "a3",
    shiftId: "s5",
    locumId: "u2",
    status: "Booked",
    createdAt: Date.now() - 6 * 86400000,
  },
  {
    id: "a4",
    shiftId: "s6",
    locumId: "u3",
    status: "Booked",
    createdAt: Date.now() - 13 * 86400000,
  },
];

interface State {
  viewerRole: ViewerRole;
  currentPracticeId: string;
  currentLocumId: string;
  practices: Practice[];
  locums: Locum[];
  shifts: Shift[];
  applications: Application[];
  timesheets: Timesheet[];
  invoices: Invoice[];
  setViewerRole: (r: ViewerRole) => void;
  addShift: (s: Omit<Shift, "id" | "createdAt" | "status">) => Shift;
  cancelShift: (id: string) => void;
  apply: (shiftId: string, locumId: string, note?: string) => void;
  requestPublicShift: (request: PublicShiftRequest) => { ok: boolean; message: string };
  withdraw: (appId: string) => void;
  confirmBooking: (appId: string) => void;
  notSelected: (appId: string) => void;
  submitTimesheet: (t: Omit<Timesheet, "id" | "status">) => void;
  approveTimesheet: (id: string) => void;
  createInvoiceDraft: (timesheetId: string) => void;
  markCompleted: (shiftId: string) => void;
}

export const useStore = create<State>((set, get) => ({
  viewerRole: "practice",
  currentPracticeId: "p1",
  currentLocumId: "u1",
  practices: seedPractices,
  locums: seedLocums,
  shifts: seedShifts,
  applications: seedApplications,
  timesheets: [],
  invoices: [],
  setViewerRole: (r) => set({ viewerRole: r }),
  addShift: (s) => {
    const shift: Shift = { ...s, id: `s${Date.now()}`, createdAt: Date.now(), status: "Open" };
    set({ shifts: [shift, ...get().shifts] });
    return shift;
  },
  cancelShift: (id) =>
    set({
      shifts: get().shifts.map((s) => (s.id === id ? { ...s, status: "Cancelled" } : s)),
      applications: get().applications.map((a) =>
        a.shiftId === id && (a.status === "Applied" || a.status === "Booked")
          ? { ...a, status: "Cancelled" }
          : a,
      ),
    }),
  apply: (shiftId, locumId, note) => {
    const existing = get().applications.some(
      (a) =>
        a.shiftId === shiftId &&
        a.locumId === locumId &&
        (a.status === "Applied" || a.status === "Booked"),
    );
    if (existing) return;
    const a: Application = {
      id: `a${Date.now()}`,
      shiftId,
      locumId,
      status: "Applied",
      note,
      createdAt: Date.now(),
    };
    const shifts = get().shifts.map(
      (s): Shift =>
        s.id === shiftId && s.status === "Open"
          ? { ...s, status: "New applicants" as ShiftStatus }
          : s,
    );
    set({ applications: [...get().applications, a], shifts });
  },
  requestPublicShift: (request) => {
    const state = get();
    const displayName = request.displayName.trim();
    const normalizedEmail = request.email.trim().toLowerCase();
    const whatsapp = request.whatsapp.trim();
    const note = request.note?.trim();
    const practice = state.practices.find((p) => p.shareSlug === request.practiceSlug);
    const shift = state.shifts.find(
      (s) => s.id === request.shiftId && s.practiceId === practice?.id,
    );
    const todayIso = new Date().toISOString().slice(0, 10);

    if (!displayName || !normalizedEmail || !whatsapp) {
      return { ok: false, message: "Add your name, email, and WhatsApp or phone number." };
    }
    if (!practice || !shift) {
      return { ok: false, message: "This booking link is no longer available." };
    }
    if (shift.date < todayIso || (shift.status !== "Open" && shift.status !== "New applicants")) {
      return { ok: false, message: "That shift is not open for requests anymore." };
    }
    if (shift.role !== request.role) {
      return { ok: false, message: `This shift needs a ${shift.role}.` };
    }

    const existingLocum = state.locums.find((l) => l.email.toLowerCase() === normalizedEmail);
    const locum: Locum = existingLocum ?? {
      id: `u${Date.now()}`,
      displayName,
      legalName: displayName,
      role: request.role,
      postcodeArea: "",
      rating: 0,
      completedShifts: 0,
      rcvs: request.role === "Reception" ? undefined : "",
      email: normalizedEmail,
      whatsapp,
      cvAttached: false,
      bio: "Public calendar request. CV and references to be checked by the practice.",
      experienceYears: 0,
      hourlyRate: shift.hourlyRate,
      documents: [{ name: "CV requested", status: "missing" }],
    };

    const alreadyRequested = state.applications.some(
      (a) =>
        a.shiftId === shift.id &&
        a.locumId === locum.id &&
        (a.status === "Applied" || a.status === "Booked"),
    );
    if (alreadyRequested) {
      return { ok: false, message: "You already requested this shift." };
    }

    const application: Application = {
      id: `a${Date.now()}`,
      shiftId: shift.id,
      locumId: locum.id,
      status: "Applied",
      note,
      createdAt: Date.now(),
    };

    set({
      locums: existingLocum ? state.locums : [...state.locums, locum],
      applications: [...state.applications, application],
      shifts: state.shifts.map((s) =>
        s.id === shift.id && s.status === "Open" ? { ...s, status: "New applicants" } : s,
      ),
    });

    return { ok: true, message: "Request sent. The practice can review and confirm it." };
  },
  withdraw: (appId) =>
    set({
      applications: get().applications.map((a) =>
        a.id === appId ? { ...a, status: "Withdrawn" } : a,
      ),
    }),
  confirmBooking: (appId) => {
    const apps = get().applications;
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    const shift = get().shifts.find((s) => s.id === app.shiftId);
    if (!shift) return;
    const confirmedCount =
      apps.filter((a) => a.shiftId === shift.id && a.status === "Booked").length + 1;
    const newApps = apps.map((a) => {
      if (a.id === appId) return { ...a, status: "Booked" as AppStatus };
      if (
        a.shiftId === shift.id &&
        a.status === "Applied" &&
        confirmedCount >= shift.positionsNeeded
      ) {
        return { ...a, status: "Not selected" as AppStatus };
      }
      return a;
    });
    const newShifts = get().shifts.map((s) =>
      s.id === shift.id && confirmedCount >= shift.positionsNeeded
        ? { ...s, status: "Booked" as ShiftStatus }
        : s,
    );
    set({ applications: newApps, shifts: newShifts });
  },
  notSelected: (appId) =>
    set({
      applications: get().applications.map((a) =>
        a.id === appId ? { ...a, status: "Not selected" } : a,
      ),
    }),
  submitTimesheet: (t) => {
    const ts: Timesheet = { ...t, id: `t${Date.now()}`, status: "Submitted" };
    set({ timesheets: [...get().timesheets, ts] });
  },
  approveTimesheet: (id) =>
    set({
      timesheets: get().timesheets.map((t) => (t.id === id ? { ...t, status: "Approved" } : t)),
    }),
  createInvoiceDraft: (timesheetId) => {
    const t = get().timesheets.find((x) => x.id === timesheetId);
    if (!t) return;
    const shift = get().shifts.find((s) => s.id === t.shiftId);
    if (!shift) return;
    const [sh, sm] = t.actualStart.split(":").map(Number);
    const [eh, em] = t.actualEnd.split(":").map(Number);
    let mins = eh * 60 + em - (sh * 60 + sm);
    if (!shift.lunchPaid) mins -= t.lunchMinutes;
    const hours = Math.max(0, mins / 60);
    const total = hours * shift.hourlyRate;
    const inv: Invoice = {
      id: `i${Date.now()}`,
      number: `INV-${1000 + get().invoices.length + 1}`,
      shiftId: shift.id,
      locumId: t.locumId,
      practiceId: shift.practiceId,
      hours,
      rate: shift.hourlyRate,
      total,
      status: "Draft",
    };
    set({ invoices: [...get().invoices, inv] });
  },
  markCompleted: (shiftId) =>
    set({
      shifts: get().shifts.map((s) => (s.id === shiftId ? { ...s, status: "Completed" } : s)),
    }),
}));

// helpers
export const calcShiftValue = (
  s: Pick<Shift, "start" | "end" | "lunchMinutes" | "lunchPaid" | "hourlyRate" | "positionsNeeded">,
) => {
  const [sh, sm] = s.start.split(":").map(Number);
  const [eh, em] = s.end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (!s.lunchPaid) mins -= s.lunchMinutes;
  const hours = Math.max(0, mins / 60);
  return hours * s.hourlyRate * s.positionsNeeded;
};
