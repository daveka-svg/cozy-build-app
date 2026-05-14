import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  PawPrint,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleChip, StatusChip, fmtDate, fmtGBP } from "@/components/Bits";
import {
  calcShiftValue,
  type Practice,
  type PublicLinkSettings,
  type Role,
  useStore,
} from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book/$shareSlug")({
  head: () => ({
    meta: [
      { title: "Book veterinary locum cover - Every Tail Locums" },
      {
        name: "description",
        content: "A public live availability calendar for veterinary locum and staff shifts.",
      },
    ],
  }),
  component: PublicBookingCalendar,
});

const roles: Role[] = ["Vet", "Nurse", "Reception"];

function fallbackSettings(practice: Practice): PublicLinkSettings {
  return {
    enabled: true,
    slug: practice.shareSlug,
    title: `${practice.tradingName} available locum shifts`,
    intro:
      "Pick an open date, check the shift details, then request the cover. The practice confirms before anything is booked.",
    visibleRoles: roles,
    showRates: true,
    showPracticeWebsite: true,
    requirePhone: true,
    requireCvLink: false,
    customFields: [],
  };
}

function PublicBookingCalendar() {
  const { shareSlug } = Route.useParams();
  const { practices, shifts, applications, applyAsRegistered, currentLocumId, locums } = useStore();
  const practice = practices.find(
    (item) => item.shareSlug === shareSlug || item.publicLink?.slug === shareSlug,
  );
  const settings = practice ? (practice.publicLink ?? fallbackSettings(practice)) : null;
  const visibleRoles = settings?.visibleRoles.length ? settings.visibleRoles : roles;
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const firstOpenDate = practice
    ? shifts
        .filter(
          (shift) =>
            shift.practiceId === practice.id &&
            shift.date >= todayIso &&
            visibleRoles.includes(shift.role) &&
            (shift.status === "Open" || shift.status === "New applicants"),
        )
        .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))[0]?.date
    : undefined;
  const [cursor, setCursor] = useState(() =>
    firstOpenDate ? new Date(`${firstOpenDate}T00:00:00`) : new Date(),
  );
  const [role, setRole] = useState<Role | "All">("All");
  const [selectedDate, setSelectedDate] = useState(() => firstOpenDate ?? todayIso);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const visibleFutureShifts = useMemo(() => {
    if (!practice) return [];
    return shifts
      .filter((shift) => {
        if (shift.practiceId !== practice.id) return false;
        if (shift.date < todayIso) return false;
        if (!visibleRoles.includes(shift.role)) return false;
        if (role !== "All" && shift.role !== role) return false;
        return true;
      })
      .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  }, [practice, role, shifts, todayIso, visibleRoles]);
  const publicShifts = visibleFutureShifts.filter(
    (shift) => shift.status === "Open" || shift.status === "New applicants",
  );

  const dateStates = new Map<string, "available" | "booked">();
  visibleFutureShifts.forEach((shift) => {
    const available = shift.status === "Open" || shift.status === "New applicants";
    if (available || !dateStates.has(shift.date)) {
      dateStates.set(shift.date, available ? "available" : "booked");
    }
  });
  const selectedDayShifts = publicShifts.filter((shift) => shift.date === selectedDate);
  const highlightedShift =
    selectedDayShifts.find((shift) => shift.id === selectedShiftId) ?? selectedDayShifts[0] ?? null;

  if (!practice) {
    return (
      <main className="min-h-screen bg-background grid place-items-center px-6">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center">
          <PawPrint className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Calendar not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This share link may have been changed or unpublished.
          </p>
          <Button asChild className="mt-5">
            <Link to="/">Back to Every Tail</Link>
          </Button>
        </div>
      </main>
    );
  }

  const activeSettings = settings ?? fallbackSettings(practice);

  if (!activeSettings.enabled) {
    return (
      <main className="min-h-screen bg-background grid place-items-center px-6">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center">
          <PawPrint className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Calendar paused</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This practice has paused its public booking link. Please contact the practice directly.
          </p>
          {activeSettings.showPracticeWebsite && practice.website && (
            <Button asChild className="mt-5" variant="outline">
              <a href={practice.website} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Practice website
              </a>
            </Button>
          )}
        </div>
      </main>
    );
  }

  const selectedLocation = highlightedShift
    ? practice.locations.find((location) => location.id === highlightedShift.locationId)
    : undefined;

  const submitRequest = () => {
    if (!highlightedShift) return;
    const locum = locums.find((item) => item.id === currentLocumId);
    if (!locum) {
      setMessage({ tone: "error", text: "Sign in as a locum before requesting this shift." });
      return;
    }
    const alreadyApplied = applications.some(
      (application) =>
        application.shiftId === highlightedShift.id && application.locumId === locum.id,
    );
    if (alreadyApplied) {
      setMessage({ tone: "error", text: "You already requested this shift." });
      return;
    }
    applyAsRegistered(
      highlightedShift.id,
      locum.id,
      `Requested from ${practice.tradingName} public calendar.`,
    );
    setMessage({ tone: "ok", text: "Request sent with your platform profile." });
  };

  const copyLink = () => {
    const href = `${window.location.origin}/book/${activeSettings.slug || practice.shareSlug}`;
    void navigator.clipboard.writeText(href);
    setMessage({ tone: "ok", text: "Share link copied." });
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="size-4" />
            Every Tail Locums
          </Link>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="size-4" />
            Share
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_390px]">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-primary">
                <CalendarDays className="size-3.5" />
                Live
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {activeSettings.title || `${practice.tradingName} available locum shifts`}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {activeSettings.intro ||
                  "Pick an open date, check the shift details, then request the cover. The practice confirms before anything is booked."}
              </p>
              {activeSettings.showPracticeWebsite && practice.website && (
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <a href={practice.website} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Practice website
                  </a>
                </Button>
              )}
            </div>
            <div className="min-w-48">
              <div className="mb-1 text-sm font-medium">Role</div>
              <Select
                value={role}
                onValueChange={(value) => {
                  setRole(value as Role | "All");
                  setSelectedShiftId(null);
                }}
              >
                <SelectTrigger className="h-10 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All roles</SelectItem>
                  {visibleRoles.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item === "Reception" ? "VCA" : item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <CalendarPanel
              cursor={cursor}
              selectedDate={selectedDate}
              dateStates={dateStates}
              onMonthChange={setCursor}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setSelectedShiftId(null);
              }}
            />

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="font-semibold">{fmtDate(selectedDate)}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedDayShifts.length} open shift{selectedDayShifts.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="max-h-[480px] space-y-2 overflow-auto p-3">
                {selectedDayShifts.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No matching shifts on this date.
                  </div>
                ) : (
                  selectedDayShifts.map((shift) => {
                    const loc = practice.locations.find(
                      (location) => location.id === shift.locationId,
                    );
                    const applicantCount = applications.filter(
                      (application) =>
                        application.shiftId === shift.id && application.status === "Applied",
                    ).length;
                    const isActive = highlightedShift?.id === shift.id;
                    return (
                      <button
                        key={shift.id}
                        onClick={() => setSelectedShiftId(shift.id)}
                        className={cn(
                          "w-full rounded-md border p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/50",
                          isActive && "border-primary bg-primary/5",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <RoleChip role={shift.role} />
                          <span className="text-xs font-medium">
                            {activeSettings.showRates
                              ? `${fmtGBP(shift.hourlyRate)}/hr`
                              : "Rate on request"}
                          </span>
                        </div>
                        <div className="mt-2 text-sm font-medium">
                          {shift.start}-{shift.end}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {loc?.name}, {loc?.postcode}
                        </div>
                        {applicantCount > 0 && (
                          <div className="mt-2 text-xs text-primary">
                            {applicantCount} request{applicantCount === 1 ? "" : "s"}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>

        <aside className="rounded-lg border bg-card p-5 lg:sticky lg:top-6 lg:self-start">
          {highlightedShift ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <RoleChip role={highlightedShift.role} />
                  <h2 className="mt-3 text-xl font-semibold">{fmtDate(highlightedShift.date)}</h2>
                  <p className="text-sm text-muted-foreground">{highlightedShift.area}</p>
                </div>
                <StatusChip status={highlightedShift.status} />
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <InfoItem
                  label="Time"
                  value={`${highlightedShift.start}-${highlightedShift.end}`}
                  icon={Clock}
                />
                {activeSettings.showRates ? (
                  <>
                    <InfoItem label="Rate" value={`${fmtGBP(highlightedShift.hourlyRate)}/hr`} />
                    <InfoItem
                      label="Estimated total"
                      value={fmtGBP(calcShiftValue(highlightedShift))}
                    />
                  </>
                ) : (
                  <InfoItem label="Rate" value="Shared after request" />
                )}
                <InfoItem
                  label="Lunch break"
                  value={`${highlightedShift.lunchMinutes} min${highlightedShift.lunchPaid ? " paid" : ""}`}
                />
              </dl>

              <div className="mt-4 rounded-md border bg-background p-3 text-sm">
                <div className="font-medium">{selectedLocation?.name}</div>
                <div className="mt-1 text-muted-foreground">
                  {selectedLocation?.address}, {selectedLocation?.postcode}
                </div>
                {highlightedShift.notes && (
                  <p className="mt-3 text-muted-foreground">{highlightedShift.notes}</p>
                )}
              </div>

              <div className="mt-5 text-sm text-muted-foreground">
                Registered locums only. Your platform profile, documents, email, and WhatsApp will
                be shared with the practice.
              </div>
              <Button className="mt-3 w-full" type="button" onClick={submitRequest}>
                <Send className="size-4" />
                Request with my profile
              </Button>
            </>
          ) : (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto size-8 text-muted-foreground" />
              <h2 className="mt-3 font-semibold">No open dates</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different role, or ask the practice for their next availability window.
              </p>
            </div>
          )}

          {message && (
            <div
              className={cn(
                "mt-4 flex gap-2 rounded-md border p-3 text-sm",
                message.tone === "ok"
                  ? "border-success/30 bg-success/10"
                  : "border-destructive/30 bg-destructive/10",
              )}
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function CalendarPanel({
  cursor,
  selectedDate,
  dateStates,
  onMonthChange,
  onSelectDate,
}: {
  cursor: Date;
  selectedDate: string;
  dateStates: Map<string, "available" | "booked">;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: string) => void;
}) {
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = useMemo(() => {
    const values: (string | null)[] = Array(startWeekday).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      values.push(format(new Date(cursor.getFullYear(), cursor.getMonth(), day), "yyyy-MM-dd"));
    }
    while (values.length % 7 !== 0) values.push(null);
    return values;
  }, [cursor, daysInMonth, startWeekday]);

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMonthChange(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          Prev
        </Button>
        <h2 className="font-semibold">
          {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMonthChange(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          Next
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} className="aspect-square" />;
          const state = dateStates.get(date);
          const selected = selectedDate === date;
          const past = date < today;
          return (
            <button
              key={date}
              disabled={past}
              onClick={() => onSelectDate(date)}
              className={cn(
                "aspect-square rounded-md border p-1.5 text-left text-sm transition-colors",
                state === "available" && "border-emerald-300 bg-emerald-50 text-emerald-950",
                state === "booked" && "border-muted bg-muted/50 text-muted-foreground",
                selected && "ring-2 ring-primary",
                !state && "hover:border-primary/50 hover:bg-accent/50",
                past && "cursor-not-allowed opacity-40",
              )}
            >
              <span className="font-medium">{Number(date.slice(-2))}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-3 rounded-sm bg-emerald-100 border border-emerald-300" />
        Available
        <span className="ml-3 size-3 rounded-sm bg-muted border" />
        Booked
      </div>
    </section>
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Clock;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3" />}
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
