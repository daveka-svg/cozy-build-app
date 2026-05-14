import { createFileRoute } from "@tanstack/react-router";

import { AttachmentManager } from "@/components/AttachmentManager";
import { PageHeader } from "@/components/AppShell";
import { LocumProfileContent } from "@/components/LocumProfileContent";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_app/locum/profile")({
  head: () => ({ meta: [{ title: "Profile - Every Tail Locums" }] }),
  component: Profile,
});

function Profile() {
  const currentLocumId = useStore((state) => state.currentLocumId);
  const locum = useStore((state) => state.locums.find((item) => item.id === state.currentLocumId));

  return (
    <div className="mx-auto max-w-5xl p-6">
      <PageHeader
        title="Profile"
        description="Photos, documents, public availability, and the details practices use to decide who to book."
      />

      <div className="space-y-5">
        <LocumProfileContent locumId={currentLocumId} editable showContact={false} />

        {locum && (
          <AttachmentManager
            ownerType="locum"
            ownerId={locum.id}
            uploadedByRole="locum"
            uploadedById={locum.id}
            title="Upload documents and photo links"
          />
        )}
      </div>
    </div>
  );
}
