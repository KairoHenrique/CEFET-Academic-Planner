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
    ],
    paragraphs: [
      "Coletamos apenas o necessário para operar o serviço (minimização de dados). O produto é gratuito; não processamos pagamento do aluno.",
    ],
  },
  {
    id: "finalidades",
    title: "3. Finalidades e bases legais",
    bullets: [
      "Execução de contrato — criar conta, sincronizar SIGAA e exibir o planejador acadêmico.",
      "Consentimento — aceite desta política e dos Termos de Uso no cadastro.",
      "Legítimo interesse — segurança, prevenção de abuso e melhoria do serviço.",
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
    ],
    paragraphs: [
      "Não vendemos dados pessoais. Compartilhamentos ocorrem apenas para operar o serviço ou cumprir a lei.",
    ],
  },
  {
    id: "retencao",
    title: "5. Retenção e exclusão",
    paragraphs: [
      "Você pode excluir sua conta e apagar seus dados a qualquer momento pelo aplicativo ou versão web (Menu > Perfil > Deletar Conta). A exclusão remove de forma definitiva dados acadêmicos e credenciais sincronizadas.",
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
      "Revogação do consentimento, quando o tratamento depender dele — pode implicar encerramento do serviço.",
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
