import { brand } from "@/config/brand";
import { resolveLegalContactEmail } from "@/lib/legal/constants";
import type { LegalSection } from "@/lib/legal/content/terms-sections";

const CONTACT_EMAIL = resolveLegalContactEmail();

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "controlador",
    title: "1. Controlador e contato",
    paragraphs: [
      `O controlador dos dados pessoais tratados no ${brand.name} é o responsável pelo produto ACME HUB. Para exercer direitos previstos na LGPD (Lei nº 13.709/2018), utilize o canal de contato: ${CONTACT_EMAIL} (também indicado no rodapé desta página).`,
    ],
  },
  {
    id: "dados",
    title: "2. Dados coletados",
    bullets: [
      "CPF — login, controle anti-abuso de trial e identificação da conta.",
      "E-mail e telefone — contato, comunicações transacionais e promocionais.",
      "Senha do SIGAA — armazenada cifrada (AES-GCM) para sincronização acadêmica; nunca exibida em texto claro na interface do aluno.",
      "Dados acadêmicos do SIGAA — notas, faltas, tarefas, grade, histórico, calendário e metadados de disciplinas.",
      "Dados de assinatura — plano, status, pagamentos PIX (referência, valor, status; sem armazenar dados completos de cartão).",
    ],
    paragraphs: [
      "Coletamos apenas o necessário para operar o serviço (minimização de dados).",
    ],
  },
  {
    id: "finalidades",
    title: "3. Finalidades e bases legais",
    bullets: [
      "Execução de contrato — criar conta, sincronizar SIGAA, exibir dashboard e processar assinatura.",
      "Consentimento — aceite desta política e dos Termos de Uso no cadastro.",
      "Legítimo interesse — prevenção de fraude (trial único por CPF), segurança e melhoria do serviço.",
      "Cumprimento de obrigação legal — quando exigido por autoridade competente.",
    ],
    paragraphs: [],
  },
  {
    id: "compartilhamento",
    title: "4. Compartilhamento com terceiros",
    bullets: [
      "Supabase — autenticação e banco de dados (hospedagem com RLS por usuário).",
      "Cloudflare — hospedagem da aplicação web e workers de cron.",
      "Mercado Pago — processamento de pagamentos PIX (e-mail e CPF do pagador conforme exigência do gateway).",
      "Provedor de e-mail transacional — envio de mensagens de ciclo de vida da conta.",
      "Worker de sincronização — execução do scraper SIGAA com credenciais cifradas.",
    ],
    paragraphs: [
      "Não vendemos dados pessoais. Compartilhamentos ocorrem apenas para operar o serviço ou cumprir a lei.",
    ],
  },
  {
    id: "retencao",
    title: "5. Retenção e exclusão",
    paragraphs: [
      "Dados acadêmicos sincronizados são apagados automaticamente 7 dias após a expiração do trial ou da assinatura sem renovação, para economia de armazenamento.",
      "O CPF permanece registrado para impedir novo trial gratuito (controle anti-abuso), conforme decisão de produto documentada.",
      "Você pode solicitar exclusão antecipada ou correção de dados pelo canal de contato. Pedidos serão atendidos nos prazos legais.",
    ],
  },
  {
    id: "direitos",
    title: "6. Direitos do titular",
    bullets: [
      "Confirmação da existência de tratamento e acesso aos dados.",
      "Correção de dados incompletos ou desatualizados (e-mail e telefone editáveis no perfil).",
      "Anonimização, bloqueio ou eliminação de dados desnecessários.",
      "Portabilidade, quando aplicável.",
      "Revogação do consentimento, quando o tratamento depender dele — pode implicar encerramento do serviço.",
    ],
    paragraphs: [],
  },
  {
    id: "seguranca",
    title: "7. Segurança",
    paragraphs: [
      "Credenciais SIGAA são cifradas em repouso. Tráfego utiliza HTTPS. Acesso ao banco é isolado por usuário (RLS).",
      "Logs de produção não devem conter senhas, CPF completo ou e-mail em texto claro. Operadores do painel /dev possuem acesso restrito e auditado.",
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies e sessão",
    paragraphs: [
      "Utilizamos cookies e armazenamento local estritamente necessários para manter a sessão de login (Supabase Auth) e preferências essenciais do aplicativo.",
    ],
  },
  {
    id: "alteracoes",
    title: "9. Alterações desta política",
    paragraphs: [
      "Esta política pode ser atualizada. A versão vigente e a data aparecem no rodapé. Alterações relevantes serão comunicadas por e-mail ou aviso no app.",
    ],
  },
];
