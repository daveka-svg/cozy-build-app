import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Pencil, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ApplicationsModal } from "@/components/ApplicationsModal";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, TagMultiSelect, fmtDate, fmtGBP, roleLabel } from "@/components/Bits";
import { LocumIdentity } from "@/components/LocumIdentity";
import { LocumProfileModal } from "@/components/LocumProfileModal";
import { MonthCalendar, ShiftCard, type CalendarDaySummary } from "@/components/PlacementUI";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { calcShiftValue, type Role, type Shift, useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/practice/shifts")({
  head: () => ({ meta: [{ title: "Shifts - Every Tail Locums" }] }),
  component: ShiftsPage,
});

const roles: Role[] = ["Vet", "Nurse", "Reception"];

function ShiftsPage() {
  const { shifts, applications, locums, currentPracticeId, cancelShift } = useStore();
  const [openShiftId, setOpenShiftId] = useState<string | null>(null);
  const [editShiftId, setEditShiftId] = useState<string | null>(null);
  const [profileLocumId, setProfileLocumId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<Role[]>([]);
  const my = shifts.filter(
    (shift) =>
      shift.practiceId === currentPracticeId &&
      (roleFilter.length === 0 || roleFilter.includes(shift.role)),
  );
  const handleCancelShift = (id: string) => {
    if (confirm("Cancel this shift?")) {
      cancelShift(id);
      toast("Shift cancelled");
    }
  };
  const suggestRating = (id: string) => {
    const booked = applications.find(
      (application) => application.shiftId === id && application.status === "Booked",
    );
    const locum = booked && locums.find((item) => item.id === booked.locumId);

    if (!locum) return;
    toast(`Suggested ${locum.rating.toFixed(1)} rating for ${locum.displayName}`);
  };

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
            onCancel={handleCancelShift}
            onEdit={setEditShiftId}
            onRate={suggestRating}
          />
        </TabsContent>

        <TabsContent value="booked" className="mt-4">
          <ShiftList
            shifts={my.filter((shift) => shift.status === "Booked")}
            onOpen={setOpenShiftId}
            onProfile={setProfileLocumId}
            onEdit={setEditShiftId}
            onRate={suggestRating}
          />
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <ShiftList
            shifts={my.filter(
              (shift) => shift.status === "Completed" || shift.status === "Cancelled",
            )}
            onOpen={setOpenShiftId}
            onProfile={setProfileLocumId}
            onEdit={setEditShiftId}
            onRate={suggestRating}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView
            shifts={my}
            onOpen={setOpenShiftId}
            onProfile={setProfileLocumId}
            onCancel={handleCancelShift}
            onEdit={setEditShiftId}
            onRate={suggestRating}
          />
        </TabsContent>
      </Tabs>

      {openShiftId && (
        <ApplicationsModal
          shiftId={openShiftId}
          onClose={() => setOpenShiftId(null)}
          onEditShift={(id) => {
            setOpenShiftId(null);
            setEditShiftId(id);
          }}
        />
      )}
      {editShiftId && (
        <ShiftEditDialog
          key={editShiftId}
          shiftId={editShiftId}
          onClose={() => setEditShiftId(null)}
        />
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
  onEdit,
  onRate,
}: {
  shifts: Shift[];
  onOpen: (id: string) => void;
  onProfile: (id: string) => void;
  onCancel?: (id: string) => void;
  onEdit?: (id: string) => void;
  onRate?: (id: string) => void;
}) {
  const { applications, locums, practices } = useStore();
  const today = new Date().toISOString().slice(0, 10);

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
          const hasRequests = requestCount > 0;
          const status = hasRequests
            ? `Request ${requestCount}`
            : shift.status === "Booked" ||
                shift.status === "Completed" ||
                shift.status === "Cancelled"
              ? shift.status
              : undefined;
          const isEditableFutureShift =
            shift.date >= today && shift.status !== "Completed" && shift.status !== "Cancelled";
          const shouldSuggestRating = shift.status === "Completed" && Boolean(bookedLocum);
          const actionItems = [];

          if (isEditableFutureShift && onEdit) {
            actionItems.push(
              <Button key="edit" size="sm" variant="outline" onClick={() => onEdit(shift.id)}>
                <Pencil className="size-4" />
                Edit
              </Button>,
            );
          }

          if ((shift.status === "Open" || shift.status === "New applicants") && hasRequests) {
            actionItems.push(
              <Button key="review" size="sm" onClick={() => onOpen(shift.id)}>
                Review
              </Button>,
            );
          }

          if ((shift.status === "Open" || shift.status === "New applicants") && onCancel) {
            actionItems.push(
              <Button
                key="cancel"
                size="sm"
                variant="ghost"
                onClick={() => onCancel(shift.id)}
                aria-label="Cancel shift"
              >
                <X className="size-4" />
              </Button>,
            );
          }

          if (shift.status === "Booked" && bookedLocum) {
            actionItems.push(
              <Button key="whatsapp" size="sm" variant="outline" asChild>
                <a
                  href={`https://wa.me/${bookedLocum.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Message ${bookedLocum.displayName}`}
                >
                  <MessageCircle className="size-4" />
                </a>
              </Button>,
              <Button key="email" size="sm" variant="outline" asChild>
                <a
                  href={`mailto:${bookedLocum.email}`}
                  aria-label={`Email ${bookedLocum.displayName}`}
                >
                  <Mail className="size-4" />
                </a>
              </Button>,
            );
          }

          if (shouldSuggestRating && onRate) {
            actionItems.push(
              <Button key="rating" size="sm" variant="outline" onClick={() => onRate(shift.id)}>
                <Star className="size-4 fill-amber-400 text-amber-400" />
                Rate
              </Button>,
            );
          }

          return (
            <ShiftCard
              key={shift.id}
              date={shift.date}
              role={shift.role}
              status={status}
              title={`${shift.start}-${shift.end}`}
              meta={
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {location?.name ?? "Location"}, {location?.postcode ?? ""}
                  </div>
                  {bookedLocum && (
                    <div className="pt-1" onClick={(event) => event.stopPropagation()}>
                      <div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">
                        {shift.status === "Completed" ? "Worked by" : "Booked locum"}
                      </div>
                      <LocumIdentity
                        locum={bookedLocum}
                        compact
                        showRole={false}
                        onProfile={onProfile}
                      />
                    </div>
                  )}
                </div>
              }
              value={
                <>
                  <div>{fmtGBP(calcShiftValue(shift))}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {fmtGBP(shift.hourlyRate)}/hr
                  </div>
                  <div className="mt-1 text-xs font-normal text-muted-foreground">
                    Lunch {shift.lunchMinutes}m {shift.lunchPaid ? "paid" : "unpaid"}
                  </div>
                </>
              }
              actions={actionItems.length > 0 ? actionItems : undefined}
              onClick={() => onOpen(shift.id)}
            />
          );
        })}
    </div>
  );
}

