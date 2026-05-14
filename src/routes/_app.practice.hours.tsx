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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoicePanel } from "@/components/InvoicePanel";
import { Check, Clock, FileText, MessageCircle, ReceiptText, WalletCards } from "lucide-react";
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
    invoices,
    attachments,
  } = useStore();

  const my: HoursItem[] = timesheets
    .flatMap((timesheet) => {
      const shift = shifts.find((x) => x.id === timesheet.shiftId);
      if (!shift || shift.practiceId !== currentPracticeId) return [];
      const locum = locums.find((x) => x.id === timesheet.locumId);
      const practice = practices.find((x) => x.id === shift.practiceId);
      const location = practice?.locations.find((x) => x.id === shift.locationId);
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
  const totalHours = approved.reduce(
    (sum, item) => sum + calcTimesheetHours(item.timesheet, item.shift),
    0,
  );
  const approvedValue = approved.reduce(
    (sum, item) => sum + calcTimesheetValue(item.timesheet, item.shift),
    0,
  );
  const issuedInvoices = my.filter((item) => item.invoice?.status === "Issued").length;

  const approve = (timesheetId: string) => {
    approveTimesheet(timesheetId);
    toast.success("Hours approved");
  };

  const createDraft = (timesheetId: string) => {
    const invoice = createInvoiceDraftFromTimesheet(timesheetId);
    if (invoice) {
      toast.success("Invoice draft created from approved hours");
    } else {
      toast.error("Approve hours before creating an invoice");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Hours"
        description="Approve submitted hours, review evidence, and track invoice status."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          icon={<Clock className="size-4" />}
          label="Awaiting approval"
          value={String(submitted.length)}
        />
        <MetricCard
          icon={<Check className="size-4" />}
          label="Approved hours"
          value={totalHours.toFixed(1)}
        />
        <MetricCard
          icon={<WalletCards className="size-4" />}
          label="Approved value"
          value={fmtGBP(approvedValue)}
        />
        <MetricCard
          icon={<ReceiptText className="size-4" />}
          label="Issued invoices"
          value={String(issuedInvoices)}
        />
      </div>

      <Tabs defaultValue="submitted" className="mt-5">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="approved">Approved & invoices</TabsTrigger>
          <TabsTrigger value="all">All hours</TabsTrigger>
        </TabsList>

        <TabsContent value="submitted" className="mt-4">
          <HoursList
            empty="No submitted timesheets yet. Locums submit hours after a completed shift."
            items={submitted}
            onApprove={approve}
            onCreateDraft={createDraft}
            onIssueInvoice={(invoiceId) => {
              issueInvoice(invoiceId);
              toast.success("Invoice issued");
            }}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <HoursList
            empty="No approved hours yet."
            items={approved}
            onApprove={approve}
            onCreateDraft={createDraft}
            onIssueInvoice={(invoiceId) => {
              issueInvoice(invoiceId);
              toast.success("Invoice issued");
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
          />
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
}: {
  empty: string;
  items: HoursItem[];
  onApprove: (timesheetId: string) => void;
  onCreateDraft: (timesheetId: string) => void;
  onIssueInvoice: (invoiceId: string) => void;
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
}: {
  item: HoursItem;
  onApprove: (timesheetId: string) => void;
  onCreateDraft: (timesheetId: string) => void;
  onIssueInvoice: (invoiceId: string) => void;
}) {
  const { timesheet, shift, locum, location, invoice, evidence } = item;
  const total = calcTimesheetValue(timesheet, shift);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <DateBlock date={shift.date} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <RoleChip role={shift.role} />
            <StatusChip status={timesheet.status} />
            {invoice && <StatusChip status={`Invoice ${invoice.status.toLowerCase()}`} />}
          </div>
          <div className="mt-1 text-sm font-medium">
            {locum.displayName} - {location.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {fmtDate(shift.date)} worked {timesheet.actualStart}-{timesheet.actualEnd}, lunch{" "}
            {timesheet.lunchMinutes}m
          </div>
          {(timesheet.expense || timesheet.notes) && (
            <div className="mt-2 rounded-md border bg-muted/40 p-2 text-xs">
              {timesheet.expense && <div>Expense: {timesheet.expense}</div>}
              {timesheet.notes && <div>Notes: {timesheet.notes}</div>}
            </div>
          )}
        </div>
        <div className="text-sm lg:text-right">
          <div className="font-semibold">{fmtGBP(total)}</div>
          <div className="text-xs text-muted-foreground">
            {calcTimesheetHours(timesheet, shift).toFixed(2)} hours at {fmtGBP(shift.hourlyRate)}/hr
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
        {timesheet.status === "Submitted" && (
          <Button size="sm" onClick={() => onApprove(timesheet.id)}>
            <Check className="size-4" />
            Approve hours
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <a
            href={`https://wa.me/${locum.whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="size-4" />
            Query locum
          </a>
        </Button>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.85fr]">
        <InvoicePanel
          timesheet={timesheet}
          invoice={invoice}
          shift={shift}
          locumName={locum.displayName}
          practiceName={item.practice.tradingName}
          showActions
          onCreateDraft={() => onCreateDraft(timesheet.id)}
          onIssue={invoice ? () => onIssueInvoice(invoice.id) : undefined}
        />
        <EvidenceList attachments={evidence} />
      </div>
    </div>
  );
}

function EvidenceList({ attachments }: { attachments: Attachment[] }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 font-medium">
        <FileText className="size-4 text-primary" />
        Timesheet evidence
      </div>
      <div className="mt-3 space-y-2">
        {attachments.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No evidence files attached.
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
