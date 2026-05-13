import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Role, ShiftStatus, AppStatus } from "@/lib/store";

const roleStyle: Record<Role, string> = {
  Vet: "bg-info/15 text-info-foreground border-info/30",
  Nurse: "bg-success/15 text-foreground border-success/30",
  Reception: "bg-warning/20 text-foreground border-warning/40",
};

export function RoleChip({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
        roleStyle[role],
      )}
    >
      {role}
    </span>
  );
}

const statusStyle: Record<string, string> = {
  Open: "bg-muted text-foreground",
  "New applicants": "bg-primary/15 text-primary border border-primary/30",
  Booked: "bg-success/15 text-foreground border border-success/30",
  Completed: "bg-secondary text-secondary-foreground",
  Cancelled: "bg-destructive/10 text-destructive border border-destructive/30",
  Applied: "bg-primary/10 text-primary",
  "Not selected": "bg-muted text-muted-foreground",
  Withdrawn: "bg-muted text-muted-foreground",
};

export function StatusChip({ status }: { status: ShiftStatus | AppStatus | string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium", statusStyle[status] ?? "bg-muted")}>
      {status}
    </span>
  );
}

export function DateBlock({ date, className }: { date: string; className?: string }) {
  const d = new Date(date + "T00:00:00");
  return (
    <div className={cn("flex flex-col items-center justify-center w-14 shrink-0 rounded-md border bg-card py-1.5", className)}>
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
  new Date(date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
