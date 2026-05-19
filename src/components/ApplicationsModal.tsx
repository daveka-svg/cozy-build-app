import { useState, type ReactNode } from "react";
import { Check, MessageCircle, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useStore, type Application, type Locum } from "@/lib/store";
import {
  ApplicantCard,
  ApplicantDetailModal,
  PipelineTabs,
  PlacementHeader,
  type PipelineTab,
} from "@/components/PlacementUI";

export function ApplicationsModal({ shiftId, onClose }: { shiftId: string; onClose: () => void }) {
  const {
    shifts,
    practices,
    locums,
    applications,
    confirmApplication,
    declineApplication,
    undoDecline,
    counterOffer,
  } = useStore();
  const shift = shifts.find((item) => item.id === shiftId);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  if (!shift) return null;

  const practice = practices.find((item) => item.id === shift.practiceId)!;
  const location = practice.locations.find((item) => item.id === shift.locationId)!;
  const rows = applications
    .filter((application) => application.shiftId === shift.id)
    .flatMap((application) => {
      const locum = locums.find((item) => item.id === application.locumId);
      return locum ? [{ application, locum }] : [];
    });

  const requested = rows.filter(({ application }) => application.status === "Requested");
  const applied = rows.filter(({ application }) => application.status === "Applied");
  const confirmed = rows.filter(
    ({ application }) => application.status === "Booked" && shift.status !== "Completed",
  );
  const completed = rows.filter(
    ({ application }) => application.status === "Booked" && shift.status === "Completed",
  );
  const declined = rows.filter(({ application }) =>
    ["Not selected", "Withdrawn", "Cancelled"].includes(application.status),
  );
  const selected = rows.find(({ application }) => application.id === selectedApplicationId);
  const positionsLeft = shift.positionsNeeded - confirmed.length - completed.length;
  const initialTab =
    requested.length > 0
      ? "requested"
      : applied.length > 0
        ? "applied"
        : confirmed.length > 0
          ? "confirmed"
          : declined.length > 0
            ? "declined"
            : "completed";

  const tabs: PipelineTab[] = [
    { value: "requested", label: "Requested", count: requested.length },
    { value: "applied", label: "Applied", count: applied.length },
    { value: "confirmed", label: "Confirmed", count: confirmed.length },
    { value: "declined", label: "Declined", count: declined.length },
    { value: "completed", label: "Completed", count: completed.length },
  ];

  const act = {
    accept: (application: Application) => {
      if (positionsLeft <= 0) {
        toast("Shift is filled");
        return;
      }
      confirmApplication(application.id);
      toast.success("Booked");
      setSelectedApplicationId(null);
    },
    reject: (application: Application) => {
      declineApplication(application.id);
      toast("Declined");
      setSelectedApplicationId(null);
    },
    undo: (application: Application) => {
      undoDecline(application.id);
      toast.success("Moved to Applied");
    },
    negotiate: (application: Application) => {
      counterOffer(application.id, "Practice wants to discuss this placement.");
      toast("Moved to Requested");
      setSelectedApplicationId(null);
    },
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-0">
          <DialogHeader>
            <DialogTitle className="sr-only">Placement</DialogTitle>
            <PlacementHeader
              shift={shift}
              location={location}
              title={`${practice.tradingName} placement`}
              onBack={onClose}
            />
          </DialogHeader>

          <Tabs defaultValue={initialTab}>
            <PipelineTabs tabs={tabs} />
            <div className="space-y-3 p-4">
              <TabsContent value="requested" className="m-0 space-y-3">
                <ApplicantList
                  rows={requested}
                  empty="No requests."
                  onOpen={setSelectedApplicationId}
                  actions={(application) => (
                    <>
                      <Button size="sm" variant="outline" onClick={() => act.reject(application)}>
                        <X className="size-4" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => act.accept(application)}>
                        <Check className="size-4" />
                        Accept
                      </Button>
                    </>
                  )}
                />
              </TabsContent>

              <TabsContent value="applied" className="m-0 space-y-3">
                <ApplicantList
                  rows={applied}
                  empty="No applications."
                  onOpen={setSelectedApplicationId}
                  actions={(application) => (
                    <>
                      <Button size="sm" variant="outline" onClick={() => act.reject(application)}>
                        <X className="size-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => act.negotiate(application)}
                      >
                        <MessageCircle className="size-4" />
                        Negotiate
                      </Button>
                      <Button size="sm" onClick={() => act.accept(application)}>
                        <Check className="size-4" />
                        Accept
                      </Button>
                    </>
                  )}
                />
              </TabsContent>

              <TabsContent value="confirmed" className="m-0 space-y-3">
                <ApplicantList
                  rows={confirmed}
                  empty="No bookings."
                  onOpen={setSelectedApplicationId}
                />
              </TabsContent>

              <TabsContent value="declined" className="m-0 space-y-3">
                <ApplicantList
                  rows={declined}
                  empty="No declined applicants."
                  onOpen={setSelectedApplicationId}
                  actions={(application) => (
                    <Button size="sm" variant="outline" onClick={() => act.undo(application)}>
                      <RotateCcw className="size-4" />
                      Undo
                    </Button>
                  )}
                />
              </TabsContent>

              <TabsContent value="completed" className="m-0 space-y-3">
                <ApplicantList
                  rows={completed}
                  empty="No completed work."
                  onOpen={setSelectedApplicationId}
                />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {selected && (
        <ApplicantDetailModal
          open
          locum={selected.locum}
          application={selected.application}
          onOpenChange={(open) => !open && setSelectedApplicationId(null)}
          onReject={
            selected.application.status === "Applied" || selected.application.status === "Requested"
              ? () => act.reject(selected.application)
              : undefined
          }
          onNegotiate={
            selected.application.status === "Applied"
              ? () => act.negotiate(selected.application)
              : undefined
          }
          onAccept={
            selected.application.status === "Applied" || selected.application.status === "Requested"
              ? () => act.accept(selected.application)
              : undefined
          }
        />
      )}
    </>
  );
}

function ApplicantList({
  rows,
  empty,
  onOpen,
  actions,
}: {
  rows: { application: Application; locum: Locum }[];
  empty: string;
  onOpen: (applicationId: string) => void;
  actions?: (application: Application) => ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return rows.map(({ application, locum }) => (
    <ApplicantCard
      key={application.id}
      locum={locum}
      application={application}
      status={application.status === "Not selected" ? "Declined" : application.status}
      onOpen={() => onOpen(application.id)}
      actions={actions?.(application)}
    />
  ));
}
