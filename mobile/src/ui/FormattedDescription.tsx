import { Fragment, useMemo } from "react";
import { Linking, StyleSheet, Text } from "react-native";
import { brand } from "../theme/brand";

const URL_INLINE_PATTERN = /(https?:\/\/[^\s<]+)/g;
const URL_INLINE_TEST = /^https?:\/\/\S+$/i;

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function InlineText({ text }: { text: string }) {
  const parts = useMemo(() => text.split(URL_INLINE_PATTERN), [text]);

  return (
    <>
      {parts.map((part, index) =>
        URL_INLINE_TEST.test(part) ? (
          <Text
            key={`${index}-${part}`}
            style={styles.link}
            onPress={() => void Linking.openURL(part)}
          >
            {part}
          </Text>
        ) : (
          <Fragment key={`${index}-${part}`}>{part}</Fragment>
        )
      )}
    </>
  );
}

type Props = {
  text: string | null | undefined;
  emptyLabel?: string;
};

export function FormattedDescription({
  text,
  emptyLabel = "Sem descrição.",
}: Props) {
  const plain = useMemo(() => {
    const raw = (text ?? "").trim();
    if (!raw) return "";
    return stripHtml(raw);
  }, [text]);

  if (!plain) {
    return <Text style={styles.body}>{emptyLabel}</Text>;
  }

  return (
    <Text style={styles.body}>
      <InlineText text={plain} />
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    marginTop: 12,
  },
  link: {
    color: brand.gold,
    textDecorationLine: "underline",
  },
});
