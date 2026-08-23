export interface JobExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
}

export interface JobHandler {
  execute(payload: any): Promise<JobExecutionResult>;
}
