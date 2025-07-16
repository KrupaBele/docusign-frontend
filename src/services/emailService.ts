// Real email service using EmailJS for sending signature requests
import emailjs from "@emailjs/browser";

export interface EmailData {
  to: string;
  subject: string;
  message: string;
  documentTitle: string;
  senderName?: string;
  documentUrl?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Updated EmailJS configuration with actual template ID
const EMAILJS_SERVICE_ID = "service_frdl56l";
const EMAILJS_TEMPLATE_ID = "template_96nvnhb";
const EMAILJS_PUBLIC_KEY = "Hgr9zWNXTctUgNDxw";

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// Real email service using EmailJS
export const sendSignatureRequestEmail = async (
  emailData: EmailData
): Promise<EmailResponse> => {
  try {
    // Create signing URL (in a real app, this would be a unique URL for each recipient)
    const signingUrl =
      emailData.documentUrl || `${window.location.origin}/sign/${Date.now()}`;

    // Email template parameters
    const templateParams = {
      to_email: emailData.to,
      to_name: emailData.to.split("@")[0], // Extract name from email
      subject: emailData.subject || "Signature Request",
      message: emailData.message || `Please sign "${emailData.documentTitle}"`,
      document_title: emailData.documentTitle,
      sender_name: emailData.senderName || "Document Sender",
      signing_url: signingUrl,
      document_url: signingUrl,
    };

    console.log("Sending email with EmailJS:", templateParams);

    // Send email using EmailJS
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log("EmailJS response:", result);

    return {
      success: true,
      messageId: result.messageId || result.text,
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
};

// Fallback mock service for development/demo
export const sendMockSignatureRequestEmail = async (
  emailData: EmailData
): Promise<EmailResponse> => {
  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create signing URL
    const signingUrl = `${window.location.origin}/sign/${Date.now()}`;

    console.log("📧 MOCK EMAIL SENT:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`To: ${emailData.to}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log(`Message: ${emailData.message}`);
    console.log(`Document: ${emailData.documentTitle}`);
    console.log(`Signing URL: ${signingUrl}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Show browser notification if supported
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Email Sent!", {
        body: `Signature request sent to ${emailData.to}`,
        icon: "/favicon.ico",
      });
    }

    // Mock successful response
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    };
  } catch (error) {
    console.error("Mock email sending failed:", error);
    return {
      success: false,
      error: "Failed to send mock email",
    };
  }
};

// Updated to use real email service by default with mock fallback option
export const sendSignatureRequest = async (
  recipients: Array<{ email: string; name: string }>,
  emailTemplate: Omit<EmailData, "to">,
  useMockService: boolean = false
): Promise<{ success: number; failed: number; results: EmailResponse[] }> => {
  const results: EmailResponse[] = [];
  let success = 0;
  let failed = 0;

  console.log(
    `📤 Sending signature requests to ${recipients.length} recipients...`
  );

  for (const recipient of recipients) {
    const emailData: EmailData = {
      ...emailTemplate,
      to: recipient.email,
      senderName: emailTemplate.senderName || recipient.name,
    };

    const result = await (useMockService
      ? sendMockSignatureRequestEmail(emailData)
      : sendSignatureRequestEmail(emailData));

    results.push(result);

    if (result.success) {
      success++;
      console.log(`✅ Email sent successfully to ${recipient.email}`);
    } else {
      failed++;
      console.log(
        `❌ Failed to send email to ${recipient.email}: ${result.error}`
      );
    }
  }

  console.log(
    `📊 Email sending complete: ${success} successful, ${failed} failed`
  );

  return { success, failed, results };
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ("Notification" in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Notification permission error:", error);
      return false;
    }
  }
  return false;
};
