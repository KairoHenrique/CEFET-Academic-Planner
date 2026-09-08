import { redirect } from "next/navigation";

export const metadata = {
  title: "PIX",
};

/** Cobrança desativada — app gratuito. */
export default function PlanosPixPage() {
  redirect("/");
}
