import type { ReactNode } from "react";
import { Check, ChevronDown, Circle, CircleAlert, Clock3, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AppStatus, Role, ShiftStatus } from "@/lib/store";

export const roleLabel: Record<Role, string> = {
  Vet: "Vet",
  Nurse: "Nurse",
  Reception: "VCA",
};

const roleStyle: Record<Role, string> = {
  Vet: "border-pink-200 bg-pink-50 text-pink-800",
  Nurse: "border-stone-200 bg-stone-50 text-stone-700",
  Reception: "border-orange-200 bg-orange-50 text-orange-800",
};

const roleDot: Record<Role, string> = {
  Vet: "bg-pink-400",
  Nurse: "bg-stone-400",
  Reception: "bg-orange-400",
};

export function RoleTag({ role, className }: { role: Role; className?: string }) {
  return (
    <Badge variant="outline" className={cn("shadow-none", roleStyle[role], className)}>
      <span className={cn("size-1.5 rounded-full", roleDot[role])} />
      {roleLabel[role]}
    </Badge>
  );
}

export function RoleChip(props: { role: Role; className?: string }) {
  return <RoleTag {...props} />;
}

const toneStyle = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-blue-200 bg-blue-50 text-blue-800",
  done: "border-green-200 bg-green-50 text-green-800",
  neutral: "border-stone-200 bg-stone-50 text-stone-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

const toneDot = {
  available: "bg-emerald-500",
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  done: "bg-green-600",
  neutral: "bg-stone-400",
  danger: "bg-red-500",
};

const statusTone: Record<string, keyof typeof toneStyle> = {
  Open: "available",
  open: "available",
  Available: "available",
  available: "available",
  Connected: "available",
  connected: "available",
  "Public profile live": "available",
  "New applicants": "pending",
  New: "pending",
  Applied: "pending",
  applied: "pending",
  Sent: "pending",
  sent: "pending",
  Submitted: "pending",
  submitted: "pending",
  Tentative: "pending",
  Queried: "pending",
  requested: "pending",
  Request: "pending",
  Requested: "pending",
  Booked: "confirmed",
  booked: "confirmed",
  confirmed: "confirmed",
  Accepted: "confirmed",
  accepted: "confirmed",
  Issued: "confirmed",
  issued: "confirmed",
  Completed: "done",
  completed: "done",
  Approved: "done",
  approved: "done",
  verified: "done",
  "Paid outside platform": "done",
  paid: "done",
  Draft: "neutral",
  draft: "neutral",
  Withdrawn: "neutral",
  withdrawn: "neutral",
  "Private profile": "neutral",
  "Not connected": "neutral",
  Cancelled: "danger",
  cancelled: "danger",
  Declined: "danger",
  declined: "danger",
  "Not selected": "danger",
  Busy: "danger",
  missing: "danger",
  Error: "danger",
};

const statusLabel: Record<string, string> = {
  Open: "Shift",
  open: "Shift",
  "New applicants": "Request",
  Applied: "Request",
  Requested: "Request",
  applied: "Applied",
  requested: "Request",
  confirmed: "Booked",
  booked: "Booked",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
  paid: "Paid",
  draft: "Draft",
  issued: "Issued",
  submitted: "Submitted",
  approved: "Approved",
  queried: "Query",
  Queried: "Query",
  "Not selected": "Declined",
  "Paid outside platform": "Paid",
  "Public profile live": "Live",
  "Private profile": "Private",
};

export function statusIntent(status: string): keyof typeof toneStyle {
  const text = status.toLowerCase();
  if (statusTone[status]) return statusTone[status];
  if (text.includes("request") || text.includes("applicant")) return "pending";
  if (text.includes("paid") || text.includes("approved")) return "done";
  if (text.includes("declined") || text.includes("cancel")) return "danger";
  return "neutral";
}

export function StatusTag({
  status,
  className,
  icon,
}: {
  status: ShiftStatus | AppStatus | string;
  className?: string;
  icon?: ReactNode;
}) {
  const tone = statusIntent(status);
  const defaultIcon =
    icon ??
    (tone === "done" ? (
      <Check className="size-3" />
    ) : tone === "danger" ? (
      <XCircle className="size-3" />
    ) : tone === "pending" ? (
      <CircleAlert className="size-3" />
    ) : tone === "confirmed" ? (
      <Clock3 className="size-3" />
    ) : (
      <Circle className={cn("size-2 fill-current", toneDot[tone])} />
    ));

  return (
    <Badge variant="outline" className={cn("shadow-none", toneStyle[tone], className)}>
      {defaultIcon}
      {statusLabel[status] ?? status}
    </Badge>
  );
}

export function StatusChip(props: {
  status: ShiftStatus | AppStatus | string;
  className?: string;
  icon?: ReactNode;
}) {
  return <StatusTag {...props} />;
}

export function DateTile({ date, className }: { date: string; className?: string }) {
  const d = new Date(`${date}T00:00:00`);
  return (
    <div
      className={cn(
        "flex h-[4.25rem] w-14 shrink-0 flex-col items-center justify-center rounded-md border bg-card py-1.5",
        className,
      )}
    >
      <span className="text-[10px] font-medium uppercase text-muted-foreground">
        {d.toLocaleDateString("en-GB", { month: "short" })}
      </span>
      <span className="text-xl font-semibold leading-none">{d.getDate()}</span>
      <span className="mt-0.5 text-[10px] text-muted-foreground">
        {d.toLocaleDateString("en-GB", { weekday: "short" })}
      </span>
    </div>
  );
}

export function DateBlock(props: { date: string; className?: string }) {
  return <DateTile {...props} />;
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border bg-card", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          {title && <h2 className="font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function MetricTile({
  label,
  value,
  detail,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
    </div>
  );
}

export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 border-t pt-3", className)}>
      {children}
    </div>
  );
}

export function TagMultiSelect({
  label,
  roles,
  selectedRoles,
  onToggle,
  onClear,
  emptyLabel = "Empty",
}: {
  label?: string;
  roles: Role[];
  selectedRoles: Role[];
  onToggle: (role: Role) => void;
  onClear?: () => void;
  emptyLabel?: string;
}) {
  return (
    <div>
      {label && <div className="mb-1.5 text-sm font-medium">{label}</div>}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/40"
          >
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Multi-select</span>
              {selectedRoles.length === 0 ? (
                <span className="text-muted-foreground">{emptyLabel}</span>
              ) : (
                selectedRoles.map((role) => <RoleTag key={role} role={role} />)
              )}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-1">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Pick roles</div>
          <div className="space-y-1">
            {roles.map((role) => {
              const selected = selectedRoles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => onToggle(role)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
                >
                  <RoleTag role={role} />
                  {selected && <Check className="size-4 text-primary" />}
                </button>
              );
            })}
          </div>
          {onClear && selectedRoles.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="mt-1 w-full rounded-md px-2 py-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Clear
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

export const fmtDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
