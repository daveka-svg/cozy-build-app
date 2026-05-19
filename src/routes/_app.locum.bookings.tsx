import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import {
  calcShiftValue,
  useStore,
  type Application,
  type Attachment,
  type BookingRequest,
  type Invoice,
  type Practice,
  type Shift,
  type Timesheet,
} from "@/lib/store";
import { DateBlock, MetricTile, RoleChip, StatusChip, fmtGBP, fmtDate } from "@/components/Bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CancellationDialog } from "@/components/CancellationDialog";
import { InvoicePanel } from "@/components/InvoicePanel";
import {
  Ban,
  BriefcaseBusiness,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  FileText,
  Hourglass,
  Mail,
  MessageCircle,
  Send,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/locum/bookings")({
  head: () => ({ meta: [{ title: "My Work - Every Tail Locums" }] }),
  component: Bookings,
});

type PracticeLocation = Practice["locations"][number];

type WorkItem = {
  a: Application;
  s: Shift;
  p: Practice;
  loc: PracticeLocation;
  ts?: Timesheet;
  inv?: Invoice;
};

type RequestItem = {
  request: BookingRequest;
  practice: Practice;
  loc?: PracticeLocation;
  shift?: Shift;
};

type TimesheetForm = {
  shiftId: string;
  locumId: string;
  actualStart: string;
  actualEnd: string;
  lunchMinutes: number;
  expense?: string;
  notes?: string;
  evidenceName?: string;
  evidenceUrl?: string;
};

function calcTimesheetHours(
  timesheet: Pick<Timesheet, "actualStart" | "actualEnd" | "lunchMinutes">,
  shift: Pick<Shift, "lunchPaid">,
) {
  const [startHour, startMinute] = timesheet.actualStart.split(":").map(Number);
  const [endHour, endMinute] = timesheet.actualEnd.split(":").map(Number);
  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (!shift.lunchPaid) minutes -= timesheet.lunchMinutes;
  return Math.max(0, minutes / 60);
}

function calcTimesheetValue(
  timesheet: Pick<Timesheet, "actualStart" | "actualEnd" | "lunchMinutes">,
  shift: Pick<Shift, "hourlyRate" | "lunchPaid">,
) {
  return calcTimesheetHours(timesheet, shift) * shift.hourlyRate;
}

