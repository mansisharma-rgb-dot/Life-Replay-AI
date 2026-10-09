import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape
from flask import current_app

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_password_reset_email(to_email: str, user_name: str, reset_url: str) -> tuple[bool, str | None]:
        """
        Sends a password reset email to the specified user using configured SMTP settings.
        Returns:
            (success: bool, error_message: str | None)
        """
        try:
            config = current_app.config
            mail_server = config.get('MAIL_SERVER', 'smtp.gmail.com')
            mail_port = int(config.get('MAIL_PORT', 587))
            mail_use_tls = config.get('MAIL_USE_TLS', True)
            mail_use_ssl = config.get('MAIL_USE_SSL', False)
            mail_username = config.get('MAIL_USERNAME', '')
            mail_password = config.get('MAIL_PASSWORD', '')
            mail_sender = config.get('MAIL_DEFAULT_SENDER', mail_username or 'noreply@lifereplay.ai')

            safe_name = escape(user_name or 'User')
            safe_url = escape(reset_url)

            # Build HTML content
            html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080c14; color: #f1f5f9; padding: 20px; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; }}
    .logo {{ font-size: 20px; font-weight: bold; color: #a78bfa; margin-bottom: 24px; }}
    .btn {{ display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; margin: 24px 0; }}
    .footer {{ font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }}
    .note {{ font-size: 13px; color: #94a3b8; line-height: 1.6; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Life Replay AI</div>
    <h2 style="color: #ffffff; margin-top: 0;">Reset Your Password</h2>
    <p class="note">Hello {safe_name},</p>
    <p class="note">We received a request to reset your password for your Life Replay AI account. Click the button below to choose a new password:</p>
    <div>
      <a href="{safe_url}" class="btn" target="_blank">Reset Password</a>
    </div>
    <p class="note">Or copy and paste this link into your browser:<br><span style="color: #a78bfa; word-break: break-all;">{safe_url}</span></p>
    <p class="note">This password reset link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
    <div class="footer">
      &copy; Life Replay AI &bull; Personal Growth Analyzer &bull; Confidential & Secure
    </div>
  </div>
</body>
</html>
"""

            plain_text = f"""Hello {user_name or 'User'},

We received a request to reset your password for your Life Replay AI account.
To reset your password, please visit the following link:

{reset_url}

This link is valid for 1 hour. If you did not request this, you can safely ignore this email.

---
Life Replay AI
"""

            # If no SMTP username/password configured in dev environment, log warning and return
            if not mail_username or not mail_password:
                print(f"[AUTH DIAGNOSTIC] SMTP not configured. Generated reset URL for {to_email}: {reset_url}", flush=True)
                logger.warning(
                    "Password reset email skipped: MAIL_USERNAME or MAIL_PASSWORD not configured. "
                    f"Reset URL for {to_email}: {reset_url}"
                )
                return True, None

            # Create MIME message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'Reset your Life Replay AI password'
            msg['From'] = mail_sender
            msg['To'] = to_email

            part1 = MIMEText(plain_text, 'plain', 'utf-8')
            part2 = MIMEText(html_body, 'html', 'utf-8')
            msg.attach(part1)
            msg.attach(part2)

            # Send via SMTP
            if mail_use_ssl:
                with smtplib.SMTP_SSL(mail_server, mail_port, timeout=10) as server:
                    server.login(mail_username, mail_password)
                    server.sendmail(mail_sender, [to_email], msg.as_string())
            else:
                with smtplib.SMTP(mail_server, mail_port, timeout=10) as server:
                    if mail_use_tls:
                        server.starttls()
                    server.login(mail_username, mail_password)
                    server.sendmail(mail_sender, [to_email], msg.as_string())

            logger.info(f"Password reset email successfully sent to {to_email}")
            return True, None

        except smtplib.SMTPAuthenticationError as e:
            logger.error("Password reset email failed to send: SMTP authentication error")
            return False, "SMTP authentication failed"
        except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected, TimeoutError) as e:
            logger.error("Password reset email failed to send: SMTP connection error")
            return False, "SMTP connection failed"
        except Exception as e:
            logger.error(f"Password reset email failed to send: {str(e)}")
            return False, "Failed to send email"
