import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { TurmaOfertadaCourse, ScheduleSlot } from "./types";
import type { CorequisitoObligation } from "./lib/corequisito-cluster-viability";
import type { SimuladorPlacementContext } from "./lib/corequisito-schedule-policy";
import {
  resolveEnrollmentCourseSelectability,
  shouldShowGroupScheduleConflictBadge,
} from "./lib/enrollment-course-selectability";
import {
  ENROLLMENT_COREQUISITO_ACTIVE_PREFIX,
  ENROLLMENT_SCHEDULE_PLACED_HINT,
  buildMultiHorarioBadgeLabel,
} from "./lib/enrollment-ui-messages";
import {
  ENROLLMENT_ELIGIBILITY_FILTER_LABELS,
  ENROLLMENT_ELIGIBILITY_FILTER_ORDER,
  filterEnrollmentCoursesByEligibility,
  filterEnrollmentCoursesByQuery,
  type EnrollmentEligibilityFilter,
} from "./lib/filter-enrollment-courses";
import {
  groupEnrollmentCourses,
  type EnrollmentCourseGroup,
} from "./lib/group-enrollment-courses";
import {
  formatDisciplinaCodeNames,
  formatTurmaHorarioDisplay,
  formatTurmaShortLabel,
} from "./lib/turma-course-utils";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";

export type EligibilityFilter = EnrollmentEligibilityFilter;

type Props = {
  curso: TurmaOfertadaCourse[];
  optativas: TurmaOfertadaCourse[];
  catalog: TurmaOfertadaCourse[];
  schedule: ScheduleSlot[][];
  placementContext: SimuladorPlacementContext;
  corequisitoObligation: CorequisitoObligation | null;
  selectedTurmaId: string | null;
  selectedGroupId: string | null;
  conflictTurmaIds?: ReadonlySet<string>;
  query: string;
  eligibility: EligibilityFilter;
  onQueryChange: (q: string) => void;
  onEligibilityChange: (f: EligibilityFilter) => void;
  onSelect: (course: TurmaOfertadaCourse) => void;
  onSelectGroup: (group: EnrollmentCourseGroup) => void;
};

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "danger" | "muted" | "gold" | "success" | "info" | "purple";
}) {
  return (
    <View style={[styles.pill, styles[`pill_${tone}`]]}>
      <Text style={[styles.pillText, styles[`pillText_${tone}`]]}>{label}</Text>
    </View>
  );
}