function CalendarView({
  shifts,
  onOpen,
  onProfile,
  onCancel,
  onEdit,
  onRate,
}: {
  shifts: Shift[];
  onOpen: (id: string) => void;
  onProfile: (id: string) => void;
  onCancel?: (id: string) => void;
  onEdit?: (id: string) => void;
  onRate?: (id: string) => void;
}) {
  const { applications } = useStore();
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const requestCounts = useMemo(() => {
    const next = new Map<string, number>();
    applications.forEach((application) => {
      if (application.status !== "Applied" && application.status !== "Requested") return;
      next.set(application.shiftId, (next.get(application.shiftId) ?? 0) + 1);
    });
    return next;
  }, [applications]);
  const dateSummaries = useMemo(() => {
    const next = new Map<string, CalendarDaySummary>();
    shifts.forEach((shift) => {
      const requestCount = requestCounts.get(shift.id) ?? 0;
      const status =
        requestCount > 0
          ? `Request ${requestCount}`
          : shift.status === "New applicants"
            ? "Open"
            : shift.status;
      const summary = next.get(shift.date) ?? { total: 0, items: [] };
      const item = summary.items.find(
        (entry) => entry.role === shift.role && entry.status === status,
      );

      summary.total += 1;
      if (item) {
        item.shiftCount += 1;
        item.requestCount = (item.requestCount ?? 0) + requestCount;
      } else {
        summary.items.push({
          role: shift.role,
          status,
          requestCount,
          shiftCount: 1,
        });
      }

      summary.items.sort(
        (left, right) =>
          calendarItemPriority(right) - calendarItemPriority(left) ||
          left.role.localeCompare(right.role),
      );
      next.set(shift.date, summary);
    });
    return next;
  }, [requestCounts, shifts]);
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
            <Legend label="Open" className="bg-emerald-500" />
            <Legend label="Request" className="bg-amber-500" />
            <Legend label="Booked" className="bg-blue-500" />
            <Legend label="Completed" className="bg-green-700" />
            <Legend label="Vet" className="bg-pink-400" />
            <Legend label="Nurse" className="bg-stone-400" />
            <Legend label="VCA" className="bg-orange-400" />
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
          dateSummaries={dateSummaries}
          onSelectDate={setSelectedDate}
        />
      </div>

      <section className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="font-semibold">{fmtDate(selectedDate)}</div>
          <div className="text-xs text-muted-foreground">
            {selected.length} shift{selected.length === 1 ? "" : "s"}
          </div>
        </div>
        <ShiftList
          shifts={selected}
          onOpen={onOpen}
          onProfile={onProfile}
          onCancel={onCancel}
          onEdit={onEdit}
          onRate={onRate}
        />
      </section>
    </div>
  );
}

