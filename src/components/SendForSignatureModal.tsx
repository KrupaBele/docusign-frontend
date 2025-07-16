import React, { useState } from "react";
import {
  X,
  Send,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Recipient, DocumentField } from "../types";

interface SendForSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (sendData: SendData) => Promise<void>;
  recipients: Recipient[];
  documentFields: DocumentField[];
  documentTitle: string;
  isSending?: boolean;
}

export interface SendData {
  recipients: Recipient[];
  message: string;
  subject: string;
  sendOrder: "parallel" | "sequential";
  reminderDays: number;
  expirationDays: number;
}

const SendForSignatureModal: React.FC<SendForSignatureModalProps> = ({
  isOpen,
  onClose,
  onSend,
  recipients,
  documentFields,
  documentTitle,
  isSending = false,
}) => {
  const [message, setMessage] = useState(
    `Please review and sign the attached document: ${documentTitle}`
  );
  const [subject, setSubject] = useState(`Signature Request: ${documentTitle}`);
  const [sendOrder, setSendOrder] = useState<"parallel" | "sequential">(
    "parallel"
  );
  const [reminderDays, setReminderDays] = useState(3);
  const [expirationDays, setExpirationDays] = useState(30);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateBeforeSend = () => {
    const errors: string[] = [];

    // Check if recipients have valid emails
    recipients.forEach((recipient, index) => {
      if (!recipient.email || !recipient.email.includes("@")) {
        errors.push(`Recipient ${index + 1} needs a valid email address`);
      }
      if (
        !recipient.name ||
        recipient.name.trim() === "" ||
        recipient.name === "Full name"
      ) {
        errors.push(`Recipient ${index + 1} needs a valid name`);
      }
    });

    // Check if there are signature fields for signers
    const signerRecipients = recipients.filter((r) => r.role === "signer");
    const signatureFields = documentFields.filter(
      (f) => f.type === "signature"
    );

    if (signerRecipients.length > 0 && signatureFields.length === 0) {
      errors.push("Add at least one signature field for signers");
    }

    // Check if all signature fields are assigned to recipients
    signatureFields.forEach((field, index) => {
      const assignedRecipient = recipients.find(
        (r) => r.id === field.recipientId
      );
      if (!assignedRecipient) {
        errors.push(
          `Signature field ${index + 1} is not assigned to a recipient`
        );
      }
    });

    return errors;
  };

  const handleSend = async () => {
    setIsValidating(true);
    const errors = validateBeforeSend();

    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsValidating(false);
      return;
    }

    const sendData: SendData = {
      recipients,
      message,
      subject,
      sendOrder,
      reminderDays,
      expirationDays,
    };

    await onSend(sendData);
    setIsValidating(false);
  };

  const getRecipientFieldCount = (recipientId: string) => {
    return documentFields.filter((field) => field.recipientId === recipientId)
      .length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Send className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Send for Signature
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <h3 className="text-sm font-medium text-red-800">
                  Please fix these issues:
                </h3>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recipients Summary */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recipients ({recipients.length})
            </h3>
            <div className="space-y-3">
              {recipients.map((recipient, index) => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {recipient.name}
                      </p>
                      <p className="text-sm text-gray-500">{recipient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        recipient.role === "signer"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {recipient.role}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getRecipientFieldCount(recipient.id)} field
                      {getRecipientFieldCount(recipient.id) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Email Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Recipients
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a personal message for your recipients..."
                />
              </div>
            </div>
          </div>

          {/* Signing Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Signing Options
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signing Order
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sendOrder"
                      value="parallel"
                      checked={sendOrder === "parallel"}
                      onChange={(e) =>
                        setSendOrder(e.target.value as "parallel")
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Send to all recipients at once
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sendOrder"
                      value="sequential"
                      checked={sendOrder === "sequential"}
                      onChange={(e) =>
                        setSendOrder(e.target.value as "sequential")
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Send in order (one at a time)
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reminder (days)
                  </label>
                  <select
                    value={reminderDays}
                    onChange={(e) => setReminderDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expires in (days)
                  </label>
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Document Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Document Summary
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                • <strong>{documentTitle}</strong>
              </p>
              <p>
                • {recipients.length} recipient
                {recipients.length !== 1 ? "s" : ""}
              </p>
              <p>
                • {documentFields.length} field
                {documentFields.length !== 1 ? "s" : ""} to complete
              </p>
              <p>
                • {documentFields.filter((f) => f.type === "signature").length}{" "}
                signature
                {documentFields.filter((f) => f.type === "signature").length !==
                1
                  ? "s"
                  : ""}{" "}
                required
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isValidating}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            {isValidating ? "Validating..." : "Send for Signature"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendForSignatureModal;
