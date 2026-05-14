import { useState } from "react";
import { FileText, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useStore,
  type AttachmentKind,
  type AttachmentOwnerType,
  type ViewerRole,
} from "@/lib/store";

const attachmentKinds: AttachmentKind[] = [
  "CV",
  "Insurance",
  "Right to work",
  "RCVS",
  "Photo",
  "Shift brief",
  "Timesheet evidence",
  "Invoice PDF",
  "Other",
];

export function AttachmentManager({
  ownerType,
  ownerId,
  uploadedByRole,
  uploadedById,
  title = "Files",
  compact,
}: {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  uploadedByRole: ViewerRole | "guest";
  uploadedById?: string;
  title?: string;
  compact?: boolean;
}) {
  const attachments = useStore((s) =>
    s.attachments.filter(
      (attachment) => attachment.ownerType === ownerType && attachment.ownerId === ownerId,
    ),
  );
  const addAttachment = useStore((s) => s.addAttachment);
  const removeAttachment = useStore((s) => s.removeAttachment);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<AttachmentKind>("Other");

  const add = () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    addAttachment({
      ownerType,
      ownerId,
      name: cleanName,
      kind,
      url: url.trim() || undefined,
      uploadedByRole,
      uploadedById,
    });
    setName("");
    setUrl("");
    setKind("Other");
  };

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium">
          <FileText className="size-4 text-primary" />
          {title}
        </div>
        <span className="text-xs text-muted-foreground">{attachments.length} attached</span>
      </div>

      <div className="mt-3 space-y-2">
        {attachments.length === 0 && (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No files attached yet. Add a file name or link for the MVP demo.
          </div>
        )}
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-2 rounded-md border p-2 text-sm"
          >
            <FileText className="size-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{attachment.name}</div>
              <div className="text-xs text-muted-foreground">{attachment.kind}</div>
            </div>
            {attachment.url && (
              <Button size="icon" variant="ghost" asChild aria-label={`Open ${attachment.name}`}>
                <a href={attachment.url} target="_blank" rel="noreferrer">
                  <LinkIcon className="size-4" />
                </a>
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeAttachment(attachment.id)}
              aria-label={`Remove ${attachment.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className={compact ? "mt-3 grid gap-2" : "mt-4 grid gap-2 sm:grid-cols-[1fr_12rem]"}>
        <div>
          <Label>File name</Label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="CV, insurance, rota..."
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={kind} onValueChange={(value) => setKind(value as AttachmentKind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {attachmentKinds.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={compact ? "" : "sm:col-span-2"}>
          <Label>Optional link</Label>
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
      <Button className="mt-3" size="sm" onClick={add}>
        <Plus className="size-4" />
        Attach file
      </Button>
    </section>
  );
}
