import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useStore, calcShiftValue, type Role } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateBlock, RoleChip, fmtGBP } from "@/components/Bits";
import { Globe, MapPin, FileText, Send, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/locum/find")({
  head: () => ({ meta: [{ title: "Find Shifts — Every Tail Locums" }] }),
  component: FindShifts,
});

function FindShifts() {
  const { shifts, practices, applications, currentLocumId, locums, apply } = useStore();
  const me = locums.find((l) => l.id === currentLocumId)!;
  const [role, setRole] = useState<Role | "All">("All");
  const [postcode, setPostcode] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [minRate, setMinRate] = useState(0);

  const today = new Date().toISOString().slice(0, 10);
  const filtered = shifts.filter((s) => {
    if (s.status !== "Open" && s.status !== "New applicants") return false;
    if (s.date < today) return false;
    if (role !== "All" && s.role !== role) return false;
    if (dateFrom && s.date < dateFrom) return false;
    if (minRate && s.hourlyRate < minRate) return false;
    if (postcode) {
      const p = practices.find((x) => x.id === s.practiceId);
      const loc = p?.locations.find((l) => l.id === s.locationId);
      if (!loc?.postcode.toLowerCase().includes(postcode.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Find shifts" description="Search by date, role, and minimum hourly rate." />

      <div className="rounded-lg border bg-card p-4 grid sm:grid-cols-4 gap-3 mb-5">
        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role | "All")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["All", "Vet", "Nurse", "Reception"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>City or postcode</Label><Input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="e.g. BS1" /></div>
        <div><Label>Date from</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
        <div><Label>Min hourly rate (£)</Label><Input type="number" value={minRate || ""} onChange={(e) => setMinRate(Number(e.target.value))} /></div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">No shifts match these filters.</div>
        )}
        {filtered.map((s) => {
          const practice = practices.find((p) => p.id === s.practiceId)!;
          const loc = practice.locations.find((l) => l.id === s.locationId)!;
          const myApp = applications.find((a) => a.shiftId === s.id && a.locumId === currentLocumId);
          const cvOk = me.cvAttached;
          const rcvsOk = s.role === "Reception" || !!me.rcvs;
          const canApply = cvOk && rcvsOk && !myApp;
          return (
            <div key={s.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <DateBlock date={s.date} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <RoleChip role={s.role} />
                    <span className="text-sm font-semibold">{practice.tradingName}</span>
                    {s.positionsNeeded > 1 && <span className="text-xs inline-flex items-center gap-1 text-muted-foreground"><Users className="size-3" />{s.positionsNeeded} positions</span>}
                  </div>
                  <div className="text-sm mt-1">{s.start}–{s.end} · lunch {s.lunchMinutes}m {s.lunchPaid ? "(paid)" : ""}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3" /> {loc.name}, {loc.postcode} · {s.area}
                  </div>
                  {s.notes && <div className="text-xs text-muted-foreground italic mt-1">"{s.notes}"</div>}
                </div>
                <div className="text-right">
                  <div className="font-semibold">{fmtGBP(s.hourlyRate)}/hr</div>
                  <div className="text-xs text-muted-foreground">Total {fmtGBP(calcShiftValue(s))}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
                <Button size="sm" variant="outline" asChild><a href={practice.website} target="_blank" rel="noreferrer"><Globe className="size-4" /> Website</a></Button>
                <Button size="sm" variant="outline" asChild><a href={`https://maps.google.com/?q=${encodeURIComponent(loc.address + " " + loc.postcode)}`} target="_blank" rel="noreferrer"><MapPin className="size-4" /> Map</a></Button>
                {myApp ? (
                  <span className="ml-auto text-sm text-primary font-medium">Status: {myApp.status}</span>
                ) : (
                  <div className="ml-auto flex items-center gap-3">
                    {!cvOk && <span className="text-xs text-destructive">CV missing</span>}
                    {!rcvsOk && <span className="text-xs text-destructive">RCVS number missing</span>}
                    <Button size="sm" disabled={!canApply} onClick={() => { apply(s.id, currentLocumId, ""); toast.success("Applied — CV and contact shared"); }}>
                      <Send className="size-4" /> Apply and share CV
                    </Button>
                  </div>
                )}
              </div>
              {!myApp && <p className="text-[11px] text-muted-foreground mt-2">Applying shares your CV, WhatsApp/email, and profile with this practice.</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
