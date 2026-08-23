import { CreateJobSchema, JobType, EmailPayloadSchema } from '../../packages/shared/src/index';

describe('Job Payload Zod Validation', () => {
  it('should validate valid email job payload', () => {
    const validPayload = {
      to: 'user@example.com',
      subject: 'Welcome',
      body: 'Hello world',
    };
    expect(() => EmailPayloadSchema.parse(validPayload)).not.toThrow();
  });

  it('should reject invalid email format in payload', () => {
    const invalidPayload = {
      to: 'not-an-email',
      subject: 'Welcome',
      body: 'Hello world',
    };
    expect(() => EmailPayloadSchema.parse(invalidPayload)).toThrow();
  });

  it('should validate CreateJobSchema with default priority and attempts', () => {
    const rawInput = {
      type: JobType.EMAIL,
      payload: { to: 'test@example.com', subject: 'Hi', body: 'Test' },
    };
    const parsed = CreateJobSchema.parse(rawInput);
    expect(parsed.maxAttempts).toBe(3);
    expect(parsed.priority).toBe(1);
  });
});
