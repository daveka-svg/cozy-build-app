import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useStore, calcShiftValue } from "@/lib/store";
import { DateBlock, RoleChip, StatusChip, fmtGBP } from "@/components/Bits";
import { Button } from "@/components/ui/button";
import { Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/practice/hours")({
  head: () => ({ meta: [{ title: "Hours — Every Tail Locums" }] }),
  component: HoursPage,
});

function HoursPage() {
  const { timesheets, shifts, locums, practices, currentPracticeId, approveTimesheet } = useStore();
  const my = timesheets.filter((t) => {
    const s = shifts.find((x) => x.id === t.shiftId);
    return s && s.practiceId === currentPracticeId;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Hours" description="Approve submitted hours, or query the locum." />
      {my.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
          No submitted timesheets yet. Locums submit hours after a completed shift.
        </div>
      ) : (
        <div className="space-y-3">
          {my.map((t) => {
            const s = shifts.find((x) => x.id === t.shiftId)!;
            const l = locums.find((x) => x.id === t.locumId)!;
            const p = practices.find((x) => x.id === s.practiceId)!;
            const loc = p.locations.find((x) => x.id === s.locationId)!;
            const total = calcShiftValue({ ...s, start: t.actualStart, end: t.actualEnd, lunchMinutes: t.lunchMinutes });
            return (
              <div key={t.id} className="rounded-lg border bg-card p-4 flex items-center gap-4">
                <DateBlock date={s.date} />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><RoleChip role={s.role} /><StatusChip status={t.status} /></div>
                  <div className="text-sm mt-1">{l.displayName} · {loc.name}</div>
                  <div className="text-xs text-muted-foreground">Submitted {t.actualStart}–{t.actualEnd} · lunch {t.lunchMinutes}m</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{fmtGBP(total)}</div>
                </div>
                <div className="flex gap-2">
                  {t.status === "Submitted" && (
                    <Button size="sm" onClick={() => { approveTimesheet(t.id); toast.success("Hours approved"); }}>
                      <Check className="size-4" /> Approve
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <a href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="size-4" /> Query
                    </a>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
