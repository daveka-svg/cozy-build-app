import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useStore, calcShiftValue } from "@/lib/store";
import { DateBlock, RoleChip, StatusChip, fmtGBP, fmtDate } from "@/components/Bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarPlus, MessageCircle, Mail, Clock, FileText, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/locum/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Every Tail Locums" }] }),
  component: Bookings,
});

function Bookings() {
  const { applications, shifts, practices, currentLocumId, withdraw, markCompleted, submitTimesheet, timesheets, createInvoiceDraft, invoices } = useStore();
  const [tsShiftId, setTsShiftId] = useState<string | null>(null);
  const myApps = applications
    .filter((a) => a.locumId === currentLocumId)
    .map((a) => ({ a, s: shifts.find((x) => x.id === a.shiftId)! }))
    .filter((x) => x.s)
    .sort((a, b) => a.s.date.localeCompare(b.s.date));

  const downloadIcs = (shiftId: string) => {
    const s = shifts.find((x) => x.id === shiftId)!;
    const p = practices.find((x) => x.id === s.practiceId)!;
    const loc = p.locations.find((l) => l.id === s.locationId)!;
    const dt = s.date.replace(/-/g, "");
    const start = dt + "T" + s.start.replace(":", "") + "00";
    const end = dt + "T" + s.end.replace(":", "") + "00";
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${s.id}@everytail\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${s.role} shift — ${p.tradingName}\nLOCATION:${loc.address} ${loc.postcode}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `shift-${s.date}.ics`;
    a.click();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Bookings" description="Confirmed work and timesheets." />
      {myApps.length === 0 && (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">No applications yet.</div>
      )}
      <div className="space-y-3">
        {myApps.map(({ a, s }) => {
          const p = practices.find((x) => x.id === s.practiceId)!;
          const loc = p.locations.find((l) => l.id === s.locationId)!;
          const ts = timesheets.find((t) => t.shiftId === s.id && t.locumId === currentLocumId);
          const inv = invoices.find((i) => i.shiftId === s.id && i.locumId === currentLocumId);
          const isPast = s.date < new Date().toISOString().slice(0, 10);
          return (
            <div key={a.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <DateBlock date={s.date} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <RoleChip role={s.role} />
                    <StatusChip status={a.status} />
                    {ts && <StatusChip status={`Hours ${ts.status.toLowerCase()}`} />}
                    {inv && <StatusChip status={`Invoice ${inv.status.toLowerCase()}`} />}
                  </div>
                  <div className="text-sm mt-1 font-medium">{p.tradingName}</div>
                  <div className="text-xs text-muted-foreground">{s.start}–{s.end} · {loc.name}, {loc.postcode}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{fmtGBP(calcShiftValue(s))}</div>
                  <div className="text-xs text-muted-foreground">{fmtGBP(s.hourlyRate)}/hr</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                {a.status === "Booked" && (
                  <>
                    <Button size="sm" variant="outline" asChild><a href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, I applied for the ${s.role} shift on ${fmtDate(s.date)}.`)}`} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /></a></Button>
                    <Button size="sm" variant="outline" asChild><a href={`mailto:${p.email}?subject=${encodeURIComponent(`${s.role} shift on ${fmtDate(s.date)}`)}`}><Mail className="size-4" /></a></Button>
                    <Button size="sm" variant="outline" onClick={() => downloadIcs(s.id)}><CalendarPlus className="size-4" /> Add to calendar</Button>
                    {isPast && s.status !== "Completed" && (
                      <Button size="sm" variant="ghost" onClick={() => { markCompleted(s.id); toast("Demo: marked completed"); }}>Demo: mark completed</Button>
                    )}
                  </>
                )}
                {a.status === "Applied" && (
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Withdraw this application?")) { withdraw(a.id); toast("Application withdrawn"); } }}>
                    <X className="size-4" /> Withdraw
                  </Button>
                )}
                {s.status === "Completed" && a.status === "Booked" && !ts && (
                  <Button size="sm" onClick={() => setTsShiftId(s.id)}><Clock className="size-4" /> Submit timesheet</Button>
                )}
                {ts?.status === "Approved" && !inv && (
                  <Button size="sm" onClick={() => { createInvoiceDraft(ts.id); toast.success("Invoice draft created"); }}>
                    <FileText className="size-4" /> Create invoice draft
                  </Button>
                )}
                {inv && (
                  <span className="text-xs text-muted-foreground self-center ml-auto">{inv.number} · {fmtGBP(inv.total)}</span>
                )}
                {ts?.status === "Submitted" && <span className="text-xs text-muted-foreground self-center ml-auto"><Check className="size-3 inline" /> Hours submitted, awaiting approval</span>}
              </div>
            </div>
          );
        })}
      </div>

      {tsShiftId && (
        <TimesheetDialog
          shiftId={tsShiftId}
          locumId={currentLocumId}
          onClose={() => setTsShiftId(null)}
          submit={(t) => { submitTimesheet(t); toast.success("Timesheet submitted"); setTsShiftId(null); }}
        />
      )}
    </div>
  );
}

function TimesheetDialog({ shiftId, locumId, onClose, submit }: { shiftId: string; locumId: string; onClose: () => void; submit: (t: { shiftId: string; locumId: string; actualStart: string; actualEnd: string; lunchMinutes: number; expense?: string }) => void }) {
  const s = useStore((st) => st.shifts.find((x) => x.id === shiftId))!;
  const [start, setStart] = useState(s.start);
  const [end, setEnd] = useState(s.end);
  const [lunch, setLunch] = useState(s.lunchMinutes);
  const [expense, setExpense] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Submit hours — {fmtDate(s.date)}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Actual start</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><Label>Actual end</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          <div><Label>Lunch (min)</Label><Input type="number" value={lunch} onChange={(e) => setLunch(Number(e.target.value))} /></div>
          <div className="col-span-2"><Label>Expense note (optional)</Label><Input value={expense} onChange={(e) => setExpense(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => submit({ shiftId, locumId, actualStart: start, actualEnd: end, lunchMinutes: lunch, expense })}>Submit hours</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
