import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { Building2, MapPin, Globe } from "lucide-react";

export const Route = createFileRoute("/_app/practice/practices")({
  head: () => ({ meta: [{ title: "Practice profile — Every Tail Locums" }] }),
  component: PracticesPage,
});

function PracticesPage() {
  const { practices } = useStore();
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Practice profile" description="Identity, locations, and trust links shown to locums." />
      <div className="space-y-4">
        {practices.map((p) => (
          <div key={p.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-primary/15 grid place-items-center text-primary"><Building2 className="size-5" /></div>
              <div>
                <div className="font-semibold">{p.tradingName}</div>
                <div className="text-xs text-muted-foreground">{p.legalName}</div>
              </div>
              <a className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline" href={p.website} target="_blank" rel="noreferrer"><Globe className="size-3.5" /> Website</a>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {p.locations.map((l) => (
                <div key={l.id} className="rounded-md border p-3">
                  <div className="font-medium text-sm flex items-center gap-1.5"><MapPin className="size-3.5 text-muted-foreground" />{l.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{l.address} · {l.postcode}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
