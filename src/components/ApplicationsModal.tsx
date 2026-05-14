import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore, calcShiftValue } from "@/lib/store";
import { RoleChip, StatusChip, DateBlock, fmtDate, fmtGBP } from "./Bits";
import {
  CheckCircle2,
  CircleAlert,
  Mail,
  MapPin,
  MessageCircle,
  RotateCcw,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { LocumProfileModal } from "./LocumProfileModal";

export function ApplicationsModal({ shiftId, onClose }: { shiftId: string; onClose: () => void }) {
  const { shifts, practices, locums, applications, confirmBooking, notSelected } = useStore();
  const shift = shifts.find((s) => s.id === shiftId);
  const [profileLocumId, setProfileLocumId] = useState<string | null>(null);
  if (!shift) return null;

  const practice = practices.find((p) => p.id === shift.practiceId)!;
  const location = practice.locations.find((l) => l.id === shift.locationId)!;
  const apps = applications.filter((a) => a.shiftId === shift.id);
  const news = apps.filter((a) => a.status === "Applied");
  const confirmed = apps.filter((a) => a.status === "Booked");
  const others = apps.filter((a) => a.status === "Not selected" || a.status === "Withdrawn");
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

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new">
                <TabLabel icon={CircleAlert} label="New" count={news.length} />
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                <TabLabel icon={CheckCircle2} label="Booked" count={confirmed.length} />
              </TabsTrigger>
              <TabsTrigger value="others">
                <TabLabel icon={XCircle} label="Declined" count={others.length} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-3">
              {news.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No new applicants yet.
                </p>
              )}
              {news.map((application) => {
                const locum = locums.find((item) => item.id === application.locumId)!;
                return (
                  <div key={application.id} className="rounded-lg border bg-card p-3">
                    <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
                      <div className="grid size-9 place-items-center rounded-full bg-amber-50 text-sm font-semibold text-amber-700">
                        {initials(locum.displayName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setProfileLocumId(locum.id)}
                          className="rounded-sm text-left font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {locum.displayName}
                        </button>
                        <div className="text-xs text-muted-foreground">
                          {locum.role} - star {locum.rating} - {locum.completedShifts} shifts
                        </div>
                        {application.note && (
                          <p className="mt-1 text-sm italic text-muted-foreground">
                            "{application.note}"
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={`https://wa.me/${locum.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${locum.displayName}, thanks for applying for our ${shift.role} shift on ${fmtDate(shift.date)}.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`WhatsApp ${locum.displayName}`}
                          >
                            <MessageCircle className="size-4" />
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={`mailto:${locum.email}?subject=${encodeURIComponent(`${shift.role} shift on ${fmtDate(shift.date)}`)}`}
                            aria-label={`Email ${locum.displayName}`}
                          >
                            <Mail className="size-4" />
                          </a>
                        </Button>
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-3">
              {confirmed.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No bookings yet.</p>
              )}
              {confirmed.map((application) => {
                const locum = locums.find((item) => item.id === application.locumId)!;
                return (
                  <div
                    key={application.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setProfileLocumId(locum.id)}
                          className="rounded-sm text-left text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {locum.displayName}
                        </button>
                        <div className="text-xs text-muted-foreground">
                          {locum.email} - {locum.whatsapp}
                        </div>
                      </div>
                    </div>
                    <StatusChip status="Booked" />
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="others" className="space-y-3">
              {others.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">None.</p>
              )}
              {others.map((application) => {
                const locum = locums.find((item) => item.id === application.locumId)!;
                return (
                  <div
                    key={application.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <XCircle className="size-5 shrink-0 text-red-600" />
                      <button
                        type="button"
                        onClick={() => setProfileLocumId(locum.id)}
                        className="rounded-sm text-left text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {locum.displayName}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => undoDecline(application.id)}
                      >
                        <RotateCcw className="size-4" /> Undo
                      </Button>
                      <StatusChip status={application.status} />
                    </div>
                  </div>
                );
              })}
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

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}
