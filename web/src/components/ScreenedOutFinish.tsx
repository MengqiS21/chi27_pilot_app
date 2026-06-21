import { HeartHandshake } from "lucide-react";
import { SCREENED_OUT } from "@/content/screened-out";
import { PageHeader } from "@/components/PageHeader";

export function ScreenedOutFinish() {
  return (
    <>
      <PageHeader
        title={SCREENED_OUT.pageTitle}
        lead={SCREENED_OUT.lead}
        icon={HeartHandshake}
      />
      <div className="card space-y-4">
        {SCREENED_OUT.body.map((paragraph) => (
          <p key={paragraph} className="text-base leading-relaxed text-ink">
            {paragraph}
          </p>
        ))}
      </div>
    </>
  );
}
