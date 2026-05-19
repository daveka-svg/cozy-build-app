import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, Building2, PawPrint, Users } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Every Tail Locums - Veterinary shift marketplace" },
      {
        name: "description",
        content: "Post and find vet, nurse and VCA locum shifts.",
      },
      { property: "og:title", content: "Every Tail Locums" },
      { property: "og:description", content: "Veterinary locum shifts." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const setViewerRole = useStore((state) => state.setViewerRole);
  const navigate = useNavigate();
  const enter = (role: "practice" | "locum") => {
    setViewerRole(role);
    navigate({ to: role === "practice" ? "/practice" : "/locum" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <PawPrint className="size-4" />
            </div>
            <span className="font-semibold">Every Tail Locums</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/practice"
              onClick={() => setViewerRole("practice")}
              className="px-3 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Practice
            </Link>
            <Link
              to="/locum"
              onClick={() => setViewerRole("locum")}
              className="px-3 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Locum
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Every Tail Locums</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <RoleCard
            icon={<Building2 className="size-6 text-primary" />}
            title="Practice"
            text="Post, review, book, approve."
            onClick={() => enter("practice")}
          />
          <RoleCard
            icon={<Users className="size-6 text-primary" />}
            title="Locum"
            text="Find, apply, work, invoice."
            onClick={() => enter("locum")}
          />
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-4xl justify-between px-6 py-5 text-xs text-muted-foreground">
          <span>2026 Every Tail Locums</span>
        </div>
      </footer>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  text,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-lg border bg-card p-5 text-left transition-colors hover:border-primary/50"
    >
      {icon}
      <div className="mt-3 font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
