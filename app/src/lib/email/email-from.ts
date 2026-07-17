/**
 * Parser do remetente `EMAIL_FROM`. Aceita "Nome <email@dominio>" ou "email@dominio".
 * Usado pelos provedores que exigem remetente estruturado (ex.: Brevo).
 */
export interface ParsedEmailAddress {
  name: string | null;
  email: string;
}

const ANGLE_ADDRESS = /^\s*(.*?)\s*<\s*([^<>]+?)\s*>\s*$/;

export function parseEmailAddress(value: string): ParsedEmailAddress {
  const trimmed = value.trim();
  const match = ANGLE_ADDRESS.exec(trimmed);

  if (match) {
    const name = match[1].replace(/^"|"$/g, "").trim();
    return { name: name.length > 0 ? name : null, email: match[2].trim() };
  }

  return { name: null, email: trimmed };
}
