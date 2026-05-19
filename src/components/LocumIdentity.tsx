import { MessageCircle } from "lucide-react";
import { RoleChip, StatusChip } from "@/components/Bits";
import type { Locum } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LocumIdentity({
  locum,
  status,
  onProfile,
  compact = false,
  showRole = true,
  className,
}: {
  locum: Locum;
  status?: string;
  onProfile: (locumId: string) => void;
  compact?: boolean;
  showRole?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-stone-100 font-semibold text-stone-700",
          compact ? "size-8 text-xs" : "size-9 text-sm",
        )}
      >
        {initials(locum.displayName)}
      </div>
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => onProfile(locum.id)}
          className="max-w-full truncate rounded-sm text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {locum.displayName}
        </button>
        {(showRole || status) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {showRole && <RoleChip role={locum.role} />}
            {status && <StatusChip status={status} />}
          </div>
        )}
      </div>
    </div>
  );
}

export function LocumContactLinks({ locum, className }: { locum: Locum; className?: string }) {
  const whatsappHref = `https://wa.me/${locum.whatsapp.replace(/[^0-9]/g, "")}`;

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", className)}>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <MessageCircle className="size-3.5" />
        {locum.whatsapp}
      </a>
      <a
        href={`mailto:${locum.email}`}
        className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {locum.email}
      </a>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}
