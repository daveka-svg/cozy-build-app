import { cn } from "@/lib/utils";
import type { Role, ShiftStatus, AppStatus } from "@/lib/store";

const roleStyle: Record<Role, string> = {
  Vet: "bg-pink-50 text-pink-800 border-pink-200",
  Nurse: "bg-stone-100 text-stone-800 border-stone-300",
  Reception: "bg-orange-50 text-orange-800 border-orange-200",
};

const roleLabel: Record<Role, string> = {
  Vet: "Vet",
  Nurse: "Nurse",
  Reception: "VCA",
};

export function RoleChip({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
        roleStyle[role],
      )}
    >
      {roleLabel[role]}
    </span>
  );
}

const statusStyle: Record<string, string> = {
  Open: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  "New applicants": "bg-amber-50 text-amber-800 border border-amber-200",
  Booked: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  Completed: "bg-violet-50 text-violet-800 border border-violet-200",
  Cancelled: "bg-red-50 text-red-700 border border-red-200",
  New: "bg-amber-50 text-amber-800 border border-amber-200",
  Applied: "bg-amber-50 text-amber-800 border border-amber-200",
  Requested: "bg-blue-50 text-blue-800 border border-blue-200",
  "Not selected": "bg-red-50 text-red-700 border border-red-200",
  Declined: "bg-red-50 text-red-700 border border-red-200",
  Withdrawn: "bg-stone-100 text-stone-700 border border-stone-200",
  Sent: "bg-amber-50 text-amber-800 border border-amber-200",
  Accepted: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  Submitted: "bg-blue-50 text-blue-800 border border-blue-200",
  Approved: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  Queried: "bg-amber-50 text-amber-800 border border-amber-200",
  Issued: "bg-blue-50 text-blue-800 border border-blue-200",
  Draft: "bg-stone-100 text-stone-700 border border-stone-200",
  "Paid outside platform": "bg-emerald-50 text-emerald-800 border border-emerald-200",
  Available: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  Tentative: "bg-amber-50 text-amber-800 border border-amber-200",
  Busy: "bg-red-50 text-red-700 border border-red-200",
  "Public profile live": "bg-emerald-50 text-emerald-800 border border-emerald-200",
  "Private profile": "bg-stone-100 text-stone-700 border border-stone-200",
  "Not connected": "bg-stone-100 text-stone-700 border border-stone-200",
  verified: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  missing: "bg-red-50 text-red-700 border border-red-200",
};

const statusLabel: Record<string, string> = {
  "Not selected": "Declined",
  "Paid outside platform": "Paid",
};

export function StatusChip({ status }: { status: ShiftStatus | AppStatus | string }) {
  const dynamicStyle =
    status.includes("new applicant") || status.includes("request")
      ? statusStyle["New applicants"]
      : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
        statusStyle[status] ?? dynamicStyle ?? "bg-muted",
      )}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}

export function DateBlock({ date, className }: { date: string; className?: string }) {
  const d = new Date(date + "T00:00:00");
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-14 shrink-0 rounded-md border bg-card py-1.5",
        className,
      )}
    >
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        {d.toLocaleDateString("en-GB", { month: "short" })}
      </span>
      <span className="text-xl font-semibold leading-none">{d.getDate()}</span>
      <span className="text-[10px] text-muted-foreground mt-0.5">
        {d.toLocaleDateString("en-GB", { weekday: "short" })}
      </span>
    </div>
  );
}

export const fmtGBP = (n: number) => `£${n.toFixed(2)}`;
export const fmtDate = (date: string) =>
  new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
