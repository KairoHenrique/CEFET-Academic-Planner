"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PageTutorial } from "@/components/tutorial/PageTutorial";
import type { PageTutorialId } from "@/components/tutorial/page-tutorial-steps";

interface PageTutorialHelpButtonProps {
  tutorialId: PageTutorialId;
  label?: string;
}

export function PageTutorialHelpButton({
  tutorialId,
  label = "Como usar esta página",
}: PageTutorialHelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="page-help">
        <p className="recovery-entry-callout page-help-callout" role="tooltip">
          {label}
        </p>
        <button
          type="button"
          className="page-help-trigger"
          aria-label={`${label}. Abrir tutorial.`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Icon name="help-circle" size={16} aria-hidden="true" />
        </button>
      </div>

      <PageTutorial
        tutorialId={tutorialId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
