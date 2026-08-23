import { JobHandler, JobExecutionResult } from './base.handler';
import { WebhookPayloadSchema } from '@queueflow/shared';
import axios from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export class WebhookHandler implements JobHandler {
  private isBlockedHost(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();
      // Prevent internal SSRF targets unless in dev mode
      const blockedPatterns = ['169.254.169.254', 'metadata.google.internal', '0.0.0.0'];
      return blockedPatterns.some((pattern) => host.includes(pattern));
    } catch {
      return true;
    }
  }

  async execute(payload: any): Promise<JobExecutionResult> {
    const data = WebhookPayloadSchema.parse(payload);

    if (this.isBlockedHost(data.url)) {
      return {
        success: false,
        error: `Security violation: URL ${data.url} resolves to a restricted internal network address`,
      };
    }

    logger.info({ event: 'webhook_dispatch', url: data.url, method: data.method }, 'Executing Webhook HTTP request...');

    try {
      const response = await axios({
        url: data.url,
        method: data.method,
        headers: {
          'User-Agent': 'QueueFlow-Worker/1.0',
          'Content-Type': 'application/json',
          ...data.headers,
        },
        data: data.body,
        timeout: config.webhookTimeoutMs,
      });

      logger.info({ event: 'webhook_success', url: data.url, statusCode: response.status }, 'Webhook delivered successfully');

      return {
        success: true,
        result: {
          statusCode: response.status,
          statusText: response.statusText,
          responseData: typeof response.data === 'object' ? response.data : String(response.data).substring(0, 500),
        },
      };
    } catch (error: any) {
      const errorMsg = error.response
        ? `HTTP ${error.response.status}: ${error.response.statusText || 'Server Error'}`
        : error.message || 'Webhook request failed';

      logger.warn({ event: 'webhook_failure', url: data.url, error: errorMsg }, 'Webhook request failed');

      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}
