/**
 * Contratos de API compartilhados — ACME HUB.
 *
 * Fonte para o app Expo (`mobile/`). Espelham as respostas JSON das rotas
 * em `app/src/app/api/` / `app/src/lib/types/*`, sem dependências do Next.js.
 *
 * Bloco 8 · M2 — ver docs/TASKS.md e docs/SCOPE-CLOUD.md §7.
 */

export type AppCursoId =
  | "eng-computacao"
  | "eng-mecatronica"
  | "design-moda";

/** Espelha `app/src/lib/types/grade-risk.ts` (objeto, não string). */
export type GradeRiskZone = "safe" | "warning" | "danger" | "unknown";

export interface GradeRisk {
  zone: GradeRiskZone;
  label: string;
  pointsNeeded: number;
  passingGrade: number;
  currentTotal: number;
  passingProgress: number;
  remainingMax: number;
  canStillPass: boolean;
  fullyDistributed?: boolean;
  recoveryScoreNeeded?: number;
  recoveryScore?: number | null;
  recoveryAverage?: number;
  awaitingRecovery?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export interface AuthCursoOption {
  id: AppCursoId;
  label: string;
}

export interface AuthConfigResponse {
  ok: true;
  mode: "cloud" | "sigaa";
  cursos: AuthCursoOption[];
}

export interface AppProfileRecord {
  userId: string;
  cpf: string;
  email: string;
  telefone: string;
  cursoId: AppCursoId;
  createdAt: string;
}

export interface AuthSessionPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

export type PerfilSubscriptionStatus =
  | "trial_active"
  | "trial_expired"
  | "pending_payment"
  | "active"
  | "expired"
  | "cancelled";

/** Assinatura resolvida no login/cadastro (campos usados pelo gate). */
export interface SubscriptionAccessView {
  planId: string;
  planLabel: string;
  status: PerfilSubscriptionStatus;
  expiresAt: string;
  daysRemaining: number;
  renewHref: string;
  inGracePeriod?: boolean;
  renewalEligible?: boolean;
  blocked?: boolean;
}

export interface AccountAuthResponse {
  ok: true;
  profile: AppProfileRecord;
  session: AuthSessionPayload;
  subscription: SubscriptionAccessView;
}

export interface RegisterAccountBody {
  email: string;
  telefone: string;
  cpf: string;
  cursoId: AppCursoId;
  password: string;
  friendMatricula?: string;
  acceptedLegal: {
    terms: boolean;
    privacy: boolean;
    termsVersion: string;
    privacyVersion: string;
  };
}

export interface LoginAccountBody {
  cpf: string;
  password: string;
}

export interface RefreshAccountBody {
  refreshToken: string;
}

/** Resposta de `POST /api/auth/refresh` (M3 · mobile). */
export interface RefreshAuthResponse {
  ok: true;
  session: AuthSessionPayload;
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export interface DashboardAluno {
  matricula: string;
  nome: string;
  curso: string;
  email: string;
  semestreAtual: string;
  rg: number;
  status: string;
}

export interface DashboardStats {
  rg: number;
  integralizacaoPercent: number;
  disciplinasCursando: number;
  tarefasPendentes: number;
}

export interface IntegrationCategory {
  label: string;
  done: number;
  total: number;
  pending: number;
  color: "blue" | "gold" | "success" | "warning";
}

export interface DashboardIntegralizacao {
  totalHours: number;
  totalDone: number;
  percent: number;
  categories: IntegrationCategory[];
}

export type TaskType = "individual" | "grupo";

export interface AcademicTask {
  id: number;
  title: string;
  subject: string;
  subjectCode: string;
  subjectColor: string;
  date: string;
  dueDateIso: string;
  dueTime: string;
  type: TaskType;
  done: boolean;
  manual: boolean;
  description: string;
  instructions: string[];
  deliverables: string[];
  hasGrade: boolean;
  maxGrade?: number;
  sigaaLinkId?: string | null;
  submittable?: boolean;
}

export interface SubjectSummary {
  name: string;
  nickname: string | null;
  displayName: string;
  shortLabel: string;
  code: string;
  room: string;
  grade: number | null;
  gradeMax: number;
  passingGrade: number;
  gradeRisk: GradeRisk;
  absences: number;
  maxAbsences: number;
  tasks: number;
  color: string;
}

export interface DashboardResponse {
  aluno: DashboardAluno;
  stats: DashboardStats;
  integralizacao: DashboardIntegralizacao;
  tarefas: AcademicTask[];
  disciplinas: SubjectSummary[];
  /** Saldo do cartão do RU (Refeições Disponíveis). */
  ru?: {
    refeicoesDisponiveis: number | null;
    updatedAt: string | null;
  } | null;
}

/* -------------------------------------------------------------------------- */
/* Disciplinas                                                                */
/* -------------------------------------------------------------------------- */

export interface SubjectListItem extends SubjectSummary {
  ch?: number;
  professor?: string;
  schedule?: string;
}

export interface DisciplinaListResponse {
  items: SubjectListItem[];
}

export interface SubjectEvaluation {
  id?: number;
  name: string;
  max: number;
  score: number | null;
  manual?: boolean;
  userOverride?: boolean;
  extra?: boolean;
}

export interface SubjectDetail {
  name: string;
  officialName: string;
  nickname: string | null;
  displayName: string;
  shortLabel: string;
  code: string;
  room: string;
  syncedRoom: string | null;
  schedule?: string;
  syncedSchedule: string | null;
  professor?: string;
  syncedProfessor: string | null;
  ch?: number;
  syncedWeeklyHours: number | null;
  grade: number | null;
  gradeMax: number;
  passingGrade: number;
  gradeRisk: GradeRisk;
  evaluations: SubjectEvaluation[];
  absences: number;
  maxAbsences: number;
  tasks: number;
  color: string;
  ementa: string;
}

export type AttendanceStatus = "presente" | "falta" | "nao_registrada";

export interface AttendanceRecord {
  id: number;
  date: string;
  status: AttendanceStatus;
  quantidade?: number;
}

/** Paridade com `app/src/lib/types/attendance.ts`. */
export interface AttendanceSummary {
  records: AttendanceRecord[];
  daysRemaining: number;
}

export interface GrupoMembroDto {
  nome: string;
  matricula: string | null;
  email: string | null;
  curso: string | null;
}

export interface DisciplinaGrupoDto {
  nome: string | null;
  membros: GrupoMembroDto[];
}

export interface SubjectDetailResponse {
  subject: SubjectDetail;
  tasks: AcademicTask[];
  attendance: AttendanceSummary;
  grupo: DisciplinaGrupoDto;
  catalogOnly?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Calendário                                                                 */
/* -------------------------------------------------------------------------- */

export type CalendarEventType =
  | "tarefa"
  | "prova"
  | "evento"
  | "aula"
  | "feriado"
  | "outro";

export interface CalendarEvent {
  id: string;
  date: string;
  dateEnd?: string | null;
  title: string;
  type: CalendarEventType;
  color?: string;
  description?: string;
  subject?: string;
  subjectCode?: string;
  timeStart?: string | null;
  timeEnd?: string | null;
  done?: boolean;
  manual?: boolean;
}

export interface AcademicDateItem {
  id: string;
  label: string;
  date: string;
}

export interface AcademicDateSemesterGroup {
  semestre: string;
  items: AcademicDateItem[];
}

export interface CalendarApiResponse {
  events: CalendarEvent[];
  academicDateGroups: AcademicDateSemesterGroup[];
}

/* -------------------------------------------------------------------------- */
/* Grade semanal (horários)                                                   */
/* -------------------------------------------------------------------------- */

export interface ScheduleApiSlot {
  code: string;
  name: string;
  room: string;
  color: string;
  professor?: string;
  ch?: number;
  displayName?: string;
}

export interface ScheduleApiResponse {
  days: string[];
  timeSlots: string[];
  /** `grid[dayIdx][slotIdx]` — linhas = dias, colunas = faixas horárias. */
  grid: (ScheduleApiSlot | null)[][];
}

/* -------------------------------------------------------------------------- */
/* Mapa / Integralização                                                      */
/* -------------------------------------------------------------------------- */

/** Paridade com `CourseMapStatus` do site. */
export type MapaDisciplineStatus = "done" | "current" | "unlocked" | "locked";

export interface MapaDiscipline {
  code: string;
  shortLabel: string;
  name: string;
  ch: number;
  type: string | null;
  status: MapaDisciplineStatus;
  blockedBy?: "prereq" | "ch";
  chRemaining?: number;
}

export interface MapaPeriod {
  period: number;
  subjects: MapaDiscipline[];
}

export interface MapaStats {
  total: number;
  done: number;
  current: number;
  unlocked: number;
  locked: number;
}

export interface MapaResponse {
  curso: string;
  periods: MapaPeriod[];
  stats: MapaStats;
  statusLabels: Record<MapaDisciplineStatus, string>;
  historicoSynced: boolean;
}

export interface IntegralizacaoManualEntry {
  id: number;
  tipoCh: string;
  horas: number;
}

export interface IntegralizacaoCategoryDetail extends IntegrationCategory {
  manualEntries: IntegralizacaoManualEntry[];
}

export interface IntegralizacaoResponse {
  totalHours: number;
  totalDone: number;
  percent: number;
  percentSigaa: number | null;
  categories: IntegralizacaoCategoryDetail[];
}

/* -------------------------------------------------------------------------- */
/* Notificações                                                               */
/* -------------------------------------------------------------------------- */

export type NotificationKind =
  | "task"
  | "grade"
  | "task-reminder"
  | "calendar-event-reminder"
  | "class-reminder"
  | "integralizacao-alert"
  | "calendar-date-alert";

export interface NotificationSnapshotItem {
  fingerprint: string;
  kind: NotificationKind;
  title: string;
  subtitle: string;
  href: string;
  at: string | null;
  disciplinaNome?: string;
  notaObtida?: number;
  notaMaxima?: number | null;
}

export type PriorityLevel =
  | "high"
  | "medium_high"
  | "neutral"
  | "medium_low"
  | "low";

export interface NotificationPreferences {
  tasks: boolean;
  grades: boolean;
  taskReminders: boolean;
  calendarReminders: boolean;
  classReminders: boolean;
  integralizacaoAlerts: boolean;
  academicDateAlerts: boolean;
  personalEvents: boolean;
}

export interface PendingTaskReminderSource {
  id: number;
  disciplinaId: string;
  title: string;
  subtitle: string;
  href: string;
  dueDateIso: string;
  dueTime: string;
}

export interface PendingCalendarReminderSource {
  eventId: string;
  title: string;
  subtitle: string;
  href: string;
  startDateIso: string;
  startTime: string;
}

export interface NotificationsSnapshotResponse {
  items: NotificationSnapshotItem[];
  pendingTasks: PendingTaskReminderSource[];
  pendingCalendarEvents: PendingCalendarReminderSource[];
  pendingClassSessions: PendingCalendarReminderSource[];
  preferences: NotificationPreferences;
  capturedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Perfil                                                                     */
/* -------------------------------------------------------------------------- */

export interface PerfilAluno {
  matricula: string;
  nome: string;
  curso: string | null;
  email: string | null;
  semestreEntrada: string | null;
  status: string | null;
  initials: string;
}

export interface PerfilAccount {
  cpf: string | null;
  email: string | null;
  phone: string | null;
}

export interface PerfilSubscription {
  planId: string;
  planLabel: string;
  status: PerfilSubscriptionStatus;
  expiresAt: string;
  daysRemaining: number;
  renewHref: string;
  inGracePeriod?: boolean;
  renewalEligible?: boolean;
}

export interface PerfilSyncStatus {
  automatic: true;
  intervalMinutes: number;
  lastSyncAt: string | null;
}

export interface PerfilResponse {
  profile: PerfilAluno | null;
  account: PerfilAccount;
  subscription: PerfilSubscription;
  sync: PerfilSyncStatus;
  notifications: NotificationPreferences;
  subjectPriorities: Record<string, PriorityLevel>;
}

export interface PatchPerfilBody {
  email?: string | null;
  phone?: string | null;
  notifications?: Partial<NotificationPreferences>;
  subjectPriorities?: Record<string, PriorityLevel>;
}

/* -------------------------------------------------------------------------- */
/* Billing / planos                                                           */
/* -------------------------------------------------------------------------- */

export type PaidPlanId =
  | "month"
  | "quarter"
  | "semester"
  | "year"
  | "five_year"
  | string;

export interface BillingPlanView {
  id: string;
  kind: "trial" | "paid";
  shortLabel: string;
  durationLabel: string;
  priceLabel: string;
  description: string;
  featured?: boolean;
  ctaLabel?: string;
  purchasable?: boolean;
}

export interface SitePromoPublic {
  badge?: string | null;
  headline: string;
  description: string;
  highlightPlanId?: PaidPlanId;
  /** ISO — fim da promoção (site). */
  expiresAt?: string | null;
  /** Alias legado / contrato antigo. */
  endsAt?: string | null;
  basePriceCents?: number;
  promoPriceCents?: number;
  discountPercent?: number;
}

export interface BillingPlansResponse {
  plans: BillingPlanView[];
  checkoutEnabled: boolean;
  promo?: SitePromoPublic | null;
  quarterSavings?: { label: string; percent?: number | null } | null;
  semesterSavings?: { label: string; percent?: number | null } | null;
  yearSavings?: { label: string; percent?: number | null } | null;
  fiveYearSavings?: { label: string; percent?: number | null } | null;
}

export interface BillingAccountSubscriptionView {
  planId: string | null;
  planLabel: string | null;
  status: string;
  expiresAt: string | null;
  daysRemaining: number | null;
  renewHref: string | null;
  inGracePeriod: boolean;
  renewalEligible: boolean;
}

export interface BillingAccountResponse {
  ok: true;
  subscription: BillingAccountSubscriptionView;
}

export interface BillingCheckoutRequestBody {
  planId: PaidPlanId;
  idempotencyKey?: string;
}

export interface BillingCheckoutPaymentView {
  id: string;
  planId: string;
  amountCents: number;
  status: string;
  expiresAt: string;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  ticketUrl?: string | null;
}

export interface BillingCheckoutResponse {
  ok: true;
  payment: BillingCheckoutPaymentView;
}

export interface BillingPaymentStatusResponse {
  ok: true;
  payment: BillingCheckoutPaymentView & {
    planLabel?: string;
  };
}

export interface RedeemGiftKeyRequestBody {
  code: string;
}

export interface RedeemGiftKeyResponse {
  ok: true;
  code: string;
  planId: string;
  planLabel: string;
  subscription: {
    id: string;
    status: "active";
    expiresAt: string;
    source: "gift_key";
  };
}

/* -------------------------------------------------------------------------- */
/* Sync                                                                       */
/* -------------------------------------------------------------------------- */

export type SyncMode = "lite" | "full" | "deep" | "incremental";

export interface SyncStep {
  id?: string;
  label: string;
  progress: number;
  status?: "pending" | "running" | "done" | "error";
}

export interface SyncQueueJobView {
  jobId: string;
  status: string;
  mode?: string;
  progress?: number;
  message?: string | null;
  position?: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  result?: { steps?: SyncStep[]; partial?: boolean } | null;
  error?: { code?: string; message?: string } | null;
}

export interface SyncQueueEnqueueResponse {
  ok: true;
  reused?: boolean;
  job: SyncQueueJobView;
}

export interface SyncQueueJobResponse {
  ok: true;
  job: SyncQueueJobView;
}
