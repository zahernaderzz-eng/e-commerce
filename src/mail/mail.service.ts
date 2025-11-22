import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `http://yourapp.com/reset-password?token=${token}`;
    const mailOptions = {
      from: 'Auth-backend service',
      to: to,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p>`,
    };

    await this.mailerService.sendMail(mailOptions);
  }

  async sendOtpViaEmail(to: string, otp: string) {
    const mailOptions = {
      from: 'Auth-backend service',
      to: to,
      subject: 'OTP Request',
      html: `<p>Your otp code is :<strong>${otp}</strong></p>.
      <br /> Provide this otp to verify your account`,
    };

    await this.mailerService.sendMail(mailOptions);
  }

  async sendOrderConfirmationEmail(
    to: string,
    orderData: {
      orderId: string;
      total: number;
      items: Array<{
        productName: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }>;
      createdAt: Date;
    },
  ) {
    // بناء HTML للـ items
    const itemsHtml = orderData.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.lineTotal.toFixed(2)}</td>
        </tr>
      `,
      )
      .join('');

    const mailOptions = {
      from: 'Auth-backend service',
      to: to,
      subject: `Order Confirmation - #${orderData.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">✅ Payment Successful!</h2>
          <p>Thank you for your order. Your payment has been processed successfully.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Date:</strong> ${new Date(orderData.createdAt).toLocaleDateString()}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
                <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 16px; color: #4CAF50;">$${orderData.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `,
    };
    await this.mailerService.sendMail(mailOptions);
  }
}
