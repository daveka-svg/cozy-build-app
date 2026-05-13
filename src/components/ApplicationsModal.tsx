import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore, calcShiftValue } from "@/lib/store";
import { RoleChip, StatusChip, DateBlock, fmtDate, fmtGBP } from "./Bits";
import { MessageCircle, Mail, FileText, MapPin, ShieldCheck, X, Star } from "lucide-react";
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Applications</DialogTitle>
            <div className="flex items-start gap-4">
              <DateBlock date={shift.date} />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <RoleChip role={shift.role} />
                  <StatusChip status={shift.status} />
                  {shift.positionsNeeded > 1 && (
                    <span className="text-xs text-muted-foreground">{shift.positionsNeeded} positions</span>
                  )}
                </div>
                <div className="mt-1 text-sm">{shift.start}–{shift.end} · {fmtGBP(shift.hourlyRate)}/hr</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3" /> {location.name}, {location.postcode}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Total: {fmtGBP(calcShiftValue(shift))}</div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="new">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="new">New ({news.length})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({confirmed.length})</TabsTrigger>
              <TabsTrigger value="others">Other ({others.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-3">
              {news.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No new applicants yet.</p>}
              {news.map((a) => {
                const l = locums.find((x) => x.id === a.locumId)!;
                return (
                  <div key={a.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-full bg-primary/15 grid place-items-center text-sm font-semibold text-primary">
                        {l.displayName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{l.displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          {l.role} · {l.postcodeArea} · ★ {l.rating} · {l.completedShifts} shifts
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                          <span className="inline-flex items-center gap-1 text-muted-foreground"><FileText className="size-3" /> CV attached</span>
                          {l.rcvs && (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <ShieldCheck className="size-3" /> RCVS number provided: {l.rcvs}
                            </span>
                          )}
                        </div>
                        {a.note && <p className="text-sm mt-2 italic text-muted-foreground">"{a.note}"</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => setProfileLocumId(l.id)}>View profile</Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${l.displayName}, thanks for applying for our ${shift.role} shift on ${fmtDate(shift.date)}.`)}`} target="_blank" rel="noreferrer">
                          <MessageCircle className="size-4" /> WhatsApp
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={`mailto:${l.email}?subject=${encodeURIComponent(`${shift.role} shift on ${fmtDate(shift.date)}`)}`}>
                          <Mail className="size-4" /> Email
                        </a>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { notSelected(a.id); toast("Marked not selected"); }}>
                        <X className="size-4" /> Not selected
                      </Button>
                      {positionsLeft > 0 && (
                        <Button size="sm" className="ml-auto" onClick={() => { confirmBooking(a.id); toast.success("Booking confirmed"); }}>
                          <Star className="size-4" /> Confirm booking
                        </Button>
                      )}
                      {positionsLeft <= 0 && <span className="ml-auto text-xs text-muted-foreground self-center">Position filled</span>}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-3">
              {confirmed.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No bookings yet.</p>}
              {confirmed.map((a) => {
                const l = locums.find((x) => x.id === a.locumId)!;
                return (
                  <div key={a.id} className="rounded-lg border bg-card p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{l.displayName}</div>
                      <div className="text-xs text-muted-foreground">{l.email} · {l.whatsapp}</div>
                    </div>
                    <StatusChip status="Booked" />
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="others" className="space-y-3">
              {others.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">None.</p>}
              {others.map((a) => {
                const l = locums.find((x) => x.id === a.locumId)!;
                return (
                  <div key={a.id} className="rounded-lg border bg-card p-3 flex items-center justify-between">
                    <div className="text-sm">{l.displayName}</div>
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
