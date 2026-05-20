import { FileText, ReceiptText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtGBP } from "@/components/Bits";
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
  const invoiceLabel = invoice?.number ?? "Invoice";
  const shareText = [
    invoiceLabel,
    locumName && practiceName
      ? `${locumName} to ${practiceName}`
      : locumName || practiceName || undefined,
    `Hours: ${hours.toFixed(2)}`,
    `Rate: ${fmtGBP(shift.hourlyRate)}/hr`,
    `Total: ${fmtGBP(total)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const shareInvoice = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: invoiceLabel, text: shareText });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
    } catch {
      // Native share is commonly cancelled by the user; no follow-up UI needed here.
    }
  };

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium">
            <ReceiptText className="size-4 text-primary" />
            Invoice
          </div>
          {(practiceName || locumName) && (
            <div className="mt-2 text-xs text-muted-foreground">
              {[locumName, practiceName].filter(Boolean).join(" to ")}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 sm:ml-auto">
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
          {showActions && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8 shrink-0"
              aria-label="Share invoice"
              title="Share invoice"
              onClick={() => void shareInvoice()}
            >
              <FileText className="size-4" />
            </Button>
          )}
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
            <div>{invoice?.number ?? "Pending"}</div>
          </div>
        </div>
      )}

      {showActions && (
        <div className="mt-3 flex flex-wrap gap-2">
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
