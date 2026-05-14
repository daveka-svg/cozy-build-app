import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  MapPin,
  PawPrint,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoleChip, StatusChip, fmtDate, fmtGBP } from "@/components/Bits";
import { calcShiftValue, type Role, useStore } from "@/lib/store";
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

function PublicBookingCalendar() {
  const { shareSlug } = Route.useParams();
  const { practices, shifts, applications, requestPublicShift } = useStore();
  const practice = practices.find((item) => item.shareSlug === shareSlug);
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const firstOpenDate = practice
    ? shifts
        .filter(
          (shift) =>
            shift.practiceId === practice.id &&
            shift.date >= todayIso &&
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

  const publicShifts = useMemo(() => {
    if (!practice) return [];
    return shifts
      .filter((shift) => {
        if (shift.practiceId !== practice.id) return false;
        if (shift.date < todayIso) return false;
        if (shift.status !== "Open" && shift.status !== "New applicants") return false;
        if (role !== "All" && shift.role !== role) return false;
        return true;
      })
      .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  }, [practice, role, shifts, todayIso]);

  const daysWithShifts = new Set(publicShifts.map((shift) => shift.date));
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

  const selectedLocation = highlightedShift
    ? practice.locations.find((location) => location.id === highlightedShift.locationId)
    : undefined;

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!highlightedShift) return;
    const form = new FormData(event.currentTarget);
    const result = requestPublicShift({
      practiceSlug: practice.shareSlug,
      shiftId: highlightedShift.id,
      displayName: String(form.get("displayName") ?? ""),
      email: String(form.get("email") ?? ""),
      whatsapp: String(form.get("whatsapp") ?? ""),
      role: highlightedShift.role,
      note: String(form.get("note") ?? ""),
    });
    setMessage({ tone: result.ok ? "ok" : "error", text: result.message });
    if (result.ok) event.currentTarget.reset();
  };

  const copyLink = () => {
    const href = `${window.location.origin}/book/${practice.shareSlug}`;
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
                Live booking calendar
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {practice.tradingName} available locum shifts
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Pick an open date, check the shift details, then request the cover. The practice
                confirms before anything is booked.
              </p>
            </div>
            <label className="min-w-40 text-sm font-medium">
              Role
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as Role | "All");
                  setSelectedShiftId(null);
                }}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="All">All roles</option>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <CalendarPanel
              cursor={cursor}
              selectedDate={selectedDate}
              datesWithShifts={daysWithShifts}
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
                          <span className="text-xs font-medium">{fmtGBP(shift.hourlyRate)}/hr</span>
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
                            {applicantCount} request{applicantCount === 1 ? "" : "s"} already sent
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
                <InfoItem label="Rate" value={`${fmtGBP(highlightedShift.hourlyRate)}/hr`} />
                <InfoItem
                  label="Estimated total"
                  value={fmtGBP(calcShiftValue(highlightedShift))}
                />
                <InfoItem label="Positions" value={String(highlightedShift.positionsNeeded)} />
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

              <form className="mt-5 space-y-3" onSubmit={submitRequest}>
                <div>
                  <Label htmlFor="displayName">Name</Label>
                  <Input id="displayName" name="displayName" required placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp or phone</Label>
                  <Input id="whatsapp" name="whatsapp" required placeholder="+44..." />
                </div>
                <div>
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    name="note"
                    placeholder="CV link, availability, questions..."
                  />
                </div>
                <Button className="w-full" type="submit">
                  <Send className="size-4" />
                  Request this shift
                </Button>
              </form>
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
  datesWithShifts,
  onMonthChange,
  onSelectDate,
}: {
  cursor: Date;
  selectedDate: string;
  datesWithShifts: Set<string>;
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
          const hasShift = datesWithShifts.has(date);
          const selected = selectedDate === date;
          const past = date < today;
          return (
            <button
              key={date}
              disabled={past}
              onClick={() => onSelectDate(date)}
              className={cn(
                "aspect-square rounded-md border p-1.5 text-left text-sm transition-colors",
                selected
                  ? "border-primary bg-primary/10"
                  : "hover:border-primary/50 hover:bg-accent/50",
                past && "cursor-not-allowed opacity-40",
              )}
            >
              <span className="font-medium">{Number(date.slice(-2))}</span>
              {hasShift && <span className="mt-2 block h-1.5 w-6 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-1.5 w-6 rounded-full bg-primary" />
        Available dates update as the practice posts or fills shifts.
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
