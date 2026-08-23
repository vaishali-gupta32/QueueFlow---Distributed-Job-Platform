import { PrismaClient, Role, JobType, JobStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding QueueFlow database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@queueflow.io' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@queueflow.io',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // 2. Seed Standard User
  const user = await prisma.user.upsert({
    where: { email: 'user@queueflow.io' },
    update: {},
    create: {
      name: 'Vaishali Engineer',
      email: 'user@queueflow.io',
      passwordHash,
      role: Role.USER,
    },
  });

  console.log(`Users seeded: Admin (${admin.id}), User (${user.id})`);

  // 3. Seed sample jobs
  const job1 = await prisma.job.create({
    data: {
      userId: user.id,
      type: JobType.EMAIL,
      status: JobStatus.COMPLETED,
      payload: {
        to: 'welcome@example.com',
        subject: 'Welcome to QueueFlow',
        body: 'Your account is ready and background jobs are active.',
      },
      attempts: 1,
      completedAt: new Date(),
    },
  });

  const job2 = await prisma.job.create({
    data: {
      userId: user.id,
      type: JobType.WEBHOOK,
      status: JobStatus.DEAD_LETTER,
      payload: {
        url: 'https://httpstat.us/500',
        method: 'POST',
        body: { event: 'user.signup' },
      },
      attempts: 3,
      failedAt: new Date(),
      lastError: 'HTTP 500 Internal Server Error',
    },
  });

  // Create attempt logs for dead letter job
  await prisma.jobAttempt.createMany({
    data: [
      {
        jobId: job2.id,
        attemptNumber: 1,
        status: JobStatus.FAILED,
        error: 'HTTP 500 Internal Server Error',
        durationMs: 145,
      },
      {
        jobId: job2.id,
        attemptNumber: 2,
        status: JobStatus.FAILED,
        error: 'HTTP 500 Internal Server Error',
        durationMs: 210,
      },
      {
        jobId: job2.id,
        attemptNumber: 3,
        status: JobStatus.DEAD_LETTER,
        error: 'Exceeded max retry limit (3 attempts)',
        durationMs: 180,
      },
    ],
  });

  // 4. Seed sample worker
  await prisma.worker.upsert({
    where: { workerId: 'worker_node_alpha' },
    update: {
      status: 'HEALTHY',
      lastHeartbeat: new Date(),
      jobsProcessed: 42,
      jobsFailed: 2,
    },
    create: {
      workerId: 'worker_node_alpha',
      status: 'HEALTHY',
      lastHeartbeat: new Date(),
      jobsProcessed: 42,
      jobsFailed: 2,
    },
  });

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
