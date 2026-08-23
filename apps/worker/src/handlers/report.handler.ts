import { JobHandler, JobExecutionResult } from './base.handler';
import { ReportPayloadSchema } from '@queueflow/shared';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export class ReportHandler implements JobHandler {
  async execute(payload: any): Promise<JobExecutionResult> {
    const data = ReportPayloadSchema.parse(payload);
    const reportName = data.reportName || `Report_${Date.now()}`;

    logger.info({ event: 'report_generating', reportName, format: data.format }, 'Generating system report...');

    // Simulate database report computation
    const jobs = await prisma.job.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
    });

    let generatedContent = '';
    if (data.format === 'CSV') {
      const header = 'Job ID,Type,Status,Created At,Completed At\n';
      const rows = jobs
        .map((j) => `${j.id},${j.type},${j.status},${j.createdAt.toISOString()},${j.completedAt ? j.completedAt.toISOString() : ''}`)
        .join('\n');
      generatedContent = header + rows;
    } else {
      generatedContent = JSON.stringify(jobs, null, 2);
    }

    logger.info({ event: 'report_completed', reportName, recordCount: jobs.length }, 'Report generated successfully');

    return {
      success: true,
      result: {
        reportName,
        format: data.format,
        recordCount: jobs.length,
        sizeBytes: Buffer.byteLength(generatedContent, 'utf8'),
        preview: generatedContent.substring(0, 300),
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
