import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore, calcShiftValue, type Application, type Locum } from "@/lib/store";
import { RoleChip, StatusChip, DateBlock, fmtGBP } from "./Bits";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  MapPin,
  RotateCcw,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { LocumProfileModal } from "./LocumProfileModal";
import { LocumContactLinks, LocumIdentity } from "./LocumIdentity";

export function ApplicationsModal({ shiftId, onClose }: { shiftId: string; onClose: () => void }) {
  const { shifts, practices, locums, applications, confirmBooking, notSelected } = useStore();
  const shift = shifts.find((s) => s.id === shiftId);
  const [profileLocumId, setProfileLocumId] = useState<string | null>(null);
  if (!shift) return null;

  const practice = practices.find((p) => p.id === shift.practiceId)!;
  const location = practice.locations.find((l) => l.id === shift.locationId)!;
  const apps = applications.filter((a) => a.shiftId === shift.id);
  const news = apps.filter((a) => a.status === "Applied");
  const requested = apps.filter((a) => a.status === "Requested");
  const confirmed = apps.filter((a) => a.status === "Booked");
  const declined = apps.filter(
    (a) => a.status === "Not selected" || a.status === "Withdrawn" || a.status === "Cancelled",
  );
  const positionsLeft = shift.positionsNeeded - confirmed.length;

  const undoDecline = (applicationId: string) => {
    useStore.setState((state) => ({
      applications: state.applications.map((application) =>
        application.id === applicationId
          ? { ...application, status: "Applied", updatedAt: Date.now() }
          : application,
      ),
      shifts: state.shifts.map((item) =>
        item.id === shift.id && item.status === "Open"
          ? { ...item, status: "New applicants" }
          : item,
      ),
    }));
    toast.success("Moved back to New");
  };

  const locumFor = (application: Application) =>
    locums.find((item) => item.id === application.locumId)!;

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Applications</DialogTitle>
            <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-start">
              <DateBlock date={shift.date} className="mx-auto sm:mx-0" />
              <div className="min-w-0 text-center sm:text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <RoleChip role={shift.role} />
                  <StatusChip status={shift.status} />
                  {shift.positionsNeeded > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {shift.positionsNeeded} positions
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm">
                  {shift.start}-{shift.end}
                </div>
                <div className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground sm:justify-start">
                  <MapPin className="size-3" /> {location.name}, {location.postcode}
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Shift value
                </div>
                <div className="text-lg font-semibold">{fmtGBP(calcShiftValue(shift))}</div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="new">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="new">
                <TabLabel icon={CircleAlert} label="New" count={news.length} />
              </TabsTrigger>
              <TabsTrigger value="requested">
                <TabLabel icon={Clock3} label="Requested" count={requested.length} />
              </TabsTrigger>
              <TabsTrigger value="booked">
                <TabLabel icon={CheckCircle2} label="Booked" count={confirmed.length} />
              </TabsTrigger>
              <TabsTrigger value="declined">
                <TabLabel icon={XCircle} label="Declined" count={declined.length} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-2">
              <EmptyState show={news.length === 0}>No new applicants yet.</EmptyState>
              {news.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  locum={locumFor(application)}
                  status="New"
                  onProfile={setProfileLocumId}
                  actions={
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        onClick={() => {
                          notSelected(application.id);
                          toast("Marked declined");
                        }}
                      >
                        <X className="size-4" /> Decline
                      </Button>
                      {positionsLeft > 0 ? (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            confirmBooking(application.id);
                            toast.success("Booking confirmed");
                          }}
                        >
                          <CheckCircle2 className="size-4" /> Book
                        </Button>
                      ) : (
                        <span className="self-center text-xs text-muted-foreground">
                          Position filled
                        </span>
                      )}
                    </>
                  }
                />
              ))}
            </TabsContent>

            <TabsContent value="requested" className="space-y-2">
              <EmptyState show={requested.length === 0}>
                No booking requests waiting for locum review.
              </EmptyState>
              {requested.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  locum={locumFor(application)}
                  status="Requested"
                  onProfile={setProfileLocumId}
                />
              ))}
            </TabsContent>

            <TabsContent value="booked" className="space-y-2">
              <EmptyState show={confirmed.length === 0}>No bookings yet.</EmptyState>
              {confirmed.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  locum={locumFor(application)}
                  status="Booked"
                  onProfile={setProfileLocumId}
                />
              ))}
            </TabsContent>

            <TabsContent value="declined" className="space-y-2">
              <EmptyState show={declined.length === 0}>None.</EmptyState>
              {declined.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  locum={locumFor(application)}
                  status={application.status}
                  onProfile={setProfileLocumId}
                  actions={
                    <Button size="sm" variant="outline" onClick={() => undoDecline(application.id)}>
                      <RotateCcw className="size-4" /> Undo
                    </Button>
                  }
                />
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      {profileLocumId && (
        <LocumProfileModal locumId={profileLocumId} onClose={() => setProfileLocumId(null)} />
      )}
    </>
  );
}

function ApplicationRow({
  application,
  locum,
  status,
  onProfile,
  actions,
}: {
  application: Application;
  locum: Locum;
  status: string;
  onProfile: (locumId: string) => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <LocumIdentity
          locum={locum}
          status={status}
          onProfile={onProfile}
          className="min-w-[13rem]"
        />

        <div className="min-w-[12rem] flex-1">
          <LocumContactLinks locum={locum} />
          {application.note && (
            <p className="mt-1 truncate text-xs italic text-muted-foreground">
              "{application.note}"
            </p>
          )}
        </div>

        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

function EmptyState({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

function TabLabel({
  icon: Icon,
  label,
  count,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5" />
      {label} ({count})
    </span>
  );
}
