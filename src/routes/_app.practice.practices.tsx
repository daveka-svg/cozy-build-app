import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { PublicLinkSettingsPanel } from "@/components/PublicLinkSettingsPanel";
import { useStore, type Practice } from "@/lib/store";
import { Building2, MapPin, Globe, Image as ImageIcon, Upload } from "lucide-react";
import { type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/practice/practices")({
  head: () => ({ meta: [{ title: "Practice profile - Every Tail Locums" }] }),
  component: PracticesPage,
});

function PracticesPage() {
  const { practices, updatePracticeLocation, updatePracticeProfile } = useStore();
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

            <BrandingEditor
              practice={practice}
              onChange={(patch) => updatePracticeProfile(practice.id, patch)}
            />

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

function BrandingEditor({
  practice,
  onChange,
}: {
  practice: Practice;
  onChange: (patch: Partial<Practice>) => void;
}) {
  const initials = practice.tradingName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const uploadImage = (field: "logoUrl" | "coverUrl") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ [field]: String(reader.result) });
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  };

  return (
    <section className="mt-4 rounded-md border p-3">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <ImageIcon className="size-3.5 text-muted-foreground" />
        Public brand
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border bg-card">
        <div
          className="h-28 bg-muted bg-cover bg-center"
          style={practice.coverUrl ? { backgroundImage: `url(${practice.coverUrl})` } : undefined}
        />
        <div className="-mt-8 flex items-end gap-3 px-4 pb-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-card bg-primary text-lg font-semibold text-primary-foreground">
            {practice.logoUrl ? (
              <img
                src={practice.logoUrl}
                alt={`${practice.tradingName} logo`}
                className="size-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 pb-1">
            <div className="truncate font-semibold">{practice.tradingName}</div>
            <div className="text-xs text-muted-foreground">{practice.locations[0]?.postcode}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${practice.id}-logo-url`}>Round logo</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id={`${practice.id}-logo-url`}
              value={practice.logoUrl ?? ""}
              onChange={(event) => onChange({ logoUrl: event.target.value || undefined })}
              placeholder="Paste image URL"
            />
            <input
              id={`${practice.id}-logo-upload`}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={uploadImage("logoUrl")}
            />
            <Button variant="outline" size="icon" asChild>
              <label htmlFor={`${practice.id}-logo-upload`} aria-label="Upload logo">
                <Upload className="size-4" />
              </label>
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor={`${practice.id}-cover-url`}>Cover image</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id={`${practice.id}-cover-url`}
              value={practice.coverUrl ?? ""}
              onChange={(event) => onChange({ coverUrl: event.target.value || undefined })}
              placeholder="Paste image URL"
            />
            <input
              id={`${practice.id}-cover-upload`}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={uploadImage("coverUrl")}
            />
            <Button variant="outline" size="icon" asChild>
              <label htmlFor={`${practice.id}-cover-upload`} aria-label="Upload cover image">
                <Upload className="size-4" />
              </label>
            </Button>
          </div>
        </div>
      </div>
    </section>
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
