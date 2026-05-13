import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { DateBlock, RoleChip, StatusChip, fmtDate } from "@/components/Bits";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, FileText, Plus } from "lucide-react";
import { useState } from "react";
import { ApplicationsModal } from "@/components/ApplicationsModal";

export const Route = createFileRoute("/_app/practice/")({
  head: () => ({ meta: [{ title: "Practice Dashboard — Every Tail Locums" }] }),
  component: PracticeDashboard,
});

function PracticeDashboard() {
  const { shifts, applications, locums, currentPracticeId, practices } = useStore();
  const [openShiftId, setOpenShiftId] = useState<string | null>(null);
  const practice = practices.find((p) => p.id === currentPracticeId)!;
  const myShifts = shifts.filter((s) => s.practiceId === currentPracticeId);

  const newApps = applications
    .filter((a) => a.status === "Applied" && myShifts.some((s) => s.id === a.shiftId))
    .map((a) => ({ a, s: myShifts.find((s) => s.id === a.shiftId)!, l: locums.find((l) => l.id === a.locumId)! }))
    .sort((x, y) => x.s.date.localeCompare(y.s.date));

  const upcoming = myShifts
    .filter((s) => s.status === "Booked" && s.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const booked = applications.find((a) => a.shiftId === s.id && a.status === "Booked");
      return { s, l: booked ? locums.find((l) => l.id === booked.locumId) : undefined };
    });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title={`Hi, ${practice.tradingName}`}
        description="Here's what needs you today."
        actions={
          <Button asChild>
            <Link to="/practice/post"><Plus className="size-4" /> Post shift</Link>
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-xl border bg-card">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Next applications</h2>
            <span className="text-xs text-muted-foreground">{newApps.length} waiting</span>
          </div>
          <div className="divide-y">
            {newApps.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No new applications.</p>
                <Button variant="outline" asChild><Link to="/practice/post">Post shift</Link></Button>
              </div>
            )}
            {newApps.map(({ a, s, l }) => (
              <div key={a.id} className="p-4 flex items-center gap-4">
                <DateBlock date={s.date} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <RoleChip role={s.role} />
                    <StatusChip status="New applicants" />
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-medium">{l.displayName}</span>
                    <span className="text-muted-foreground"> · ★ {l.rating} · {l.completedShifts} shifts</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <FileText className="size-3" /> CV attached
                  </div>
                </div>
                <Button size="sm" onClick={() => setOpenShiftId(s.id)}>Review</Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Upcoming booked shifts</h2>
            <span className="text-xs text-muted-foreground">{upcoming.length}</span>
          </div>
          <div className="divide-y">
            {upcoming.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No booked shifts yet.</div>
            )}
            {upcoming.map(({ s, l }) => {
              const loc = practice.locations.find((x) => x.id === s.locationId);
              return (
                <div key={s.id} className="p-4 flex items-center gap-4">
                  <DateBlock date={s.date} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><RoleChip role={s.role} /></div>
                    <div className="text-sm mt-1">
                      <span className="font-medium">{l?.displayName ?? "—"}</span>
                      <span className="text-muted-foreground"> · {s.start}–{s.end} · {loc?.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{fmtDate(s.date)}</div>
                  </div>
                  {l && (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${l.displayName}, looking forward to your ${s.role} shift on ${fmtDate(s.date)}.`)}`} target="_blank" rel="noreferrer">
                          <MessageCircle className="size-4" />
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={`mailto:${l.email}?subject=${encodeURIComponent(`${s.role} shift on ${fmtDate(s.date)}`)}`}>
                          <Mail className="size-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {openShiftId && (
        <ApplicationsModal shiftId={openShiftId} onClose={() => setOpenShiftId(null)} />
      )}
    </div>
  );
}
