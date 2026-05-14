import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocumProfileContent } from "@/components/LocumProfileContent";

export function LocumProfileModal({ locumId, onClose }: { locumId: string; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Locum profile</DialogTitle>
        </DialogHeader>
        <LocumProfileContent locumId={locumId} mode="modal" />
      </DialogContent>
    </Dialog>
  );
}
