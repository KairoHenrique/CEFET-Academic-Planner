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
      "Cada CPF pode receber um período de trial gratuito de 7 dias, uma única vez, conforme regras anti-abuso descritas na Política de Privacidade.",
    ],
  },
  {
    id: "assinatura",
    title: "3. Assinatura e pagamento",
    paragraphs: [
      "Após o trial, o acesso contínuo depende de assinatura paga via PIX ou resgate de chave de plano emitida por operador autorizado.",
      "Valores, duração dos planos e renovação são exibidos em /planos antes da confirmação do pagamento. Pagamentos processados por gateway terceiro (Mercado Pago) estão sujeitos também às regras desse provedor.",
      "Renovações podem acumular período remanescente conforme indicado na interface. Após expiração, pode haver janela de tolerância (grace period) antes do bloqueio total do acesso.",
    ],
  },
  {
    id: "uso",
    title: "4. Uso aceitável",
    bullets: [
      "Não compartilhar credenciais SIGAA com terceiros nem usar o serviço para acessar dados de outras pessoas.",
      "Não tentar burlar limites de trial, assinatura ou sincronização automatizada.",
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
      "Edições feitas pelo aluno no ACME HUB têm prioridade sobre dados sincronizados, conforme regras de produto documentadas.",
    ],
  },
  {
    id: "comunicacoes",
    title: "6. Comunicações",
    paragraphs: [
      "Podemos enviar e-mails transacionais (cadastro, fim de trial, aviso de plano próximo do fim ou encerrado) e comunicações promocionais relacionadas ao ACME HUB, conforme Política de Privacidade.",
      "Alertas acadêmicos (notas, tarefas) são entregues no aplicativo (sino de notificações), não por e-mail.",
    ],
  },
  {
    id: "responsabilidade",
    title: "7. Limitação de responsabilidade",
    paragraphs: [
      "O serviço é fornecido na medida do possível, sem garantia de disponibilidade contínua do SIGAA ou de exatidão absoluta dos dados sincronizados.",
      "Decisões acadêmicas (matrícula, trancamento, entrega de atividades) devem ser confirmadas nos canais oficiais da instituição.",
    ],
  },
  {
    id: "alteracoes",
    title: "8. Alterações e vigência",
    paragraphs: [
      "Estes Termos podem ser atualizados. Mudanças relevantes serão comunicadas por e-mail ou aviso no aplicativo. A versão vigente está indicada no rodapé desta página.",
      "O uso continuado após a publicação de nova versão constitui aceite, salvo quando a lei exigir novo consentimento explícito.",
    ],
  },
  {
    id: "contato",
    title: "9. Contato",
    paragraphs: [
      `Dúvidas sobre estes Termos, sobre a Política de Privacidade ou solicitações relacionadas à sua conta podem ser enviadas para o e-mail de suporte: ${CONTACT_EMAIL}.`,
    ],
  },
];
