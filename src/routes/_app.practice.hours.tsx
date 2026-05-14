import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import {
  useStore,
  type Attachment,
  type Invoice,
  type Locum,
  type Practice,
  type Shift,
  type Timesheet,
} from "@/lib/store";
import { DateBlock, RoleChip, StatusChip, fmtDate, fmtGBP } from "@/components/Bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  Clock,
  Download,
  FileText,
  MessageCircle,
  ReceiptText,
  Users,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/practice/hours")({
  head: () => ({ meta: [{ title: "Hours - Every Tail Locums" }] }),
  component: HoursPage,
});

type PracticeLocation = Practice["locations"][number];

type HoursItem = {
  timesheet: Timesheet;
  shift: Shift;
  locum: Locum;
  practice: Practice;
  location: PracticeLocation;
  invoice?: Invoice;
  evidence: Attachment[];
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

function HoursPage() {
  const {
    timesheets,
    shifts,
    locums,
    practices,
    currentPracticeId,
    approveTimesheet,
    createInvoiceDraftFromTimesheet,
    issueInvoice,
    markInvoicePaid,
    updateLocumProfile,
    invoices,
    attachments,
  } = useStore();

  const my: HoursItem[] = timesheets
    .flatMap((timesheet) => {
      const shift = shifts.find((item) => item.id === timesheet.shiftId);
      if (!shift || shift.practiceId !== currentPracticeId) return [];
      const locum = locums.find((item) => item.id === timesheet.locumId);
      const practice = practices.find((item) => item.id === shift.practiceId);
      const location = practice?.locations.find((item) => item.id === shift.locationId);
      if (!locum || !practice || !location) return [];
      return [
        {
          timesheet,
          shift,
          locum,
          practice,
          location,
          invoice: invoices.find((invoice) => invoice.timesheetId === timesheet.id),
          evidence: attachments.filter(
            (attachment) =>
              attachment.ownerType === "timesheet" && attachment.ownerId === timesheet.id,
          ),
        },
      ];
    })
    .sort((left, right) => right.shift.date.localeCompare(left.shift.date));

  const submitted = my.filter((item) => item.timesheet.status === "Submitted");
  const approved = my.filter((item) => item.timesheet.status === "Approved");
  const workedWith = Array.from(new Map(my.map((item) => [item.locum.id, item.locum])).values());
  const totalHours = approved.reduce(
    (sum, item) => sum + calcTimesheetHours(item.timesheet, item.shift),
    0,
  );
  const approvedValue = approved.reduce(
    (sum, item) => sum + calcTimesheetValue(item.timesheet, item.shift),
    0,
  );
  const paidCount = my.filter((item) => item.invoice?.status === "Paid outside platform").length;

  const approve = (timesheetId: string) => {
    approveTimesheet(timesheetId);
    toast.success("Timesheet approved");
  };

  const createDraft = (timesheetId: string) => {
    const invoice = createInvoiceDraftFromTimesheet(timesheetId);
    if (invoice) toast.success("Invoice draft created");
    else toast.error("Approve the timesheet before creating an invoice");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Hours"
        description="Review submitted timesheets, approve worked hours, export invoice checks, and keep internal locum notes."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          icon={<Clock className="size-4" />}
          label="Submitted"
          value={String(submitted.length)}
        />
        <MetricCard
          icon={<Check className="size-4" />}
          label="Approved"
          value={totalHours.toFixed(1)}
        />
        <MetricCard
          icon={<WalletCards className="size-4" />}
          label="Approved value"
          value={fmtGBP(approvedValue)}
        />
        <MetricCard
          icon={<ReceiptText className="size-4" />}
          label="Paid internally"
          value={String(paidCount)}
        />
      </div>

      <Tabs defaultValue="submitted" className="mt-5">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="all">All hours</TabsTrigger>
          <TabsTrigger value="locums">Locum database</TabsTrigger>
        </TabsList>

        <TabsContent value="submitted" className="mt-4">
          <HoursList
            empty="No submitted timesheets yet."
            items={submitted}
            onApprove={approve}
            onCreateDraft={createDraft}
            onIssueInvoice={(invoiceId) => {
              issueInvoice(invoiceId);
              toast.success("Invoice issued");
            }}
            onMarkPaid={(invoiceId) => {
              markInvoicePaid(invoiceId);
              toast.success("Marked paid internally");
            }}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => downloadInvoiceCheck(approved)}>
              <Download className="size-4" />
              Export invoice check
            </Button>
          </div>
          <HoursList
            empty="No approved timesheets yet."
            items={approved}
            onApprove={approve}
            onCreateDraft={createDraft}
            onIssueInvoice={(invoiceId) => {
              issueInvoice(invoiceId);
              toast.success("Invoice issued");
            }}
            onMarkPaid={(invoiceId) => {
              markInvoicePaid(invoiceId);
              toast.success("Marked paid internally");
            }}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <HoursList
            empty="No timesheets yet."
            items={my}
            onApprove={approve}
            onCreateDraft={createDraft}
            onIssueInvoice={(invoiceId) => {
              issueInvoice(invoiceId);
              toast.success("Invoice issued");
            }}
            onMarkPaid={(invoiceId) => {
              markInvoicePaid(invoiceId);
              toast.success("Marked paid internally");
            }}
          />
        </TabsContent>

        <TabsContent value="locums" className="mt-4">
          <section className="rounded-lg border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <Users className="size-4" />
                Locums worked with
              </h2>
            </div>
            <div className="divide-y">
              {workedWith.map((locum) => {
                const rows = my.filter((item) => item.locum.id === locum.id);
                const hours = rows.reduce(
                  (sum, item) => sum + calcTimesheetHours(item.timesheet, item.shift),
                  0,
                );
                return (
                  <div key={locum.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_20rem]">
                    <div>
                      <div className="font-medium">{locum.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {rows.length} shift{rows.length === 1 ? "" : "s"} - {hours.toFixed(1)} hours
                        reviewed
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <a className="text-primary hover:underline" href={`mailto:${locum.email}`}>
                          {locum.email}
                        </a>
                        <a
                          className="text-primary hover:underline"
                          href={`https://wa.me/${locum.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {locum.whatsapp}
                        </a>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium text-muted-foreground">
                        Internal note
                      </div>
                      <Textarea
                        rows={3}
                        defaultValue={locum.internalNote ?? ""}
                        placeholder="Private notes about reliability, preferences, or rebooking."
                        onBlur={(event) =>
                          updateLocumProfile(locum.id, { internalNote: event.target.value })
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function HoursList({
  empty,
  items,
  onApprove,
  onCreateDraft,
  onIssueInvoice,
  onMarkPaid,
}: {
  empty: string;
  items: HoursItem[];
  onApprove: (timesheetId: string) => void;
  onCreateDraft: (timesheetId: string) => void;
  onIssueInvoice: (invoiceId: string) => void;
  onMarkPaid: (invoiceId: string) => void;
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
        <HoursCard
          key={item.timesheet.id}
          item={item}
          onApprove={onApprove}
          onCreateDraft={onCreateDraft}
          onIssueInvoice={onIssueInvoice}
          onMarkPaid={onMarkPaid}
        />
      ))}
    </div>
  );
}

function HoursCard({
  item,
  onApprove,
  onCreateDraft,
  onIssueInvoice,
  onMarkPaid,
}: {
  item: HoursItem;
  onApprove: (timesheetId: string) => void;
  onCreateDraft: (timesheetId: string) => void;
  onIssueInvoice: (invoiceId: string) => void;
  onMarkPaid: (invoiceId: string) => void;
}) {
  const { timesheet, shift, locum, location, invoice, evidence } = item;
  const hours = calcTimesheetHours(timesheet, shift);
  const total = calcTimesheetValue(timesheet, shift);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-start">
        <DateBlock date={shift.date} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <RoleChip role={shift.role} />
            <StatusChip status={timesheet.status} />
            {invoice && <StatusChip status={invoice.status} />}
          </div>
          <div className="mt-1 font-medium">{locum.displayName}</div>
          <div className="text-xs text-muted-foreground">
            {location.name} - {fmtDate(shift.date)}
          </div>
        </div>
        <div className="text-sm lg:text-right">
          <div className="font-semibold">{fmtGBP(total)}</div>
          <div className="text-xs text-muted-foreground">
            {hours.toFixed(2)}h at {fmtGBP(shift.hourlyRate)}/hr
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Fact label="Started" value={timesheet.actualStart} />
        <Fact label="Finished" value={timesheet.actualEnd} />
        <Fact label="Lunch break" value={`${timesheet.lunchMinutes} min`} />
        <Fact label="Evidence" value={evidence.length ? `${evidence.length} file` : "No proof"} />
      </div>

      {(timesheet.expense || timesheet.notes) && (
        <div className="mt-3 rounded-md border bg-muted/40 p-3 text-sm">
          {timesheet.expense && <div>Expense: {timesheet.expense}</div>}
          {timesheet.notes && <div>Locum note: {timesheet.notes}</div>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
        {timesheet.status === "Submitted" && (
          <Button size="sm" onClick={() => onApprove(timesheet.id)}>
            <Check className="size-4" />
            Approve
          </Button>
        )}
        {timesheet.status === "Approved" && !invoice && (
          <Button size="sm" variant="outline" onClick={() => onCreateDraft(timesheet.id)}>
            <ReceiptText className="size-4" />
            Create invoice
          </Button>
        )}
        {invoice?.status === "Draft" && (
          <Button size="sm" variant="outline" onClick={() => onIssueInvoice(invoice.id)}>
            Issue invoice
          </Button>
        )}
        {invoice && invoice.status !== "Paid outside platform" && (
          <Button size="sm" variant="outline" onClick={() => onMarkPaid(invoice.id)}>
            Mark paid
          </Button>
        )}
        {invoice && (
          <Button size="sm" variant="outline" onClick={() => downloadInvoiceCheck([item])}>
            <Download className="size-4" />
            Export
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <a
            href={`https://wa.me/${locum.whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="size-4" />
            Query
          </a>
        </Button>
      </div>

      <EvidenceList attachments={evidence} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function EvidenceList({ attachments }: { attachments: Attachment[] }) {
  return (
    <section className="mt-3 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 font-medium">
        <FileText className="size-4 text-primary" />
        Timesheet proof
      </div>
      <div className="mt-3 space-y-2">
        {attachments.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No proof attached.
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

function downloadInvoiceCheck(items: HoursItem[]) {
  const lines = [
    "Locum,Date,Practice,Location,Start,Finish,Lunch minutes,Hours,Rate,Total,Invoice status",
    ...items.map((item) =>
      [
        item.locum.displayName,
        item.shift.date,
        item.practice.tradingName,
        item.location.name,
        item.timesheet.actualStart,
        item.timesheet.actualEnd,
        item.timesheet.lunchMinutes,
        calcTimesheetHours(item.timesheet, item.shift).toFixed(2),
        item.shift.hourlyRate.toFixed(2),
        calcTimesheetValue(item.timesheet, item.shift).toFixed(2),
        item.invoice?.status ?? "No invoice",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-check-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
