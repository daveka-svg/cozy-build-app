import { create } from "zustand";
import { addDays, format } from "date-fns";

export type Role = "Vet" | "Nurse" | "Reception";
export type ShiftStatus = "Open" | "New applicants" | "Booked" | "Completed" | "Cancelled";
export type AppStatus =
  | "Applied"
  | "Requested"
  | "Booked"
  | "Not selected"
  | "Withdrawn"
  | "Cancelled";

export interface Practice {
  id: string;
  tradingName: string;
  legalName: string;
  shareSlug: string;
  publicLink?: PublicLinkSettings;
  website: string;
  email: string;
  whatsapp: string;
  profileUrl?: string;
  locations: {
    id: string;
    name: string;
    address: string;
    postcode: string;
    lat?: number;
    lng?: number;
    mapUrl?: string;
  }[];
}

export interface Locum {
  id: string;
  displayName: string;
  legalName: string;
  photoUrl?: string;
  publicHeadline?: string;
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
  specialisms?: string[];
  preferredLocations?: string[];
  availabilityNote?: string;
  internalNote?: string;
  profilePhotos?: { url: string; caption: string }[];
  publicProfile?: LocumPublicProfileSettings;
  documents: {
    name: string;
    status: "supplied" | "missing" | "expiring" | "verified";
    kind?: AttachmentKind;
    required?: boolean;
    expiry?: string;
    fileName?: string;
    visibility?: "private" | "practice" | "public";
  }[];
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
  applicantKind?: ApplicantKind;
  guestApplicantId?: string;
  note?: string;
  internalNote?: string;
  customAnswers?: Record<string, string>;
  attachmentIds?: string[];
  createdAt: number;
  updatedAt?: number;
}

export interface Timesheet {
  id: string;
  shiftId: string;
  locumId: string;
  actualStart: string;
  actualEnd: string;
  lunchMinutes: number;
  expense?: string;
  notes?: string;
  attachmentIds?: string[];
  submittedAt?: number;
  approvedAt?: number;
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
  timesheetId?: string;
  issuedAt?: number;
  pdfAttachmentId?: string;
}

export type BookingStatus = "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  shiftId: string;
  practiceId: string;
  locumId: string;
  locationId: string;
  applicationId?: string;
  bookingRequestId?: string;
  status: BookingStatus;
  date: string;
  start: string;
  end: string;
  lunchMinutes: number;
  lunchPaid: boolean;
  hourlyRate: number;
  confirmedAt: number;
  completedAt?: number;
  cancelledAt?: number;
  cancelReason?: string;
}

const ACTIVE_APPLICATION_STATUSES: AppStatus[] = ["Applied", "Requested"];

function canRequestShift(status: ShiftStatus) {
  return status === "Open" || status === "New applicants";
}

function recalculateShiftStatus(shift: Shift, applications: Application[]): ShiftStatus {
  if (shift.status === "Cancelled" || shift.status === "Completed") return shift.status;
  const bookedCount = applications.filter(
    (application) => application.shiftId === shift.id && application.status === "Booked",
  ).length;
  if (bookedCount >= shift.positionsNeeded) return "Booked";
  const hasRequests = applications.some(
    (application) =>
      application.shiftId === shift.id && ACTIVE_APPLICATION_STATUSES.includes(application.status),
  );
  return hasRequests ? "New applicants" : "Open";
}

export type ViewerRole = "practice" | "locum";
export type AttachmentOwnerType =
  | "practice"
  | "locum"
  | "shift"
  | "application"
  | "booking"
  | "timesheet"
  | "invoice";
export type AttachmentKind =
  | "CV"
  | "Insurance"
  | "Right to work"
  | "RCVS"
  | "Photo"
  | "Shift brief"
  | "Timesheet evidence"
  | "Invoice PDF"
  | "Other";
export type ApplicantKind = "registered" | "guest";

export interface Attachment {
  id: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  name: string;
  kind: AttachmentKind;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedByRole: ViewerRole | "guest";
  uploadedById?: string;
  createdAt: number;
}

export interface PublicApplicationField {
  id: string;
  label: string;
  required: boolean;
  type: "text" | "textarea" | "url";
}

export interface PublicLinkSettings {
  enabled: boolean;
  slug: string;
  title?: string;
  intro?: string;
  visibleRoles: Role[];
  showRates: boolean;
  showPracticeWebsite: boolean;
  requirePhone: boolean;
  requireCvLink: boolean;
  customFields: PublicApplicationField[];
}

export interface LocumPublicProfileSettings {
  enabled: boolean;
  slug: string;
  headline?: string;
  showRate: boolean;
  showDocuments: boolean;
  showAvailability: boolean;
}

export interface LocumAvailabilityWindow {
  id: string;
  locumId: string;
  date: string;
  start: string;
  end: string;
  note?: string;
  status?: "Available" | "Unavailable" | "Tentative";
  publicVisible: boolean;
}

export interface GuestApplicant {
  id: string;
  displayName: string;
  email: string;
  whatsapp: string;
  role: Role;
  cvUrl?: string;
  createdAt: number;
}

