import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PlusCircle,
  Calendar,
  Clock,
  Search,
  BookOpen,
  User,
  PawPrint,
  Building2,
  Users,
} from "lucide-react";
import { useStore, type ViewerRole } from "@/lib/store";
import { cn } from "@/lib/utils";

const practiceNav = [
  { to: "/practice", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/practice/post", label: "Post Shift", icon: PlusCircle },
  { to: "/practice/shifts", label: "Shifts", icon: Calendar },
  { to: "/practice/hours", label: "Hours", icon: Clock },
  { to: "/practice/practices", label: "Practice", icon: Building2 },
];

const locumNav = [
  { to: "/locum", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/locum/find", label: "Find Shifts", icon: Search },
  { to: "/locum/bookings", label: "Bookings", icon: BookOpen },
  { to: "/locum/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const viewerRole = useStore((s) => s.viewerRole);
  const setViewerRole = useStore((s) => s.setViewerRole);
  const currentPracticeId = useStore((s) => s.currentPracticeId);
  const practices = useStore((s) => s.practices);
  const location = useLocation();
  const nav = viewerRole === "practice" ? practiceNav : locumNav;
  const practice = practices.find((item) => item.id === currentPracticeId);

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r bg-sidebar">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <PawPrint className="size-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Every Tail</div>
            <div className="text-[11px] text-muted-foreground">Locums</div>
          </div>
        </Link>
        <nav className="p-3 flex-1 space-y-0.5">
          {nav.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 p-3 border-t">
          {viewerRole === "practice" && practice && (
            <Link
              to="/book/$shareSlug"
              params={{ shareSlug: practice.shareSlug }}
              className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Calendar className="size-4 text-primary" />
              Public calendar
            </Link>
          )}
          <RoleSwitch value={viewerRole} onChange={setViewerRole} />
        </div>
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden h-14 border-b flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <PawPrint className="size-4 text-primary" />
            <span className="text-sm font-semibold">Every Tail Locums</span>
          </Link>
          <RoleSwitch value={viewerRole} onChange={setViewerRole} compact />
        </header>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}

function RoleSwitch({
  value,
  onChange,
  compact,
}: {
  value: ViewerRole;
  onChange: (r: ViewerRole) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center rounded-md border bg-card p-0.5", compact && "text-xs")}>
      <button
        onClick={() => onChange("practice")}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors",
          value === "practice"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Building2 className="size-3.5" /> Practice
      </button>
      <button
        onClick={() => onChange("locum")}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors",
          value === "locum"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Users className="size-3.5" /> Locum
      </button>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
