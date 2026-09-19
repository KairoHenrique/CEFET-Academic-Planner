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
      "CPF — login e identificação da conta.",
      "E-mail e telefone — contato e comunicações transacionais.",
      "Senha do SIGAA — armazenada cifrada (AES-GCM) para sincronização acadêmica; nunca exibida em texto claro na interface do aluno.",
      "Dados acadêmicos do SIGAA — notas, faltas, tarefas, grade, histórico, calendário e metadados de disciplinas.",
      "Dados de pagamento (quando aplicável) — na web via Mercado Pago (PIX); no Android via Google Play Billing. O ACME HUB não armazena números de cartão.",
      "Identificadores de publicidade (AdMob) no app Android gratuito e cookies/identificadores do Google AdSense na web — para exibir anúncios.",
    ],
    paragraphs: [
      "Coletamos apenas o necessário para operar o serviço (minimização de dados). O uso acadêmico é gratuito; o pagamento opcional serve apenas para remover anúncios.",
    ],
  },
  {
    id: "finalidades",
    title: "3. Finalidades e bases legais",
    bullets: [
      "Execução de contrato — criar conta, sincronizar SIGAA e exibir o planejador acadêmico.",
      "Consentimento — aceite desta política e dos Termos de Uso no cadastro; exibição de anúncios no app gratuito.",
      "Legítimo interesse — segurança, prevenção de abuso, higiene de dados inativos e melhoria do serviço.",
      "Cumprimento de obrigação legal — quando exigido por autoridade competente.",
    ],
    paragraphs: [],
  },
  {
    id: "compartilhamento",
    title: "4. Compartilhamento com terceiros",
    bullets: [
      "Supabase — autenticação e banco de dados (hospedagem com RLS por usuário).",
      "Cloudflare — hospedagem da aplicação web.",
      "Provedor de e-mail transacional — envio de comunicações importantes sobre sua conta.",
      "Worker de sincronização — sistema isolado e seguro para comunicação com o SIGAA.",
      "Google AdMob — exibição de anúncios no aplicativo Android gratuito.",
      "Google AdSense — exibição de anúncios na versão web (laterais no desktop; faixa dismissível no mobile).",
      "Mercado Pago — processamento de PIX na web (plano sem propaganda).",
      "Google Play — cobrança e gestão de assinatura no Android (plano sem propaganda).",
    ],
    paragraphs: [
      "Não vendemos dados pessoais. Compartilhamentos ocorrem apenas para operar o serviço, processar pagamentos ou cumprir a lei.",
    ],
  },
  {
    id: "retencao",
    title: "5. Retenção e exclusão",
    paragraphs: [
      "Você pode excluir sua conta e apagar seus dados a qualquer momento pelo aplicativo ou versão web (Menu > Perfil > Deletar Conta). A exclusão remove de forma definitiva dados acadêmicos e credenciais sincronizadas.",
      "Contas gratuitas sem uso por mais de 15 dias podem ter dados acadêmicos e manuais apagados automaticamente (login permanece). Com plano sem propaganda ativo, essa limpeza só começa após o término do plano.",
      "Você também pode solicitar exclusão ou correção pelo canal de contato.",
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
      "Revogação do consentimento, quando o tratamento depender dele — pode implicar encerramento do serviço ou exibição de anúncios.",
    ],
    paragraphs: [],
  },
  {
    id: "seguranca",
    title: "7. Segurança",
    paragraphs: [
      "As credenciais do SIGAA são estritamente protegidas com criptografia avançada. O tráfego de dados utiliza conexão segura HTTPS. O acesso ao banco de dados é restrito, garantindo que suas informações sejam acessíveis apenas por você.",
      "Nossa infraestrutura é monitorada continuamente para prevenir acessos não autorizados e garantir a integridade dos seus dados.",
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies, sessão e anúncios",
    paragraphs: [
      "Utilizamos cookies e armazenamento local estritamente necessários para manter a sessão de login (Supabase Auth) e preferências essenciais do aplicativo.",
      "No Android gratuito, o AdMob pode usar identificadores de publicidade conforme as políticas do Google e as configurações do dispositivo. Na web, o AdSense pode usar cookies e tecnologias similares; você pode fechar a faixa de anúncio temporariamente ou assinar o plano sem propaganda.",
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
