import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  Send,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RoleChip, TagMultiSelect, fmtDate, fmtGBP } from "@/components/Bits";
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
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(visibleRoles);
  const [selectedDate, setSelectedDate] = useState(() => firstOpenDate ?? todayIso);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const visibleFutureShifts = useMemo(() => {
    if (!practice) return [];
    return shifts
      .filter((shift) => {
        if (shift.practiceId !== practice.id) return false;
        if (shift.date < todayIso) return false;
        if (!visibleRoles.includes(shift.role)) return false;
        if (selectedRoles.length > 0 && !selectedRoles.includes(shift.role)) return false;
        return true;
      })
      .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  }, [practice, selectedRoles, shifts, todayIso, visibleRoles]);
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
  const highlightedShift = selectedDayShifts[0] ?? null;

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
                Website
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
  const primaryLocation = selectedLocation ?? practice.locations[0];
  const mapQuery = `${primaryLocation.name} ${primaryLocation.address} ${primaryLocation.postcode}`;
  const mapSrc = mapEmbedUrl(primaryLocation, mapQuery);
  const phoneHref = `tel:${practice.whatsapp.replace(/[^+0-9]/g, "")}`;

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
    setMessage({ tone: "ok", text: "Request sent." });
  };

  const copyLink = () => {
    const href = `${window.location.origin}/book/${activeSettings.slug || practice.shareSlug}`;
    void navigator.clipboard.writeText(href);
    setMessage({ tone: "ok", text: "Share link copied." });
  };

  return (
    <main className="min-h-screen bg-stone-50/60">
      <header className="border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
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

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border bg-card">
            <div
              className="h-28 bg-muted bg-cover bg-center sm:h-32"
              style={
                practice.coverUrl ? { backgroundImage: `url(${practice.coverUrl})` } : undefined
              }
            />
            <div className="px-4 pb-4 sm:px-5">
              <div className="-mt-9 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <PracticeAvatar practice={practice} />
                  <div className="min-w-0 pt-9 sm:pt-10">
                    <div className="inline-flex items-center gap-2 rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-primary">
                      <CalendarDays className="size-3.5" />
                      Live
                    </div>
                    <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                      {activeSettings.title || `${practice.tradingName} available locum shifts`}
                    </h1>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      <span>
                        {primaryLocation.name}, {primaryLocation.postcode}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:pb-1">
                  {activeSettings.showPracticeWebsite && practice.website && (
                    <IconLink href={practice.website} label="Website" icon={Globe} external />
                  )}
                  <IconLink href={phoneHref} label={practice.whatsapp} icon={Phone} />
                  <IconLink href={`mailto:${practice.email}`} label={practice.email} icon={Mail} />
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="overflow-hidden rounded-md border bg-muted/30">
                  <iframe
                    title={`${practice.tradingName} map`}
                    src={mapSrc}
                    className="h-32 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="flex items-start gap-2 px-3 py-2 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      <span className="font-medium text-foreground">{primaryLocation.name}</span>,{" "}
                      {primaryLocation.postcode}
                    </span>
                  </div>
                </div>

                <TagMultiSelect
                  label="Role"
                  roles={visibleRoles}
                  selectedRoles={selectedRoles}
                  onToggle={(item) =>
                    setSelectedRoles((current) =>
                      current.includes(item)
                        ? current.filter((roleItem) => roleItem !== item)
                        : [...current, item],
                    )
                  }
                  onClear={() => setSelectedRoles([])}
                  emptyLabel="All roles"
                />
              </div>
            </div>
          </div>

          <CalendarPanel
            cursor={cursor}
            selectedDate={selectedDate}
            dateStates={dateStates}
            onMonthChange={setCursor}
            onSelectDate={setSelectedDate}
          />
        </div>

        <aside className="rounded-lg border bg-card p-4 lg:sticky lg:top-4 lg:self-start">
          {highlightedShift ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <RoleChip role={highlightedShift.role} />
                  <h2 className="mt-3 text-lg font-semibold">{fmtDate(highlightedShift.date)}</h2>
                  <p className="text-sm text-muted-foreground">{highlightedShift.area}</p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <InfoItem
                  label="Time"
                  value={`${highlightedShift.start}-${highlightedShift.end}`}
                  icon={Clock}
                />
                {activeSettings.showRates ? (
                  <>
                    <InfoItem label="Rate" value={`${fmtGBP(highlightedShift.hourlyRate)}/hr`} />
                    <InfoItem label="Total" value={fmtGBP(calcShiftValue(highlightedShift))} />
                  </>
                ) : (
                  <InfoItem label="Rate" value="Shared after request" />
                )}
                <InfoItem
                  label="Lunch break"
                  value={`${highlightedShift.lunchMinutes} min ${
                    highlightedShift.lunchPaid ? "paid" : "unpaid"
                  }`}
                />
              </dl>

              <div className="mt-3 rounded-md border bg-background p-3 text-sm">
                <div className="font-medium">{selectedLocation?.name}</div>
                <div className="mt-1 text-muted-foreground">
                  {selectedLocation?.address}, {selectedLocation?.postcode}
                </div>
                {highlightedShift.notes && (
                  <p className="mt-3 text-muted-foreground">{highlightedShift.notes}</p>
                )}
              </div>

              <div className="mt-4 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                Register and request shift in one tap.
              </div>
              <Button className="mt-3 w-full" type="button" onClick={submitRequest}>
                <Send className="size-4" />
                Request
              </Button>
            </>
          ) : (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto size-8 text-muted-foreground" />
              <h2 className="mt-3 font-semibold">No shifts</h2>
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

function IconLink({
  href,
  label,
  icon: Icon,
  external,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      aria-label={label}
      title={label}
      className="inline-grid size-8 place-items-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Icon className="size-4" />
    </a>
  );
}

function PracticeAvatar({ practice }: { practice: Practice }) {
  const initials = practice.tradingName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-card bg-primary text-xl font-semibold text-primary-foreground shadow-none sm:size-20">
      {practice.logoUrl ? (
        <img
          src={practice.logoUrl}
          alt={`${practice.tradingName} logo`}
          className="size-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

function mapEmbedUrl(location: Practice["locations"][number], fallbackQuery: string) {
  const trimmed = location.mapUrl?.trim();
  if (trimmed?.includes("/embed") || trimmed?.includes("output=embed")) return trimmed;
  if (typeof location.lat === "number" && typeof location.lng === "number") {
    const lat = location.lat;
    const lng = location.lng;
    const bbox = [lng - 0.02, lat - 0.014, lng + 0.02, lat + 0.014].join("%2C");
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  }
  if (!trimmed)
    return `https://www.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&output=embed`;
  try {
    const url = new URL(trimmed);
    const query = url.searchParams.get("q") || url.searchParams.get("query") || fallbackQuery;
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  } catch {
    return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
  }
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
    <section className="rounded-lg border bg-card p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
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
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
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
    <div className="rounded-md border bg-background p-2.5">
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3" />}
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
