import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useStore, calcShiftValue, type ShiftStatus } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DateBlock, RoleChip, StatusChip, fmtGBP, fmtDate } from "@/components/Bits";
import { useMemo, useState } from "react";
import { ApplicationsModal } from "@/components/ApplicationsModal";
import { MessageCircle, Mail, MapPin, Users, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/practice/shifts")({
  head: () => ({ meta: [{ title: "Shifts — Every Tail Locums" }] }),
  component: ShiftsPage,
});

function ShiftsPage() {
  const { shifts, applications, locums, practices, currentPracticeId, cancelShift } = useStore();
  const [openShiftId, setOpenShiftId] = useState<string | null>(null);
  const my = shifts.filter((s) => s.practiceId === currentPracticeId);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Shifts" description="Manage all posted shifts in one place." />
      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="booked">Booked</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="live" className="space-y-3">
          <ShiftList
            shifts={my.filter((s) => s.status === "Open" || s.status === "New applicants")}
            onOpen={setOpenShiftId} cancel={(id) => { if (confirm("Cancel this shift? Applicants will see it as cancelled.")) { cancelShift(id); toast("Shift cancelled"); } }}
            applications={applications} locums={locums} practices={practices} />
        </TabsContent>
        <TabsContent value="booked" className="space-y-3">
          <ShiftList shifts={my.filter((s) => s.status === "Booked")} onOpen={setOpenShiftId} applications={applications} locums={locums} practices={practices} />
        </TabsContent>
        <TabsContent value="past" className="space-y-3">
          <ShiftList shifts={my.filter((s) => s.status === "Completed" || s.status === "Cancelled")} onOpen={setOpenShiftId} applications={applications} locums={locums} practices={practices} />
        </TabsContent>
        <TabsContent value="calendar">
          <CalendarView shifts={my} onOpen={setOpenShiftId} />
        </TabsContent>
      </Tabs>
      {openShiftId && <ApplicationsModal shiftId={openShiftId} onClose={() => setOpenShiftId(null)} />}
    </div>
  );
}

function ShiftList({
  shifts, onOpen, cancel, applications, locums, practices,
}: {
  shifts: ReturnType<typeof useStore.getState>["shifts"];
  onOpen: (id: string) => void;
  cancel?: (id: string) => void;
  applications: ReturnType<typeof useStore.getState>["applications"];
  locums: ReturnType<typeof useStore.getState>["locums"];
  practices: ReturnType<typeof useStore.getState>["practices"];
}) {
  if (shifts.length === 0) return <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">No shifts here.</div>;
  return (
    <div className="space-y-3">
      {shifts.sort((a, b) => a.date.localeCompare(b.date)).map((s) => {
        const apps = applications.filter((a) => a.shiftId === s.id);
        const newCount = apps.filter((a) => a.status === "Applied").length;
        const booked = apps.find((a) => a.status === "Booked");
        const bookedLocum = booked && locums.find((l) => l.id === booked.locumId);
        const practice = practices.find((p) => p.id === s.practiceId)!;
        const loc = practice.locations.find((l) => l.id === s.locationId)!;
        const status: ShiftStatus = newCount > 0 && s.status === "Open" ? "New applicants" : s.status;
        return (
          <div key={s.id} className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <DateBlock date={s.date} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <RoleChip role={s.role} />
                <StatusChip status={status} />
                {s.positionsNeeded > 1 && <span className="text-xs inline-flex items-center gap-1 text-muted-foreground"><Users className="size-3" />{s.positionsNeeded} positions</span>}
                {newCount > 0 && <span className="text-xs text-primary font-medium">{newCount} applicant{newCount > 1 ? "s" : ""}</span>}
              </div>
              <div className="text-sm mt-1">{s.start}–{s.end} · lunch {s.lunchMinutes}m {s.lunchPaid ? "(paid)" : ""}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="size-3" /> {loc.name}, {loc.postcode}
              </div>
              {s.notes && <div className="text-xs text-muted-foreground mt-1 italic">"{s.notes}"</div>}
            </div>
            <div className="text-right text-sm">
              <div className="font-semibold">{fmtGBP(calcShiftValue(s))}</div>
              <div className="text-xs text-muted-foreground">{fmtGBP(s.hourlyRate)}/hr</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(s.status === "Open" || s.status === "New applicants") && (
                <>
                  <Button size="sm" onClick={() => onOpen(s.id)}>Applications</Button>
                  {cancel && <Button size="sm" variant="ghost" onClick={() => cancel(s.id)}><X className="size-4" /></Button>}
                </>
              )}
              {s.status === "Booked" && bookedLocum && (
                <>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`https://wa.me/${bookedLocum.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /></a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${bookedLocum.email}`}><Mail className="size-4" /></a>
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarView({ shifts, onOpen }: { shifts: ReturnType<typeof useStore.getState>["shifts"]; onOpen: (id: string) => void }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(new Date().toISOString().slice(0, 10));
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startWeekday = (monthStart.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = useMemo(() => {
    const arr: (string | null)[] = Array(startWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor, startWeekday, daysInMonth]);
  const dayShifts = (date: string) => shifts.filter((s) => s.date === date);
  const sel = dayShifts(selected);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <Button size="sm" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</Button>
        <div className="font-semibold">{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
        <Button size="sm" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] uppercase text-muted-foreground mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="text-center">{d}</div>)}
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
              className={`aspect-square rounded-md border text-left p-1.5 hover:bg-accent transition-colors ${isSel ? "border-primary bg-primary/5" : ""}`}
            >
              <div className="text-xs font-medium">{Number(date.split("-")[2])}</div>
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {ds.slice(0, 3).map((s) => (
                  <span key={s.id} className="size-1.5 rounded-full bg-primary" />
                ))}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-5 border-t pt-4">
        <div className="font-semibold mb-2">{fmtDate(selected)} — {sel.length} shift{sel.length !== 1 ? "s" : ""}</div>
        {sel.length === 0 && <p className="text-sm text-muted-foreground">No shifts on this date.</p>}
        <div className="space-y-2">
          {sel.map((s) => (
            <button key={s.id} onClick={() => onOpen(s.id)} className="w-full rounded-md border p-3 flex items-center gap-3 text-left hover:bg-accent transition-colors">
              <RoleChip role={s.role} />
              <div className="text-sm flex-1">{s.start}–{s.end}</div>
              <StatusChip status={s.status} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
