import { JobHandler, JobExecutionResult } from './base.handler';
import { EmailPayloadSchema } from '@queueflow/shared';
import { logger } from '../utils/logger';

export class EmailHandler implements JobHandler {
  async execute(payload: any): Promise<JobExecutionResult> {
    const data = EmailPayloadSchema.parse(payload);

    logger.info({ event: 'email_processing', to: data.to, subject: data.subject }, 'Simulating email delivery...');

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Simulate intentional failure condition for testing failure/retry flows
    if (data.simulateFailure || data.to.includes('fail') || data.subject.toLowerCase().includes('fail')) {
      logger.warn({ event: 'email_failed', to: data.to }, 'Simulated SMTP connection timeout');
      return {
        success: false,
        error: 'SMTP connection timed out after 5000ms: recipient server unavailable',
      };
    }

    logger.info({ event: 'email_sent', to: data.to }, 'Email delivered successfully via Mock SMTP');

    return {
      success: true,
      result: {
        messageId: `msg_${Math.random().toString(36).substr(2, 9)}`,
        status: 'DELIVERED',
        recipient: data.to,
        deliveredAt: new Date().toISOString(),
      },
    };
  }
}
