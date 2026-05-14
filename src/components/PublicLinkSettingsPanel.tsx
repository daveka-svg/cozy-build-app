import { Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Practice, PublicLinkSettings, Role } from "@/lib/store";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const roles: Role[] = ["Vet", "Nurse", "Reception"];

function fallbackSettings(practice: Practice): PublicLinkSettings {
  return {
    enabled: true,
    slug: practice.shareSlug,
    title: `${practice.tradingName} locum booking calendar`,
    intro:
      "Choose an open shift and request cover. The practice reviews every request before confirming.",
    visibleRoles: roles,
    showRates: true,
    showPracticeWebsite: true,
    requirePhone: true,
    requireCvLink: false,
    customFields: [],
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function PublicLinkSettingsPanel({ practice }: { practice: Practice }) {
  const updatePracticePublicLink = useStore((state) => state.updatePracticePublicLink);
  const settings = practice.publicLink ?? fallbackSettings(practice);
  const [copied, setCopied] = useState(false);
  const publicPath = `/book/${settings.slug || practice.shareSlug}`;
  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return publicPath;
    return `${window.location.origin}${publicPath}`;
  }, [publicPath]);

  const update = (patch: Partial<PublicLinkSettings>) => {
    updatePracticePublicLink(practice.id, patch);
  };

  const toggleRole = (role: Role, checked: boolean) => {
    const current = settings.visibleRoles.length ? settings.visibleRoles : roles;
    const next = checked
      ? [...new Set([...current, role])]
      : current.filter((item) => item !== role);
    update({ visibleRoles: next.length ? next : current });
  };

  const copyLink = () => {
    if (typeof navigator === "undefined") return;
    void navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="mt-5 rounded-lg border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Public booking link</div>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Customise the live calendar that locums and staff see before requesting shifts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => update({ enabled })}
            aria-label="Enable public booking link"
          />
          <span className={cn("text-xs font-medium", !settings.enabled && "text-muted-foreground")}>
            {settings.enabled ? "Published" : "Paused"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${practice.id}-booking-title`}>Page title</Label>
              <Input
                id={`${practice.id}-booking-title`}
                value={settings.title ?? ""}
                onChange={(event) => update({ title: event.target.value })}
                placeholder={`${practice.tradingName} locum calendar`}
              />
            </div>
            <div>
              <Label htmlFor={`${practice.id}-booking-slug`}>Link slug</Label>
              <Input
                id={`${practice.id}-booking-slug`}
                value={settings.slug}
                onChange={(event) =>
                  update({
                    slug:
                      slugify(event.target.value) || slugify(practice.tradingName) || practice.id,
                  })
                }
                placeholder="riverside-vets"
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`${practice.id}-booking-intro`}>Intro copy</Label>
            <Textarea
              id={`${practice.id}-booking-intro`}
              value={settings.intro ?? ""}
              onChange={(event) => update({ intro: event.target.value })}
              placeholder="Tell locums what kind of cover you need and how requests are reviewed."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SettingToggle
              label="Show rates"
              description="Display hourly and estimated total values on public shifts."
              checked={settings.showRates}
              onCheckedChange={(showRates) => update({ showRates })}
            />
            <SettingToggle
              label="Show website"
              description="Add a public practice website link to the booking page."
              checked={settings.showPracticeWebsite}
              onCheckedChange={(showPracticeWebsite) => update({ showPracticeWebsite })}
            />
            <SettingToggle
              label="Require phone"
              description="Ask applicants for WhatsApp or a direct phone number."
              checked={settings.requirePhone}
              onCheckedChange={(requirePhone) => update({ requirePhone })}
            />
            <SettingToggle
              label="Require CV link"
              description="Add a required CV/profile URL field to public requests."
              checked={settings.requireCvLink}
              onCheckedChange={(requireCvLink) => update({ requireCvLink })}
            />
          </div>

          <div className="rounded-md border p-3">
            <div className="text-sm font-medium">Visible roles</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {roles.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={(settings.visibleRoles.length
                      ? settings.visibleRoles
                      : roles
                    ).includes(role)}
                    onCheckedChange={(checked) => toggleRole(role, checked === true)}
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-md border p-3">
          <div className="text-xs font-medium uppercase text-muted-foreground">Live URL</div>
          <div className="mt-2 break-all rounded-md bg-muted p-2 text-xs">{publicUrl}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={copyLink}>
              <Copy className="size-4" />
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={publicPath} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Open
              </a>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Pausing keeps the settings but hides the public booking page from new applicants.
          </p>
        </aside>
      </div>
    </section>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border p-3">
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