function ShiftEditDialog({ shiftId, onClose }: { shiftId: string; onClose: () => void }) {
  const { shifts, practices, updateShift } = useStore();
  const shift = shifts.find((item) => item.id === shiftId);
  const practice = shift && practices.find((item) => item.id === shift.practiceId);
  const [form, setForm] = useState(() => (shift ? toEditForm(shift) : undefined));

  if (!shift || !practice || !form) return null;

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const save = () => {
    if (form.start >= form.end) {
      toast.error("End time must be after start.");
      return;
    }
    if (form.hourlyRate <= 0) {
      toast.error("Check rate.");
      return;
    }
    if (form.positionsNeeded < 1) {
      toast.error("Positions must be at least 1.");
      return;
    }

    updateShift(shift.id, form);
    toast.success("Shift updated");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit shift</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Role</Label>
              <select
                className="h-9 w-full rounded-md border bg-white px-3 text-sm"
                value={form.role}
                onChange={(event) => update("role", event.target.value as Role)}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel[role]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Location</Label>
              <select
                className="h-9 w-full rounded-md border bg-white px-3 text-sm"
                value={form.locationId}
                onChange={(event) => update("locationId", event.target.value)}
              >
                {practice.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} - {location.postcode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => update("date", event.target.value)}
              />
            </div>
            <div>
              <Label>Start</Label>
              <Input
                type="time"
                value={form.start}
                onChange={(event) => update("start", event.target.value)}
              />
            </div>
            <div>
              <Label>End</Label>
              <Input
                type="time"
                value={form.end}
                onChange={(event) => update("end", event.target.value)}
              />
            </div>
            <div>
              <Label>Positions</Label>
              <Input
                type="number"
                min={1}
                value={form.positionsNeeded}
                onChange={(event) => update("positionsNeeded", Number(event.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <Label>Rate</Label>
              <Input
                type="number"
                value={form.hourlyRate}
                onChange={(event) => update("hourlyRate", Number(event.target.value))}
              />
            </div>
            <div>
              <Label>Lunch minutes</Label>
              <Input
                type="number"
                min={0}
                value={form.lunchMinutes}
                onChange={(event) => update("lunchMinutes", Number(event.target.value))}
              />
            </div>
            <label className="flex h-10 items-center gap-2 self-end rounded-md border bg-white px-3 font-medium">
              <Checkbox
                className="size-5 border-primary"
                checked={form.lunchPaid}
                onCheckedChange={(value) => update("lunchPaid", Boolean(value))}
              />
              Paid
            </label>
          </div>

          <div>
            <Label>Area</Label>
            <Input value={form.area} onChange={(event) => update("area", event.target.value)} />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function toEditForm(shift: Shift) {
  return {
    locationId: shift.locationId,
    role: shift.role,
    date: shift.date,
    start: shift.start,
    end: shift.end,
    lunchMinutes: shift.lunchMinutes,
    lunchPaid: shift.lunchPaid,
    hourlyRate: shift.hourlyRate,
    positionsNeeded: shift.positionsNeeded,
    area: shift.area,
    notes: shift.notes,
  };
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

function calendarItemPriority(item: CalendarDaySummary["items"][number]) {
  if (item.requestCount) return 5;
  return priority(item.status);
}
