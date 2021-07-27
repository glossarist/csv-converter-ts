export interface ReportingOpts {
  onOutput: (output: string) => void;
  onProgress: (total: number, completed: number) => void;
}
