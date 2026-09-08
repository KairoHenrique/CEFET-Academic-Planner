import { redirect } from "next/navigation";

export const metadata = {
  title: "Planos",
};

/** Cobrança desativada — app gratuito. */
export default function PlanosPage() {
  redirect("/");
}
