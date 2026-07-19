import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";

type GlossaryEntry = {
  title: string;
  summary: string;
  description: string;
  examples: string[];
  ppcHours: number;
  regulation?: string;
};

/** Conteúdo espelhado de `ch-glossary.ts` (PPC Eng. Computação). */
const CH_GLOSSARY: GlossaryEntry[] = [
  {
    title: "Obrigatória",
    summary:
      "Disciplinas e componentes da matriz curricular que você precisa cursar e aprovar.",
    description:
      "No SIGAA, somam-se as horas dos componentes curriculares obrigatórios do PPC — núcleo básico, tecnológico e profissional, incluindo laboratórios, PFC e estágio quando previstos como obrigatórios na grade. É o bloco principal da integralização.",
    examples: [
      "Cálculo I, Algoritmos e Estruturas de Dados, Engenharia de Software",
      "Redes de Computadores, Arquitetura de Computadores, PFC e estágio curricular",
    ],
    ppcHours: 3105,
    regulation:
      "Engenharia de Computação — CEFET-MG Divinópolis (PPC v2, 4.320 h totais)",
  },
  {
    title: "Optativa (eletiva)",
    summary:
      "Eletivas do catálogo do seu curso, escolhidas por você na matrícula.",
    description:
      "Componentes optativos listados no PPC do Eng. Computação. No SIGAA costumam aparecer no 0º nível da matrícula. Contam aqui apenas eletivas do catálogo do curso — disciplina de outro curso ou IES entra em Complementar, não em Optativa.",
    examples: [
      "Ciência dos Dados, Inteligência Artificial (como optativa do PPC)",
      "Computação Gráfica, Linguagens Formais — quando cursadas como eletiva",
    ],
    ppcHours: 360,
    regulation: "Resoluções CEFET-MG · catálogo de optativas do PPC",
  },
  {
    title: "Complementar (ACC)",
    summary:
      "Atividades Complementares de Curso (ACC) homologadas fora da grade rígida.",
    description:
      "Eixo de Prática Profissional e Integração Curricular do CEFET-MG. Inclui iniciação científica (até 360 h), monitoria (até 180 h), extensão comunitária (até 120 h), prática profissional (até 90 h) e outras ACC (até 120 h), com documentação e avaliação do colegiado. O app permite cadastrar horas que o SIGAA ainda não refletiu.",
    examples: [
      "IC/PIC, monitoria em disciplina do CEFET-MG",
      "Curso de idiomas, participação na Semana de C&T, disciplina de outra IES homologada",
    ],
    ppcHours: 375,
    regulation:
      "DECOM CEFET-MG · Res. CEPE 24/08, CEPE 39/10, CGRAD 17/11 e 19/11",
  },
  {
    title: "Extensão universitária",
    summary:
      "Ações de extensão (universidade ↔ sociedade), com meta ~10% da CH total.",
    description:
      "Atividades extensionistas registradas no SIGAA e vinculadas à política de extensão do CEFET-MG (DEDC). O PPC exige cerca de 450 h (~10% de 4.320 h). Projetos, cursos, eventos e campanhas devem ser validados como extensão — não confundir com ACC genérica ou optativa.",
    examples: [
      "Projeto extensionista do CEFET-MG com CH lançada em Extensão",
      "Ação comunitária coordenada pela DEDC e validada no histórico",
    ],
    ppcHours: 450,
    regulation: "Res. CEPE 04/22 · Política de Extensão CEFET-MG",
  },
  {
    title: "Flexibilizada",
    summary:
      "CH de vivências especiais previstas no PPC e validadas pelo colegiado.",
    description:
      "Horas reconhecidas por experiências ou equivalências fora do fluxo padrão da grade — intercâmbio homologado, validação de competência ou atividade flexibilizada prevista no regulamento do curso. O PPC reserva 30 h nesta categoria.",
    examples: [
      "Intercâmbio ou equivalência de disciplina aprovada pelo colegiado",
      "Atividade flexibilizada prevista no PPC com validação formal",
    ],
    ppcHours: 30,
    regulation:
      "Engenharia de Computação — CEFET-MG Divinópolis (PPC v2, 4.320 h totais)",
  },
];

const INTRO =
  "O SIGAA agrupa sua formação em cinco tipos de carga horária. Os totais exigidos vêm do PPC do curso; o progresso é atualizado pelo histórico escolar e pelas ACC homologadas.";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Espelho de `ChGlossaryModal` + `ChGlossaryContent`. */
export function ChGlossaryModal({ open, onClose }: Props) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Entenda suas horas</Text>
            <Text style={styles.badge}>CEFET-MG · Eng. Computação</Text>
          </View>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.intro}>{INTRO}</Text>
            {CH_GLOSSARY.map((entry) => (
              <View key={entry.title} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{entry.title}</Text>
                  <Text style={styles.itemHours}>{entry.ppcHours}h</Text>
                </View>
                <Text style={styles.summary}>{entry.summary}</Text>
                <Text style={styles.description}>{entry.description}</Text>
                <Text style={styles.examplesLabel}>Exemplos</Text>
                {entry.examples.map((ex) => (
                  <Text key={ex} style={styles.example}>
                    · {ex}
                  </Text>
                ))}
                {entry.regulation ? (
                  <Text style={styles.regulation}>
                    <Text style={styles.regulationLabel}>Referência: </Text>
                    {entry.regulation}
                  </Text>
                ) : null}
              </View>
            ))}
            <Text style={styles.footer}>
              Fontes: PPC Eng. Computação (CEFET-MG Divinópolis), portal DECOM —{" "}
              <Text
                style={styles.link}
                onPress={() =>
                  void Linking.openURL(
                    "https://www.decom.cefetmg.br/ensino/graduacao/engenharia-de-computacao/atividades-complementares/"
                  )
                }
              >
                Atividades Complementares
              </Text>
              {" · "}
              <Text
                style={styles.link}
                onPress={() =>
                  void Linking.openURL("https://www.dedc.cefetmg.br/faq/")
                }
              >
                Extensão (DEDC)
              </Text>
            </Text>
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Fechar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: brand.bgSecondary,
    borderTopLeftRadius: brand.radiusLg,
    borderTopRightRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 12,
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  badge: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
    backgroundColor: "rgba(212,168,67,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.35)",
    borderRadius: brand.radiusSm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  scroll: { maxHeight: 520 },
  intro: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  item: {
    borderWidth: 1,
    borderColor: brand.borderMuted,
    borderRadius: brand.radiusMd,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "flex-start",
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  itemHours: {
    fontSize: 13,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "700",
    color: brand.gold300,
  },
  summary: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
    lineHeight: 18,
  },
  description: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 17,
  },
  examplesLabel: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  example: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 17,
  },
  regulation: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 15,
  },
  regulationLabel: {
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
  footer: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 11,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 16,
  },
  link: {
    color: brand.gold200,
    textDecorationLine: "underline",
  },
  closeBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
  },
  closeText: {
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
});
