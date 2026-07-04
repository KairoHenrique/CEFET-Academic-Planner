import { toJpeg } from "html-to-image";

/** Fundo sólido equivalente a `--bg-secondary` para exportação. */
const EXPORT_BACKGROUND = "#001a33";

/** JPEG — menor que PNG para capturas de UI; extensão `.jpg`. */
const JPEG_QUALITY = 0.84;
const EXPORT_PIXEL_RATIO = 2;

function sanitizeSemestreLabel(semestreLabel?: string | null): string {
  const semestre = (semestreLabel ?? "").trim() || "semestre";
  return semestre.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
}

export function buildSimuladorGradeExportFilename(
  semestreLabel?: string | null
): string {
  return `ACME-Simulador-Grade-${sanitizeSemestreLabel(semestreLabel)}.jpg`;
}

async function waitForImagesInElement(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );
}

export async function downloadElementAsJpeg(
  element: HTMLElement,
  semestreLabel?: string | null
): Promise<void> {
  const scrollContainer = element.querySelector<HTMLElement>(
    ".enrollment-schedule"
  );
  const previousCaptureOverflow = element.style.overflow;
  const previousScheduleOverflow = scrollContainer?.style.overflow ?? "";

  element.style.overflow = "visible";
  if (scrollContainer) scrollContainer.style.overflow = "visible";

  await waitForImagesInElement(element);

  try {
    const width = element.scrollWidth;
    const height = element.scrollHeight;

    const dataUrl = await toJpeg(element, {
      quality: JPEG_QUALITY,
      pixelRatio: EXPORT_PIXEL_RATIO,
      cacheBust: true,
      backgroundColor: EXPORT_BACKGROUND,
      width,
      height,
      style: {
        overflow: "visible",
        maxHeight: "none",
        maxWidth: "none",
      },
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        return node.dataset.exportExclude !== "true";
      },
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = buildSimuladorGradeExportFilename(semestreLabel);
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    element.style.overflow = previousCaptureOverflow;
    if (scrollContainer) scrollContainer.style.overflow = previousScheduleOverflow;
  }
}
