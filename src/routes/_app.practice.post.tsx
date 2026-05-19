import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore, calcShiftValue, type Role } from "@/lib/store";
import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TagMultiSelect, fmtGBP } from "@/components/Bits";
import { PageHeader } from "@/components/AppShell";
import { ShiftCard } from "@/components/PlacementUI";
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
  const positions = 1;
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
    if (rate <= 0) return toast.error("Check rate.");
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
      <PageHeader title="Post" />
      <div className="grid lg:grid-cols-[1fr_22rem] gap-6 text-sm">
        <div className="space-y-5">
          <Section title="Role">
            <TagMultiSelect
              roles={["Vet", "Nurse", "Reception"]}
              selectedRoles={[role]}
              onToggle={(item) => setRole(item)}
            />
          </Section>

          <Section title="Practice">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Practice</Label>
                <select
                  className="h-9 w-full rounded-md border bg-card px-3 text-sm"
                  value={practiceId}
                  onChange={(event) => {
                    setPracticeId(event.target.value);
                    setLocationId(
                      practices.find((p) => p.id === event.target.value)!.locations[0].id,
                    );
                  }}
                >
                  {practices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.tradingName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <div className="min-h-10 w-full rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Location</span>{" "}
                  <span className="font-medium">{selectedLocation.name}</span>{" "}
                  <span className="text-muted-foreground">- {selectedLocation.postcode}</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Dates">
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="rounded-md border bg-card p-3">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 sm:col-span-4">
                      <Label className="text-xs font-medium text-muted-foreground">Date</Label>
                      <Input
                        className="h-9 text-sm"
                        type="date"
                        value={r.date}
                        onChange={(e) => updateRow(i, { date: e.target.value })}
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Label className="text-xs font-medium text-muted-foreground">Start</Label>
                      <Input
                        className="h-9 text-sm"
                        type="time"
                        value={r.start}
                        onChange={(e) => updateRow(i, { start: e.target.value })}
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Label className="text-xs font-medium text-muted-foreground">End</Label>
                      <Input
                        className="h-9 text-sm"
                        type="time"
                        value={r.end}
                        onChange={(e) => updateRow(i, { end: e.target.value })}
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Label className="text-xs font-medium text-muted-foreground">Lunch</Label>
                      <Input
                        className="h-9 text-sm"
                        type="number"
                        value={r.lunchMinutes}
                        onChange={(e) => updateRow(i, { lunchMinutes: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-1 flex items-center gap-2 pb-2">
                      <Checkbox
                        id={`lp-${i}`}
                        className="size-5"
                        checked={r.lunchPaid}
                        onCheckedChange={(v) => updateRow(i, { lunchPaid: !!v })}
                      />
                      <label htmlFor={`lp-${i}`} className="text-xs leading-tight">
                        Paid
                      </label>
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex justify-end pb-1">
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
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRows([...rows, { ...rows[rows.length - 1], date: today }])}
              >
                <Plus className="size-4" /> Add date
              </Button>
            </div>
          </Section>

          <Section title="Pay">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Rate</Label>
                <Input
                  className="h-9 text-sm"
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Area</Label>
                <select
                  className="h-9 w-full rounded-md border bg-card px-3 text-sm"
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                >
                  {["Small animals", "Nurse clinics", "Surgery", "Front desk", "Out-of-hours"].map(
                    (a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
              <Textarea
                className="text-sm"
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
            <ShiftCard
              key={i}
              date={r.date}
              role={role}
              status="Open"
              title={`${r.start}-${r.end}`}
              meta={
                <div className="space-y-1">
                  <div>{selectedLocation.name}</div>
                  <div>
                    Lunch {r.lunchMinutes}m{r.lunchPaid ? " paid" : ""}
                  </div>
                </div>
              }
              value={
                <div>
                  <div>{fmtGBP(r.total)}</div>
                  <div className="text-xs font-normal text-muted-foreground">{fmtGBP(rate)}/hr</div>
                </div>
              }
            />
          ))}
          <Button className="w-full" size="lg" onClick={publish}>
            Publish
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}
