export class WorkerRuntimeState {
  private currentJobId: string | null = null;
  private acceptingJobs = true;
  private readonly startedAt = Date.now();

  beginJob(jobId: string): void {
    this.currentJobId = jobId;
  }

  endJob(): void {
    this.currentJobId = null;
  }

  stopAcceptingJobs(): void {
    this.acceptingJobs = false;
  }

  canAcceptJobs(): boolean {
    return this.acceptingJobs;
  }

  getCurrentJobId(): string | null {
    return this.currentJobId;
  }

  getUptimeMs(): number {
    return Date.now() - this.startedAt;
  }

  isBusy(): boolean {
    return this.currentJobId !== null;
  }
}
