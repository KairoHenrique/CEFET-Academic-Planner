import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "../navigation/types";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { Screen } from "../ui/Screen";

type Nav = NativeStackNavigationProp<MoreStackParamList, "MoreHome">;

type MenuItem = {
  key: keyof Omit<MoreStackParamList, "MoreHome">;
  label: string;
  subtitle: string;
  icon: string;
};

const MENU: MenuItem[] = [
  {
    key: "Notificacoes",
    label: "Notificações",
    subtitle: "Mesmo feed do sino do site",
    icon: "🔔",
  },
  {
    key: "Sync",
    label: "Sync SIGAA",
    subtitle: "Enfileirar sincronização lite/full",
    icon: "↻",
  },
  {
    key: "Mapa",
    label: "Mapa PPC",
    subtitle: "Grade curricular + grafo",
    icon: "M",
  },
  {
    key: "Integralizacao",
    label: "Integralização",
    subtitle: "CH por categoria + horas manuais",
    icon: "I",
  },
  {
    key: "Simulador",
    label: "Simulador",
    subtitle: "Turmas, choques e simulações",
    icon: "S",
  },
  {
    key: "Planos",
    label: "Planos / PIX",
    subtitle: "Assinatura e chave-presente",
    icon: "P",
  },
  {
    key: "Perfil",
    label: "Perfil",
    subtitle: "Conta, contato e notificações",
    icon: "◎",
  },
];

export function MoreHomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <Screen title="Mais" subtitle="Ferramentas e configurações">
      {MENU.map((item) => (
        <Pressable
          key={item.key}
          style={({ pressed }) => [
            cardStyles.card,
            styles.menuItem,
            pressed && styles.pressed,
          ]}
          onPress={() => navigation.navigate(item.key)}
        >
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>{item.icon}</Text>
          </View>
          <View style={styles.textWrap}>
            <Text style={cardStyles.cardTitle}>{item.label}</Text>
            <Text style={cardStyles.cardMeta}>{item.subtitle}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>ACME HUB · CEFET Academic Planner</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(0,96,177,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 16,
    fontWeight: "800",
    color: brand.gold,
  },
  textWrap: { flex: 1 },
  chevron: {
    fontSize: 22,
    color: brand.gold,
    fontWeight: "300",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: brand.textMuted,
  },
});
