import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { Search, FileText, ShieldCheck, Calendar, ArrowRight, Wallet } from "lucide-react";

export const Route = createFileRoute("/_app/locum/")({
  head: () => ({ meta: [{ title: "Locum Dashboard — Every Tail Locums" }] }),
  component: LocumDashboard,
});

function LocumDashboard() {
  const { locums, currentLocumId, applications, shifts } = useStore();
  const me = locums.find((l) => l.id === currentLocumId)!;
  const myApps = applications.filter((a) => a.locumId === currentLocumId);
  const bookings = myApps.filter((a) => a.status === "Booked").length;
  const pending = myApps.filter((a) => a.status === "Applied").length;
  const open = shifts.filter((s) => s.status === "Open" || s.status === "New applicants").length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title={`Hi, ${me.displayName}`} description="Your readiness and next actions." />

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Open shifts" value={open} icon={Search} link={{ to: "/locum/find", label: "Find shifts" }} />
        <Stat label="Applied" value={pending} icon={FileText} />
        <Stat label="Bookings" value={bookings} icon={Calendar} link={{ to: "/locum/bookings", label: "View" }} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="CV & documents" subtitle={me.cvAttached ? "CV attached" : "CV needed"} status={me.cvAttached ? "ok" : "warn"} link={{ to: "/locum/profile", label: "Manage" }} icon={FileText} />
        <Card title="Registration" subtitle={me.role === "Reception" ? "Not required" : me.rcvs ? `RCVS number provided: ${me.rcvs}` : "Add RCVS number"} status={me.role === "Reception" || me.rcvs ? "ok" : "warn"} link={{ to: "/locum/profile", label: "Edit" }} icon={ShieldCheck} />
        <Card title="Get paid" subtitle="Submit timesheet, then create invoice draft." link={{ to: "/locum/bookings", label: "Bookings" }} icon={Wallet} />
        <Card title="Find shifts" subtitle="Search by date, role and minimum rate." link={{ to: "/locum/find", label: "Browse" }} icon={Search} />
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, link }: { label: string; value: number; icon: React.ElementType; link?: { to: string; label: string } }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-3.5" />{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {link && <Link to={link.to} className="text-xs text-primary inline-flex items-center gap-1 mt-2 hover:underline">{link.label} <ArrowRight className="size-3" /></Link>}
    </div>
  );
}

function Card({ title, subtitle, status, link, icon: Icon }: { title: string; subtitle: string; status?: "ok" | "warn"; link?: { to: string; label: string }; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
      <div className={`size-9 rounded-md grid place-items-center ${status === "warn" ? "bg-warning/30 text-foreground" : "bg-primary/15 text-primary"}`}>
        <Icon className="size-4" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
        {link && <Link to={link.to} className="text-xs text-primary inline-flex items-center gap-1 mt-2 hover:underline">{link.label} <ArrowRight className="size-3" /></Link>}
      </div>
    </div>
  );
}
