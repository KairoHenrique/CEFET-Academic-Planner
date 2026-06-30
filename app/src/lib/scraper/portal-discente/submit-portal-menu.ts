import type { Page } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS } from "@/lib/scraper/constants";

const DISCENTE_MENU_ACTION_PREFIX =
  "menu_form_menu_discente_discente_menu:A]#{ ";

/**
 * Submete o formulário JSF do portal discente (menu JSCookMenu).
 */
export async function submitDiscenteMenuAction(
  page: Page,
  beanAction: string
): Promise<boolean> {
  const actionValue = `${DISCENTE_MENU_ACTION_PREFIX}${beanAction} }`;

  const responsePromise = page
    .waitForResponse(
      (resp) =>
        resp.request().method() === "POST" &&
        /discente\.jsf|historico|relatorio|documento/i.test(resp.url()),
      { timeout: SIGAA_NAVIGATION_TIMEOUT_MS }
    )
    .catch(() => null);

  const submitted = await page.evaluate((action) => {
    const form =
      (document.getElementById("menu:form_menu_discente") as HTMLFormElement | null) ??
      (document.querySelector(
        "form[name='menu:form_menu_discente']"
      ) as HTMLFormElement | null);

    if (!form) return false;

    const viewState = document.querySelector(
      "input[name='javax.faces.ViewState']"
    ) as HTMLInputElement | null;

    if (viewState && !form.querySelector("input[name='javax.faces.ViewState']")) {
      const clone = viewState.cloneNode(true) as HTMLInputElement;
      form.appendChild(clone);
    }

    let input = form.querySelector(
      "input[name='jscook_action']"
    ) as HTMLInputElement | null;

    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = "jscook_action";
      form.appendChild(input);
    }

    input.value = action;
    form.requestSubmit?.() ?? form.submit();
    return true;
  }, actionValue);

  if (!submitted) return false;

  await responsePromise;
  await page
    .waitForLoadState("domcontentloaded", {
      timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
    })
    .catch(() => undefined);

  return true;
}
