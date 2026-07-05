/** Stub de `pdf-parse` para bundle OpenNext/Cloudflare. */
export class PDFParse {
  constructor(_options: { data: Buffer }) {
    throw new Error("pdf-parse indisponível no deploy cloud.");
  }

  async getText(): Promise<{ text: string }> {
    throw new Error("pdf-parse indisponível no deploy cloud.");
  }

  async destroy(): Promise<void> {
    return undefined;
  }
}
