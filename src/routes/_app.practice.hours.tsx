import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Clock,
  Download,
  MessageCircle,
  ReceiptText,
  Users,
  WalletCards,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/AppShell";
import { RoleChip, StatusChip, fmtDate, fmtGBP } from "@/components/Bits";
import { LocumContactLinks, LocumIdentity } from "@/components/LocumIdentity";
import { LocumProfileModal } from "@/components/LocumProfileModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useStore,
  type Invoice,
  type Locum,
  type Practice,
  type Shift,
  type Timesheet,
} from "@/lib/store";
import { cn } from "@/lib/utils";
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
    queryTimesheet,
    createInvoiceDraftFromTimesheet,
    issueInvoice,
    markInvoicePaid,
    updateLocumProfile,
    invoices,
  } = useStore();
  const [profileLocumId, setProfileLocumId] = useState<string | null>(null);

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
        },
      ];
    })
    .sort((left, right) => right.shift.date.localeCompare(left.shift.date));

  const submitted = my.filter((item) => item.timesheet.status === "Submitted");
  const approved = my.filter(
    (item) =>
      item.timesheet.status === "Approved" && item.invoice?.status !== "Paid outside platform",
  );
  const paid = my.filter((item) => item.invoice?.status === "Paid outside platform");
  const workedWith = Array.from(new Map(my.map((item) => [item.locum.id, item.locum])).values());
  const approvedHours = my
    .filter((item) => item.timesheet.status === "Approved")
    .reduce((sum, item) => sum + calcTimesheetHours(item.timesheet, item.shift), 0);
  const toPayValue = my
    .filter((item) => item.invoice?.status !== "Paid outside platform")
    .reduce((sum, item) => sum + calcTimesheetValue(item.timesheet, item.shift), 0);

  const approve = (timesheetId: string) => {
    approveTimesheet(timesheetId);
    toast.success("Approved");
  };

  const query = (timesheetId: string) => {
    queryTimesheet(timesheetId);
    toast("Queried");
  };

  const createDraft = (timesheetId: string) => {
    const invoice = createInvoiceDraftFromTimesheet(timesheetId);
    if (invoice) toast.success("Invoice draft");
    else toast.error("Approve hours first");
  };

  return (
    <>
      <div className="mx-auto max-w-6xl p-6">
        <PageHeader title="Hours" />

        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <MetricPill
            icon={<Clock className="size-4" />}
            label="Submitted"
            value={submitted.length}
          />
          <MetricPill
            icon={<Check className="size-4" />}
            label="Approved"
            value={approvedHours.toFixed(1)}
          />
          <MetricPill
            icon={<WalletCards className="size-4" />}
            label="To pay"
            value={fmtGBP(toPayValue)}
            main
          />
          <MetricPill icon={<ReceiptText className="size-4" />} label="Paid" value={paid.length} />
        </div>

        <Tabs defaultValue="submitted">
          <TabsList className="h-auto flex-wrap justify-start rounded-lg bg-card p-1">
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="locums">Locums</TabsTrigger>
          </TabsList>

          <TabsContent value="submitted" className="mt-4">
            <HoursTable
              items={submitted}
              empty="No submitted hours"
              onApprove={approve}
              onQuery={query}
              onCreateDraft={createDraft}
              onIssueInvoice={(invoiceId) => {
                issueInvoice(invoiceId);
                toast.success("Issued");
              }}
              onMarkPaid={(invoiceId) => {
                markInvoicePaid(invoiceId);
                toast.success("Paid");
              }}
              onProfile={setProfileLocumId}
            />
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <div className="mb-2 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => downloadInvoiceCheck(approved)}>
                <Download className="size-4" />
                Export
              </Button>
            </div>
            <HoursTable
              items={approved}
              empty="No approved hours"
              onApprove={approve}
              onQuery={query}
              onCreateDraft={createDraft}
              onIssueInvoice={(invoiceId) => {
                issueInvoice(invoiceId);
                toast.success("Issued");
              }}
              onMarkPaid={(invoiceId) => {
                markInvoicePaid(invoiceId);
                toast.success("Paid");
              }}
              onProfile={setProfileLocumId}
            />
          </TabsContent>

          <TabsContent value="paid" className="mt-4">
            <HoursTable
              items={paid}
              empty="No paid hours"
              onApprove={approve}
              onQuery={query}
              onCreateDraft={createDraft}
              onIssueInvoice={(invoiceId) => {
                issueInvoice(invoiceId);
                toast.success("Issued");
              }}
              onMarkPaid={(invoiceId) => {
                markInvoicePaid(invoiceId);
                toast.success("Paid");
              }}
              onProfile={setProfileLocumId}
            />
          </TabsContent>

          <TabsContent value="locums" className="mt-4">
            <section className="overflow-hidden rounded-lg border bg-card">
              <div className="flex items-center gap-2 border-b px-3 py-2 text-sm font-medium">
                <Users className="size-4 text-muted-foreground" />
                Locums
              </div>
              <div className="divide-y">
                {workedWith.map((locum) => {
                  const rows = my.filter((item) => item.locum.id === locum.id);
                  const hours = rows.reduce(
                    (sum, item) => sum + calcTimesheetHours(item.timesheet, item.shift),
                    0,
                  );
                  return (
                    <div key={locum.id} className="grid gap-3 p-3 lg:grid-cols-[1fr_20rem]">
                      <div>
                        <LocumIdentity locum={locum} onProfile={setProfileLocumId} />
                        <div className="mt-1 text-xs text-muted-foreground">
                          {rows.length} shift{rows.length === 1 ? "" : "s"} · {hours.toFixed(1)}h
                        </div>
                        <LocumContactLinks locum={locum} className="mt-2" />
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-medium text-muted-foreground">
                          Internal note
                        </div>
                        <Textarea
                          rows={3}
                          defaultValue={locum.internalNote ?? ""}
                          placeholder="Internal note"
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
      {profileLocumId && (
        <LocumProfileModal locumId={profileLocumId} onClose={() => setProfileLocumId(null)} />
      )}
    </>
  );
}

function MetricPill({
  icon,
  label,
  value,
  main,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  main?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-3 py-2",
        main && "border-primary/35 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function HoursTable({
  empty,
  items,
  onApprove,
  onQuery,
  onCreateDraft,
  onIssueInvoice,
  onMarkPaid,
  onProfile,
}: {
  empty: string;
  items: HoursItem[];
  onApprove: (timesheetId: string) => void;
  onQuery: (timesheetId: string) => void;
  onCreateDraft: (timesheetId: string) => void;
  onIssueInvoice: (invoiceId: string) => void;
  onMarkPaid: (invoiceId: string) => void;
  onProfile: (locumId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Locum</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <HoursRow
                key={item.timesheet.id}
                item={item}
                onApprove={onApprove}
                onQuery={onQuery}
                onCreateDraft={onCreateDraft}
                onIssueInvoice={onIssueInvoice}
                onMarkPaid={onMarkPaid}
                onProfile={onProfile}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y lg:hidden">
        {items.map((item) => (
          <HoursMobileCard
            key={item.timesheet.id}
            item={item}
            onApprove={onApprove}
            onQuery={onQuery}
            onCreateDraft={onCreateDraft}
            onIssueInvoice={onIssueInvoice}
            onMarkPaid={onMarkPaid}
            onProfile={onProfile}
          />
        ))}
      </div>
    </section>
  );
}

function HoursRow({
  item,
  onApprove,
  onQuery,
  onCreateDraft,
  onIssueInvoice,
  onMarkPaid,
  onProfile,
}: {
  item: HoursItem;
  onApprove: (timesheetId: string) => void;
  onQuery: (timesheetId: string) => void;
  onCreateDraft: (timesheetId: string) => void;
  onIssueInvoice: (invoiceId: string) => void;
  onMarkPaid: (invoiceId: string) => void;
  onProfile: (locumId: string) => void;
}) {
  const { timesheet, shift, locum, location, invoice } = item;
  const hours = calcTimesheetHours(timesheet, shift);
  const total = calcTimesheetValue(timesheet, shift);

  return (
    <TableRow>
      <TableCell className="w-28">
        <div className="font-medium">{fmtDate(shift.date)}</div>
        <div className="text-xs text-muted-foreground">{location.name}</div>
      </TableCell>
      <TableCell>
        <PersonCell locum={locum} onProfile={onProfile} />
      </TableCell>
      <TableCell>
        <RoleChip role={shift.role} />
      </TableCell>
      <TableCell className="text-sm">
        <div>
          {timesheet.actualStart}-{timesheet.actualEnd}
        </div>
        <div className="text-xs text-muted-foreground">Lunch {timesheet.lunchMinutes}m</div>
      </TableCell>
      <TableCell className="text-right tabular-nums">{hours.toFixed(2)}</TableCell>
      <TableCell className="text-right text-base font-semibold tabular-nums">
        {fmtGBP(total)}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1.5">
          <StatusChip status={timesheet.status} />
          {invoice && <StatusChip status={invoice.status} />}
        </div>
      </TableCell>
      <TableCell>
        <RowActions
          item={item}
          onApprove={onApprove}
          onQuery={onQuery}
          onCreateDraft={onCreateDraft}
          onIssueInvoice={onIssueInvoice}
          onMarkPaid={onMarkPaid}
        />
      </TableCell>
    </TableRow>
  );
}

function HoursMobileCard({
  item,
  onApprove,
  onQuery,
  onCreateDraft,
  onIssueInvoice,
  onMarkPaid,
  onProfile,
}: {
  item: HoursItem;
  onApprove: (timesheetId: string) => void;
  onQuery: (timesheetId: string) => void;
  onCreateDraft: (timesheetId: string) => void;
  onIssueInvoice: (invoiceId: string) => void;
  onMarkPaid: (invoiceId: string) => void;
  onProfile: (locumId: string) => void;
}) {
  const { timesheet, shift, locum, location, invoice } = item;
  const hours = calcTimesheetHours(timesheet, shift);
  const total = calcTimesheetValue(timesheet, shift);

  return (
    <article className="p-3">
      <div className="flex items-start justify-between gap-3">
        <PersonCell locum={locum} onProfile={onProfile} />
        <div className="text-right text-lg font-semibold tabular-nums">{fmtGBP(total)}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <RoleChip role={shift.role} />
        <StatusChip status={timesheet.status} />
        {invoice && <StatusChip status={invoice.status} />}
      </div>
      <Separator className="my-3" />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Fact label="Date" value={fmtDate(shift.date)} />
        <Fact label="Place" value={`${location.name}, ${location.postcode}`} />
        <Fact label="Time" value={`${timesheet.actualStart}-${timesheet.actualEnd}`} />
        <Fact label="Hours" value={`${hours.toFixed(2)}h`} />
      </div>
      <RowActions
        item={item}
        onApprove={onApprove}
        onQuery={onQuery}
        onCreateDraft={onCreateDraft}
        onIssueInvoice={onIssueInvoice}
        onMarkPaid={onMarkPaid}
        className="mt-3 justify-start"
      />
    </article>
  );
}

function RowActions({
  item,
  onApprove,
  onQuery,
  onCreateDraft,
  onIssueInvoice,
  onMarkPaid,
  className,
}: {
  item: HoursItem;
  onApprove: (timesheetId: string) => void;
  onQuery: (timesheetId: string) => void;
  onCreateDraft: (timesheetId: string) => void;
  onIssueInvoice: (invoiceId: string) => void;
  onMarkPaid: (invoiceId: string) => void;
  className?: string;
}) {
  const { timesheet, invoice, locum } = item;
  return (
    <div className={cn("flex flex-wrap justify-end gap-1.5", className)}>
      {timesheet.status === "Submitted" && (
        <>
          <Button size="sm" onClick={() => onApprove(timesheet.id)}>
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => onQuery(timesheet.id)}>
            Query
          </Button>
        </>
      )}
      {timesheet.status === "Approved" && !invoice && (
        <Button size="sm" variant="outline" onClick={() => onCreateDraft(timesheet.id)}>
          Invoice
        </Button>
      )}
      {invoice?.status === "Draft" && (
        <Button size="sm" variant="outline" onClick={() => onIssueInvoice(invoice.id)}>
          Issue
        </Button>
      )}
      {invoice && invoice.status !== "Paid outside platform" && (
        <Button size="sm" variant="outline" onClick={() => onMarkPaid(invoice.id)}>
          Paid
        </Button>
      )}
      {invoice && (
        <Button size="sm" variant="outline" onClick={() => downloadInvoiceCheck([item])}>
          Export
        </Button>
      )}
      <Button size="sm" variant="ghost" asChild>
        <a
          href={`https://wa.me/${locum.whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Query ${locum.displayName}`}
        >
          <MessageCircle className="size-4" />
        </a>
      </Button>
    </div>
  );
}

function PersonCell({ locum, onProfile }: { locum: Locum; onProfile: (locumId: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onProfile(locum.id)}
      className="flex min-w-0 items-center gap-2 rounded-sm text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Avatar className="size-8">
        <AvatarImage src={locum.photoUrl} alt={locum.displayName} />
        <AvatarFallback>{initials(locum.displayName)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{locum.displayName}</span>
        <span className="block truncate text-xs text-muted-foreground">{locum.email}</span>
      </span>
    </button>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-medium">{value}</div>
    </div>
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

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}
