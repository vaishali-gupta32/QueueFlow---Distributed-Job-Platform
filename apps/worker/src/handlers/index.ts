import { JobType } from '@queueflow/shared';
import { JobHandler } from './base.handler';
import { EmailHandler } from './email.handler';
import { WebhookHandler } from './webhook.handler';
import { ReportHandler } from './report.handler';

const handlers: Record<string, JobHandler> = {
  [JobType.EMAIL]: new EmailHandler(),
  [JobType.WEBHOOK]: new WebhookHandler(),
  [JobType.REPORT]: new ReportHandler(),
};

export function getJobHandler(type: string): JobHandler {
  const handler = handlers[type];
  if (!handler) {
    throw new Error(`Unsupported job handler type: ${type}`);
  }
  return handler;
}