/** Catálogo F28 — grupos multi-horário + selectability 1:1 do site. */
export function EnrollmentCatalog({
  curso,
  optativas,
  catalog,
  schedule,
  placementContext,
  corequisitoObligation,
  selectedTurmaId,
  selectedGroupId,
  conflictTurmaIds,
  query,
  eligibility,
  onQueryChange,
  onEligibilityChange,
  onSelect,
  onSelectGroup,
}: Props) {
  const filteredCurso = filterEnrollmentCoursesByEligibility(
    filterEnrollmentCoursesByQuery(curso, query),
    eligibility
  );
  const filteredOpt = filterEnrollmentCoursesByEligibility(
    filterEnrollmentCoursesByQuery(optativas, query),
    eligibility
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.search}>
        <Icon name="search" size={14} color={brand.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar disciplina ou sigla…"
          placeholderTextColor={brand.textMuted}
          value={query}
          onChangeText={onQueryChange}
          autoCorrect={false}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {ENROLLMENT_ELIGIBILITY_FILTER_ORDER.map((id) => {
          const active = eligibility === id;
          return (
            <Pressable
              key={id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onEligibilityChange(id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {ENROLLMENT_ELIGIBILITY_FILTER_LABELS[id]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Section
        title="Grade do curso"
        courses={filteredCurso}
        catalog={catalog}
        schedule={schedule}
        placementContext={placementContext}
        corequisitoObligation={corequisitoObligation}
        selectedTurmaId={selectedTurmaId}
        selectedGroupId={selectedGroupId}
        conflictTurmaIds={conflictTurmaIds}
        onSelect={onSelect}
        onSelectGroup={onSelectGroup}
      />
      <Section
        title="Optativas"
        courses={filteredOpt}
        catalog={catalog}
        schedule={schedule}
        placementContext={placementContext}
        corequisitoObligation={corequisitoObligation}
        selectedTurmaId={selectedTurmaId}
        selectedGroupId={selectedGroupId}
        conflictTurmaIds={conflictTurmaIds}
        onSelect={onSelect}
        onSelectGroup={onSelectGroup}
      />
    </View>
  );
}

function Section({
  title,
  courses,
  catalog,
  schedule,
  placementContext,
  corequisitoObligation,
  selectedTurmaId,
  selectedGroupId,
  conflictTurmaIds,
  onSelect,
  onSelectGroup,
}: {
  title: string;
  courses: TurmaOfertadaCourse[];
  catalog: TurmaOfertadaCourse[];
  schedule: ScheduleSlot[][];
  placementContext: SimuladorPlacementContext;
  corequisitoObligation: CorequisitoObligation | null;
  selectedTurmaId: string | null;
  selectedGroupId: string | null;
  conflictTurmaIds?: ReadonlySet<string>;
  onSelect: (c: TurmaOfertadaCourse) => void;
  onSelectGroup: (g: EnrollmentCourseGroup) => void;
}) {
  if (courses.length === 0) return null;
  const groups = groupEnrollmentCourses(courses);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            catalog={catalog}
            schedule={schedule}
            placementContext={placementContext}
            corequisitoObligation={corequisitoObligation}
            selectedTurmaId={selectedTurmaId}
            selectedGroupId={selectedGroupId}
            conflictTurmaIds={conflictTurmaIds}
            onSelect={onSelect}
            onSelectGroup={onSelectGroup}
          />
        ))}
      </View>
    </View>
  );
}

function GroupCard({
  group,
  catalog,
  schedule,
  placementContext,
  corequisitoObligation,
  selectedTurmaId,
  selectedGroupId,
  conflictTurmaIds,
  onSelect,
  onSelectGroup,
}: {
  group: EnrollmentCourseGroup;
  catalog: TurmaOfertadaCourse[];
  schedule: ScheduleSlot[][];
  placementContext: SimuladorPlacementContext;
  corequisitoObligation: CorequisitoObligation | null;
  selectedTurmaId: string | null;
  selectedGroupId: string | null;
  conflictTurmaIds?: ReadonlySet<string>;
  onSelect: (c: TurmaOfertadaCourse) => void;
  onSelectGroup: (g: EnrollmentCourseGroup) => void;
}) {
  if (!group.multiVariant) {
    const course = group.variants[0];
    if (!course) return null;
    return (
      <CourseCard
        course={course}
        catalog={catalog}
        schedule={schedule}
        placementContext={placementContext}
        corequisitoObligation={corequisitoObligation}
        selected={selectedTurmaId === course.turmaSigaaId}
        conflict={Boolean(conflictTurmaIds?.has(course.turmaSigaaId))}
        onSelect={onSelect}
      />
    );
  }

  const primary = group.variants[0];
  const shortBase = formatTurmaShortLabel({ code: group.code, name: group.name });
  const isObrigatoria = primary?.categoria === "curso";
  const periodo = primary?.periodo ? `${primary.periodo}º Período` : null;
  const short = isObrigatoria && periodo ? `${shortBase} | ${periodo}` : shortBase;
  const showConflict = shouldShowGroupScheduleConflictBadge(
    group.variants,
    catalog,
    schedule,
    placementContext
  );
  const activeCoreqs = primary
    ? primary.coRequisitoCodes.filter(
        (code) => !primary.waivedCoRequisitoCodes.includes(code)
      )
    : [];
  const groupSelected = selectedGroupId === group.id;
  const variantSelected = group.variants.some(
    (v) => v.turmaSigaaId === selectedTurmaId
  );

  return (
    <View
      style={[
        styles.card,
        (groupSelected || variantSelected) && styles.cardSelected,
      ]}
    >
      <View
        style={[styles.accent, { backgroundColor: group.color || brand.gold400 }]}
      />
      <View style={styles.cardBody}>
        <Pressable onPress={() => onSelectGroup(group)}>
          <View style={styles.cardHead}>
            <Text style={styles.cardShort} numberOfLines={1}>
              {short}
            </Text>
            <View style={styles.badges}>
              {showConflict ? (
                <StatusPill label="Conflito" tone="muted" />
              ) : null}
              <StatusPill
                label={buildMultiHorarioBadgeLabel(group.variants.length)}
                tone="info"
              />
              {activeCoreqs.length > 0 && !showConflict ? (
                <StatusPill label="Coreq." tone="info" />
              ) : null}
            </View>
          </View>
          <Text style={styles.cardName} numberOfLines={2}>
            {group.name}
          </Text>
          {groupSelected ? (
            <Text style={styles.cardFoot}>
              Toque em um horário destacado na grade
            </Text>
          ) : (
            <Text style={styles.cardFoot}>
              {group.variants.length} horários — toque para ver na grade
            </Text>
          )}
        </Pressable>
        <View style={styles.slotChips}>
          {group.variants.map((variant) => {
            const state = resolveEnrollmentCourseSelectability(
              variant,
              catalog,
              schedule,
              placementContext,
              corequisitoObligation
            );
            const selected = selectedTurmaId === variant.turmaSigaaId;
            const conflict = Boolean(
              conflictTurmaIds?.has(variant.turmaSigaaId)
            );
            const chipLabel =
              formatTurmaHorarioDisplay(variant)?.replace(/^Horários:\s*/i, "") ??
              variant.turmaCodigo ??
              "Horário";
            return (
              <Pressable
                key={variant.turmaSigaaId}
                style={[
                  styles.slotChip,
                  selected && styles.slotChipSelected,
                  conflict && styles.slotChipConflict,
                  state.timeLocked && styles.slotChipLocked,
                  !state.selectable && !state.timeLocked && styles.slotChipDisabled,
                ]}
                disabled={!state.selectable && !state.timeLocked}
                onPress={() => onSelect(variant)}
              >
                <Text style={styles.slotChipText} numberOfLines={1}>
                  {chipLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function CourseCard({
  course,
  catalog,
  schedule,
  placementContext,
  corequisitoObligation,
  selected,
  conflict,
  onSelect,
}: {
  course: TurmaOfertadaCourse;
  catalog: TurmaOfertadaCourse[];
  schedule: ScheduleSlot[][];
  placementContext: SimuladorPlacementContext;
  corequisitoObligation: CorequisitoObligation | null;
  selected: boolean;
  conflict: boolean;
  onSelect: (c: TurmaOfertadaCourse) => void;
}) {
  const state = resolveEnrollmentCourseSelectability(
    course,
    catalog,
    schedule,
    placementContext,
    corequisitoObligation
  );
  const shortBase = formatTurmaShortLabel(course);
  const isObrigatoria = course.categoria === "curso";
  const periodo = course.periodo ? `${course.periodo}º Período` : null;
  const short = isObrigatoria && periodo ? `${shortBase} | ${periodo}` : shortBase;
  const horario = formatTurmaHorarioDisplay(course);
  const activeCoreqs = course.coRequisitoCodes.filter(
    (code) => !course.waivedCoRequisitoCodes.includes(code)
  );
  const uncertain =
    Boolean(course.scheduleWarningMessage) && !course.scheduleBlocker;

  return (
    <Pressable
      style={[
        styles.card,
        selected && styles.cardSelected,
        conflict && styles.cardConflict,
        state.timeLocked && styles.cardLocked,
        state.blockedByObligation && styles.cardBlocked,
        !state.selectable && !state.timeLocked && styles.cardDisabled,
      ]}
      disabled={!state.selectable && !state.timeLocked}
      onPress={() => onSelect(course)}
      accessibilityHint={state.tooltip}
    >
      <View
        style={[
          styles.accent,
          { backgroundColor: course.color || brand.gold400 },
          selected && styles.accentSelected,
        ]}
      />
      <View style={styles.cardBody}>
        <View style={styles.cardHead}>
          <Text style={styles.cardShort} numberOfLines={1}>
            {short}
          </Text>
          <View style={styles.badges}>
            {course.scheduleBlocker ? (
              <StatusPill label="Sem horário" tone="danger" />
            ) : state.timeLocked ? (
              <StatusPill label="Conflito" tone="muted" />
            ) : state.siblingBlocked ? (
              <StatusPill label="Trocar" tone="gold" />
            ) : state.schedulePlaced ? (
              <StatusPill label="Grade" tone="success" />
            ) : activeCoreqs.length > 0 ? (
              <StatusPill label="Coreq." tone="info" />
            ) : course.status === "conditional" ? (
              <StatusPill label="Cond." tone="purple" />
            ) : uncertain ? (
              <StatusPill label="Prov." tone="gold" />
            ) : null}
          </View>
        </View>
        <Text style={styles.cardName} numberOfLines={2}>
          {course.name}
        </Text>
        <Text style={styles.cardFoot} numberOfLines={2}>
          {state.schedulePlaced
            ? ENROLLMENT_SCHEDULE_PLACED_HINT
            : horario ?? (course.scheduleBlocker ? "Sem horário" : "\u00a0")}
        </Text>
        {activeCoreqs.length > 0 && !state.schedulePlaced ? (
          <Text style={styles.coreqHint} numberOfLines={2}>
            {ENROLLMENT_COREQUISITO_ACTIVE_PREFIX}{" "}
            {formatDisciplinaCodeNames(
              activeCoreqs,
              catalog,
              placementContext.disciplinaNames
            )}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: brand.space3, gap: 12 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: brand.radiusMd,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    color: brand.text,
    fontSize: 14,
    fontFamily: brand.fontBody,
    paddingVertical: 10,
  },
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
  },
  chipActive: {
    borderColor: brand.gold,
    backgroundColor: "rgba(0,96,177,0.35)",
  },
  chipText: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
  },
  chipTextActive: { color: brand.gold },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    width: "48%",
    flexGrow: 0,
    flexBasis: "48%",
    maxWidth: "48%",
    minHeight: 112,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: brand.radiusSm,
    backgroundColor: "rgba(255,255,255,0.02)",
    overflow: "hidden",
    flexDirection: "row",
  },
  cardSelected: {
    borderColor: "rgba(212,168,67,0.45)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  cardConflict: {
    borderColor: "rgba(248,81,73,0.5)",
  },
  cardLocked: {
    borderColor: "rgba(248,81,73,0.35)",
  },
  cardBlocked: {
    opacity: 0.55,
  },
  cardDisabled: {
    opacity: 0.4,
  },
  accent: {
    width: 3,
  },
  accentSelected: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 2,
    justifyContent: "center",
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  cardShort: {
    flexShrink: 1,
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: brand.gold300,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "flex-end",
  },
  pill: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 9,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
  pill_danger: {
    backgroundColor: "rgba(248,81,73,0.16)",
    borderColor: "rgba(248,81,73,0.4)",
  },
  pillText_danger: { color: "#FF7B72" },
  pill_muted: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: brand.border,
  },
  pillText_muted: { color: brand.textMuted },
  pill_gold: {
    backgroundColor: "rgba(212,168,67,0.14)",
    borderColor: "rgba(212,168,67,0.35)",
  },
  pillText_gold: { color: brand.gold200 },
  pill_success: {
    backgroundColor: "rgba(63,185,80,0.14)",
    borderColor: "rgba(63,185,80,0.35)",
  },
  pillText_success: { color: "#3FB950" },
  pill_info: {
    backgroundColor: "rgba(56,139,253,0.14)",
    borderColor: "rgba(56,139,253,0.35)",
  },
  pillText_info: { color: "#58A6FF" },
  pill_purple: {
    backgroundColor: "rgba(163,113,247,0.14)",
    borderColor: "rgba(163,113,247,0.35)",
  },
  pillText_purple: { color: "#A371F7" },
  cardName: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    lineHeight: 14,
  },
  cardFoot: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 13,
  },
  coreqHint: {
    marginTop: 2,
    fontSize: 9,
    fontFamily: brand.fontBody,
    color: "#58A6FF",
    lineHeight: 12,
  },
  slotChips: {
    marginTop: 8,
    flexDirection: "column",
    gap: 6,
  },
  slotChip: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: brand.radiusSm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "rgba(0,0,0,0.2)",
    width: "100%",
  },
  slotChipSelected: {
    borderColor: brand.gold,
    backgroundColor: "rgba(212,168,67,0.14)",
  },
  slotChipConflict: {
    borderColor: "rgba(248,81,73,0.5)",
  },
  slotChipLocked: {
    opacity: 0.7,
  },
  slotChipDisabled: {
    opacity: 0.4,
  },
  slotChipText: {
    fontSize: 10,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
});
