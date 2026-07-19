import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";
import { Icon, type IconName } from "./Icon";

export type SectionIcon =
  | "calendar"
  | "books"
  | "map"
  | "tasks"
  | "chart"
  | "bell"
  | "filter"
  | "clipboard";

const SECTION_TO_ICON: Record<SectionIcon, IconName> = {
  calendar: "calendar",
  books: "books",
  map: "map",
  tasks: "clipboard",
  chart: "chart",
  bell: "bell",
  filter: "filter",
  clipboard: "clipboard",
};

type Props = {
  title: string;
  icon?: SectionIcon;
  linkLabel?: string;
  onPressLink?: () => void;
  badge?: string;
  badgeTone?: "info" | "gold" | "success";
  stackLink?: boolean;
};

/** SectionHeader F28 — ícones SVG do site. */
export function SectionHeader({
  title,
  icon,
  linkLabel = "Ver tudo",
  onPressLink,
  badge,
  badgeTone = "info",
  stackLink = false,
}: Props) {
  const link = onPressLink ? (
    <Pressable
      onPress={onPressLink}
      hitSlop={8}
      style={styles.linkHit}
      accessibilityRole="link"
    >
      <Text style={styles.link}>{linkLabel}</Text>
      <Icon name="arrow-right" size={14} color={brand.gold} />
    </Pressable>
  ) : null;

  const titleBlock = (
    <View style={styles.left}>
      {icon ? (
        <View style={styles.iconBox}>
          <Icon name={SECTION_TO_ICON[icon]} size={16} color={brand.gold} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {badge ? (
        <View
          style={[
            styles.badge,
            badgeTone === "gold" && styles.badgeGold,
            badgeTone === "success" && styles.badgeSuccess,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              badgeTone === "gold" && styles.badgeTextGold,
              badgeTone === "success" && styles.badgeTextSuccess,
            ]}
          >
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (stackLink && link) {
    return (
      <View style={styles.headerStack}>
        {titleBlock}
        <View style={styles.linkRow}>{link}</View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      {titleBlock}
      {link}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: brand.space4,
    gap: brand.space2,
    minHeight: brand.touchMin,
  },
  headerStack: {
    marginBottom: brand.space4,
    gap: brand.space2,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: brand.radiusSm,
    backgroundColor: "rgba(212,168,67,0.16)",
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    fontSize: 12.5,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flexShrink: 1,
    minWidth: 0,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: brand.radiusSm,
    backgroundColor: "rgba(88,166,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(88,166,255,0.35)",
    flexShrink: 0,
  },
  badgeGold: {
    backgroundColor: "rgba(212,168,67,0.2)",
    borderColor: "rgba(212,168,67,0.35)",
  },
  badgeSuccess: {
    backgroundColor: "rgba(63,185,80,0.2)",
    borderColor: "rgba(63,185,80,0.35)",
  },
  badgeText: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#79B8FF",
    letterSpacing: 0.4,
  },
  badgeTextGold: { color: brand.gold200 },
  badgeTextSuccess: { color: "#5FD068" },
  linkRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  linkHit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minHeight: 44,
    paddingLeft: 4,
    flexShrink: 0,
  },
  link: {
    fontSize: 11.5,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold,
  },
});
