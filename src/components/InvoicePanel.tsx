import { CheckCircle2, FileText, ReceiptText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip, fmtGBP } from "@/components/Bits";
import type { Invoice, Shift, Timesheet } from "@/lib/store";

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

export function InvoicePanel({
  timesheet,
  invoice,
  shift,
  practiceName,
  locumName,
  compact,
  showActions = true,
  onCreateDraft,
  onIssue,
}: {
  timesheet?: Timesheet;
  invoice?: Invoice;
  shift?: Shift;
  practiceName?: string;
  locumName?: string;
  compact?: boolean;
  showActions?: boolean;
  onCreateDraft?: () => void;
  onIssue?: () => void;
}) {
  if (!timesheet || !shift) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
        No worked hours submitted yet.
      </div>
    );
  }

  const hours = invoice?.hours ?? calcTimesheetHours(timesheet, shift);
  const total = invoice?.total ?? calcTimesheetValue(timesheet, shift);

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-medium">
            <ReceiptText className="size-4 text-primary" />
            Invoice
            {invoice ? <StatusChip status={invoice.status} /> : <StatusChip status="Not drafted" />}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Generated from approved worked hours, not the planned shift value.
          </div>
          {(practiceName || locumName) && (
            <div className="mt-2 text-xs text-muted-foreground">
              {[locumName, practiceName].filter(Boolean).join(" to ")}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-right text-sm sm:min-w-72">
          <div className="rounded-md bg-muted/50 p-2">
            <div className="text-xs text-muted-foreground">Hours</div>
            <div className="font-semibold">{hours.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <div className="text-xs text-muted-foreground">Rate</div>
            <div className="font-semibold">{fmtGBP(shift.hourlyRate)}/hr</div>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="font-semibold">{fmtGBP(total)}</div>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-md border p-2">
            <div className="text-xs text-muted-foreground">Worked</div>
            <div>
              {timesheet.actualStart}-{timesheet.actualEnd}
            </div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-xs text-muted-foreground">Lunch</div>
            <div>{timesheet.lunchMinutes} min</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-xs text-muted-foreground">Invoice number</div>
            <div>{invoice?.number ?? "Create draft after approval"}</div>
          </div>
        </div>
      )}

      {showActions && (
        <div className="mt-3 flex flex-wrap gap-2">
          {timesheet.status !== "Approved" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3" />
              Invoice unlocks once hours are approved.
            </span>
          )}
          {timesheet.status === "Approved" && !invoice && onCreateDraft && (
            <Button size="sm" onClick={onCreateDraft}>
              <FileText className="size-4" />
              Create invoice draft
            </Button>
          )}
          {invoice?.status === "Draft" && onIssue && (
            <Button size="sm" variant="outline" onClick={onIssue}>
              <Send className="size-4" />
              Issue invoice
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
