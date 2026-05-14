import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore, calcShiftValue, type Role } from "@/lib/store";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DateBlock, RoleChip, fmtGBP } from "@/components/Bits";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/practice/post")({
  head: () => ({ meta: [{ title: "Post Shift - Every Tail Locums" }] }),
  component: PostShift,
});

interface DateRow {
  date: string;
  start: string;
  end: string;
  lunchMinutes: number;
  lunchPaid: boolean;
}

function PostShift() {
  const { practices, currentPracticeId, addShift } = useStore();
  const nav = useNavigate();
  const [practiceId, setPracticeId] = useState(currentPracticeId);
  const practice = practices.find((p) => p.id === practiceId)!;
  const [locationId, setLocationId] = useState(practice.locations[0].id);
  const [role, setRole] = useState<Role>("Vet");
  const [positions, setPositions] = useState(1);
  const [rate, setRate] = useState(60);
  const [area, setArea] = useState("Small animals");
  const [notes, setNotes] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState<DateRow[]>([
    { date: today, start: "09:00", end: "18:00", lunchMinutes: 30, lunchPaid: false },
  ]);
  const selectedLocation =
    practice.locations.find((l) => l.id === locationId) ?? practice.locations[0];

  const updateRow = (i: number, patch: Partial<DateRow>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const previews = rows.map((r) => ({
    ...r,
    role,
    hourlyRate: rate,
    positionsNeeded: positions,
    total: calcShiftValue({ ...r, hourlyRate: rate, positionsNeeded: positions }),
  }));

  const publish = () => {
    if (rate <= 0 || positions < 1) return toast.error("Check rate and positions.");
    rows.forEach((r) => {
      if (r.start >= r.end) return;
      addShift({
        practiceId,
        locationId,
        role,
        date: r.date,
        start: r.start,
        end: r.end,
        lunchMinutes: r.lunchMinutes,
        lunchPaid: r.lunchPaid,
        hourlyRate: rate,
        positionsNeeded: positions,
        area,
        notes,
      });
    });
    toast.success(`Published ${rows.length} shift${rows.length > 1 ? "s" : ""}`);
    nav({ to: "/practice/shifts" });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Post shift" description="Form on the left. Live preview on the right." />
      <div className="grid lg:grid-cols-[1fr_22rem] gap-6">
        <div className="space-y-5">
          <Section title="Role">
            <div className="grid grid-cols-3 gap-2">
              {(["Vet", "Nurse", "Reception"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    role === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:bg-accent"
                  }`}
                >
                  {r === "Reception" ? "VCA" : r}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Practice">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Practice</Label>
                <Select
                  value={practiceId}
                  onValueChange={(v) => {
                    setPracticeId(v);
                    setLocationId(practices.find((p) => p.id === v)!.locations[0].id);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {practices.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.tradingName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <div className="min-h-10 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  {selectedLocation.name} - {selectedLocation.postcode}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Dates & times">
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 items-end rounded-md border p-3 bg-card"
                >
                  <div className="col-span-12 sm:col-span-3">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={r.date}
                      onChange={(e) => updateRow(i, { date: e.target.value })}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <Label>Start</Label>
                    <Input
                      type="time"
                      value={r.start}
                      onChange={(e) => updateRow(i, { start: e.target.value })}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <Label>End</Label>
                    <Input
                      type="time"
                      value={r.end}
                      onChange={(e) => updateRow(i, { end: e.target.value })}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <Label>Lunch (min)</Label>
                    <Input
                      type="number"
                      value={r.lunchMinutes}
                      onChange={(e) => updateRow(i, { lunchMinutes: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2 flex items-center gap-2 pb-2">
                    <Checkbox
                      id={`lp-${i}`}
                      checked={r.lunchPaid}
                      onCheckedChange={(v) => updateRow(i, { lunchPaid: !!v })}
                    />
                    <label htmlFor={`lp-${i}`} className="text-xs">
                      Lunch paid
                    </label>
                  </div>
                  <div className="col-span-12 sm:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={rows.length === 1}
                      onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRows([...rows, { ...rows[rows.length - 1], date: today }])}
              >
                <Plus className="size-4" /> Add another date
              </Button>
            </div>
          </Section>

          <Section title="Pay & details">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>Hourly rate (GBP)</Label>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Positions needed</Label>
                <Input
                  type="number"
                  min={1}
                  value={positions}
                  onChange={(e) => setPositions(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Area of interest</Label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Small animals",
                      "Nurse clinics",
                      "Surgery",
                      "Front desk",
                      "Out-of-hours",
                    ].map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                placeholder="No sole charge. Consults only."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </Section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6 self-start">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Preview
          </div>
          {previews.map((r, i) => (
            <div key={i} className="rounded-lg border bg-card p-3 flex gap-3">
              <DateBlock date={r.date} />
              <div className="flex-1 min-w-0 text-sm">
                <div className="flex items-center gap-2">
                  <RoleChip role={role} />
                </div>
                <div className="mt-1">
                  {r.start}-{r.end} - lunch {r.lunchMinutes}m {r.lunchPaid ? "(paid)" : ""}
                </div>
                <div className="text-muted-foreground text-xs">{selectedLocation.name}</div>
                <div className="text-xs mt-1">
                  {positions} pos - {fmtGBP(rate)}/hr
                </div>
                <div className="text-xs font-semibold mt-1">Total: {fmtGBP(r.total)}</div>
              </div>
            </div>
          ))}
          <Button className="w-full" size="lg" onClick={publish}>
            Publish shift
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}
