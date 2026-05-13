import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, Users, PawPrint, ArrowRight, ShieldCheck, Calendar, MessageCircle } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Every Tail Locums — Veterinary shift marketplace" },
      { name: "description", content: "Post and find vet, nurse and reception locum shifts. Practice approval required, no instant booking." },
      { property: "og:title", content: "Every Tail Locums" },
      { property: "og:description", content: "A simple shift marketplace for veterinary practices and locums." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Landing() {
  const setViewerRole = useStore((s) => s.setViewerRole);
  const navigate = useNavigate();
  const enter = (role: "practice" | "locum") => {
    setViewerRole(role);
    navigate({ to: role === "practice" ? "/practice" : "/locum" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <PawPrint className="size-4" />
            </div>
            <span className="font-semibold tracking-tight">Every Tail Locums</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link to="/practice" onClick={() => setViewerRole("practice")} className="px-3 py-1.5 text-muted-foreground hover:text-foreground">For practices</Link>
            <Link to="/locum" onClick={() => setViewerRole("locum")} className="px-3 py-1.5 text-muted-foreground hover:text-foreground">For locums</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="py-20 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-6">
            <ShieldCheck className="size-3.5" /> Practice approval required — no instant booking
          </span>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl mx-auto">
            A simple shift marketplace for veterinary practices and locums.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Post a shift. Locum applies and shares CV. Practice confirms one. Both sides talk on WhatsApp or email.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto mt-10">
            <button
              onClick={() => enter("practice")}
              className="group rounded-xl border bg-card p-6 text-left hover:border-primary/50 transition-colors"
            >
              <Building2 className="size-6 text-primary" />
              <div className="mt-3 font-semibold">I'm a practice</div>
              <p className="text-sm text-muted-foreground mt-1">Post Vet, Nurse or Reception shifts. Review applicants. Confirm one.</p>
              <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 font-medium">
                Open practice view <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
            <button
              onClick={() => enter("locum")}
              className="group rounded-xl border bg-card p-6 text-left hover:border-primary/50 transition-colors"
            >
              <Users className="size-6 text-primary" />
              <div className="mt-3 font-semibold">I'm a locum</div>
              <p className="text-sm text-muted-foreground mt-1">Find shifts by date, role and rate. Apply with your CV in one tap.</p>
              <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 font-medium">
                Open locum view <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4 pb-20">
          {[
            { icon: Calendar, title: "Date-led", body: "Every shift, application and booking leads with the date — because that's what matters." },
            { icon: ShieldCheck, title: "Approval based", body: "Practices review applicants and confirm one. No instant bookings, no surprises." },
            { icon: MessageCircle, title: "Talk directly", body: "After applying, both sides see WhatsApp and email. No internal messaging maze." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5">
              <f.icon className="size-5 text-primary" />
              <div className="font-medium mt-3">{f.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-muted-foreground flex justify-between">
          <span>© 2026 Every Tail Locums</span>
          <span>MVP demo — money moves outside the platform.</span>
        </div>
      </footer>
    </div>
  );
}
