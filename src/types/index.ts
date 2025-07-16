export interface Document {
  id: string;
  title: string;
  recipients: number;
  status: 'pending' | 'completed' | 'draft';
  date: string;
  templateId: string;
}

export interface Template {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  popular?: boolean;
  fields?: DocumentField[];
  recipients?: Recipient[];
  createdAt?: string;
  fileUrl?: string;
  fileType?: string;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  role: 'signer' | 'viewer';
  signature?: {
    id: string;
    name: string;
    type: 'draw' | 'type' | 'upload';
    data: string;
    createdAt: string;
  };
}

export interface DocumentField {
  id: string;
  type: 'signature' | 'date' | 'text' | 'checkbox';
  x: number;
  y: number;
  width: number;
  height: number;
  recipientId: string;
  required: boolean;
  signedData?: {
    id: string;
    name: string;
    type: 'draw' | 'type' | 'upload';
    data: string;
    createdAt: string;
  };
  signedData?: {
    id: string;
    name: string;
    type: 'draw' | 'type' | 'upload';
    data: string;
    createdAt: string;
  };
}

export interface SendData {
  recipients: Recipient[];
  message: string;
  subject: string;
  sendOrder: 'parallel' | 'sequential';
  reminderDays: number;
  expirationDays: number;
}