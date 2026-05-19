import { useMemo, type ReactNode } from "react";
import { BadgeCheck, Check, ChevronLeft, MessageCircle, Pencil, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateBlock, RoleChip, StatusChip, fmtDate, fmtGBP, statusIntent } from "@/components/Bits";
import {
  calcShiftValue,
  type Application,
  type Locum,
  type Practice,
  type Shift,
} from "@/lib/store";
import { cn } from "@/lib/utils";

type PracticeLocation = Practice["locations"][number];

const shouldShowStatusChip = (status?: string | null) =>
  typeof status === "string" && !["Open", "open", "Shift", "shift"].includes(status);

export type PipelineTab = {
  value: string;
  label: string;
  count: number;
};

export function PlacementHeader({
  shift,
  location,
  title = "Placement",
  onBack,
  onEdit,
}: {
  shift: Shift;
  location: PracticeLocation;
  title?: string;
  onBack?: () => void;
  onEdit?: () => void;
}) {
  return (
    <div className="rounded-t-lg bg-[#fbefe6] px-5 pb-4 pt-3">
      <div className="flex items-center justify-between gap-3 text-primary">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-semibold disabled:opacity-40"
          disabled={!onBack}
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-sm font-semibold disabled:opacity-40"
          disabled={!onEdit}
        >
          <Pencil className="size-4" />
          Edit
        </button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-end">
        <DateBlock date={shift.date} className="bg-white/80" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <RoleChip role={shift.role} />
            {shouldShowStatusChip(shift.status) && <StatusChip status={shift.status} />}
          </div>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">{fmtDate(shift.date)}</h2>
          <div className="mt-1 text-sm text-muted-foreground">
            {fmtGBP(shift.hourlyRate)} per hour - {shift.role === "Reception" ? "VCA" : shift.role}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {shift.start}-{shift.end} - {location.name}, {location.postcode}
          </div>
        </div>
        <div className="rounded-lg bg-white/75 p-3 text-left sm:text-right">
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">Value</div>
          <div className="mt-1 text-2xl font-semibold">{fmtGBP(calcShiftValue(shift))}</div>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium text-muted-foreground">{title}</div>
    </div>
  );
}

