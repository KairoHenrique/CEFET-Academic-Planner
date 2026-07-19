-- Support ops notify e-mails (cadastro + pagamento)

ALTER TABLE account_email_queue
  DROP CONSTRAINT IF EXISTS account_email_queue_kind_check;

ALTER TABLE account_email_queue
  ADD CONSTRAINT account_email_queue_kind_check CHECK (
    kind IN (
      'promotion',
      'welcome',
      'trial_ended',
      'plan_expiring_soon',
      'plan_ended',
      'support_notify'
    )
  );

COMMENT ON TABLE account_email_queue IS
  'Fila de e-mails de conta (promoções, ciclo de vida, avisos internos de suporte).';
