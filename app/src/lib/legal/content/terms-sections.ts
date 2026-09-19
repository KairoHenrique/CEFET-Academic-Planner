
import { resolveLegalContactEmail } from "@/lib/legal/constants";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const CONTACT_EMAIL = resolveLegalContactEmail();

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "objeto",
    title: "1. Objeto",
    paragraphs: [
      "O ACME HUB é um planejador acadêmico para alunos do CEFET-MG que sincroniza dados do portal SIGAA e oferece dashboard, calendário, mapa do curso, integralização e ferramentas de organização.",
      "Ao criar uma conta ou utilizar o serviço, você declara ter lido e aceito estes Termos de Uso e a Política de Privacidade vigentes.",
    ],
  },
  {
    id: "elegibilidade",
    title: "2. Elegibilidade e conta",
    paragraphs: [
      "O serviço destina-se a alunos regularmente vinculados ao CEFET-MG. O login utiliza CPF e a mesma senha do portal SIGAA, validada durante a sincronização acadêmica.",
      "O ACME HUB permanece gratuito para as funções acadêmicas: não há trial obrigatório nem bloqueio de recursos por falta de pagamento.",
    ],
  },
  {
    id: "assinatura",
    title: "3. Uso gratuito, anúncios e plano opcional",
    paragraphs: [
      "O aplicativo e a versão web podem ser usados sem custo. No modo gratuito podem ser exibidos anúncios: no Android (Google AdMob), em abertura de sessão e após sincronização; na web (Google AdSense), nas laterais do desktop e, no mobile web, faixa inferior dismissível — sem bloquear o uso (podem reaparecer após algumas horas).",
      "É opcional assinar o plano “sem propaganda”, que remove anúncios no app e na web pelo período contratado. A assinatura não libera funções acadêmicas adicionais — elas já estão disponíveis no modo gratuito.",
      "Pagamentos: na web, via PIX (Mercado Pago); no aplicativo Android, apenas pela Google Play. Os canais não se misturam na interface (o app não oferece checkout PIX; a web não vende pela Play).",
      "Quem paga em qualquer canal fica sem anúncios nos dois. Chaves gift / concessão manual pelo operador também ativam o mesmo benefício.",
    ],
  },
  {
    id: "uso",
    title: "4. Uso aceitável",
    bullets: [
      "Não compartilhar credenciais SIGAA com terceiros nem usar o serviço para acessar dados de outras pessoas.",
      "Não tentar burlar limites de sincronização automatizada ou abusar da infraestrutura.",
      "Não realizar engenharia reversa, scraping abusivo ou interferência nos workers de sincronização.",
      "Respeitar a propriedade intelectual do CEFET-MG, do SIGAA e de terceiros cujos dados são exibidos.",
    ],
    paragraphs: [],
  },
  {
    id: "sigaa",
    title: "5. Relação com o SIGAA",
    paragraphs: [
      "O ACME HUB não é oficial do CEFET-MG nem substitui o SIGAA. Dados exibidos são obtidos por sincronização automatizada e podem estar desatualizados se o portal estiver indisponível.",
      "Edições feitas pelo aluno no ACME HUB têm prioridade sobre dados sincronizados, garantindo total controle sobre a sua própria organização acadêmica.",
    ],
  },
  {
    id: "retencao",
    title: "6. Retenção de dados e inatividade",
    paragraphs: [
      "Para higiene do banco, contas gratuitas sem uso há mais de 15 dias podem ter dados acadêmicos e manuais (notas, faltas, tarefas, calendário editado, etc.) apagados. A conta de login (CPF/e-mail) permanece para você entrar de novo e sincronizar.",
      "Com plano “sem propaganda” ativo, essa limpeza só passa a contar após o fim do plano. A sincronização automática também exige uso recente (últimos 15 dias), independentemente do plano.",
    ],
  },
  {
    id: "comunicacoes",
    title: "7. Comunicações",
    paragraphs: [
      "Podemos enviar e-mails transacionais relacionados à conta (cadastro e avisos operacionais), conforme Política de Privacidade.",
      "Alertas acadêmicos (notas, tarefas) são entregues no aplicativo (sino de notificações e push no Android), não por e-mail promocional.",
    ],
  },
  {
    id: "responsabilidade",
    title: "8. Limitação de responsabilidade",
    paragraphs: [
      "O serviço é fornecido na medida do possível, sem garantia de disponibilidade contínua do SIGAA ou de exatidão absoluta dos dados sincronizados.",
      "Decisões acadêmicas (matrícula, trancamento, entrega de atividades) devem ser confirmadas nos canais oficiais da instituição.",
    ],
  },
  {
    id: "open-source",
    title: "9. Software livre (AGPL)",
    paragraphs: [
      "O código-fonte do ACME HUB é disponibilizado sob a licença GNU Affero General Public License v3.0 (AGPL-3.0). Quem modificar o software e o oferecer como serviço deve disponibilizar o código correspondente sob a mesma licença.",
    ],
  },
  {
    id: "alteracoes",
    title: "10. Alterações e vigência",
    paragraphs: [
      "Estes Termos podem ser atualizados. Mudanças relevantes serão comunicadas por e-mail ou aviso no aplicativo. A versão vigente está indicada no rodapé desta página.",
      "O uso continuado após a publicação de nova versão constitui aceite, salvo quando a lei exigir novo consentimento explícito.",
    ],
  },
  {
    id: "contato",
    title: "11. Contato",
    paragraphs: [
      `Dúvidas sobre estes Termos, sobre a Política de Privacidade ou solicitações relacionadas à sua conta podem ser enviadas para o e-mail de suporte: ${CONTACT_EMAIL}.`,
    ],
  },
];
