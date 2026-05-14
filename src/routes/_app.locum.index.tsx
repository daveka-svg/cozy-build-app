import { createFileRoute, Link } from "@tanstack/react-router";
import type { ElementType } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  CalendarClock,
  Clock,
  FileText,
  Search,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/AppShell";
import { DateBlock, RoleChip, StatusChip } from "@/components/Bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { calcShiftHours, useStore } from "@/lib/store";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export const Route = createFileRoute("/_app/locum/")({
  head: () => ({ meta: [{ title: "Locum Dashboard - Every Tail Locums" }] }),
  component: LocumDashboard,
});

function LocumDashboard() {
  const {
    locums,
    currentLocumId,
    applications,
    shifts,
    practices,
    timesheets,
    invoices,
    bookingRequests,
    locumAvailability,
    calendarSyncSettings,
    attachments,
  } = useStore();
  const me = locums.find((locum) => locum.id === currentLocumId);

  if (!me) {
    return (
      <div className="mx-auto max-w-5xl p-6 text-sm text-muted-foreground">
        Locum profile not found.
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const monthKey = today.slice(0, 7);
  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const myRows = applications
    .filter((application) => application.locumId === currentLocumId)
    .map((application) => ({
      application,
      shift: shifts.find((shift) => shift.id === application.shiftId),
    }))
    .filter(
      (
        row,
      ): row is { application: (typeof applications)[number]; shift: (typeof shifts)[number] } =>
        Boolean(row.shift),
    );

  const workedRows = myRows.filter(
    ({ application, shift }) =>
      application.status === "Booked" &&
      shift.status === "Completed" &&
      shift.date.startsWith(monthKey),
  );
  const upcomingRows = myRows
    .filter(
      ({ application, shift }) =>
        application.status === "Booked" && shift.date >= today && shift.status !== "Cancelled",
    )
    .sort((a, b) => a.shift.date.localeCompare(b.shift.date))
    .slice(0, 3);
  const pendingApplications = myRows.filter(
    ({ application }) => application.status === "Applied",
  ).length;
  const inboundRequests = bookingRequests.filter(
    (request) => request.locumId === currentLocumId && request.status === "Sent",
  ).length;
  const publicAvailability = locumAvailability.filter(
    (block) => block.locumId === currentLocumId && block.publicVisible && block.date >= today,
  ).length;
  const openShifts = shifts.filter(
    (shift) =>
      shift.date >= today && (shift.status === "Open" || shift.status === "New applicants"),
  ).length;

  const hoursWorked = workedRows.reduce((sum, { shift }) => {
    const timesheet = timesheets.find(
      (item) => item.shiftId === shift.id && item.locumId === currentLocumId,
    );
    return (
      sum +
      (timesheet
        ? calcActualHours(timesheet.actualStart, timesheet.actualEnd, timesheet.lunchMinutes)
        : calcShiftHours(shift))
    );
  }, 0);

  const earned = workedRows.reduce((sum, { shift }) => {
    const invoice = invoices.find(
      (item) => item.shiftId === shift.id && item.locumId === currentLocumId,
    );
    if (invoice) return sum + invoice.total;
    const timesheet = timesheets.find(
      (item) => item.shiftId === shift.id && item.locumId === currentLocumId,
    );
    const hours = timesheet
      ? calcActualHours(timesheet.actualStart, timesheet.actualEnd, timesheet.lunchMinutes)
      : calcShiftHours(shift);
    return sum + hours * shift.hourlyRate;
  }, 0);

  const requiredDocs = me.documents.filter((document) => document.required);
  const readyRequiredDocs = requiredDocs.filter(
    (document) => document.status === "verified" || document.status === "supplied",
  );
  const readinessItems = [
    { label: "CV", ready: me.cvAttached },
    { label: "RCVS", ready: me.role === "Reception" || Boolean(me.rcvs) },
    {
      label: "Required docs",
      ready: requiredDocs.length === 0 || readyRequiredDocs.length === requiredDocs.length,
    },
    { label: "Profile photo", ready: Boolean(me.photoUrl) },
    {
      label: "Files",
      ready: attachments.some(
        (attachment) => attachment.ownerType === "locum" && attachment.ownerId === me.id,
      ),
    },
    { label: "Availability", ready: publicAvailability > 0 },
  ];
  const readinessScore = Math.round(
    (readinessItems.filter((item) => item.ready).length / readinessItems.length) * 100,
  );
  const sync = calendarSyncSettings.find(
    (setting) => setting.ownerType === "locum" && setting.ownerId === currentLocumId,
  );

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title={`Hi, ${me.displayName}`}
        description={`Your locum month, profile readiness, and next bookings for ${monthLabel}.`}
      />

      <section className="mb-5 overflow-hidden rounded-lg border bg-card">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="size-16 overflow-hidden rounded-lg border bg-primary/10">
                {me.photoUrl ? (
                  <img src={me.photoUrl} alt={me.displayName} className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center font-semibold text-primary">
                    {initials(me.displayName)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <RoleChip role={me.role} />
                  <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium">
                    <Star className="size-3 text-primary" />
                    {me.rating.toFixed(1)}
                  </span>
                  <StatusChip status={sync?.status ?? "Calendar not connected"} />
                </div>
                <h2 className="mt-2 text-xl font-semibold">
                  {me.publicHeadline ?? `${me.role} locum around ${me.postcodeArea}`}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {me.availabilityNote ?? "Add an availability note so practices know when to ask."}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              <Button size="sm" asChild>
                <Link to="/locum/find">
                  <Search className="size-4" />
                  Find shifts
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/locum/bookings">
                  <Calendar className="size-4" />
                  My work
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/locum/profile">
                  <FileText className="size-4" />
                  Improve profile
                </Link>
              </Button>
            </div>
          </div>

          <div className="border-t bg-muted/20 p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Profile readiness</div>
                <div className="text-sm text-muted-foreground">
                  {readinessScore}% ready for practice review
                </div>
              </div>
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <Progress value={readinessScore} className="mt-3" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {readinessItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  {item.ready ? (
                    <BadgeCheck className="size-3.5 text-primary" />
                  ) : (
                    <FileText className="size-3.5 text-muted-foreground" />
                  )}
                  <span className={item.ready ? "" : "text-muted-foreground"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          label="Shifts worked"
          value={workedRows.length}
          detail={monthLabel}
          icon={CalendarClock}
        />
        <Stat
          label="Hours worked"
          value={hoursWorked.toFixed(1)}
          detail="Approved or completed"
          icon={Clock}
        />
        <Stat
          label="Earned"
          value={money.format(earned)}
          detail="Invoices or approved hours"
          icon={Wallet}
        />
        <Stat
          label="Pending"
          value={pendingApplications + inboundRequests}
          detail={`${pendingApplications} apps, ${inboundRequests} requests`}
          icon={FileText}
        />
        <Stat
          label="Open shifts"
          value={openShifts}
          detail="Available to browse"
          icon={Search}
          link={{ to: "/locum/find", label: "Browse" }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Upcoming bookings</h3>
              <p className="text-sm text-muted-foreground">
                Confirmed shifts that need travel, files, or calendar prep.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link to="/locum/bookings">
                View all
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingRows.length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No upcoming confirmed bookings. Search open shifts or publish availability for
                practices to request you.
              </div>
            )}
            {upcomingRows.map(({ application, shift }) => {
              const practice = practices.find((item) => item.id === shift.practiceId);
              const location = practice?.locations.find((item) => item.id === shift.locationId);
              return (
                <div key={application.id} className="flex gap-3 rounded-md border p-3">
                  <DateBlock date={shift.date} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <RoleChip role={shift.role} />
                      <StatusChip status={application.status} />
                    </div>
                    <div className="mt-1 font-medium">{practice?.tradingName ?? "Practice"}</div>
                    <div className="text-xs text-muted-foreground">
                      {shift.start}-{shift.end} at {location?.name ?? "Location"}{" "}
                      {location?.postcode ? `, ${location.postcode}` : ""}
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold">
                    {money.format(shift.hourlyRate)}/hr
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Calendar className="size-4 text-primary" />
            Availability and public link
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {publicAvailability} upcoming public availability slots. Practices can review your
            profile and ask for cover from your public page.
          </p>
          <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Public page</div>
            <a
              className="mt-1 block truncate font-medium text-primary hover:underline"
              href={`/availability/${me.publicProfile?.slug ?? me.id}`}
            >
              /availability/{me.publicProfile?.slug ?? me.id}
            </a>
          </div>
          <div className="mt-3 grid gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/locum/profile">
                Manage photos and docs
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/locum/bookings">
                Check applications and invoices
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
  icon: Icon,
  link,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: ElementType;
  link?: { to: string; label: string };
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
      {link && (
        <Link
          to={link.to}
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {link.label}
          <ArrowRight className="size-3" />
        </Link>
      )}
    </div>
  );
}

function calcActualHours(start: string, end: string, lunchMinutes: number) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute) - lunchMinutes;
  return Math.max(0, minutes / 60);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}
