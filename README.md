# DocuSign Clone - Email Setup Guide

## 📧 Email Integration Setup

This application supports real email sending through EmailJS. Follow these steps to enable actual email delivery:

### Option 1: EmailJS Setup (Recommended for Client-Side)

1. **Create EmailJS Account**
   - Go to [EmailJS.com](https://www.emailjs.com/)
   - Sign up for a free account

2. **Create Email Service**
   - Add a new email service (Gmail, Outlook, etc.)
   - Note your Service ID

3. **Create Email Template**
   - Create a new email template with these variables:
     - `{{to_email}}` - Recipient email
     - `{{to_name}}` - Recipient name
     - `{{subject}}` - Email subject
     - `{{message}}` - Custom message
     - `{{document_title}}` - Document title
     - `{{sender_name}}` - Sender name
     - `{{signing_url}}` - Link to sign document
   - Note your Template ID

4. **Get Public Key**
   - Go to Account settings
   - Copy your Public Key

5. **Update Configuration**
   - Open `src/services/emailService.ts`
   - Replace these values:
     ```javascript
     const EMAILJS_SERVICE_ID = 'your_service_id';
     const EMAILJS_TEMPLATE_ID = 'your_template_id';
     const EMAILJS_PUBLIC_KEY = 'your_public_key';
     ```
   - Change the email function call from `sendMockSignatureRequestEmail` to `sendSignatureRequestEmail`

### Option 2: Alternative Email Services

For production applications, consider these alternatives:

- **SendGrid** - Professional email delivery
- **AWS SES** - Amazon's email service
- **Mailgun** - Developer-friendly email API
- **Resend** - Modern email API

### Current Demo Mode

The application currently runs in **demo mode** with:
- ✅ Mock email sending (console logs)
- ✅ Browser notifications (if permitted)
- ✅ Detailed success/failure reporting
- ✅ Professional email templates

### Email Template Example

```html
Subject: {{subject}}

Hi {{to_name}},

{{message}}

Document: {{document_title}}
From: {{sender_name}}

Please click the link below to review and sign the document:
{{signing_url}}

This link will expire in 30 days.

Best regards,
{{sender_name}}
```

### Features

- 📧 **Professional Email Templates**
- 🔄 **Bulk Email Sending**
- ✅ **Success/Failure Tracking**
- 🔔 **Browser Notifications**
- 📊 **Detailed Reporting**
- 🎯 **Recipient Management**
- ⏰ **Reminder Settings**
- 📅 **Expiration Control**

### Testing

1. **Demo Mode**: Works immediately with console logging
2. **Real Emails**: Configure EmailJS for actual email delivery
3. **Notifications**: Browser notifications show email status

---

**Note**: The application is fully functional in demo mode. Real email integration requires setting up an email service provider.