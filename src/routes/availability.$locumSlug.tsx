import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, CalendarDays, Clock, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DateBlock, RoleChip, fmtDate, fmtGBP } from "@/components/Bits";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/availability/$locumSlug")({
  head: () => ({
    meta: [
      { title: "Locum availability - Every Tail Locums" },
      {
        name: "description",
        content: "A public locum availability calendar for veterinary practices.",
      },
    ],
  }),
  component: PublicLocumAvailability,
});

function PublicLocumAvailability() {
  const { locumSlug } = Route.useParams();
  const {
    locums,
    locumAvailability,
    practices,
    currentPracticeId,
    sendBookingRequest,
    bookingRequests,
  } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const locum = locums.find(
    (item) => item.publicProfile?.slug === locumSlug || item.id === locumSlug,
  );
  const practice = practices.find((item) => item.id === currentPracticeId);

  const availability = useMemo(
    () =>
      locumAvailability
        .filter(
          (block) => block.locumId === locum?.id && block.publicVisible && block.date >= today,
        )
        .sort((left, right) =>
          `${left.date}${left.start}`.localeCompare(`${right.date}${right.start}`),
        ),
    [locum?.id, locumAvailability, today],
  );
  const selected = availability.filter((block) => block.date === selectedDate);
  const selectedBlock = selected[0];
  const dates = new Set(availability.map((block) => block.date));
  const monthKey = selectedDate.slice(0, 7);

  if (!locum || locum.publicProfile?.enabled === false) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Availability not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This locum may have changed or paused their public availability link.
          </p>
          <Button asChild className="mt-5">
            <Link to="/">Back to Every Tail</Link>
          </Button>
        </div>
      </main>
    );
  }

  const requestBooking = () => {
    if (!practice || !selectedBlock) return;
    const duplicate = bookingRequests.some(
      (request) =>
        request.locumId === locum.id &&
        request.practiceId === practice.id &&
        request.date === selectedBlock.date &&
        request.status === "Sent",
    );
    if (duplicate) {
      setMessage("Already requested.");
      return;
    }
    sendBookingRequest({
      practiceId: practice.id,
      locumId: locum.id,
      date: selectedBlock.date,
      start: selectedBlock.start,
      end: selectedBlock.end,
      hourlyRate: locum.hourlyRate,
      role: locum.role,
      locationId: practice.locations[0].id,
      message: `Requested from ${locum.displayName}'s public availability page.`,
    });
    setMessage("Request sent.");
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="size-4" />
            Every Tail Locums
          </Link>
          <span className="rounded-md border bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
            Live
          </span>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-lg border bg-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="size-16 overflow-hidden rounded-lg border bg-primary/10">
                {locum.photoUrl ? (
                  <img
                    src={locum.photoUrl}
                    alt={locum.displayName}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center font-semibold text-primary">
                    {initials(locum.displayName)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <RoleChip role={locum.role} />
                </div>
                <h1 className="mt-2 text-2xl font-semibold">{locum.displayName}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locum.publicHeadline ?? `${locum.role} locum around ${locum.postcodeArea}`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <IconLink
                    href={`https://wa.me/${locum.whatsapp.replace(/[^0-9]/g, "")}`}
                    label="WhatsApp"
                    icon={<MessageCircle className="size-4" />}
                  />
                  <IconLink
                    href={`mailto:${locum.email}`}
                    label="Email"
                    icon={<Mail className="size-4" />}
                  />
                </div>
              </div>
            </div>
          </section>

          <CalendarPanel
            monthKey={monthKey}
            availableDates={dates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        <aside className="rounded-lg border bg-card p-5 lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center gap-2 font-semibold">
            <CalendarDays className="size-4 text-primary" />
            {fmtDate(selectedDate)}
          </div>
          {selectedBlock ? (
            <div className="mt-4 space-y-3">
              <div className="flex gap-3 rounded-md border p-3">
                <DateBlock date={selectedBlock.date} />
                <div className="min-w-0">
                  <div className="font-medium">
                    {selectedBlock.start}-{selectedBlock.end}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    Available
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {locum.preferredLocations?.join(", ") || locum.postcodeArea}
                  </div>
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="text-xs text-muted-foreground">Rate</div>
                <div className="mt-1 font-semibold">{fmtGBP(locum.hourlyRate)}/hr</div>
              </div>
              <Button className="w-full" onClick={requestBooking}>
                <Send className="size-4" />
                Request
              </Button>
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No availability.
            </div>
          )}
          {message && (
            <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm">{message}</div>
          )}
        </aside>
      </section>
    </main>
  );
}

function CalendarPanel({
  monthKey,
  availableDates,
  selectedDate,
  onSelectDate,
}: {
  monthKey: string;
  availableDates: Set<string>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const days = daysInMonth(monthKey);
  const firstWeekday = new Date(`${monthKey}-01T00:00:00`).getDay();
  const blanks = Array.from({ length: firstWeekday });

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 font-medium">
        {new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        })}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, index) => (
          <div key={`blank-${index}`} className="min-h-20 rounded-md border border-transparent" />
        ))}
        {days.map((date) => {
          const available = availableDates.has(date);
          const selected = selectedDate === date;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "min-h-20 rounded-md border p-2 text-left transition-colors",
                available
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100"
                  : "bg-background hover:bg-accent",
                selected && "ring-2 ring-primary",
              )}
            >
              <span className="text-sm font-medium">{Number(date.slice(-2))}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function IconLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      aria-label={label}
      title={label}
      className="inline-grid size-8 place-items-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {icon}
    </a>
  );
}

function daysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const count = new Date(year, month, 0).getDate();
  return Array.from({ length: count }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${monthKey}-${day}`;
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}