function Bookings() {
  const {
    applications,
    shifts,
    practices,
    currentLocumId,
    withdraw,
    submitTimesheet,
    timesheets,
    createInvoiceDraftFromTimesheet,
    issueInvoice,
    invoices,
    attachments,
    bookingRequests,
    acceptBookingRequest,
    declineBookingRequest,
    cancellations,
    addAttachment,
  } = useStore();
  const [tsShiftId, setTsShiftId] = useState<string | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<WorkItem | null>(null);
  const [declineTarget, setDeclineTarget] = useState<RequestItem | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const todayIso = new Date().toISOString().slice(0, 10);
  const currentMonth = todayIso.slice(0, 7);

  const myApps: WorkItem[] = applications
    .filter((a) => a.locumId === currentLocumId)
    .flatMap((a) => {
      const s = shifts.find((x) => x.id === a.shiftId);
      if (!s) return [];
      const p = practices.find((x) => x.id === s.practiceId);
      const loc = p?.locations.find((l) => l.id === s.locationId);
      if (!p || !loc) return [];
      const ts = timesheets.find((t) => t.shiftId === s.id && t.locumId === currentLocumId);
      const inv = invoices.find((i) => i.shiftId === s.id && i.locumId === currentLocumId);
      return [{ a, s, p, loc, ts, inv }];
    })
    .sort((left, right) => left.s.date.localeCompare(right.s.date));

  const myRequests: RequestItem[] = bookingRequests
    .filter((request) => request.locumId === currentLocumId)
    .flatMap((request) => {
      const practice = practices.find((p) => p.id === request.practiceId);
      if (!practice) return [];
      return [
        {
          request,
          practice,
          loc: practice.locations.find((location) => location.id === request.locationId),
          shift: request.shiftId ? shifts.find((shift) => shift.id === request.shiftId) : undefined,
        },
      ];
    })
    .sort((left, right) => left.request.date.localeCompare(right.request.date));

  const monthTimesheets = timesheets.filter((timesheet) => {
    const shift = shifts.find((s) => s.id === timesheet.shiftId);
    return timesheet.locumId === currentLocumId && shift?.date.startsWith(currentMonth);
  });
  const monthHours = monthTimesheets.reduce((sum, timesheet) => {
    const shift = shifts.find((s) => s.id === timesheet.shiftId);
    return shift ? sum + calcTimesheetHours(timesheet, shift) : sum;
  }, 0);
  const monthEarned = monthTimesheets.reduce((sum, timesheet) => {
    const shift = shifts.find((s) => s.id === timesheet.shiftId);
    return shift && timesheet.status === "Approved"
      ? sum + calcTimesheetValue(timesheet, shift)
      : sum;
  }, 0);

  const upcoming = myApps.filter(
    ({ a, s }) => a.status === "Booked" && s.status !== "Cancelled" && s.date >= todayIso,
  );
  const activeApplications = myApps.filter(({ a }) => a.status === "Applied");
  const history = myApps.filter(
    ({ a, s }) =>
      s.date < todayIso ||
      s.status === "Completed" ||
      a.status === "Withdrawn" ||
      a.status === "Not selected" ||
      a.status === "Cancelled",
  );
  const selectedDayItems = myApps.filter(({ s }) => s.date === selectedDate);

  const downloadIcs = (shiftId: string) => {
    const s = shifts.find((x) => x.id === shiftId);
    if (!s) return;
    const p = practices.find((x) => x.id === s.practiceId);
    const loc = p?.locations.find((l) => l.id === s.locationId);
    if (!p || !loc) return;
    const dt = s.date.replace(/-/g, "");
    const start = `${dt}T${s.start.replace(":", "")}00`;
    const end = `${dt}T${s.end.replace(":", "")}00`;
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${s.id}@everytail\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${s.role} shift - ${p.tradingName}\nLOCATION:${loc.address} ${loc.postcode}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `shift-${s.date}.ics`;
    link.click();
  };

  const submitHours = (form: TimesheetForm) => {
    const { evidenceName, evidenceUrl, ...timesheet } = form;
    submitTimesheet(timesheet);
    const created = useStore
      .getState()
      .timesheets.filter(
        (entry) => entry.shiftId === form.shiftId && entry.locumId === form.locumId,
      )
      .sort((left, right) => (right.submittedAt ?? 0) - (left.submittedAt ?? 0))[0];

    if (created && evidenceName?.trim()) {
      addAttachment({
        ownerType: "timesheet",
        ownerId: created.id,
        name: evidenceName.trim(),
        kind: "Timesheet evidence",
        url: evidenceUrl?.trim() || undefined,
        uploadedByRole: "locum",
        uploadedById: currentLocumId,
      });
    }

    toast.success("Timesheet submitted");
    setTsShiftId(null);
  };

  const createDraft = (timesheetId: string) => {
    const invoice = createInvoiceDraftFromTimesheet(timesheetId);
    if (invoice) {
      toast.success("Invoice draft created from approved hours");
    } else {
      toast.error("Approve the timesheet before creating an invoice");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="My Work" />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricTile
          icon={<BriefcaseBusiness className="size-4" />}
          label="Worked"
          value={String(monthTimesheets.length)}
          detail="This month"
        />
        <MetricTile
          icon={<Clock className="size-4" />}
          label="Hours"
          value={monthHours.toFixed(1)}
          detail="from worked hours"
        />
        <MetricTile
          icon={<WalletCards className="size-4" />}
          label="Earned"
          value={fmtGBP(monthEarned)}
          detail="Approved"
        />
        <MetricTile
          icon={<Hourglass className="size-4" />}
          label="Pending"
          value={String(
            activeApplications.length +
              myRequests.filter((item) => item.request.status === "Sent").length,
          )}
          detail="applications and requests"
        />
      </div>

      <Tabs defaultValue="calendar" className="mt-5">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="applications">Applied</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <MonthPlanner
              monthKey={currentMonth}
              items={myApps}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <section className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 font-medium">
                <CalendarDays className="size-4 text-primary" />
                {fmtDate(selectedDate)}
              </div>
              <div className="mt-3 space-y-3">
                {selectedDayItems.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No applications, bookings, or worked hours on this date.
                  </div>
                ) : (
                  selectedDayItems.map((item) => (
                    <WorkItemCard
                      key={item.a.id}
                      item={item}
                      attachments={attachments}
                      cancellations={cancellations}
                      onDownloadIcs={downloadIcs}
                      onSubmitTimesheet={setTsShiftId}
                      onCreateDraft={createDraft}
                      onIssueInvoice={(invoiceId) => {
                        issueInvoice(invoiceId);
                        toast.success("Invoice issued");
                      }}
                      onWithdraw={setWithdrawTarget}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <WorkList
            empty="No confirmed upcoming bookings."
            items={upcoming}
            attachments={attachments}
            cancellations={cancellations}
            onDownloadIcs={downloadIcs}
            onSubmitTimesheet={setTsShiftId}
            onCreateDraft={createDraft}
            onIssueInvoice={(invoiceId) => {
              issueInvoice(invoiceId);
              toast.success("Invoice issued");
            }}
            onWithdraw={setWithdrawTarget}
          />
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          <WorkList
            empty="No active applications."
            items={activeApplications}
            attachments={attachments}
            cancellations={cancellations}
            onDownloadIcs={downloadIcs}
            onSubmitTimesheet={setTsShiftId}
            onCreateDraft={createDraft}
            onIssueInvoice={(invoiceId) => {
              issueInvoice(invoiceId);
              toast.success("Invoice issued");
            }}
            onWithdraw={setWithdrawTarget}
          />
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <PracticeRequests
            items={myRequests}
            onAccept={(requestId) => {
              acceptBookingRequest(requestId);
              toast.success("Practice request accepted");
            }}
            onDecline={setDeclineTarget}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <WorkList
            empty="No past work or cancelled applications yet."
            items={history}
            attachments={attachments}
            cancellations={cancellations}
            onDownloadIcs={downloadIcs}
            onSubmitTimesheet={setTsShiftId}
            onCreateDraft={createDraft}
            onIssueInvoice={(invoiceId) => {
              issueInvoice(invoiceId);
              toast.success("Invoice issued");
            }}
            onWithdraw={setWithdrawTarget}
          />
        </TabsContent>
      </Tabs>

      {tsShiftId && (
        <TimesheetDialog
          shiftId={tsShiftId}
          locumId={currentLocumId}
          onClose={() => setTsShiftId(null)}
          submit={submitHours}
        />
      )}

      <CancellationDialog
        open={!!withdrawTarget}
        title={
          withdrawTarget?.a.status === "Booked"
            ? "Cancel this booking?"
            : "Withdraw this application?"
        }
        description={
          withdrawTarget
            ? `${withdrawTarget.p.tradingName} will see the reason on their side of the workflow.`
            : undefined
        }
        confirmLabel={withdrawTarget?.a.status === "Booked" ? "Cancel booking" : "Withdraw"}
        destructive
        onOpenChange={(open) => !open && setWithdrawTarget(null)}
        onConfirm={(reason, note) => {
          if (!withdrawTarget) return;
          withdraw(withdrawTarget.a.id, reason, note);
          toast.success("Reason saved");
          setWithdrawTarget(null);
        }}
      />

      <CancellationDialog
        open={!!declineTarget}
        title="Decline practice request?"
        description={
          declineTarget
            ? `${declineTarget.practice.tradingName} will see this reason on the request.`
            : undefined
        }
        confirmLabel="Decline request"
        reasons={["Already booked", "Rate does not work", "Too far away", "Unavailable", "Other"]}
        destructive
        onOpenChange={(open) => !open && setDeclineTarget(null)}
        onConfirm={(reason) => {
          if (!declineTarget) return;
          declineBookingRequest(declineTarget.request.id, reason);
          toast.success("Request declined");
          setDeclineTarget(null);
        }}
      />
    </div>
  );
}

function WorkList({
  empty,
  items,
  attachments,
  cancellations,
  onDownloadIcs,
  onSubmitTimesheet,
  onCreateDraft,
  onIssueInvoice,
  onWithdraw,
}: {
  empty: string;
  items: WorkItem[];
  attachments: Attachment[];
  cancellations: { ownerType: string; ownerId: string; reason: string; note?: string }[];
  onDownloadIcs: (shiftId: string) => void;
  onSubmitTimesheet: (shiftId: string) => void;
  onCreateDraft: (timesheetId: string) => void;
  onIssueInvoice: (invoiceId: string) => void;
  onWithdraw: (item: WorkItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <WorkItemCard
          key={item.a.id}
          item={item}
          attachments={attachments}
          cancellations={cancellations}
          onDownloadIcs={onDownloadIcs}
          onSubmitTimesheet={onSubmitTimesheet}
          onCreateDraft={onCreateDraft}
          onIssueInvoice={onIssueInvoice}
          onWithdraw={onWithdraw}
        />
      ))}
    </div>
  );
}

function WorkItemCard({
  item,
  attachments,
  cancellations,
  onDownloadIcs,
  onSubmitTimesheet,
  onCreateDraft,
  onIssueInvoice,
  onWithdraw,
}: {
  item: WorkItem;
  attachments: Attachment[];
  cancellations: { ownerType: string; ownerId: string; reason: string; note?: string }[];
  onDownloadIcs: (shiftId: string) => void;
  onSubmitTimesheet: (shiftId: string) => void;
  onCreateDraft: (timesheetId: string) => void;
  onIssueInvoice: (invoiceId: string) => void;
  onWithdraw: (item: WorkItem) => void;
}) {
  const { a, s, p, loc, ts, inv } = item;
  const isPast = s.date < new Date().toISOString().slice(0, 10);
  const cancellation = cancellations.find(
    (entry) => entry.ownerType === "application" && entry.ownerId === a.id,
  );
  const evidence = ts
    ? attachments.filter(
        (attachment) => attachment.ownerType === "timesheet" && attachment.ownerId === ts.id,
      )
    : [];

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <DateBlock date={s.date} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <RoleChip role={s.role} />
            <StatusChip status={a.status} />
            <StatusChip status={s.status} />
          </div>
          <div className="mt-1 text-sm font-medium">{p.tradingName}</div>
          <div className="text-xs text-muted-foreground">
            {s.start}-{s.end} at {loc.name}, {loc.postcode}
          </div>
          {cancellation && (
            <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs">
              <span className="font-medium text-destructive">Cancellation reason:</span>{" "}
              {cancellation.reason}
              {cancellation.note ? ` - ${cancellation.note}` : ""}
            </div>
          )}
        </div>
        <div className="text-sm sm:text-right">
          <div className="font-semibold">{fmtGBP(calcShiftValue(s))}</div>
          <div className="text-xs text-muted-foreground">{fmtGBP(s.hourlyRate)}/hr planned</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
        {a.status === "Booked" && (
          <>
            <Button size="sm" variant="outline" asChild>
              <a
                href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hi, I am booked for the ${s.role} shift on ${fmtDate(s.date)}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Message ${p.tradingName} on WhatsApp`}
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a
                href={`mailto:${p.email}?subject=${encodeURIComponent(`${s.role} shift on ${fmtDate(s.date)}`)}`}
                aria-label={`Email ${p.tradingName}`}
              >
                <Mail className="size-4" />
                Email
              </a>
            </Button>
            {s.date >= new Date().toISOString().slice(0, 10) && (
              <>
                <Button size="sm" variant="outline" onClick={() => onDownloadIcs(s.id)}>
                  <CalendarPlus className="size-4" />
                  Calendar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onWithdraw(item)}>
                  <Ban className="size-4" />
                  Cancel
                </Button>
              </>
            )}
            {isPast && ts?.status === "Approved" && !inv && (
              <Button size="sm" onClick={() => onCreateDraft(ts.id)}>
                <FileText className="size-4" />
                Invoice
              </Button>
            )}
          </>
        )}
        {a.status === "Applied" && (
          <Button size="sm" variant="ghost" onClick={() => onWithdraw(item)}>
            <X className="size-4" />
            Withdraw
          </Button>
        )}
        {isPast && a.status === "Booked" && !ts && (
          <Button size="sm" onClick={() => onSubmitTimesheet(s.id)}>
            <Clock className="size-4" />
            Hours
          </Button>
        )}
        {ts?.status === "Submitted" && (
          <span className="self-center text-xs text-muted-foreground">
            <Check className="mr-1 inline size-3" />
            Submitted
          </span>
        )}
      </div>

      {(ts || inv) && (
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.85fr]">
          <InvoicePanel
            compact
            timesheet={ts}
            invoice={inv}
            shift={s}
            practiceName={p.tradingName}
            showActions
            onCreateDraft={ts ? () => onCreateDraft(ts.id) : undefined}
            onIssue={inv ? () => onIssueInvoice(inv.id) : undefined}
          />
          {evidence.length > 0 && <EvidenceList attachments={evidence} empty="No evidence." />}
        </div>
      )}
    </div>
  );
}

function PracticeRequests({
  items,
  onAccept,
  onDecline,
}: {
  items: RequestItem[];
  onAccept: (requestId: string) => void;
  onDecline: (item: RequestItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
        No requests.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.request.id} className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <DateBlock date={item.request.date} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <RoleChip role={item.request.role} />
                <StatusChip status={item.request.status} />
              </div>
              <div className="mt-1 text-sm font-medium">{item.practice.tradingName}</div>
              <div className="text-xs text-muted-foreground">
                {item.request.start}-{item.request.end}
                {item.loc ? ` at ${item.loc.name}, ${item.loc.postcode}` : ""}
              </div>
              {item.request.message && (
                <div className="mt-2 rounded-md border bg-muted/40 p-2 text-xs">
                  {item.request.message}
                </div>
              )}
              {item.request.declineReason && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Declined reason: {item.request.declineReason}
                </div>
              )}
            </div>
            <div className="text-sm sm:text-right">
              <div className="font-semibold">{fmtGBP(item.request.hourlyRate)}/hr</div>
              {item.shift && (
                <div className="text-xs text-muted-foreground">
                  shift value {fmtGBP(calcShiftValue(item.shift))}
                </div>
              )}
            </div>
          </div>
          {item.request.status === "Sent" && (
            <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
              <Button size="sm" onClick={() => onAccept(item.request.id)}>
                <Check className="size-4" />
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDecline(item)}>
                <X className="size-4" />
                Decline
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MonthPlanner({
  monthKey,
  items,
  selectedDate,
  onSelectDate,
}: {
  monthKey: string;
  items: WorkItem[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const days = daysInMonth(monthKey);
  const firstWeekday = new Date(`${monthKey}-01T00:00:00`).getDay();
  const blanks = Array.from({ length: firstWeekday });

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-medium">
          {new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <div className="text-xs text-muted-foreground">Select a day to see work details</div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, index) => (
          <div key={`blank-${index}`} className="min-h-20 rounded-md border border-transparent" />
        ))}
        {days.map((date) => {
          const dayItems = items.filter(({ s }) => s.date === date);
          const booked = dayItems.filter(({ a }) => a.status === "Booked").length;
          const applied = dayItems.filter(({ a }) => a.status === "Applied").length;
          const isSelected = date === selectedDate;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`min-h-20 rounded-md border p-2 text-left transition hover:border-primary/60 ${
                isSelected ? "border-primary bg-primary/5" : "bg-background"
              }`}
              aria-label={`${fmtDate(date)}: ${booked} booked, ${applied} applications`}
            >
              <div className="text-sm font-medium">{Number(date.slice(-2))}</div>
              <div className="mt-2 space-y-1">
                {booked > 0 && (
                  <div className="rounded-sm bg-emerald-100 px-1 py-0.5 text-[10px] font-medium text-emerald-800">
                    booked
                  </div>
                )}
                {applied > 0 && (
                  <div className="rounded-sm bg-primary/10 px-1 py-0.5 text-[10px]">
                    {applied} applied
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EvidenceList({ attachments, empty }: { attachments: Attachment[]; empty: string }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 font-medium">
        <FileText className="size-4 text-primary" />
        Evidence
      </div>
      <div className="mt-3 space-y-2">
        {attachments.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            {empty}
          </div>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{attachment.name}</div>
                <div className="text-xs text-muted-foreground">{attachment.kind}</div>
              </div>
              {attachment.url && (
                <Button size="sm" variant="outline" asChild>
                  <a href={attachment.url} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function TimesheetDialog({
  shiftId,
  locumId,
  onClose,
  submit,
}: {
  shiftId: string;
  locumId: string;
  onClose: () => void;
  submit: (t: TimesheetForm) => void;
}) {
  const s = useStore((st) => st.shifts.find((x) => x.id === shiftId))!;
  const [start, setStart] = useState(s.start);
  const [end, setEnd] = useState(s.end);
  const [lunch, setLunch] = useState(s.lunchMinutes);
  const [expense, setExpense] = useState("");
  const [notes, setNotes] = useState("");
  const [evidenceName, setEvidenceName] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit hours - {fmtDate(s.date)}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Actual start</Label>
            <Input type="time" value={start} onChange={(event) => setStart(event.target.value)} />
          </div>
          <div>
            <Label>Actual end</Label>
            <Input type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
          </div>
          <div>
            <Label>Lunch (min)</Label>
            <Input
              type="number"
              value={lunch}
              onChange={(event) => setLunch(Number(event.target.value))}
            />
          </div>
          <div>
            <Label>Evidence file name</Label>
            <Input
              value={evidenceName}
              onChange={(event) => setEvidenceName(event.target.value)}
              placeholder="Signed timesheet"
            />
          </div>
          <div className="col-span-2">
            <Label>Evidence link</Label>
            <Input
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
              placeholder="https://drive.example/timesheet"
            />
          </div>
          <div className="col-span-2">
            <Label>Expense note</Label>
            <Input value={expense} onChange={(event) => setExpense(event.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Work notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything the practice should know before approving?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              submit({
                shiftId,
                locumId,
                actualStart: start,
                actualEnd: end,
                lunchMinutes: lunch,
                expense: expense.trim() || undefined,
                notes: notes.trim() || undefined,
                evidenceName,
                evidenceUrl,
              })
            }
          >
            <Send className="size-4" />
            Submit hours
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function daysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const count = new Date(year, month, 0).getDate();
  return Array.from(
    { length: count },
    (_, index) => `${monthKey}-${String(index + 1).padStart(2, "0")}`,
  );
}