export interface BookingRequest {
  id: string;
  practiceId: string;
  locumId: string;
  shiftId?: string;
  role: Role;
  date: string;
  start: string;
  end: string;
  hourlyRate: number;
  locationId: string;
  message?: string;
  status: "Sent" | "Accepted" | "Declined" | "Expired" | "Cancelled";
  createdAt: number;
  respondedAt?: number;
  declineReason?: string;
  cancelReason?: string;
}

export interface Cancellation {
  id: string;
  ownerType: "shift" | "application" | "bookingRequest";
  ownerId: string;
  reason: string;
  note?: string;
  cancelledByRole: ViewerRole;
  cancelledById: string;
  createdAt: number;
}

export interface CalendarSyncSettings {
  id: string;
  ownerType: "practice" | "locum";
  ownerId: string;
  provider: "google";
  status: "Not connected" | "Connected" | "Error";
  calendarName?: string;
  lastSyncedAt?: number;
  placeholderOnly: boolean;
}

export interface PublicShiftRequest {
  shiftId: string;
  practiceSlug: string;
  displayName: string;
  email: string;
  whatsapp: string;
  role: Role;
  note?: string;
  cvUrl?: string;
  customAnswers?: Record<string, string>;
}

const today = new Date();
const iso = (d: Date) => format(d, "yyyy-MM-dd");
const publicPracticeLink = (slug: string, title: string, intro: string): PublicLinkSettings => ({
  enabled: true,
  slug,
  title,
  intro,
  visibleRoles: ["Vet", "Nurse", "Reception"],
  showRates: true,
  showPracticeWebsite: true,
  requirePhone: true,
  requireCvLink: false,
  customFields: [
    { id: "experience", label: "Relevant experience", required: false, type: "textarea" },
    { id: "cv", label: "CV or profile link", required: false, type: "url" },
  ],
});

const seedPractices: Practice[] = [
  {
    id: "p1",
    tradingName: "Riverside Vets",
    legalName: "Riverside Veterinary Ltd",
    shareSlug: "riverside-vets",
    publicLink: publicPracticeLink(
      "riverside-vets",
      "Riverside Vets locum shifts",
      "See open cover dates for our Bristol clinics and request a shift for practice review.",
    ),
    website: "https://riversidevets.example.com",
    email: "manager@riversidevets.example.com",
    whatsapp: "+447700900111",
    profileUrl: "https://riversidevets.example.com/about",
    locations: [
      {
        id: "l1",
        name: "Riverside Main",
        address: "12 Mill Lane",
        postcode: "BS1 4AB",
        lat: 51.4545,
        lng: -2.5879,
        mapUrl: "https://maps.google.com/?q=12%20Mill%20Lane%20BS1%204AB",
      },
      {
        id: "l2",
        name: "Riverside North",
        address: "44 Park Rd",
        postcode: "BS7 9PP",
        lat: 51.4781,
        lng: -2.5924,
      },
    ],
  },
  {
    id: "p2",
    tradingName: "Oakfield Animal Hospital",
    legalName: "Oakfield Vets Ltd",
    shareSlug: "oakfield-animal-hospital",
    publicLink: publicPracticeLink(
      "oakfield-animal-hospital",
      "Oakfield Animal Hospital cover calendar",
      "Browse VCA, nurse, and vet shifts.",
    ),
    website: "https://oakfield.example.com",
    email: "ops@oakfield.example.com",
    whatsapp: "+447700900222",
    locations: [
      {
        id: "l3",
        name: "Oakfield HQ",
        address: "1 Oak St",
        postcode: "CB2 1JT",
        lat: 52.1981,
        lng: 0.1237,
        mapUrl: "https://maps.google.com/?q=1%20Oak%20St%20CB2%201JT",
      },
    ],
  },
];

