import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ApplicationsModal } from "@/components/ApplicationsModal";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, StatusChip, TagMultiSelect, fmtDate, fmtGBP } from "@/components/Bits";
import { LocumIdentity } from "@/components/LocumIdentity";
import { LocumProfileModal } from "@/components/LocumProfileModal";
import { MonthCalendar, ShiftCard } from "@/components/PlacementUI";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcShiftValue, type Role, type Shift, useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/practice/shifts")({
  head: () => ({ meta: [{ title: "Shifts - Every Tail Locums" }] }),
  component: ShiftsPage,
});

const roles: Role[] = ["Vet", "Nurse", "Reception"];

function ShiftsPage() {
  const { shifts, applications, locums, practices, currentPracticeId, cancelShift } = useStore();
  const [openShiftId, setOpenShiftId] = useState<string | null>(null);
  const [profileLocumId, setProfileLocumId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<Role[]>([]);
  const my = shifts.filter(
    (shift) =>
      shift.practiceId === currentPracticeId &&
      (roleFilter.length === 0 || roleFilter.includes(shift.role)),
  );

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader title="Shifts" />

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_26rem] lg:items-end">
        <div className="text-sm text-muted-foreground">
          {my.length} shift{my.length === 1 ? "" : "s"}
        </div>
        <TagMultiSelect
          roles={roles}
          selectedRoles={roleFilter}
          onToggle={(role) =>
            setRoleFilter((current) =>
              current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
            )
          }
          onClear={() => setRoleFilter([])}
          emptyLabel="All roles"
        />
      </div>

      <Tabs defaultValue="shift">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="shift">Shift</TabsTrigger>
          <TabsTrigger value="booked">Booked</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="shift" className="mt-4">
          <ShiftList
            shifts={my.filter(
              (shift) => shift.status === "Open" || shift.status === "New applicants",
            )}
            onOpen={setOpenShiftId}
            onProfile={setProfileLocumId}
            onCancel={(id) => {
              if (confirm("Cancel this shift?")) {
                cancelShift(id);
                toast("Shift cancelled");
              }
            }}
          />
        </TabsContent>

        <TabsContent value="booked" className="mt-4">
          <ShiftList
            shifts={my.filter((shift) => shift.status === "Booked")}
            onOpen={setOpenShiftId}
            onProfile={setProfileLocumId}
          />
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <ShiftList
            shifts={my.filter(
              (shift) => shift.status === "Completed" || shift.status === "Cancelled",
            )}
            onOpen={setOpenShiftId}
            onProfile={setProfileLocumId}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView shifts={my} onOpen={setOpenShiftId} />
        </TabsContent>
      </Tabs>

      {openShiftId && (
        <ApplicationsModal shiftId={openShiftId} onClose={() => setOpenShiftId(null)} />
      )}
      {profileLocumId && (
        <LocumProfileModal locumId={profileLocumId} onClose={() => setProfileLocumId(null)} />
      )}
    </div>
  );
}

