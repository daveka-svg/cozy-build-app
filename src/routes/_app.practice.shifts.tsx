import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useStore, calcShiftValue, type Role, type ShiftStatus } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateBlock, RoleChip, StatusChip, fmtGBP, fmtDate } from "@/components/Bits";
import { useMemo, useState } from "react";
import { ApplicationsModal } from "@/components/ApplicationsModal";
import { LocumProfileModal } from "@/components/LocumProfileModal";
import { LocumIdentity } from "@/components/LocumIdentity";
import { MessageCircle, Mail, MapPin, Users, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/practice/shifts")({
  head: () => ({ meta: [{ title: "Shifts - Every Tail Locums" }] }),
  component: ShiftsPage,
});

const roles: (Role | "All")[] = ["All", "Vet", "Nurse", "Reception"];
const roleNames: Record<Role | "All", string> = {
  All: "All roles",
  Vet: "Vet",
  Nurse: "Nurse",
  Reception: "VCA",
};

function ShiftsPage() {
  const { shifts, applications, locums, practices, currentPracticeId, cancelShift } = useStore();
  const [openShiftId, setOpenShiftId] = useState<string | null>(null);
  const [profileLocumId, setProfileLocumId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<Role | "All">("All");
  const my = shifts.filter(
    (s) => s.practiceId === currentPracticeId && (roleFilter === "All" || s.role === roleFilter),
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Shifts" description="Manage all posted shifts in one place." />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {my.length} shift{my.length === 1 ? "" : "s"} shown
        </div>
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as Role | "All")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {roleNames[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">Open</TabsTrigger>
          <TabsTrigger value="booked">Booked</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="live" className="space-y-3">
          <ShiftList
            shifts={my.filter((s) => s.status === "Open" || s.status === "New applicants")}
            onOpen={setOpenShiftId}
            onProfile={setProfileLocumId}
            cancel={(id) => {
              if (confirm("Cancel this shift? Applicants will see it as cancelled.")) {
                cancelShift(id);
                toast("Shift cancelled");
              }
            }}
            applications={applications}
            locums={locums}
            practices={practices}
          />
        </TabsContent>
        <TabsContent value="booked" className="space-y-3">
          <ShiftList
            shifts={my.filter((s) => s.status === "Booked")}
            onOpen={setOpenShiftId}
            onProfile={setProfileLocumId}
            applications={applications}
            locums={locums}
            practices={practices}
          />
        </TabsContent>
        <TabsContent value="past" className="space-y-3">
          <ShiftList
            shifts={my.filter((s) => s.status === "Completed" || s.status === "Cancelled")}
            onOpen={setOpenShiftId}
            onProfile={setProfileLocumId}
            applications={applications}
            locums={locums}
            practices={practices}
          />
        </TabsContent>
        <TabsContent value="calendar">
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
  cancel,
  applications,
  locums,
  practices,
}: {
  shifts: ReturnType<typeof useStore.getState>["shifts"];
  onOpen: (id: string) => void;
  onProfile: (id: string) => void;
  cancel?: (id: string) => void;
  applications: ReturnType<typeof useStore.getState>["applications"];
  locums: ReturnType<typeof useStore.getState>["locums"];
  practices: ReturnType<typeof useStore.getState>["practices"];
}) {
  if (shifts.length === 0)
    return (
      <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
        No shifts here.
      </div>
    );
  return (
    <div className="space-y-3">
      {[...shifts]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => {
          const apps = applications.filter((a) => a.shiftId === s.id);
          const newCount = apps.filter((a) => a.status === "Applied").length;
          const booked = apps.find((a) => a.status === "Booked");
          const bookedLocum = booked && locums.find((l) => l.id === booked.locumId);
          const practice = practices.find((p) => p.id === s.practiceId)!;
          const loc = practice.locations.find((l) => l.id === s.locationId)!;
          const status: ShiftStatus =
            newCount > 0 && s.status === "Open" ? "New applicants" : s.status;
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(s.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onOpen(s.id);
              }}
              className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center">
                <DateBlock date={s.date} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <RoleChip role={s.role} />
                    <StatusChip status={status} />
                    {s.positionsNeeded > 1 && (
                      <span className="text-xs inline-flex items-center gap-1 text-muted-foreground">
                        <Users className="size-3" />
                        {s.positionsNeeded} positions
                      </span>
                    )}
                    {newCount > 0 && (
                      <span className="text-xs text-primary font-medium">
                        {newCount} applicant{newCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="text-sm mt-1">
                    {s.start}-{s.end} - lunch {s.lunchMinutes}m {s.lunchPaid ? "(paid)" : ""}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3" /> {loc.name}, {loc.postcode}
                  </div>
                  {bookedLocum && (
                    <div className="mt-2" onClick={(event) => event.stopPropagation()}>
                      <LocumIdentity
                        locum={bookedLocum}
                        onProfile={onProfile}
                        compact
                        showRole={false}
                      />
                    </div>
                  )}
                  {s.notes && (
                    <div className="text-xs text-muted-foreground mt-1 italic">"{s.notes}"</div>
                  )}
                </div>
                <div className="text-left text-sm sm:text-right">
                  <div className="font-semibold">{fmtGBP(calcShiftValue(s))}</div>
                  <div className="text-xs text-muted-foreground">{fmtGBP(s.hourlyRate)}/hr</div>
                </div>
                <div
                  className="flex flex-wrap gap-2 sm:justify-end"
                  onClick={(event) => event.stopPropagation()}
                >
                  {(s.status === "Open" || s.status === "New applicants") && (
                    <>
                      <Button size="sm" onClick={() => onOpen(s.id)}>
                        Review
                      </Button>
                      {cancel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancel(s.id)}
                          aria-label="Cancel shift"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {s.status === "Booked" && bookedLocum && (
                    <>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`https://wa.me/${bookedLocum.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={`mailto:${bookedLocum.email}`}>
                          <Mail className="size-4" />
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

const roleLineStyle: Record<Role, string> = {
  Vet: "bg-sky-500",
  Nurse: "bg-emerald-500",
  Reception: "bg-amber-500",
};

function CalendarView({
  shifts,
  onOpen,
}: {
  shifts: ReturnType<typeof useStore.getState>["shifts"];
  onOpen: (id: string) => void;
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(new Date().toISOString().slice(0, 10));
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = useMemo(() => {
    const arr: (string | null)[] = Array(startWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      );
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor, startWeekday, daysInMonth]);
  const dayShifts = (date: string) => shifts.filter((s) => s.date === date);
  const sel = dayShifts(selected);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          Prev
        </Button>
        <div className="font-semibold text-center">
          {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          Next
        </Button>
      </div>
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(["Vet", "Nurse", "Reception"] as Role[]).map((role) => (
          <span key={role} className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-6 rounded-full ${roleLineStyle[role]}`} />
            {roleNames[role]}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] uppercase text-muted-foreground mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const ds = dayShifts(date);
          const isSel = date === selected;
          return (
            <button
              key={i}
              onClick={() => setSelected(date)}
              className={`min-h-20 rounded-md border p-1.5 text-left hover:bg-accent transition-colors ${isSel ? "border-primary bg-primary/5" : ""}`}
            >
              <div className="text-xs font-medium">{Number(date.split("-")[2])}</div>
              <div className="mt-2 space-y-1">
                {ds.slice(0, 3).map((s) => (
                  <span
                    key={s.id}
                    className={`block h-1.5 rounded-full ${roleLineStyle[s.role]}`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-5 border-t pt-4">
        <div className="font-semibold mb-2">
          {fmtDate(selected)} - {sel.length} shift{sel.length !== 1 ? "s" : ""}
        </div>
        {sel.length === 0 && (
          <p className="text-sm text-muted-foreground">No shifts on this date.</p>
        )}
        <div className="space-y-2">
          {sel.map((s) => (
            <button
              key={s.id}
              onClick={() => onOpen(s.id)}
              className="w-full rounded-md border p-3 flex items-center gap-3 text-left hover:bg-accent transition-colors"
            >
              <RoleChip role={s.role} />
              <div className="text-sm flex-1">
                {s.start}-{s.end}
              </div>
              <StatusChip status={s.status} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