const seedLocums: Locum[] = [
  {
    id: "u1",
    displayName: "Dr. Aisha Khan",
    legalName: "Aisha Khan",
    photoUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=320&q=80",
    publicHeadline:
      "Small animal vet for calm consults, surgery cover, and busy first-opinion days.",
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
    specialisms: ["Small animals", "Dental surgery", "Consults", "No sole charge preferred"],
    preferredLocations: ["Bristol", "Bath", "North Somerset"],
    availabilityNote:
      "Usually available Tue-Thu with two weeks notice. Same-week cover possible for consult-only days.",
    publicProfile: {
      enabled: true,
      slug: "aisha-khan-vet",
      headline: "Reliable Bristol small animal vet cover",
      showRate: true,
      showDocuments: true,
      showAvailability: true,
    },
    profilePhotos: [
      {
        url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=640&q=80",
        caption: "Small animal consults",
      },
      {
        url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=640&q=80",
        caption: "Surgery and inpatient care",
      },
    ],
    documents: [
      {
        name: "CV",
        status: "verified",
        kind: "CV",
        required: true,
        fileName: "aisha-khan-cv.pdf",
        visibility: "practice",
      },
      {
        name: "Professional cover",
        status: "verified",
        kind: "Insurance",
        required: true,
        expiry: "2026-12-31",
        fileName: "professional-cover.pdf",
        visibility: "practice",
      },
      {
        name: "Right to work",
        status: "verified",
        kind: "Right to work",
        required: true,
        fileName: "right-to-work.pdf",
        visibility: "private",
      },
      {
        name: "RCVS certificate",
        status: "verified",
        kind: "RCVS",
        required: true,
        expiry: "2027-03-31",
        fileName: "rcvs-certificate.pdf",
        visibility: "practice",
      },
    ],
  },
  {
    id: "u2",
    displayName: "Tom Reilly",
    legalName: "Thomas Reilly",
    photoUrl:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=320&q=80",
    publicHeadline: "RVN cover for nurse clinics, anaesthesia support, and inpatient days.",
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
    specialisms: ["Nurse clinics", "Anaesthesia", "Inpatient care"],
    preferredLocations: ["Bristol", "Gloucestershire"],
    availabilityNote: "Available Mondays and Fridays for regular cover.",
    publicProfile: {
      enabled: true,
      slug: "tom-reilly-rvn",
      headline: "RVN locum cover for clinics and theatre support",
      showRate: true,
      showDocuments: true,
      showAvailability: true,
    },
    profilePhotos: [
      {
        url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=640&q=80",
        caption: "Nurse clinics",
      },
    ],
    documents: [
      {
        name: "CV",
        status: "verified",
        kind: "CV",
        required: true,
        fileName: "tom-reilly-cv.pdf",
        visibility: "practice",
      },
      {
        name: "Insurance",
        status: "verified",
        kind: "Insurance",
        required: true,
        expiry: "2026-10-15",
        visibility: "practice",
      },
      {
        name: "Reference",
        status: "supplied",
        kind: "Other",
        required: false,
        visibility: "practice",
      },
    ],
  },
  {
    id: "u3",
    displayName: "Maya Patel",
    legalName: "Maya Patel",
    photoUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
    publicHeadline: "VCA cover for busy front desks, payments, phones, and client handover.",
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
    specialisms: ["Front desk", "Phones", "Payments", "Client care"],
    preferredLocations: ["Bristol", "Cambridge"],
    availabilityNote: "Available for half days and school-hour reception cover.",
    publicProfile: {
      enabled: true,
      slug: "maya-patel-reception",
      headline: "Experienced veterinary reception cover",
      showRate: true,
      showDocuments: false,
      showAvailability: true,
    },
    profilePhotos: [
      {
        url: "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=640&q=80",
        caption: "Client care",
      },
    ],
    documents: [
      {
        name: "CV",
        status: "verified",
        kind: "CV",
        required: true,
        fileName: "maya-patel-cv.pdf",
        visibility: "practice",
      },
      {
        name: "Right to work",
        status: "verified",
        kind: "Right to work",
        required: true,
        visibility: "private",
      },
    ],
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
  {
    id: "s7",
    practiceId: "p1",
    locationId: "l1",
    role: "Vet",
    date: iso(addDays(today, -5)),
    start: "09:00",
    end: "18:00",
    lunchMinutes: 30,
    lunchPaid: false,
    hourlyRate: 65,
    positionsNeeded: 1,
    area: "Small animals",
    notes: "Completed consults and routine surgery day.",
    status: "Completed",
    createdAt: Date.now() - 20 * 86400000,
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
  {
    id: "a5",
    shiftId: "s7",
    locumId: "u1",
    status: "Booked",
    applicantKind: "registered",
    createdAt: Date.now() - 18 * 86400000,
  },
];

const seedTimesheets: Timesheet[] = [
  {
    id: "t2",
    shiftId: "s6",
    locumId: "u3",
    actualStart: "09:10",
    actualEnd: "17:05",
    lunchMinutes: 30,
    notes: "Reception handover completed.",
    attachmentIds: [],
    status: "Submitted",
    submittedAt: Date.now() - 2 * 86400000,
  },
  {
    id: "t1",
    shiftId: "s7",
    locumId: "u1",
    actualStart: "09:00",
    actualEnd: "18:00",
    lunchMinutes: 30,
    expense: "Parking GBP 8",
    notes: "All consult notes completed before leaving.",
    attachmentIds: ["att-timesheet-1"],
    status: "Approved",
    submittedAt: Date.now() - 4 * 86400000,
    approvedAt: Date.now() - 3 * 86400000,
  },
];

const seedInvoices: Invoice[] = [
  {
    id: "i1",
    number: "INV-1001",
    shiftId: "s7",
    locumId: "u1",
    practiceId: "p1",
    hours: 8.5,
    rate: 65,
    total: 552.5,
    status: "Paid outside platform",
    timesheetId: "t1",
    issuedAt: Date.now() - 2 * 86400000,
  },
];

const seedBookings: Booking[] = seedApplications.flatMap((application) => {
  if (application.status !== "Booked") return [];
  const shift = seedShifts.find((item) => item.id === application.shiftId);
  if (!shift) return [];
  return [
    {
      id: `b-${application.id}`,
      shiftId: shift.id,
      practiceId: shift.practiceId,
      locumId: application.locumId,
      locationId: shift.locationId,
      applicationId: application.id,
      status: shift.status === "Completed" ? "completed" : "confirmed",
      date: shift.date,
      start: shift.start,
      end: shift.end,
      lunchMinutes: shift.lunchMinutes,
      lunchPaid: shift.lunchPaid,
      hourlyRate: shift.hourlyRate,
      confirmedAt: application.updatedAt ?? application.createdAt,
      completedAt: shift.status === "Completed" ? Date.now() - 2 * 86400000 : undefined,
    },
  ];
});

const seedAttachments: Attachment[] = [
  {
    id: "att-cv-u1",
    ownerType: "locum",
    ownerId: "u1",
    name: "Aisha Khan CV",
    kind: "CV",
    url: "https://example.com/aisha-khan-cv.pdf",
    uploadedByRole: "locum",
    uploadedById: "u1",
    createdAt: Date.now() - 60 * 86400000,
  },
  {
    id: "att-timesheet-1",
    ownerType: "timesheet",
    ownerId: "t1",
    name: "Parking receipt",
    kind: "Timesheet evidence",
    url: "https://example.com/parking-receipt.pdf",
    uploadedByRole: "locum",
    uploadedById: "u1",
    createdAt: Date.now() - 4 * 86400000,
  },
  {
    id: "att-shift-s1",
    ownerType: "shift",
    ownerId: "s1",
    name: "Riverside induction notes",
    kind: "Shift brief",
    url: "https://example.com/riverside-induction.pdf",
    uploadedByRole: "practice",
    uploadedById: "p1",
    createdAt: Date.now() - 86400000,
  },
];

const seedAvailability: LocumAvailabilityWindow[] = [
  {
    id: "av1",
    locumId: "u1",
    date: iso(addDays(today, 8)),
    start: "09:00",
    end: "18:00",
    status: "Available",
    note: "Consult-only or routine surgery cover.",
    publicVisible: true,
  },
  {
    id: "av2",
    locumId: "u1",
    date: iso(addDays(today, 10)),
    start: "10:00",
    end: "16:00",
    status: "Tentative",
    note: "Can confirm with 48h notice.",
    publicVisible: true,
  },
];

const seedCalendarSync: CalendarSyncSettings[] = [
  {
    id: "sync-u1-google",
    ownerType: "locum",
    ownerId: "u1",
    provider: "google",
    status: "Not connected",
    calendarName: "Google Calendar",
    placeholderOnly: true,
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
  bookings: Booking[];
  timesheets: Timesheet[];
  invoices: Invoice[];
  attachments: Attachment[];
  guestApplicants: GuestApplicant[];
  bookingRequests: BookingRequest[];
  cancellations: Cancellation[];
  locumAvailability: LocumAvailabilityWindow[];
  calendarSyncSettings: CalendarSyncSettings[];
  setViewerRole: (r: ViewerRole) => void;
  updateLocumProfile: (locumId: string, patch: Partial<Locum>) => void;
  addAttachment: (input: Omit<Attachment, "id" | "createdAt">) => Attachment;
  removeAttachment: (id: string) => void;
  updatePracticeLocation: (
    practiceId: string,
    patch: Partial<Practice["locations"][number]>,
  ) => void;
  updatePracticePublicLink: (practiceId: string, patch: Partial<PublicLinkSettings>) => void;
  updateLocumPublicProfile: (locumId: string, patch: Partial<LocumPublicProfileSettings>) => void;
  addLocumAvailability: (input: Omit<LocumAvailabilityWindow, "id">) => LocumAvailabilityWindow;
  removeLocumAvailability: (id: string) => void;
  addShift: (s: Omit<Shift, "id" | "createdAt" | "status">) => Shift;
  cancelShift: (id: string, reason?: string, note?: string) => void;
  apply: (shiftId: string, locumId: string, note?: string) => void;
  applyToShift: (shiftId: string, locumId: string, note?: string) => void;
  requestPublicShift: (request: PublicShiftRequest) => { ok: boolean; message: string };
  applyAsRegistered: (
    shiftId: string,
    locumId: string,
    note?: string,
    attachmentIds?: string[],
  ) => void;
  withdraw: (appId: string, reason?: string, note?: string) => void;
  confirmBooking: (appId: string) => void;
  confirmApplication: (appId: string) => void;
  notSelected: (appId: string) => void;
  declineApplication: (appId: string) => void;
  undoDecline: (appId: string) => void;
  counterOffer: (appId: string, note?: string) => void;
  sendBookingRequest: (
    input: Omit<BookingRequest, "id" | "status" | "createdAt">,
  ) => BookingRequest;
  respondToBookingRequest: (
    requestId: string,
    status: "Accepted" | "Declined",
    reason?: string,
  ) => void;
  acceptBookingRequest: (requestId: string) => void;
  declineBookingRequest: (requestId: string, reason?: string) => void;
  cancelBookingRequest: (requestId: string, reason: string, note?: string) => void;
  cancelBooking: (bookingId: string, reason?: string, note?: string) => void;
  submitTimesheet: (t: Omit<Timesheet, "id" | "status"> & { attachmentIds?: string[] }) => void;
  approveTimesheet: (id: string) => void;
  queryTimesheet: (id: string) => void;
  createInvoiceDraft: (timesheetId: string) => void;
  createInvoiceDraftFromTimesheet: (timesheetId: string) => Invoice | undefined;
  issueInvoice: (invoiceId: string) => void;
  markInvoicePaid: (invoiceId: string) => void;
  connectGoogleCalendarPlaceholder: (ownerType: "practice" | "locum", ownerId: string) => void;
  syncCalendarPlaceholder: (ownerType: "practice" | "locum", ownerId: string) => void;
  markCompleted: (shiftId: string) => void;
  markShiftCompleted: (shiftId: string) => void;
}

export const useStore = create<State>((set, get) => ({
  viewerRole: "practice",
  currentPracticeId: "p1",
  currentLocumId: "u1",
  practices: seedPractices,
  locums: seedLocums,
  shifts: seedShifts,
  applications: seedApplications,
  bookings: seedBookings,
  timesheets: seedTimesheets,
  invoices: seedInvoices,
  attachments: seedAttachments,
  guestApplicants: [],
  bookingRequests: [],
  cancellations: [],
  locumAvailability: seedAvailability,
  calendarSyncSettings: seedCalendarSync,
  setViewerRole: (r) => set({ viewerRole: r }),
  updateLocumProfile: (locumId, patch) =>
    set({ locums: get().locums.map((l) => (l.id === locumId ? { ...l, ...patch } : l)) }),
  addAttachment: (input) => {
    const attachment: Attachment = { ...input, id: `att${Date.now()}`, createdAt: Date.now() };
    set({ attachments: [attachment, ...get().attachments] });
    return attachment;
  },
  removeAttachment: (id) => set({ attachments: get().attachments.filter((a) => a.id !== id) }),
  updatePracticeLocation: (practiceId, patch) =>
    set({
      practices: get().practices.map((practice) =>
        practice.id === practiceId
          ? {
              ...practice,
              locations: practice.locations.map((location, index) =>
                index === 0 ? { ...location, ...patch } : location,
              ),
            }
          : practice,
      ),
    }),
  updatePracticePublicLink: (practiceId, patch) =>
    set({
      practices: get().practices.map((p) =>
        p.id === practiceId
          ? {
              ...p,
              shareSlug: patch.slug ?? p.shareSlug,
              publicLink: {
                ...(p.publicLink ?? publicPracticeLink(p.shareSlug, p.tradingName, "")),
                ...patch,
              },
            }
          : p,
      ),
    }),
  updateLocumPublicProfile: (locumId, patch) =>
    set({
      locums: get().locums.map((l) =>
        l.id === locumId
          ? {
              ...l,
              publicProfile: {
                ...(l.publicProfile ?? {
                  enabled: true,
                  slug: l.id,
                  showRate: true,
                  showDocuments: true,
                  showAvailability: true,
                }),
                ...patch,
              },
            }
          : l,
      ),
    }),
  addLocumAvailability: (input) => {
    const block: LocumAvailabilityWindow = { ...input, id: `av${Date.now()}` };
    set({ locumAvailability: [block, ...get().locumAvailability] });
    return block;
  },
  removeLocumAvailability: (id) =>
    set({ locumAvailability: get().locumAvailability.filter((block) => block.id !== id) }),
  addShift: (s) => {
    const shift: Shift = { ...s, id: `s${Date.now()}`, createdAt: Date.now(), status: "Open" };
    set({ shifts: [shift, ...get().shifts] });
    return shift;
  },
  cancelShift: (id, reason = "Practice no longer needs cover", note) =>
    set({
      shifts: get().shifts.map((s) => (s.id === id ? { ...s, status: "Cancelled" } : s)),
      applications: get().applications.map((a) =>
        a.shiftId === id &&
        (ACTIVE_APPLICATION_STATUSES.includes(a.status) || a.status === "Booked")
          ? { ...a, status: "Cancelled", updatedAt: Date.now() }
          : a,
      ),
      cancellations: [
        {
          id: `c${Date.now()}`,
          ownerType: "shift",
          ownerId: id,
          reason,
          note,
          cancelledByRole: "practice",
          cancelledById: get().currentPracticeId,
          createdAt: Date.now(),
        },
        ...get().cancellations,
      ],
    }),
  apply: (shiftId, locumId, note) => {
    const state = get();
    const shift = state.shifts.find((item) => item.id === shiftId);
    const locum = state.locums.find((item) => item.id === locumId);
    if (!shift || !locum || !canRequestShift(shift.status)) return;
    const existing = state.applications.some(
      (a) =>
        a.shiftId === shiftId &&
        a.locumId === locumId &&
        (ACTIVE_APPLICATION_STATUSES.includes(a.status) || a.status === "Booked"),
    );
    if (existing) return;
    const a: Application = {
      id: `a${Date.now()}`,
      shiftId,
      locumId,
      status: "Applied",
      note,
      applicantKind: "registered",
      createdAt: Date.now(),
    };
    const shifts = state.shifts.map(
      (s): Shift =>
        s.id === shiftId && s.status === "Open"
          ? { ...s, status: "New applicants" as ShiftStatus }
          : s,
    );
    set({ applications: [...state.applications, a], shifts });
  },
  applyToShift: (shiftId, locumId, note) => get().apply(shiftId, locumId, note),
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
    if (shift.date < todayIso || !canRequestShift(shift.status)) {
      return { ok: false, message: "That shift is not open for requests anymore." };
    }
    if (shift.role !== request.role) {
      return { ok: false, message: `This shift needs a ${shift.role}.` };
    }

    const existingLocum = state.locums.find((l) => l.email.toLowerCase() === normalizedEmail);
    if (!existingLocum) {
      return { ok: false, message: "Register as a locum before requesting this shift." };
    }
    const applicantLocumId = existingLocum.id;

    const alreadyRequested = state.applications.some(
      (a) =>
        a.shiftId === shift.id &&
        a.locumId === applicantLocumId &&
        (ACTIVE_APPLICATION_STATUSES.includes(a.status) || a.status === "Booked"),
    );
    if (alreadyRequested) {
      return { ok: false, message: "You already requested this shift." };
    }

    const application: Application = {
      id: `a${Date.now()}`,
      shiftId: shift.id,
      locumId: applicantLocumId,
      status: "Applied",
      applicantKind: "registered",
      note,
      customAnswers: request.customAnswers,
      createdAt: Date.now(),
    };

    set({
      applications: [...state.applications, application],
      shifts: state.shifts.map((s) =>
        s.id === shift.id && s.status === "Open" ? { ...s, status: "New applicants" } : s,
      ),
    });

    return { ok: true, message: "Request sent. The practice can review and confirm it." };
  },
  applyAsRegistered: (shiftId, locumId, note, attachmentIds) => {
    get().apply(shiftId, locumId, note);
    if (attachmentIds?.length) {
      const app = get()
        .applications.filter((a) => a.shiftId === shiftId && a.locumId === locumId)
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      if (app) {
        set({
          applications: get().applications.map((a) =>
            a.id === app.id ? { ...a, attachmentIds, updatedAt: Date.now() } : a,
          ),
        });
      }
    }
  },
  withdraw: (appId, reason = "Locum unavailable", note) => {
    const state = get();
    const app = state.applications.find((a) => a.id === appId);
    if (!app || !ACTIVE_APPLICATION_STATUSES.includes(app.status)) return;
    const applications = state.applications.map((a) =>
      a.id === appId ? { ...a, status: "Withdrawn" as AppStatus, updatedAt: Date.now() } : a,
    );
    set({
      applications,
      shifts: state.shifts.map((shift) =>
        shift.id === app.shiftId
          ? { ...shift, status: recalculateShiftStatus(shift, applications) }
          : shift,
      ),
      cancellations: [
        {
          id: `c${Date.now()}`,
          ownerType: "application",
          ownerId: appId,
          reason,
          note,
          cancelledByRole: "locum",
          cancelledById: get().currentLocumId,
          createdAt: Date.now(),
        },
        ...state.cancellations,
      ],
    });
  },
  confirmBooking: (appId) => {
    const state = get();
    const apps = state.applications;
    const app = apps.find((a) => a.id === appId);
    if (!app || !ACTIVE_APPLICATION_STATUSES.includes(app.status)) return;
    const shift = state.shifts.find((s) => s.id === app.shiftId);
    if (!shift || !canRequestShift(shift.status)) return;
    const activeBookings = state.bookings.filter(
      (booking) => booking.shiftId === shift.id && booking.status !== "cancelled",
    );
    const sameLocumAlreadyBooked = activeBookings.some(
      (booking) => booking.locumId === app.locumId,
    );
    if (sameLocumAlreadyBooked || activeBookings.length >= shift.positionsNeeded) return;
    const confirmedCount = activeBookings.length + 1;
    const newApps = apps.map((a) => {
      if (a.id === appId) return { ...a, status: "Booked" as AppStatus };
      if (
        a.shiftId === shift.id &&
        ACTIVE_APPLICATION_STATUSES.includes(a.status) &&
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
    const existingBooking = state.bookings.some(
      (booking) =>
        booking.applicationId === app.id ||
        (booking.shiftId === shift.id &&
          booking.locumId === app.locumId &&
          booking.status !== "cancelled"),
    );
    const booking: Booking = {
      id: `b${Date.now()}`,
      shiftId: shift.id,
      practiceId: shift.practiceId,
      locumId: app.locumId,
      locationId: shift.locationId,
      applicationId: app.id,
      status: "confirmed",
      date: shift.date,
      start: shift.start,
      end: shift.end,
      lunchMinutes: shift.lunchMinutes,
      lunchPaid: shift.lunchPaid,
      hourlyRate: shift.hourlyRate,
      confirmedAt: Date.now(),
    };
    set({
      applications: newApps,
      shifts: newShifts,
      bookings: existingBooking ? state.bookings : [booking, ...state.bookings],
    });
  },
  confirmApplication: (appId) => get().confirmBooking(appId),
  notSelected: (appId) => {
    const state = get();
    const app = state.applications.find((application) => application.id === appId);
    if (!app || !ACTIVE_APPLICATION_STATUSES.includes(app.status)) return;
    const applications = state.applications.map((application) =>
      application.id === appId
        ? { ...application, status: "Not selected" as AppStatus, updatedAt: Date.now() }
        : application,
    );
    set({
      applications,
      shifts: state.shifts.map((shift) =>
        shift.id === app.shiftId
          ? { ...shift, status: recalculateShiftStatus(shift, applications) }
          : shift,
      ),
    });
  },
  declineApplication: (appId) => get().notSelected(appId),
  undoDecline: (appId) => {
    const state = get();
    const app = state.applications.find((application) => application.id === appId);
    const shift = app ? state.shifts.find((item) => item.id === app.shiftId) : undefined;
    if (!app || app.status !== "Not selected" || !shift || !canRequestShift(shift.status)) return;
    const applications = state.applications.map((application) =>
      application.id === appId
        ? { ...application, status: "Applied" as AppStatus, updatedAt: Date.now() }
        : application,
    );
    set({
      applications,
      shifts: state.shifts.map((item) =>
        item.id === shift.id
          ? { ...item, status: recalculateShiftStatus(item, applications) }
          : item,
      ),
    });
  },
  counterOffer: (appId, note) =>
    set({
      applications: get().applications.map((application) =>
        application.id === appId
          ? {
              ...application,
              status: "Requested",
              internalNote: note ?? application.internalNote,
              updatedAt: Date.now(),
            }
          : application,
      ),
    }),
  sendBookingRequest: (input) => {
    const request: BookingRequest = {
      ...input,
      id: `br${Date.now()}`,
      status: "Sent",
      createdAt: Date.now(),
    };
    set({ bookingRequests: [request, ...get().bookingRequests] });
    return request;
  },
  respondToBookingRequest: (requestId, status, reason) =>
    set({
      bookingRequests: get().bookingRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status,
              respondedAt: Date.now(),
              declineReason: status === "Declined" ? reason : request.declineReason,
            }
          : request,
      ),
    }),
  acceptBookingRequest: (requestId) => {
    const state = get();
    const request = state.bookingRequests.find((item) => item.id === requestId);
    if (!request || request.status !== "Sent") return;
    let shift = request.shiftId
      ? state.shifts.find((item) => item.id === request.shiftId)
      : undefined;
    if (shift) {
      const activeBookings = state.bookings.filter(
        (booking) => booking.shiftId === shift!.id && booking.status !== "cancelled",
      );
      if (
        !canRequestShift(shift.status) ||
        activeBookings.length >= shift.positionsNeeded ||
        activeBookings.some((booking) => booking.locumId === request.locumId)
      ) {
        return;
      }
    }
    const now = Date.now();
    if (!shift) {
      shift = {
        id: `s${now}`,
        practiceId: request.practiceId,
        locationId: request.locationId,
        role: request.role,
        date: request.date,
        start: request.start,
        end: request.end,
        lunchMinutes: 30,
        lunchPaid: false,
        hourlyRate: request.hourlyRate,
        positionsNeeded: 1,
        area: "Shift",
        notes: request.message ?? "",
        status: "Booked",
        createdAt: now,
      };
      set({ shifts: [shift, ...state.shifts] });
    }
    const application: Application = {
      id: `a${now}`,
      shiftId: shift.id,
      locumId: request.locumId,
      status: "Booked",
      applicantKind: "registered",
      note: request.message,
      createdAt: request.createdAt,
      updatedAt: now,
    };
    const booking: Booking = {
      id: `b${now}`,
      shiftId: shift.id,
      practiceId: request.practiceId,
      locumId: request.locumId,
      locationId: request.locationId,
      bookingRequestId: request.id,
      applicationId: application.id,
      status: "confirmed",
      date: request.date,
      start: request.start,
      end: request.end,
      lunchMinutes: shift.lunchMinutes,
      lunchPaid: shift.lunchPaid,
      hourlyRate: request.hourlyRate,
      confirmedAt: now,
    };
    set({
      bookingRequests: get().bookingRequests.map((item) =>
        item.id === request.id ? { ...item, status: "Accepted", respondedAt: now } : item,
      ),
      applications: [application, ...get().applications],
      bookings: [booking, ...get().bookings],
      shifts: get().shifts.map((item) =>
        item.id === shift!.id ? { ...item, status: "Booked" } : item,
      ),
    });
  },
  declineBookingRequest: (requestId, reason) =>
    get().respondToBookingRequest(requestId, "Declined", reason),
  cancelBookingRequest: (requestId, reason, note) =>
    set({
      bookingRequests: get().bookingRequests.map((request) =>
        request.id === requestId
          ? { ...request, status: "Cancelled", cancelReason: reason }
          : request,
      ),
      cancellations: [
        {
          id: `c${Date.now()}`,
          ownerType: "bookingRequest",
          ownerId: requestId,
          reason,
          note,
          cancelledByRole: "practice",
          cancelledById: get().currentPracticeId,
          createdAt: Date.now(),
        },
        ...get().cancellations,
      ],
    }),
  cancelBooking: (bookingId, reason = "Cancelled", note) => {
    const booking = get().bookings.find((item) => item.id === bookingId);
    if (!booking) return;
    set({
      bookings: get().bookings.map((item) =>
        item.id === bookingId
          ? { ...item, status: "cancelled", cancelledAt: Date.now(), cancelReason: reason }
          : item,
      ),
      applications: get().applications.map((application) =>
        application.id === booking.applicationId
          ? { ...application, status: "Cancelled", updatedAt: Date.now() }
          : application,
      ),
      shifts: get().shifts.map((shift) =>
        shift.id === booking.shiftId ? { ...shift, status: "Cancelled" } : shift,
      ),
      cancellations: [
        {
          id: `c${Date.now()}`,
          ownerType: "application",
          ownerId: booking.applicationId ?? booking.id,
          reason,
          note,
          cancelledByRole: get().viewerRole,
          cancelledById:
            get().viewerRole === "practice" ? get().currentPracticeId : get().currentLocumId,
          createdAt: Date.now(),
        },
        ...get().cancellations,
      ],
    });
  },
  submitTimesheet: (t) => {
    const state = get();
    const shift = state.shifts.find((item) => item.id === t.shiftId);
    const booking = state.bookings.find(
      (item) =>
        item.shiftId === t.shiftId && item.locumId === t.locumId && item.status !== "cancelled",
    );
    const alreadySubmitted = state.timesheets.some(
      (item) => item.shiftId === t.shiftId && item.locumId === t.locumId,
    );
    if (!shift || !booking || alreadySubmitted) return;
    const today = new Date().toISOString().slice(0, 10);
    if (shift.date > today && booking.status !== "completed") return;
    const ts: Timesheet = {
      ...t,
      id: `t${Date.now()}`,
      status: "Submitted",
      submittedAt: Date.now(),
    };
    set({ timesheets: [...state.timesheets, ts] });
  },
  approveTimesheet: (id) =>
    set({
      timesheets: get().timesheets.map((t) =>
        t.id === id && t.status === "Submitted"
          ? { ...t, status: "Approved", approvedAt: Date.now() }
          : t,
      ),
    }),
  queryTimesheet: (id) =>
    set({
      timesheets: get().timesheets.map((t) => (t.id === id ? { ...t, status: "Queried" } : t)),
    }),
  createInvoiceDraft: (timesheetId) => {
    get().createInvoiceDraftFromTimesheet(timesheetId);
  },
  createInvoiceDraftFromTimesheet: (timesheetId) => {
    const t = get().timesheets.find((x) => x.id === timesheetId);
    if (!t || t.status !== "Approved") return undefined;
    const existing = get().invoices.find((invoice) => invoice.timesheetId === timesheetId);
    if (existing) return existing;
    const shift = get().shifts.find((s) => s.id === t.shiftId);
    if (!shift) return undefined;
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
      timesheetId,
    };
    set({ invoices: [...get().invoices, inv] });
    return inv;
  },
  issueInvoice: (invoiceId) =>
    set({
      invoices: get().invoices.map((invoice) =>
        invoice.id === invoiceId && invoice.status === "Draft"
          ? { ...invoice, status: "Issued", issuedAt: Date.now() }
          : invoice,
      ),
    }),
  markInvoicePaid: (invoiceId) =>
    set({
      invoices: get().invoices.map((invoice) =>
        invoice.id === invoiceId && invoice.status === "Issued"
          ? { ...invoice, status: "Paid outside platform" }
          : invoice,
      ),
    }),
  connectGoogleCalendarPlaceholder: (ownerType, ownerId) =>
    set({
      calendarSyncSettings: [
        {
          id: `sync${Date.now()}`,
          ownerType,
          ownerId,
          provider: "google",
          status: "Connected",
          calendarName: "Google Calendar",
          lastSyncedAt: Date.now(),
          placeholderOnly: true,
        },
        ...get().calendarSyncSettings.filter(
          (setting) => !(setting.ownerType === ownerType && setting.ownerId === ownerId),
        ),
      ],
    }),
  syncCalendarPlaceholder: (ownerType, ownerId) =>
    set({
      calendarSyncSettings: get().calendarSyncSettings.map((setting) =>
        setting.ownerType === ownerType && setting.ownerId === ownerId
          ? { ...setting, status: "Connected", lastSyncedAt: Date.now() }
          : setting,
      ),
    }),
  markCompleted: (shiftId) =>
    set({
      shifts: get().shifts.map((s) => (s.id === shiftId ? { ...s, status: "Completed" } : s)),
      bookings: get().bookings.map((booking) =>
        booking.shiftId === shiftId
          ? { ...booking, status: "completed", completedAt: Date.now() }
          : booking,
      ),
    }),
  markShiftCompleted: (shiftId) => get().markCompleted(shiftId),
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

export const calcShiftHours = (s: Pick<Shift, "start" | "end" | "lunchMinutes" | "lunchPaid">) => {
  const [sh, sm] = s.start.split(":").map(Number);
  const [eh, em] = s.end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (!s.lunchPaid) mins -= s.lunchMinutes;
  return Math.max(0, mins / 60);
};