function ShiftList({
  shifts,
  onOpen,
  onProfile,
  onCancel,
}: {
  shifts: Shift[];
  onOpen: (id: string) => void;
  onProfile: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  const { applications, locums, practices } = useStore();

  if (shifts.length === 0) return <EmptyState>No shifts.</EmptyState>;

  return (
    <div className="space-y-3">
      {[...shifts]
        .sort((left, right) =>
          `${left.date}${left.start}`.localeCompare(`${right.date}${right.start}`),
        )
        .map((shift) => {
          const applicationsForShift = applications.filter(
            (application) => application.shiftId === shift.id,
          );
          const requestCount = applicationsForShift.filter(
            (application) => application.status === "Applied" || application.status === "Requested",
          ).length;
          const booked = applicationsForShift.find(
            (application) => application.status === "Booked",
          );
          const bookedLocum = booked && locums.find((locum) => locum.id === booked.locumId);
          const practice = practices.find((item) => item.id === shift.practiceId);
          const location = practice?.locations.find((item) => item.id === shift.locationId);
          const status = requestCount > 0 && shift.status === "Open" ? "requested" : shift.status;

          return (
            <ShiftCard
              key={shift.id}
              date={shift.date}
              role={shift.role}
              status={status}
              title={`${shift.start}-${shift.end}`}
              meta={
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    {location?.name ?? "Location"}, {location?.postcode ?? ""}
                  </span>
                  <span>
                    Lunch {shift.lunchMinutes}m{shift.lunchPaid ? " paid" : ""}
                  </span>
                  {requestCount > 0 && (
                    <span className="font-medium text-primary">
                      {requestCount} request{requestCount === 1 ? "" : "s"}
                    </span>
                  )}
                  {bookedLocum && (
                    <span onClick={(event) => event.stopPropagation()}>
                      <LocumIdentity
                        locum={bookedLocum}
                        compact
                        showRole={false}
                        onProfile={onProfile}
                      />
                    </span>
                  )}
                </div>
              }
              value={
                <>
                  <div>{fmtGBP(calcShiftValue(shift))}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {fmtGBP(shift.hourlyRate)}/hr
                  </div>
                </>
              }
              actions={
                <>
                  {(shift.status === "Open" || shift.status === "New applicants") && (
                    <>
                      <Button size="sm" onClick={() => onOpen(shift.id)}>
                        Review
                      </Button>
                      {onCancel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCancel(shift.id)}
                          aria-label="Cancel shift"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {shift.status === "Booked" && bookedLocum && (
                    <>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`https://wa.me/${bookedLocum.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Message ${bookedLocum.displayName}`}
                        >
                          <MessageCircle className="size-4" />
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`mailto:${bookedLocum.email}`}
                          aria-label={`Email ${bookedLocum.displayName}`}
                        >
                          <Mail className="size-4" />
                        </a>
                      </Button>
                    </>
                  )}
                </>
              }
              onClick={() => onOpen(shift.id)}
            />
          );
        })}
    </div>
  );
}

function CalendarView({ shifts, onOpen }: { shifts: Shift[]; onOpen: (id: string) => void }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const dateStates = useMemo(() => {
    const next = new Map<string, string>();
    shifts.forEach((shift) => {
      const current = next.get(shift.date);
      if (!current || priority(shift.status) > priority(current)) {
        next.set(shift.date, shift.status === "New applicants" ? "requested" : shift.status);
      }
    });
    return next;
  }, [shifts]);
  const selected = shifts
    .filter((shift) => shift.date === selectedDate)
    .sort((left, right) => left.start.localeCompare(right.start));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            Prev
          </Button>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <Legend label="Shift" className="bg-emerald-500" />
            <Legend label="Request" className="bg-amber-500" />
            <Legend label="Booked" className="bg-blue-500" />
            <Legend label="Completed" className="bg-green-700" />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            Next
          </Button>
        </div>
        <MonthCalendar
          month={cursor}
          selectedDate={selectedDate}
          dateStates={dateStates}
          onSelectDate={setSelectedDate}
        />
      </div>

      <section className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold">{fmtDate(selectedDate)}</div>
          <StatusChip status={`${selected.length} shift${selected.length === 1 ? "" : "s"}`} />
        </div>
        <div className="mt-3 space-y-2">
          {selected.length === 0 && <EmptyState>No shifts.</EmptyState>}
          {selected.map((shift) => (
            <ShiftCard
              key={shift.id}
              date={shift.date}
              role={shift.role}
              status={shift.status === "New applicants" ? "requested" : shift.status}
              title={`${shift.start}-${shift.end}`}
              value={fmtGBP(calcShiftValue(shift))}
              onClick={() => onOpen(shift.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function Legend({ label, className }: { label: string; className: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-6 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function priority(status: string) {
  if (status === "Cancelled") return 5;
  if (status === "Completed") return 4;
  if (status === "Booked") return 3;
  if (status === "New applicants" || status === "requested") return 2;
  return 1;
}
