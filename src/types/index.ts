export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  businessId: string;
  role: 'Admin' | 'Finance Manager' | 'Collection Specialist' | 'Auditor';
  photoURL?: string;
  phone?: string;
  createdAt: string;
}

export interface BusinessProfile {
  businessId: string;
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  businessAddress: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  createdDate: string;
  gstin?: string;
  logoUrl?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  discountPercent: number;
  total: number;
}

export type InvoiceStatus = 'paid' | 'overdue' | 'pending';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  overdueDays?: number;
  items: InvoiceItem[];
  notes?: string;
  paymentTerms?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  totalBilled: number;
  outstandingBalance: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  status: 'active' | 'overdue' | 'good' | 'pending';
  overdueDays?: number;
  creditLimit: number;
  notes?: string;
  avatarColor?: string;
  preferredChannel?: 'whatsapp' | 'email' | 'sms' | 'all';
  optInWhatsapp?: boolean;
  optInSms?: boolean;
  optInEmail?: boolean;
}

export type FollowUpStatus = 'pending' | 'sent' | 'completed' | 'rescheduled' | 'overdue';
export type FollowUpChannel = 'whatsapp' | 'email' | 'call' | 'sms';

export interface FollowUp {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  amountDue: number;
  dueDate: string;
  dueLabel: string;
  lastReminderDate?: string;
  status: FollowUpStatus;
  channel: FollowUpChannel;
  avatarLetter: string;
  avatarColor: string;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
}

export type PromiseStatus = 'pending' | 'fulfilled' | 'overdue';

export interface PromiseToPay {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  promisedAmount: number;
  promisedDate: string;
  status: PromiseStatus;
  notes?: string;
  followUpAction?: string;
  createdAt: string;
}

export type PaymentMethod = 'UPI' | 'Bank Transfer (NEFT/RTGS)' | 'Credit Card' | 'Cheque' | 'Cash' | 'Stripe';
export type PaymentStatus = 'success' | 'pending' | 'failed' | 'refunded';
export type ReconciliationStatus = 'reconciled' | 'unreconciled';

export interface Payment {
  id: string;
  transactionId: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  reconciliationStatus: ReconciliationStatus;
  referenceNote?: string;
  receivedBy?: string;
}

export interface Task {
  id: string;
  title: string;
  customerName: string;
  dueDate: string;
  timeLabel: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface ActivityLog {
  id: string;
  type: 'payment_received' | 'reminder_sent' | 'invoice_created' | 'customer_added' | 'promise_recorded' | 'status_updated';
  title: string;
  description: string;
  amount?: number;
  timestamp?: string;
  customerName?: string;
  iconType: 'check' | 'mail' | 'plus' | 'alert' | 'user';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Finance Manager' | 'Collection Specialist' | 'Auditor';
  assignedCustomersCount: number;
  assignedInvoicesCount: number;
  recoveryRate: number;
  status: 'Active' | 'Invited' | 'Suspended';
  avatar?: string;
  joinedDate: string;
}

export interface Integration {
  id: string;
  name: string;
  category: 'communication' | 'storage' | 'payments' | 'accounting' | 'crm' | 'calendar';
  description: string;
  icon: string;
  isConnected: boolean;
  connectedAccount?: string;
  connectedAt?: string;
  config: Record<string, string>;
  features: string[];
}

export interface BusinessSettings {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  gstin: string;
  invoicePrefix: string;
  startingInvoiceNumber: number;
  defaultPaymentTermsDays: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  dailyDigest: boolean;
  twoFactorEnabled: boolean;
  currentPlan: 'Free Trial' | 'Starter' | 'Pro' | 'Enterprise';
  trialDaysLeft: number;
}

export type NotificationChannel = 'email' | 'whatsapp' | 'sms' | 'push';
export type NotificationEventType = 'invoice_reminder' | 'overdue_alert' | 'payment_confirmation' | 'followup_reminder';
export type NotificationDeliveryStatus = 'queued' | 'sent' | 'delivered' | 'failed';

export interface NotificationLog {
  id: string;
  businessId: string;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  recipientName: string;
  recipientTarget: string; // email, phone number, or FCM push token
  subject?: string;
  content: string;
  status: NotificationDeliveryStatus;
  provider: 'Resend' | 'Meta WhatsApp Cloud' | 'MSG91' | 'Firebase Cloud Messaging' | 'Google Workspace Gmail';
  providerMessageId?: string;
  sentAt: string;
  deliveredAt?: string;
  failedAt?: string;
  errorMessage?: string;
  costEstimate: number; // in INR
  retryCount: number;
  canRetry: boolean;
  invoiceNumber?: string;
  customerName?: string;
  dltTemplateId?: string;
  metaTemplateName?: string;
}

export interface EmailChannelConfig {
  enabled: boolean;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  apiKeyConfigured: boolean;
  dailyLimit: number;
  costPerUnit: number; // in INR
}

export interface WhatsAppChannelConfig {
  enabled: boolean;
  phoneNumberId: string;
  wabaId: string;
  accessToken?: string;
  businessPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'error';
  lastTestedAt?: string;
  lastError?: string;
  optInEnforced: boolean;
  templateNamespace: string;
  tokenConfigured: boolean;
  costPerUnit: number; // in INR
  requireAdminApproval: boolean;
}

export interface SMSChannelConfig {
  enabled: boolean;
  senderId: string; // 6-char DLT Header e.g. COLTIQ
  dltEntityId: string;
  dltRegistered: boolean;
  route: 'dlt' | 'transactional';
  authKeyConfigured: boolean;
  costPerUnit: number; // in INR
  requireAdminApproval: boolean;
}

export interface PushChannelConfig {
  enabled: boolean;
  fcmConfigured: boolean;
  vapidKey: string;
  costPerUnit: number; // 0 INR
}

export interface NotificationTemplate {
  id: string;
  name: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  dltTemplateId?: string;
  metaTemplateName?: string;
  metaTemplateCategory?: 'PAYMENT_UPDATE' | 'UTILITY';
  metaStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  variables: string[];
  isDefault: boolean;
}

export interface NotificationSettings {
  email: EmailChannelConfig;
  whatsapp: WhatsAppChannelConfig;
  sms: SMSChannelConfig;
  push: PushChannelConfig;
  monthlySpendLimit: number; // in INR e.g. 2500
  currentMonthSpend: number;
  currentMonthCount: {
    email: number;
    whatsapp: number;
    sms: number;
    push: number;
  };
  autoPauseOnSpendLimit: boolean;
  alertThresholdPercent: number; // 80%
  requireAdminApprovalForPaid: boolean;
  sandboxSimulationMode: boolean; // Safe preview mode
}

