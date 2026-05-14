import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const defaultReasons = [
  "Locum unavailable",
  "Practice no longer needs cover",
  "Illness or emergency",
  "Rate or time changed",
  "Filled elsewhere",
  "Other",
];

export function CancellationDialog({
  open,
  title,
  description,
  confirmLabel = "Save reason",
  reasons = defaultReasons,
  defaultReason,
  destructive,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  reasons?: string[];
  defaultReason?: string;
  destructive?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, note?: string) => void;
}) {
  const firstReason = defaultReason ?? reasons[0] ?? "Other";
  const [reason, setReason] = useState(firstReason);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setReason(firstReason);
      setNote("");
    }
  }, [firstReason, open]);

  const submit = () => {
    const cleanReason = reason.trim() || "Other";
    const cleanNote = note.trim();
    onConfirm(cleanReason, cleanNote || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-md border bg-muted p-2">
              <AlertTriangle className="size-4 text-muted-foreground" />
            </span>
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Optional note</Label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add context for the other side..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep booking
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={submit}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
