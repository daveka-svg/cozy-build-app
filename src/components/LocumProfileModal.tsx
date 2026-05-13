import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { FileText, ShieldCheck, MessageCircle, Mail } from "lucide-react";

export function LocumProfileModal({ locumId, onClose }: { locumId: string; onClose: () => void }) {
  const l = useStore((s) => s.locums.find((x) => x.id === locumId));
  if (!l) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary/15 grid place-items-center text-primary font-semibold">
              {l.displayName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div>{l.displayName}</div>
              <div className="text-xs font-normal text-muted-foreground">{l.legalName} · {l.role} · {l.postcodeArea}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md border p-2"><div className="font-semibold text-base">★ {l.rating}</div><div className="text-muted-foreground">Rating</div></div>
          <div className="rounded-md border p-2"><div className="font-semibold text-base">{l.completedShifts}</div><div className="text-muted-foreground">Shifts</div></div>
          <div className="rounded-md border p-2"><div className="font-semibold text-base">{l.experienceYears}y</div><div className="text-muted-foreground">Experience</div></div>
        </div>

        <Section title="CV">
          <Button variant="outline" size="sm"><FileText className="size-4" /> Open CV</Button>
        </Section>

        <Section title="Registration">
          {l.role === "Reception" ? (
            <p className="text-sm text-muted-foreground">RCVS not required for reception cover.</p>
          ) : (
            <p className="text-sm flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> RCVS number provided: <span className="font-mono">{l.rcvs}</span>
            </p>
          )}
        </Section>

        <Section title="Profile">
          <p className="text-sm">{l.bio}</p>
        </Section>

        <Section title="Documents">
          <ul className="text-sm space-y-1">
            {l.documents.map((d) => (
              <li key={d.name} className="flex justify-between border-b py-1">
                <span>{d.name}</span>
                <span className="text-muted-foreground">{d.status}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Contact">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={`mailto:${l.email}`}>
                <Mail className="size-4" /> Email
              </a>
            </Button>
          </div>
        </Section>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 mt-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{title}</div>
      {children}
    </div>
  );
}
