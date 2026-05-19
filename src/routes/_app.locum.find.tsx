import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Globe, ListFilter, MapPin, Navigation, Send, Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, StatusChip, TagMultiSelect, fmtDate, fmtGBP } from "@/components/Bits";
import { ShiftCard } from "@/components/PlacementUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcShiftValue, type Role, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/locum/find")({
  head: () => ({ meta: [{ title: "Find Shifts - Every Tail Locums" }] }),
  component: FindShifts,
});

const roles: Role[] = ["Vet", "Nurse", "Reception"];
const pointClass = [
  "left-[18%] top-[44%]",
  "left-[56%] top-[34%]",
  "left-[72%] top-[58%]",
  "left-[36%] top-[64%]",
];

function FindShifts() {
  const { shifts, practices, applications, currentLocumId, locums, apply } = useStore();
  const me = locums.find((locum) => locum.id === currentLocumId)!;
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minRate, setMinRate] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const filtered = shifts
    .filter((shift) => {
      if (shift.status !== "Open" && shift.status !== "New applicants") return false;
      if (shift.date < today) return false;
      if (selectedRoles.length > 0 && !selectedRoles.includes(shift.role)) return false;
      if (selectedDate && shift.date !== selectedDate) return false;
      if (dateFrom && shift.date < dateFrom) return false;
      if (dateTo && shift.date > dateTo) return false;
      if (minRate && shift.hourlyRate < minRate) return false;
      if (query.trim()) {
        const practice = practices.find((item) => item.id === shift.practiceId);
        const location = practice?.locations.find((item) => item.id === shift.locationId);
        const haystack = [
          practice?.tradingName,
          location?.name,
          location?.address,
          location?.postcode,
          shift.area,
          shift.notes,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    })
    .sort((left, right) =>
      `${left.date}${left.start}`.localeCompare(`${right.date}${right.start}`),
    );

  const mapPractices = Array.from(new Set(filtered.map((shift) => shift.practiceId)))
    .map((practiceId) => practices.find((practice) => practice.id === practiceId))
    .filter(Boolean);
  const calendarDates = useMemo(() => new Set(filtered.map((shift) => shift.date)), [filtered]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader title="Find" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 font-medium">
            <ListFilter className="size-4 text-muted-foreground" />
            Filters
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <TagMultiSelect
                roles={roles}
                selectedRoles={selectedRoles}
                onToggle={(role) =>
                  setSelectedRoles((current) =>
                    current.includes(role)
                      ? current.filter((item) => item !== role)
                      : [...current, role],
                  )
                }
                onClear={() => setSelectedRoles([])}
                emptyLabel="All roles"
              />
            </div>
            <div>
              <Label>Search</Label>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Practice, area, postcode"
              />
            </div>
            <div>
              <Label>Rate</Label>
              <Input
                type="number"
                value={minRate || ""}
                onChange={(event) => setMinRate(Number(event.target.value))}
                placeholder="Min"
              />
            </div>
            <div>
              <Label>From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div>
              <Label>To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  setSelectedRoles([]);
                  setQuery("");
                  setDateFrom("");
                  setDateTo("");
                  setSelectedDate("");
                  setMinRate(0);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </section>

        <MapPanel practices={mapPractices} />
      </div>

      <CalendarStrip
        dates={calendarDates}
        selectedDate={selectedDate}
        onSelect={(date) => setSelectedDate(date === selectedDate ? "" : date)}
      />

      <div className="mt-4 space-y-3">
        {filtered.length === 0 && <EmptyState>No shifts.</EmptyState>}
        {filtered.map((shift) => {
          const practice = practices.find((item) => item.id === shift.practiceId)!;
          const location = practice.locations.find((item) => item.id === shift.locationId)!;
          const myApp = applications.find(
            (application) =>
              application.shiftId === shift.id && application.locumId === currentLocumId,
          );
          const cvOk = me.cvAttached;
          const rcvsOk = shift.role === "Reception" || Boolean(me.rcvs);
          const canApply = cvOk && rcvsOk && !myApp;

          return (
            <ShiftCard
              key={shift.id}
              date={shift.date}
              role={shift.role}
              status={myApp ? myApp.status : shift.status}
              title={practice.tradingName}
              meta={
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    {shift.start}-{shift.end}
                  </span>
                  <span>Lunch {shift.lunchMinutes}m</span>
                  <span>
                    <MapPin className="mr-1 inline size-3" />
                    {location.name}, {location.postcode}
                  </span>
                  {shift.positionsNeeded > 1 && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" />
                      {shift.positionsNeeded}
                    </span>
                  )}
                </div>
              }
              value={
                <>
                  <div>{fmtGBP(shift.hourlyRate)}/hr</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {fmtGBP(calcShiftValue(shift))}
                  </div>
                </>
              }
              actions={
                <>
                  <Button size="sm" variant="outline" asChild>
                    <a href={practice.website} target="_blank" rel="noreferrer">
                      <Globe className="size-4" />
                      Website
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${location.address} ${location.postcode}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Navigation className="size-4" />
                      Map
                    </a>
                  </Button>
                  {!myApp && (
                    <Button
                      size="sm"
                      className="ml-auto"
                      disabled={!canApply}
                      onClick={() => {
                        apply(shift.id, currentLocumId, "");
                        toast.success("Applied");
                      }}
                    >
                      <Send className="size-4" />
                      Apply
                    </Button>
                  )}
                </>
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function MapPanel({
  practices,
}: {
  practices: Array<ReturnType<typeof useStore.getState>["practices"][number] | undefined>;
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 font-medium">
        <MapPin className="size-4 text-muted-foreground" />
        Map
      </div>
      <div className="relative h-56 overflow-hidden rounded-md border bg-[linear-gradient(135deg,#edf7f1_0%,#f8faf8_45%,#eef2f0_100%)]">
        <div className="absolute left-0 top-1/3 h-px w-full bg-emerald-900/10" />
        <div className="absolute left-1/4 top-0 h-full w-px bg-emerald-900/10" />
        <div className="absolute left-2/3 top-0 h-full w-px bg-emerald-900/10" />
        {practices.map((practice, index) => {
          if (!practice) return null;
          return (
            <a
              key={practice.id}
              href={`/book/${practice.shareSlug}`}
              className={cn(
                "absolute grid size-8 place-items-center rounded-full border border-primary bg-primary text-primary-foreground shadow-sm",
                pointClass[index % pointClass.length],
              )}
              title={practice.tradingName}
            >
              <MapPin className="size-4" />
            </a>
          );
        })}
      </div>
    </section>
  );
}

function CalendarStrip({
  dates,
  selectedDate,
  onSelect,
}: {
  dates: Set<string>;
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const days = Array.from(dates).sort().slice(0, 12);
  return (
    <section className="mt-4 rounded-lg border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-medium">Calendar</div>
        {selectedDate && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onSelect(selectedDate)}
          >
            Clear
          </button>
        )}
      </div>
      {days.length === 0 ? (
        <div className="text-sm text-muted-foreground">No dates.</div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((date) => (
            <button
              key={date}
              onClick={() => onSelect(date)}
              className={cn(
                "min-w-24 rounded-md border px-3 py-2 text-left text-sm",
                selectedDate === date
                  ? "border-primary bg-primary/10"
                  : "bg-background hover:bg-accent",
              )}
            >
              <div className="font-medium">{date.slice(-2)}</div>
              <div className="text-xs text-muted-foreground">{fmtDate(date)}</div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
