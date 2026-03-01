import nodemailer, { Transporter } from 'nodemailer';

// ─────────────────────────────────────────────
// Transporter (lazy-initialized singleton)
// ─────────────────────────────────────────────
let _transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('[EmailService] EMAIL_USER / EMAIL_PASS not set — emails disabled.');
    return null;
  }

  _transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user, pass }
  });

  return _transporter;
}

// ─────────────────────────────────────────────
// HTML Template Wrapper
// ─────────────────────────────────────────────
function template(
  title: string,
  accentColor: string,
  emoji: string,
  headline: string,
  bodyHtml: string,
  ctaText?: string,
  ctaUrl?: string
): string {
  const cta = ctaText && ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:${accentColor};color:${accentColor === '#FACC15' ? '#000' : '#fff'};font-weight:700;font-size:15px;border-radius:12px;text-decoration:none;">${ctaText}</a>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#111;border-radius:20px 20px 0 0;padding:32px 40px;border-bottom:1px solid #222;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display:inline-block;width:36px;height:36px;background:${accentColor};border-radius:10px;text-align:center;line-height:36px;font-size:20px;transform:rotate(3deg);">🔥</span>
                  <span style="margin-left:10px;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">BIDORA</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#111;padding:40px 40px 16px;">
            <div style="font-size:48px;margin-bottom:12px;">${emoji}</div>
            <h1 style="margin:0 0 16px;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">${headline}</h1>
            <div style="color:#9ca3af;font-size:15px;line-height:1.7;">${bodyHtml}</div>
            ${cta ? `<div style="margin-top:8px;">${cta}</div>` : ''}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#111;border-radius:0 0 20px 20px;padding:24px 40px;border-top:1px solid #222;">
            <p style="margin:0;color:#4b5563;font-size:12px;line-height:1.6;">
              You're receiving this because you have an active Bidora account.<br>
              © ${new Date().getFullYear()} Bidora Inc. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// Core Send Function
// ─────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return; // silently skip if not configured

  try {
    await transporter.sendMail({
      from: `"Bidora" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`[EmailService] Email sent → ${to}: ${subject}`);
  } catch (err) {
    // Email failures are non-critical — log only
    console.error(`[EmailService] Failed to send email to ${to}:`, err);
  }
}

// ─────────────────────────────────────────────
// Typed Email Factories
// ─────────────────────────────────────────────
const APP_URL = process.env.CLIENT_URL || 'http://localhost:3000';

export const EmailService = {

  async sendWelcome(to: string, name: string) {
    await sendEmail(to, '🎉 Welcome to Bidora!', template(
      'Welcome to Bidora',
      '#FACC15', '🎉',
      `Welcome, ${name || 'Bidder'}!`,
      `<p>You've joined <strong style="color:#fff;">Bidora</strong> — the premium real-time auction platform for verified luxury &amp; collectibles.</p>
             <p>Your wallet is ready. Deposit funds and start bidding on exclusive items from verified sellers worldwide.</p>`,
      'Browse Live Auctions', `${APP_URL}/search?status=LIVE`
    ));
  },

  async sendOutbid(to: string, name: string, auctionTitle: string, auctionId: string, newBid: number) {
    await sendEmail(to, `🔔 You've been outbid on "${auctionTitle}"`, template(
      'You\'ve Been Outbid',
      '#EF4444', '🔔',
      "You've Been Outbid!",
      `<p>Hi <strong style="color:#fff;">${name || 'there'}</strong>,</p>
             <p>Someone placed a higher bid of <strong style="color:#ef4444;">₹${newBid.toLocaleString()}</strong> on:</p>
             <p style="background:#1a1a1a;border-left:4px solid #ef4444;padding:12px 16px;border-radius:8px;color:#fff;font-weight:700;">${auctionTitle}</p>
             <p>Don't let them win — jump back in before the auction ends!</p>`,
      '⚡ Bid Again Now', `${APP_URL}/auctions/${auctionId}`
    ));
  },

  async sendAuctionWon(to: string, name: string, auctionTitle: string, auctionId: string, amount: number) {
    await sendEmail(to, `🏆 Congratulations! You won "${auctionTitle}"`, template(
      'You Won the Auction!',
      '#FACC15', '🏆',
      'You Won the Auction!',
      `<p>Hi <strong style="color:#fff;">${name || 'there'}</strong>,</p>
             <p>Congratulations! You are the winning bidder for:</p>
             <p style="background:#1a1a1a;border-left:4px solid #facc15;padding:12px 16px;border-radius:8px;color:#fff;font-weight:700;">${auctionTitle}</p>
             <p>Winning bid: <strong style="color:#facc15;font-size:20px;">₹${amount.toLocaleString()}</strong></p>
             <p>Please complete your payment within <strong style="color:#fff;">48 hours</strong> to secure your item. After that, the item may be offered to the next bidder.</p>`,
      '💳 Complete Payment Now', `${APP_URL}/auctions/${auctionId}/pay`
    ));
  },

  async sendPaymentRequired(to: string, name: string, auctionTitle: string, auctionId: string, amount: number) {
    await sendEmail(to, `💳 Payment required for "${auctionTitle}"`, template(
      'Payment Required',
      '#F97316', '💳',
      'Payment Required',
      `<p>Hi <strong style="color:#fff;">${name || 'there'}</strong>,</p>
             <p>Your payment of <strong style="color:#f97316;">₹${amount.toLocaleString()}</strong> is due for:</p>
             <p style="background:#1a1a1a;border-left:4px solid #f97316;padding:12px 16px;border-radius:8px;color:#fff;font-weight:700;">${auctionTitle}</p>
             <p>⚠️ Please pay within <strong style="color:#fff;">48 hours</strong> to secure your item. Failure to pay may result in account suspension.</p>`,
      '💳 Pay Now', `${APP_URL}/auctions/${auctionId}/pay`
    ));
  },

  async sendPaymentReceived(to: string, name: string, auctionTitle: string, amount: number) {
    await sendEmail(to, `💰 Payment received for "${auctionTitle}"`, template(
      'Payment Received',
      '#22C55E', '💰',
      'Payment Received!',
      `<p>Hi <strong style="color:#fff;">${name || 'there'}</strong>,</p>
             <p>Great news! The buyer has paid <strong style="color:#22c55e;">₹${amount.toLocaleString()}</strong> for:</p>
             <p style="background:#1a1a1a;border-left:4px solid #22c55e;padding:12px 16px;border-radius:8px;color:#fff;font-weight:700;">${auctionTitle}</p>
             <p>The payment is held securely in <strong style="color:#fff;">Bidora Escrow</strong>. Please ship the item and provide a valid tracking number within <strong style="color:#fff;">5 business days</strong>.</p>
             <p style="color:#6b7280;font-size:13px;">Funds will be released to your wallet automatically once the buyer confirms delivery.</p>`,
      '📦 Mark as Shipped', `${APP_URL}/dashboard`
    ));
  },

  async sendItemShipped(to: string, name: string, auctionTitle: string, auctionId: string, courier: string, trackingNumber: string) {
    await sendEmail(to, `📦 Your item has been shipped!`, template(
      'Item Shipped',
      '#3B82F6', '📦',
      'Your Item is on the Way!',
      `<p>Hi <strong style="color:#fff;">${name || 'there'}</strong>,</p>
             <p>Your item <strong style="color:#fff;">"${auctionTitle}"</strong> has been shipped!</p>
             <table style="width:100%;background:#1a1a1a;border-radius:12px;padding:16px;border-collapse:collapse;margin:16px 0;">
               <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Courier</td><td style="color:#fff;font-weight:700;">${courier}</td></tr>
               <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Tracking #</td><td style="color:#3b82f6;font-weight:700;font-family:monospace;">${trackingNumber}</td></tr>
             </table>
             <p>Once you receive the item, please confirm delivery on Bidora to release payment to the seller.</p>`,
      '📦 Track My Order', `${APP_URL}/auctions/${auctionId}`
    ));
  },

  async sendDisputeOpened(to: string, name: string, auctionTitle: string) {
    await sendEmail(to, `⚠️ Dispute opened for "${auctionTitle}"`, template(
      'Dispute Opened',
      '#EF4444', '⚠️',
      'A Dispute Has Been Opened',
      `<p>Hi <strong style="color:#fff;">${name || 'there'}</strong>,</p>
             <p>A buyer has opened a dispute for:</p>
             <p style="background:#1a1a1a;border-left:4px solid #ef4444;padding:12px 16px;border-radius:8px;color:#fff;font-weight:700;">${auctionTitle}</p>
             <p>Escrow funds are temporarily frozen pending admin review. Our team will contact you within <strong style="color:#fff;">24–48 hours</strong>.</p>`,
      '📋 View Dashboard', `${APP_URL}/dashboard`
    ));
  },

  async sendDepositSuccess(to: string, name: string, amount: number) {
    await sendEmail(to, '💰 Deposit Successful!', template(
      'Deposit Successful',
      '#FACC15', '💰',
      'Funds Added to Wallet',
      `<p>Hi <strong style="color:#fff;">${name || 'there'}</strong>,</p>
             <p>A deposit of <strong style="color:#facc15;font-size:20px;">₹${amount.toLocaleString()}</strong> has been successfully credited to your wallet.</p>
             <p>You can now use these funds to bid on active auctions.</p>`,
      'Go to Dashboard', `${APP_URL}/dashboard`
    ));
  }
};
