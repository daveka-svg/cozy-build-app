import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Award,
  BadgeCheck,
  CalendarDays,
  Camera,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  Image,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Plus,
  Save,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { RoleChip, StatusChip } from "@/components/Bits";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useStore,
  type AttachmentKind,
  type CalendarSyncSettings,
  type Locum,
  type LocumAvailabilityWindow,
} from "@/lib/store";

type ProfileMode = "full" | "modal";

type EditableDocumentStatus = Locum["documents"][number]["status"];
type EditableDocumentVisibility = NonNullable<Locum["documents"][number]["visibility"]>;

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export function LocumProfileContent({
  locumId,
  editable = false,
  mode = "full",
  showContact = true,
}: {
  locumId: string;
  editable?: boolean;
  mode?: ProfileMode;
  showContact?: boolean;
}) {
  const {
    locums,
    attachments,
    locumAvailability,
    calendarSyncSettings,
    updateLocumProfile,
    updateLocumPublicProfile,
    connectGoogleCalendarPlaceholder,
    syncCalendarPlaceholder,
  } = useStore();
  const locum = locums.find((item) => item.id === locumId);

  if (!locum) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Locum profile not found.
      </div>
    );
  }

  const locumAttachments = attachments.filter(
    (attachment) => attachment.ownerType === "locum" && attachment.ownerId === locum.id,
  );
  const availability = locumAvailability
    .filter((block) => block.locumId === locum.id)
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  const sync = calendarSyncSettings.find(
    (setting) => setting.ownerType === "locum" && setting.ownerId === locum.id,
  );

  return (
    <div className={mode === "modal" ? "space-y-4" : "space-y-5"}>
      <ProfileHero locum={locum} mode={mode} showContact={showContact} />

      {editable && (
        <EditableProfilePanel
          locum={locum}
          onSave={(patch) => {
            updateLocumProfile(locum.id, patch);
            toast.success("Profile updated");
          }}
          onPublicSave={(patch) => {
            updateLocumPublicProfile(locum.id, patch);
            toast.success("Public profile settings saved");
          }}
        />
      )}

      <div className={mode === "modal" ? "grid gap-4" : "grid gap-4 lg:grid-cols-[1.05fr_0.95fr]"}>
        <ProfileSection title="Profile" icon={Award}>
          <p className="text-sm leading-6">{locum.bio}</p>
          <TagList items={locum.specialisms ?? []} empty="No specialisms added yet." />
          {locum.preferredLocations?.length ? (
            <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 text-primary" />
              <span>{locum.preferredLocations.join(", ")}</span>
            </div>
          ) : null}
        </ProfileSection>

        <ProfileSection title="Availability" icon={CalendarDays}>
          <p className="text-sm text-muted-foreground">
            {locum.availabilityNote ?? "No availability note added yet."}
          </p>
          <AvailabilityList availability={availability} compact={mode === "modal"} />
        </ProfileSection>
      </div>

      <div className={mode === "modal" ? "grid gap-4" : "grid gap-4 lg:grid-cols-[0.95fr_1.05fr]"}>
        <ProfileSection title="Documents" icon={FileCheck2}>
          {locum.cvText || locum.cvFileName ? (
            <div className="mb-3 rounded-md border bg-muted/30 p-3 text-sm">
              <div className="font-medium">CV</div>
              {locum.cvText && (
                <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-muted-foreground">
                  {locum.cvText}
                </p>
              )}
              {locum.cvFileName && (
                <div className="mt-2 text-xs text-muted-foreground">{locum.cvFileName}</div>
              )}
            </div>
          ) : null}
          <DocumentList documents={locum.documents} />
          {locumAttachments.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Attached files
              </div>
              {locumAttachments.map((attachment) => (
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
                    <Button
                      size="icon"
                      variant="ghost"
                      asChild
                      aria-label={`Open ${attachment.name}`}
                    >
                      <a href={attachment.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ProfileSection>

        <ProfileSection title="Photos" icon={Image}>
          <PhotoGrid locum={locum} />
        </ProfileSection>
      </div>

      {editable && (
        <div className="grid gap-4 lg:grid-cols-2">
          <DocumentEditor
            locum={locum}
            onChange={(documents) => updateLocumProfile(locum.id, { documents })}
          />
          <PhotoEditor
            locum={locum}
            onChange={(profilePhotos) => updateLocumProfile(locum.id, { profilePhotos })}
          />
        </div>
      )}

      {editable && (
        <GoogleCalendarPanel
          locum={locum}
          sync={sync}
          onConnect={() => connectGoogleCalendarPlaceholder("locum", locum.id)}
          onSync={() => syncCalendarPlaceholder("locum", locum.id)}
        />
      )}
    </div>
  );
}

function ProfileHero({
  locum,
  mode,
  showContact,
}: {
  locum: Locum;
  mode: ProfileMode;
  showContact: boolean;
}) {
  const publicSlug = locum.publicProfile?.slug ?? locum.id;
  const initials = locum.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      {locum.profilePhotos?.[0]?.url && mode === "full" ? (
        <div
          className="h-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${locum.profilePhotos[0].url})` }}
        />
      ) : null}
      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="size-20 shrink-0 overflow-hidden rounded-lg border bg-primary/10">
            {locum.photoUrl ? (
              <img
                src={locum.photoUrl}
                alt={locum.displayName}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-xl font-semibold text-primary">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <RoleChip role={locum.role} />
              {locum.publicProfile?.enabled ? (
                <StatusChip status="Public profile live" />
              ) : (
                <StatusChip status="Private profile" />
              )}
            </div>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">{locum.displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {locum.publicHeadline ??
                locum.publicProfile?.headline ??
                `${locum.role} locum cover around ${locum.postcodeArea}`}
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <MiniMetric
                icon={Clock}
                label="Experience"
                value={`${locum.experienceYears} years`}
              />
              <MiniMetric
                icon={BadgeCheck}
                label="Completed"
                value={`${locum.completedShifts} shifts`}
              />
              <MiniMetric
                icon={Wallet}
                label="Rate"
                value={`${money.format(locum.hourlyRate)}/hr`}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <Button size="sm" variant="outline" asChild>
            <a href={`/availability/${publicSlug}`}>
              <Link2 className="size-4" />
              Public availability
            </a>
          </Button>
          {showContact && (
            <>
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`https://wa.me/${locum.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`mailto:${locum.email}`}>
                  <Mail className="size-4" />
                  Email
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function EditableProfilePanel({
  locum,
  onSave,
  onPublicSave,
}: {
  locum: Locum;
  onSave: (patch: Partial<Locum>) => void;
  onPublicSave: (patch: Partial<NonNullable<Locum["publicProfile"]>>) => void;
}) {
  const [displayName, setDisplayName] = useState(locum.displayName);
  const [legalName, setLegalName] = useState(locum.legalName);
  const [photoUrl, setPhotoUrl] = useState(locum.photoUrl ?? "");
  const [headline, setHeadline] = useState(locum.publicHeadline ?? "");
  const [bio, setBio] = useState(locum.bio);
  const [postcodeArea, setPostcodeArea] = useState(locum.postcodeArea);
  const [hourlyRate, setHourlyRate] = useState(String(locum.hourlyRate));
  const [availabilityNote, setAvailabilityNote] = useState(locum.availabilityNote ?? "");
  const [publicSlug, setPublicSlug] = useState(locum.publicProfile?.slug ?? locum.id);
  const [publicHeadline, setPublicHeadline] = useState(locum.publicProfile?.headline ?? "");
  const [cvText, setCvText] = useState(locum.cvText ?? "");
  const [cvFileName, setCvFileName] = useState(locum.cvFileName ?? "");

  const uploadCvText = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCvText(String(reader.result ?? ""));
      setCvFileName(file.name);
    };
    reader.readAsText(file);
  };

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Adjust profile</h3>
          <p className="text-sm text-muted-foreground">
            Keep the practice-facing profile sharp, complete, and easy to trust.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() =>
            onSave({
              displayName: displayName.trim() || locum.displayName,
              legalName: legalName.trim() || locum.legalName,
              photoUrl: photoUrl.trim() || undefined,
              publicHeadline: headline.trim() || undefined,
              bio: bio.trim() || locum.bio,
              postcodeArea: postcodeArea.trim() || locum.postcodeArea,
              hourlyRate: Number(hourlyRate) || locum.hourlyRate,
              availabilityNote: availabilityNote.trim() || undefined,
              cvText: cvText.trim() || undefined,
              cvFileName: cvFileName.trim() || undefined,
              cvAttached: Boolean(cvText.trim() || cvFileName.trim()),
            })
          }
        >
          <Save className="size-4" />
          Save
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Display name" value={displayName} onChange={setDisplayName} />
        <Field label="Legal name" value={legalName} onChange={setLegalName} />
        <Field
          label="Profile photo URL"
          value={photoUrl}
          onChange={setPhotoUrl}
          placeholder="https://..."
        />
        <Field label="Postcode area" value={postcodeArea} onChange={setPostcodeArea} />
        <Field label="Hourly rate" type="number" value={hourlyRate} onChange={setHourlyRate} />
        <Field label="Public page slug" value={publicSlug} onChange={setPublicSlug} />
        <div className="sm:col-span-2">
          <Label>Public headline</Label>
          <Input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder="Reliable small animal vet cover..."
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Bio</Label>
          <Textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} />
        </div>
        <div className="sm:col-span-2">
          <Label>CV text file</Label>
          <Input type="file" accept=".txt,text/plain" onChange={uploadCvText} />
          {cvFileName && <div className="mt-1 text-xs text-muted-foreground">{cvFileName}</div>}
        </div>
        <div className="sm:col-span-2">
          <Label>CV text</Label>
          <Textarea
            value={cvText}
            onChange={(event) => {
              setCvText(event.target.value);
              if (!cvFileName && event.target.value.trim()) setCvFileName("cv-text.txt");
            }}
            rows={5}
            placeholder="Paste CV text here..."
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Availability note</Label>
          <Textarea
            value={availabilityNote}
            onChange={(event) => setAvailabilityNote(event.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="mt-4 rounded-md border bg-muted/30 p-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Public availability URL slug" value={publicSlug} onChange={setPublicSlug} />
          <Field
            label="Public page title"
            value={publicHeadline}
            onChange={setPublicHeadline}
            placeholder="Available Bristol vet cover"
          />
          <Button
            variant="outline"
            onClick={() =>
              onPublicSave({
                enabled: true,
                slug: publicSlug.trim() || locum.id,
                headline: publicHeadline.trim() || undefined,
                showRate: locum.publicProfile?.showRate ?? true,
                showAvailability: locum.publicProfile?.showAvailability ?? true,
              })
            }
          >
            Save public link
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Practices can use this page to review your profile, availability, and request cover.
        </p>
      </div>
    </section>
  );
}

function DocumentEditor({
  locum,
  onChange,
}: {
  locum: Locum;
  onChange: (documents: Locum["documents"]) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AttachmentKind>("Other");
  const [status, setStatus] = useState<EditableDocumentStatus>("supplied");
  const [visibility, setVisibility] = useState<EditableDocumentVisibility>("practice");
  const [fileName, setFileName] = useState("");

  const addDocument = () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    onChange([
      ...locum.documents,
      {
        name: cleanName,
        kind,
        status,
        required: false,
        visibility,
        fileName: fileName.trim() || undefined,
      },
    ]);
    setName("");
    setFileName("");
    setKind("Other");
    setStatus("supplied");
    setVisibility("practice");
    toast.success("Document added");
  };

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 font-medium">
        <FileText className="size-4 text-primary" />
        Add document record
      </div>
      <div className="mt-3 grid gap-2">
        <Field
          label="Document name"
          value={name}
          onChange={setName}
          placeholder="DBS, insurance, reference..."
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <SelectField
            label="Type"
            value={kind}
            onChange={(value) => setKind(value as AttachmentKind)}
            options={["CV", "Insurance", "Right to work", "RCVS", "Photo", "Other"]}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as EditableDocumentStatus)}
            options={["supplied", "missing", "expiring"]}
          />
          <SelectField
            label="Visible to"
            value={visibility}
            onChange={(value) => setVisibility(value as EditableDocumentVisibility)}
            options={["private", "practice", "public"]}
          />
        </div>
        <Field
          label="File name"
          value={fileName}
          onChange={setFileName}
          placeholder="insurance-2026.pdf"
        />
      </div>
      <Button className="mt-3" size="sm" onClick={addDocument}>
        <Plus className="size-4" />
        Add document
      </Button>
    </section>
  );
}

function PhotoEditor({
  locum,
  onChange,
}: {
  locum: Locum;
  onChange: (photos: NonNullable<Locum["profilePhotos"]>) => void;
}) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  const addPhoto = () => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    onChange([
      ...(locum.profilePhotos ?? []),
      { url: cleanUrl, caption: caption.trim() || "Profile photo" },
    ]);
    setUrl("");
    setCaption("");
    toast.success("Photo added");
  };

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 font-medium">
        <Camera className="size-4 text-primary" />
        Add profile photo
      </div>
      <div className="mt-3 grid gap-2">
        <Field label="Photo URL" value={url} onChange={setUrl} placeholder="https://..." />
        <Field
          label="Caption"
          value={caption}
          onChange={setCaption}
          placeholder="Surgery cover, consults, client care..."
        />
      </div>
      <Button className="mt-3" size="sm" onClick={addPhoto}>
        <Plus className="size-4" />
        Add photo
      </Button>
    </section>
  );
}

function GoogleCalendarPanel({
  locum,
  sync,
  onConnect,
  onSync,
}: {
  locum: Locum;
  sync?: CalendarSyncSettings;
  onConnect: () => void;
  onSync: () => void;
}) {
  const lastSynced = sync?.lastSyncedAt
    ? new Date(sync.lastSyncedAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not synced yet";

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <CalendarDays className="size-4 text-primary" />
            Google Calendar
          </div>
        </div>
        {sync && <StatusChip status={sync.status} />}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={onConnect}>
          Connect
        </Button>
        <Button size="sm" variant="outline" onClick={onSync}>
          Sync
        </Button>
        <span className="text-xs text-muted-foreground">{lastSynced}</span>
      </div>
    </section>
  );
}

function AvailabilityList({
  availability,
  compact,
}: {
  availability: LocumAvailabilityWindow[];
  compact: boolean;
}) {
  const upcoming = useMemo(
    () =>
      availability
        .filter((block) => block.date >= new Date().toISOString().slice(0, 10))
        .slice(0, compact ? 3 : 5),
    [availability, compact],
  );

  if (upcoming.length === 0) {
    return (
      <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        No upcoming availability published.
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {upcoming.map((block) => (
        <div
          key={block.id}
          className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
        >
          <div>
            <div className="font-medium">{formatDate(block.date)}</div>
            <div className="text-xs text-muted-foreground">
              {block.start}-{block.end}
              {block.note ? ` - ${block.note}` : ""}
            </div>
          </div>
          <StatusChip status={block.status ?? "Available"} />
        </div>
      ))}
    </div>
  );
}

function DocumentList({ documents }: { documents: Locum["documents"] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        No documents added yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((document) => (
        <div
          key={`${document.name}-${document.kind ?? "doc"}`}
          className="flex items-center gap-3 rounded-md border p-3 text-sm"
        >
          <FileText className="size-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{document.name}</span>
              {document.required ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  Required
                </span>
              ) : null}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {document.fileName ?? document.kind ?? "Document"}
              {document.expiry ? ` - expires ${formatDate(document.expiry)}` : ""}
            </div>
          </div>
          <StatusChip status={document.status} />
        </div>
      ))}
    </div>
  );
}

function PhotoGrid({ locum }: { locum: Locum }) {
  const photos = locum.profilePhotos ?? [];

  if (photos.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        No profile photos added yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {photos.map((photo) => (
        <figure key={photo.url} className="overflow-hidden rounded-md border bg-muted/30">
          <img src={photo.url} alt={photo.caption} className="h-32 w-full object-cover" />
          <figcaption className="p-2 text-xs text-muted-foreground">{photo.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function ProfileSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      {children}
    </section>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-background/60 p-2">
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function TagList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="mt-3 text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-md border bg-muted/40 px-2 py-1 text-xs">
          {item}
        </span>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
