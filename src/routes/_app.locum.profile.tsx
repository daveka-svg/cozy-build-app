import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { FileText, ShieldCheck, Upload } from "lucide-react";

export const Route = createFileRoute("/_app/locum/profile")({
  head: () => ({ meta: [{ title: "Profile — Every Tail Locums" }] }),
  component: Profile,
});

function Profile() {
  const me = useStore((s) => s.locums.find((l) => l.id === s.currentLocumId))!;
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Profile" description="What practices see when you apply." />

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-primary/15 grid place-items-center text-primary font-semibold">
            {me.displayName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold">{me.displayName}</div>
            <div className="text-xs text-muted-foreground">{me.legalName} · {me.role} · {me.postcodeArea}</div>
          </div>
        </div>
        <p className="text-sm mt-4">{me.bio}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 font-medium"><FileText className="size-4 text-primary" /> CV</div>
          <p className="text-sm text-muted-foreground mt-1">{me.cvAttached ? "CV attached" : "No CV uploaded"}</p>
          <Button size="sm" variant="outline" className="mt-3"><Upload className="size-4" /> Upload CV</Button>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 font-medium"><ShieldCheck className="size-4 text-primary" /> Registration</div>
          {me.role === "Reception" ? (
            <p className="text-sm text-muted-foreground mt-1">RCVS not required for reception cover.</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">RCVS number provided: <span className="font-mono">{me.rcvs}</span></p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 mt-4">
        <div className="font-medium mb-2">Documents</div>
        <ul className="text-sm divide-y">
          {me.documents.map((d) => (
            <li key={d.name} className="flex justify-between py-2"><span>{d.name}</span><span className="text-muted-foreground">{d.status}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