export function PipelineTabs({ tabs }: { tabs: PipelineTab[] }) {
  return (
    <TabsList className="grid h-auto w-full grid-cols-2 rounded-none border-b bg-transparent p-0 sm:grid-cols-5">
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className="rounded-none border-b-2 border-transparent px-3 py-3 text-base font-semibold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          {tab.label}
          {tab.count > 0 && (
            <span className="ml-2 inline-grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
              {tab.count}
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

export function ApplicantCard({
  locum,
  application,
  status,
  actions,
  onOpen,
}: {
  locum: Locum;
  application?: Application;
  status: string;
  actions?: ReactNode;
  onOpen: () => void;
}) {
  return (
    <article className="rounded-lg border bg-card p-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <button
          type="button"
          onClick={onOpen}
          className="grid min-w-0 gap-3 text-left sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center"
        >
          <Avatar locum={locum} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold">{locum.displayName}</span>
              <RoleChip role={locum.role} />
              <StatusChip status={status} />
            </div>
            <ApplicantStats locum={locum} />
            {application?.note && (
              <div className="mt-1 truncate text-sm italic text-muted-foreground">
                "{application.note}"
              </div>
            )}
          </div>
        </button>
        <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
      </div>
    </article>
  );
}

export function ApplicantDetailModal({
  locum,
  application,
  open,
  onOpenChange,
  onReject,
  onNegotiate,
  onAccept,
  acceptLabel = "Accept",
}: {
  locum: Locum;
  application?: Application;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject?: () => void;
  onNegotiate?: () => void;
  onAccept?: () => void;
  acceptLabel?: string;
}) {
  const verifiedDocs = locum.documents.filter(
    (document) => document.status === "verified" || document.status === "supplied",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Applicant details</DialogTitle>
        </DialogHeader>
        <div className="p-5">
          <div className="rounded-lg bg-muted/40 p-4">
            <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <Avatar locum={locum} large />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold">{locum.displayName}</h2>
                  <RoleChip role={locum.role} />
                </div>
                <ApplicantStats locum={locum} className="mt-2" />
              </div>
              <StatusChip
                status={locum.rcvs ? "verified" : "supplied"}
                icon={<BadgeCheck className="size-3" />}
              />
            </div>
          </div>

          <Tabs defaultValue="skills" className="mt-5">
            <TabsList className="h-auto rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="skills"
                className="rounded-none border-b-2 border-transparent px-0 py-3 mr-6 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                CV & Skills
              </TabsTrigger>
              <TabsTrigger
                value="shifts"
                className="rounded-none border-b-2 border-transparent px-0 py-3 mr-6 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Applied Shifts
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="skills" className="space-y-4 pt-4">
              <section>
                <div className="text-sm font-medium text-muted-foreground">
                  Personal information
                </div>
                <p className="mt-1 max-w-3xl text-sm leading-6">{locum.bio}</p>
              </section>
              <section className="grid gap-3 md:grid-cols-2">
                <InfoPanel label="Experience" value={`${locum.experienceYears} years`} />
                <InfoPanel label="Rate" value={`${fmtGBP(locum.hourlyRate)}/hr`} />
              </section>
              <section>
                <div className="text-sm font-medium text-muted-foreground">Skills</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(locum.specialisms ?? []).map((item) => (
                    <span key={item} className="rounded-md border bg-card px-2 py-1 text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </section>
              <section>
                <div className="text-sm font-medium text-muted-foreground">Documents</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {verifiedDocs.map((document) => (
                    <div key={document.name} className="rounded-md border bg-card p-3 text-sm">
                      <div className="font-medium">{document.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {document.fileName ?? document.kind ?? "Document"}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="shifts" className="pt-4">
              <div className="rounded-lg border bg-card p-4 text-sm">
                {locum.completedShifts} completed shifts. Current application{" "}
                {application ? `#${application.id}` : "ready for review"}.
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="pt-4">
              <div className="rounded-lg border bg-card p-4 text-sm">
                {locum.rating.toFixed(1)} rating from practice feedback.
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t bg-card px-5 py-4">
          {onReject && (
            <Button
              variant="ghost"
              onClick={onReject}
              className="mr-auto text-destructive hover:text-destructive"
            >
              Reject
            </Button>
          )}
          {onNegotiate && (
            <Button variant="outline" onClick={onNegotiate}>
              <MessageCircle className="size-4" />
              Negotiate
            </Button>
          )}
          {onAccept && (
            <Button onClick={onAccept}>
              <Check className="size-4" />
              {acceptLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ShiftCard({
  date,
  role,
  status,
  title,
  meta,
  value,
  actions,
  onClick,
}: {
  date: string;
  role: Shift["role"];
  status?: string;
  title: ReactNode;
  meta?: ReactNode;
  value?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <article
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) onClick();
      }}
      className={cn(
        "rounded-lg border bg-card p-3 transition-colors",
        onClick && "cursor-pointer hover:border-primary/50 hover:bg-accent/25",
      )}
    >
      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <DateBlock date={date} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <RoleChip role={role} />
            {status && shouldShowStatusChip(status) && <StatusChip status={status} />}
          </div>
          <div className="mt-1 font-semibold">{title}</div>
          {meta && <div className="mt-1 text-xs text-muted-foreground">{meta}</div>}
        </div>
        {value && <div className="text-sm font-semibold sm:text-right">{value}</div>}
      </div>
      {actions && (
        <div
          className="mt-3 flex flex-wrap gap-2 border-t pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </article>
  );
}

export function WorkCard({ children, className }: { children: ReactNode; className?: string }) {
  return <article className={cn("rounded-lg border bg-card p-3", className)}>{children}</article>;
}

export function MonthCalendar({
  month,
  selectedDate,
  dateStates,
  onSelectDate,
}: {
  month: Date;
  selectedDate?: string;
  dateStates: Map<string, string>;
  onSelectDate: (date: string) => void;
}) {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const startWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = useMemo(() => {
    const values: (string | null)[] = Array(startWeekday).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      values.push(
        `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      );
    }
    while (values.length % 7 !== 0) values.push(null);
    return values;
  }, [daysInMonth, month, startWeekday]);

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 text-center font-semibold">
        {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} className="aspect-square" />;
          const state = dateStates.get(date);
          const tone = state ? statusIntent(state) : "neutral";
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "aspect-square rounded-md border p-1.5 text-left text-sm transition-colors hover:border-primary/60",
                selectedDate === date && "ring-2 ring-primary",
                tone === "available" && "border-emerald-300 bg-emerald-50 text-emerald-950",
                tone === "pending" && "border-amber-300 bg-amber-50 text-amber-950",
                tone === "confirmed" && "border-blue-300 bg-blue-50 text-blue-950",
                tone === "done" && "border-green-300 bg-green-50 text-green-950",
                tone === "danger" && "border-red-300 bg-red-50 text-red-950",
                !state && "bg-background",
              )}
            >
              <span className="font-medium">{Number(date.slice(-2))}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ApplicantStats({ locum, className }: { locum: Locum; className?: string }) {
  const reliability = Math.min(100, Math.max(0, Math.round((locum.rating / 5) * 100)));
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground",
        className,
      )}
    >
      <span>
        <strong className="text-foreground">{reliability}%</strong> Reliability
      </span>
      <span>
        <strong className="text-foreground">{locum.completedShifts}</strong> shifts
      </span>
      <span className="inline-flex items-center gap-1">
        <strong className="text-foreground">{locum.rating.toFixed(1)}</strong>
        <Star className="size-4 fill-amber-400 text-amber-400" />
      </span>
      <span>{locum.experienceYears} years</span>
    </div>
  );
}

function Avatar({ locum, large }: { locum: Locum; large?: boolean }) {
  const initials = locum.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-full border bg-muted",
        large ? "size-16" : "size-12",
      )}
    >
      {locum.photoUrl ? (
        <img src={locum.photoUrl} alt={locum.displayName} className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center text-sm font-semibold">{initials}</div>
      )}
    </div>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
