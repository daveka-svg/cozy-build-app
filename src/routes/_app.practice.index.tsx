import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { calcShiftValue, useStore } from "@/lib/store";
import {
  DateBlock,
  MetricTile,
  Panel,
  RoleChip,
  StatusChip,
  fmtDate,
  fmtGBP,
} from "@/components/Bits";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Clock,
  FileText,
  MessageCircle,
  Mail,
  Plus,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { ApplicationsModal } from "@/components/ApplicationsModal";
import { LocumProfileModal } from "@/components/LocumProfileModal";
import { LocumIdentity } from "@/components/LocumIdentity";

export const Route = createFileRoute("/_app/practice/")({
  head: () => ({ meta: [{ title: "Practice Dashboard - Every Tail Locums" }] }),
  component: PracticeDashboard,
});

function PracticeDashboard() {
  const { shifts, applications, locums, currentPracticeId, practices, timesheets, invoices } =
    useStore();
  const [openShiftId, setOpenShiftId] = useState<string | null>(null);
  const [profileLocumId, setProfileLocumId] = useState<string | null>(null);
  const practice = practices.find((p) => p.id === currentPracticeId)!;
  const myShifts = shifts.filter((s) => s.practiceId === currentPracticeId);

  const newApps = applications
    .filter((a) => a.status === "Applied" && myShifts.some((s) => s.id === a.shiftId))
    .map((a) => ({
      a,
      s: myShifts.find((s) => s.id === a.shiftId)!,
      l: locums.find((l) => l.id === a.locumId)!,
    }))
    .sort((x, y) => x.s.date.localeCompare(y.s.date));

  const upcoming = myShifts
    .filter((s) => s.status === "Booked" && s.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const booked = applications.find((a) => a.shiftId === s.id && a.status === "Booked");
      return { s, l: booked ? locums.find((l) => l.id === booked.locumId) : undefined };
    });
  const submittedTimesheets = timesheets.filter((timesheet) => {
    const shift = myShifts.find((item) => item.id === timesheet.shiftId);
    return shift && timesheet.status === "Submitted";
  });
  const invoiceChecks = invoices.filter((invoice) => {
    const shift = myShifts.find((item) => item.id === invoice.shiftId);
    return shift && invoice.status !== "Paid outside platform";
  });
  const bookedValue = upcoming.reduce((sum, item) => sum + calcShiftValue(item.s), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title={practice.tradingName}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/book/$shareSlug" params={{ shareSlug: practice.shareSlug }}>
                <CalendarDays className="size-4" /> Share
              </Link>
            </Button>
            <Button asChild>
              <Link to="/practice/post">
                <Plus className="size-4" /> Shift
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Requests"
          value={newApps.length}
          icon={<FileText className="size-4" />}
        />
        <MetricTile
          label="Booked"
          value={upcoming.length}
          icon={<CalendarDays className="size-4" />}
        />
        <MetricTile
          label="Hours"
          value={submittedTimesheets.length}
          icon={<Clock className="size-4" />}
        />
        <MetricTile
          label="Invoice"
          value={invoiceChecks.length}
          detail={fmtGBP(bookedValue)}
          icon={<WalletCards className="size-4" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel
          title="Requests"
          action={
            newApps.length > 0 ? (
              <StatusChip status={`${newApps.length} request${newApps.length === 1 ? "" : "s"}`} />
            ) : undefined
          }
        >
          <div className="divide-y">
            {newApps.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No requests.</p>
                <Button variant="outline" asChild>
                  <Link to="/practice/post">Post</Link>
                </Button>
              </div>
            )}
            {newApps.map(({ a, s, l }) => (
              <div key={a.id} className="p-4 flex items-center gap-4">
                <DateBlock date={s.date} />
                <div className="flex-1 min-w-0">
                  <LocumIdentity
                    locum={l}
                    status={a.status === "Applied" ? "Request" : a.status}
                    onProfile={setProfileLocumId}
                  />
                </div>
                <Button size="sm" onClick={() => setOpenShiftId(s.id)}>
                  Review
                </Button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Booked"
          action={<span className="text-xs text-muted-foreground">{upcoming.length}</span>}
        >
          <div className="divide-y">
            {upcoming.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No shifts yet.</div>
            )}
            {upcoming.map(({ s, l }) => {
              const loc = practice.locations.find((x) => x.id === s.locationId);
              return (
                <div key={s.id} className="p-4 flex items-center gap-4">
                  <DateBlock date={s.date} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <RoleChip role={s.role} />
                    </div>
                    <div className="mt-2">
                      {l ? (
                        <LocumIdentity
                          locum={l}
                          onProfile={setProfileLocumId}
                          compact
                          showRole={false}
                        />
                      ) : (
                        <span className="font-medium">-</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {s.start}-{s.end} - {loc?.name} - {fmtDate(s.date)}
                    </div>
                  </div>
                  {l && (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${l.displayName}, looking forward to your ${s.role} shift on ${fmtDate(s.date)}.`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`mailto:${l.email}?subject=${encodeURIComponent(`${s.role} shift on ${fmtDate(s.date)}`)}`}
                        >
                          <Mail className="size-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {openShiftId && (
        <ApplicationsModal shiftId={openShiftId} onClose={() => setOpenShiftId(null)} />
      )}
      {profileLocumId && (
        <LocumProfileModal locumId={profileLocumId} onClose={() => setProfileLocumId(null)} />
      )}
    </div>
  );
}
