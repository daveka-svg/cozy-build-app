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
  const setting = useStore((s) =>
    s.calendarSyncSettings.find((item) => item.ownerType === ownerType && item.ownerId === ownerId),
  );
  const connect = useStore((s) => s.connectGoogleCalendarPlaceholder);
  const sync = useStore((s) => s.syncCalendarPlaceholder);
  const connected = setting?.status === "Connected";

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-primary/15 text-primary">
          <CalendarCheck className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Google Calendar sync</div>
          <p className="mt-1 text-sm text-muted-foreground">
            MVP placeholder for pushing confirmed bookings and pulling busy blocks once auth and
            storage are live.
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-foreground">
              {setting?.status ?? "Not connected"}
            </span>
            {setting?.lastSyncedAt && (
              <span> · Last sync {new Date(setting.lastSyncedAt).toLocaleString("en-GB")}</span>
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
          {connected ? "Reconnect Google" : "Connect Google"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!connected}
          onClick={() => sync(ownerType, ownerId)}
        >
          <RefreshCw className="size-4" />
          Sync now
        </Button>
      </div>
    </section>
  );
}
