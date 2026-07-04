export interface BrowserJobSlotSnapshot {
  maxConcurrent: number;
  activeSlots: number;
  queued: number;
}

/**
 * Limita quantos jobs Playwright rodam ao mesmo tempo no worker (B54).
 * Cada slot = 1 browser Chromium; padrão produção = 1 (CPFs diferentes em paralelo só se max > 1).
 */
export class BrowserJobSlot {
  private activeSlots = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private readonly maxConcurrent: number) {
    if (maxConcurrent < 1) {
      throw new Error("maxConcurrent deve ser >= 1.");
    }
  }

  snapshot(): BrowserJobSlotSnapshot {
    return {
      maxConcurrent: this.maxConcurrent,
      activeSlots: this.activeSlots,
      queued: this.waiters.length,
    };
  }

  async acquire(): Promise<void> {
    if (this.activeSlots < this.maxConcurrent) {
      this.activeSlots += 1;
      return;
    }

    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
    this.activeSlots += 1;
  }

  release(): void {
    if (this.activeSlots <= 0) {
      throw new Error("release() sem acquire correspondente.");
    }

    this.activeSlots -= 1;
    const next = this.waiters.shift();
    if (next) next();
  }

  async run<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await operation();
    } finally {
      this.release();
    }
  }
}
