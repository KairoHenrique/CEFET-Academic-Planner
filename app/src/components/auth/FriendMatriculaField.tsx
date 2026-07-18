"use client";

import { Input } from "@/components/ui/Input";
import { normalizeFriendMatricula } from "@/lib/billing/referrals/normalize-friend-matricula";

interface FriendMatriculaFieldProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function FriendMatriculaField({
  value,
  disabled = false,
  onChange,
}: FriendMatriculaFieldProps) {
  return (
    <section
      className="gift-key-redeem gift-key-redeem--inline"
      aria-labelledby="friend-matricula-title"
    >
      <div className="gift-key-redeem-head">
        <h3 id="friend-matricula-title" className="gift-key-redeem-title">
          Matrícula do amigo
        </h3>
        <p className="gift-key-redeem-copy">
          Opcional. Vocês ganham 3 dias a mais quando o indicado pagar um plano
          (até 30 dias no total por indicação). O trial de 7 dias continua
          valendo.
        </p>
      </div>
      <div className="gift-key-redeem-form">
        <Input
          label="Matrícula"
          value={value}
          onChange={(event) =>
            onChange(normalizeFriendMatricula(event.target.value))
          }
          placeholder="Ex.: 2024001234"
          autoComplete="off"
          inputMode="text"
          disabled={disabled}
          maxLength={20}
        />
      </div>
    </section>
  );
}
