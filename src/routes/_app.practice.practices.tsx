import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { PublicLinkSettingsPanel } from "@/components/PublicLinkSettingsPanel";
import { useStore } from "@/lib/store";
import { Building2, MapPin, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/practice/practices")({
  head: () => ({ meta: [{ title: "Practice profile - Every Tail Locums" }] }),
  component: PracticesPage,
});

function PracticesPage() {
  const { practices, updatePracticeLocation } = useStore();
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Practice" />
      <div className="space-y-4">
        {practices.map((practice) => (
          <div key={practice.id} className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-primary/15 grid place-items-center text-primary">
                <Building2 className="size-5" />
              </div>
              <div>
                <div className="font-semibold">{practice.tradingName}</div>
                <div className="text-xs text-muted-foreground">{practice.legalName}</div>
              </div>
              <a
                className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline"
                href={practice.website}
                target="_blank"
                rel="noreferrer"
              >
                <Globe className="size-3.5" /> Website
              </a>
            </div>

            <LocationEditor
              practiceId={practice.id}
              location={practice.locations[0]}
              onChange={(patch) => updatePracticeLocation(practice.id, patch)}
            />

            <PublicLinkSettingsPanel practice={practice} />
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationEditor({
  practiceId,
  location,
  onChange,
}: {
  practiceId: string;
  location: {
    name: string;
    address: string;
    postcode: string;
    mapUrl?: string;
  };
  onChange: (patch: Partial<typeof location>) => void;
}) {
  return (
    <section className="mt-4 rounded-md border p-3">
      <div className="font-medium text-sm flex items-center gap-1.5">
        <MapPin className="size-3.5 text-muted-foreground" />
        Main location
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${practiceId}-location-name`}>Name</Label>
          <Input
            id={`${practiceId}-location-name`}
            value={location.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor={`${practiceId}-postcode`}>Postcode</Label>
          <Input
            id={`${practiceId}-postcode`}
            value={location.postcode}
            onChange={(event) => onChange({ postcode: event.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${practiceId}-address`}>Address</Label>
          <Input
            id={`${practiceId}-address`}
            value={location.address}
            onChange={(event) => onChange({ address: event.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${practiceId}-map`}>Google Maps link</Label>
          <Input
            id={`${practiceId}-map`}
            value={location.mapUrl ?? ""}
            onChange={(event) => onChange({ mapUrl: event.target.value })}
            placeholder="Paste Google Maps link"
          />
        </div>
      </div>
    </section>
  );
}
