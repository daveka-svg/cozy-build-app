import { CalendarCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export function GoogleCalendarSyncCard({
  ownerType,
  ownerId,
}: {
  ownerType: "practice" | "locum";
  ownerId: string;
}) {
  const setting = useStore((state) =>
    state.calendarSyncSettings.find(
      (item) => item.ownerType === ownerType && item.ownerId === ownerId,
    ),
  );
  const connect = useStore((state) => state.connectGoogleCalendarPlaceholder);
  const sync = useStore((state) => state.syncCalendarPlaceholder);
  const connected = setting?.status === "Connected";

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-primary/15 text-primary">
          <CalendarCheck className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Google Calendar</div>
          <div className="mt-2 text-xs text-muted-foreground">
            {setting?.status && (
              <span className="font-medium text-foreground">{setting.status}</span>
            )}
            {setting?.lastSyncedAt && (
              <span> Last sync {new Date(setting.lastSyncedAt).toLocaleString("en-GB")}</span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={connected ? "outline" : "default"}
          onClick={() => connect(ownerType, ownerId)}
        >
          <CalendarCheck className="size-4" />
          {connected ? "Reconnect" : "Connect"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!connected}
          onClick={() => sync(ownerType, ownerId)}
        >
          <RefreshCw className="size-4" />
          Sync
        </Button>
      </div>
    </section>
  );
}
