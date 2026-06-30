"use client";

import { Fragment, memo, useMemo } from "react";
import {
  getDescriptionBlocks,
  URL_INLINE_PATTERN,
  type DescriptionBlock,
} from "@/lib/format/description-html";

const URL_INLINE_TEST = /^https?:\/\/\S+$/i;

interface FormattedDescriptionProps {
  text: string | null | undefined;
  className?: string;
  emptyLabel?: string;
}

const InlineText = memo(function InlineText({ text }: { text: string }) {
  const parts = useMemo(() => text.split(URL_INLINE_PATTERN), [text]);

  return (
    <>
      {parts.map((part, index) =>
        URL_INLINE_TEST.test(part) ? (
          <a
            key={`${index}-${part}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
          >
            {part}
          </a>
        ) : (
          <Fragment key={`${index}-${part}`}>{part}</Fragment>
        )
      )}
    </>
  );
});

const DescriptionBlockView = memo(function DescriptionBlockView({
  block,
}: {
  block: DescriptionBlock;
}) {
  if (block.kind === "heading") {
    return (
      <p className="desc-heading">
        <InlineText text={block.text} />
      </p>
    );
  }

  if (block.kind === "link") {
    return (
      <p className="desc-link">
        <a href={block.href} target="_blank" rel="noopener noreferrer">
          {block.text}
        </a>
      </p>
    );
  }

  if (block.kind === "list") {
    return (
      <ul className="desc-list">
        {block.items.map((item, index) => (
          <li key={`${index}-${item}`}>
            <InlineText text={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p>
      <InlineText text={block.text} />
    </p>
  );
});

export const FormattedDescription = memo(function FormattedDescription({
  text,
  className = "detail-description rich-description",
  emptyLabel,
}: FormattedDescriptionProps) {
  const blocks = useMemo(() => getDescriptionBlocks(text), [text]);

  if (blocks.length === 0) {
    if (!emptyLabel) return null;
    return <p className={className}>{emptyLabel}</p>;
  }

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <DescriptionBlockView key={`${block.kind}-${index}`} block={block} />
      ))}
    </div>
  );
});
