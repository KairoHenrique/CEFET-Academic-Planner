"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Icon } from "@/components/ui/Icon";

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

export function PasswordInput({
  label,
  error,
  id,
  className = "",
  ...props
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={`form-field ${className}`}>
      <label className="form-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="password-input-wrap">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className={`form-input password-input ${error ? "form-input-error" : ""}`}
          {...props}
        />
        <button
          type="button"
          className="password-input-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          disabled={props.disabled}
        >
          <Icon name={visible ? "eye-off" : "eye"} size={15} aria-hidden />
        </button>
      </div>
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
