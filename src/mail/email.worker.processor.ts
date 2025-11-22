import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from './mail.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@Processor('email')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<any>) {
    try {
      switch (job.name) {
        case 'send-otp':
          this.logger.log(`📩 Sending OTP to ${job.data.to}`);
          await this.mailService.sendOtpViaEmail(job.data.to, job.data.otp);
          break;

        case 'password-reset':
          this.logger.log(`🔑 Sending reset email to ${job.data.to}`);
          await this.mailService.sendPasswordResetEmail(
            job.data.to,
            job.data.token,
          );
          break;

        case 'order-confirmation':
          this.logger.log(`📦 Sending order confirmation to ${job.data.to}`);
          await this.mailService.sendOrderConfirmationEmail(
            job.data.to,
            job.data.orderData,
          );
          break;

        default:
          this.logger.warn(`❓ Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to process job ${job.name}: ${error.message}`,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `✅ Job "${job.name}" for ${job.data.to} completed successfully`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `❌ Job "${job.name}" failed for ${job.data.to}: ${err.message}`,
    );
  }
}
