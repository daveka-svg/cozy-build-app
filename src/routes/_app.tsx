import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_app")({
  component: () => (
    <AppShell>
      <Outlet />
      <Toaster />
    </AppShell>
  ),
});
