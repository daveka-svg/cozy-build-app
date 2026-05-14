import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore, calcShiftValue } from "@/lib/store";
import { RoleChip, StatusChip, DateBlock, fmtDate, fmtGBP } from "./Bits";
import { MessageCircle, Mail, MapPin, X, Star } from "lucide-react";
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

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Applications</DialogTitle>
            <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-start">
              <DateBlock date={shift.date} className="mx-auto sm:mx-0" />
              <div className="min-w-0 text-center sm:text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <RoleChip role={shift.role} />
                  <StatusChip status={shift.status} />
                  {shift.positionsNeeded > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {shift.positionsNeeded} positions
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm">
                  {shift.start}–{shift.end} · {fmtGBP(shift.hourlyRate)}/hr
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-0.5">
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
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="new">New ({news.length})</TabsTrigger>
              <TabsTrigger value="confirmed">Booked ({confirmed.length})</TabsTrigger>
              <TabsTrigger value="others">Declined ({others.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-3">
              {news.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No new applicants yet.
                </p>
              )}
              {news.map((a) => {
                const l = locums.find((x) => x.id === a.locumId)!;
                return (
                  <div key={a.id} className="rounded-lg border bg-card p-4">
                    <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                      <div className="size-10 rounded-full bg-primary/15 grid place-items-center text-sm font-semibold text-primary">
                        {l.displayName
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => setProfileLocumId(l.id)}
                          className="font-medium text-left underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                        >
                          {l.displayName}
                        </button>
                        <div className="text-xs text-muted-foreground">
                          {l.role} · {l.postcodeArea} · ★ {l.rating} · {l.completedShifts} shifts
                        </div>
                        {a.note && (
                          <p className="text-sm mt-2 italic text-muted-foreground">"{a.note}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${l.displayName}, thanks for applying for our ${shift.role} shift on ${fmtDate(shift.date)}.`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="size-4" /> WhatsApp
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`mailto:${l.email}?subject=${encodeURIComponent(`${shift.role} shift on ${fmtDate(shift.date)}`)}`}
                        >
                          <Mail className="size-4" /> Email
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        onClick={() => {
                          notSelected(a.id);
                          toast("Marked declined");
                        }}
                      >
                        <X className="size-4" /> Decline
                      </Button>
                      {positionsLeft > 0 && (
                        <Button
                          size="sm"
                          className="ml-auto bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            confirmBooking(a.id);
                            toast.success("Booking confirmed");
                          }}
                        >
                          <Star className="size-4" /> Confirm booking
                        </Button>
                      )}
                      {positionsLeft <= 0 && (
                        <span className="ml-auto text-xs text-muted-foreground self-center">
                          Position filled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-3">
              {confirmed.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">No bookings yet.</p>
              )}
              {confirmed.map((a) => {
                const l = locums.find((x) => x.id === a.locumId)!;
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border bg-card p-3 flex items-center justify-between"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => setProfileLocumId(l.id)}
                        className="font-medium text-sm text-left underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        {l.displayName}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {l.email} · {l.whatsapp}
                      </div>
                    </div>
                    <StatusChip status="Booked" />
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="others" className="space-y-3">
              {others.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">None.</p>
              )}
              {others.map((a) => {
                const l = locums.find((x) => x.id === a.locumId)!;
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border bg-card p-3 flex items-center justify-between"
                  >
                    <button
                      type="button"
                      onClick={() => setProfileLocumId(l.id)}
                      className="text-sm text-left underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      {l.displayName}
                    </button>
                    <StatusChip status={a.status} />
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
