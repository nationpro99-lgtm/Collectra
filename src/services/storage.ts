import {
  Invoice,
  Customer,
  FollowUp,
  PromiseToPay,
  Payment,
  Task,
  ActivityLog,
  TeamMember,
  Integration,
  BusinessSettings,
  NotificationSettings,
  NotificationLog,
  NotificationTemplate,
  NotificationChannel,
} from '../types';
import {
  db,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

export interface AppState {
  invoices: Invoice[];
  customers: Customer[];
  followUps: FollowUp[];
  promisesToPay: PromiseToPay[];
  payments: Payment[];
  tasks: Task[];
  activities: ActivityLog[];
  teamMembers: TeamMember[];
  integrations: Integration[];
  settings: BusinessSettings;
  notificationSettings: NotificationSettings;
  notificationLogs: NotificationLog[];
  notificationTemplates: NotificationTemplate[];
}

export const createCleanBusinessState = (
  businessName: string = '',
  businessEmail: string = '',
  _ownerName: string = ''
): AppState => ({
  settings: {
    businessName: businessName || 'My Business',
    businessEmail: businessEmail || '',
    businessPhone: '',
    businessAddress: '',
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata (IST)',
    gstin: '',
    invoicePrefix: 'INV-',
    startingInvoiceNumber: 1001,
    defaultPaymentTermsDays: 15,
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    emailNotifications: true,
    whatsappNotifications: true,
    dailyDigest: true,
    twoFactorEnabled: true,
    currentPlan: 'Free Trial',
    trialDaysLeft: 7,
    allowPartialPayments: true,
    minPartialAmount: 500,
    razorpayKeyId: '',
    razorpayKeySecretConfigured: false,
    razorpayWebhookConfigured: false,
  },
  customers: [],
  invoices: [],
  followUps: [],
  promisesToPay: [],
  payments: [],
  tasks: [],
  activities: [],
  teamMembers: [],
  integrations: [
    {
      id: 'int-whatsapp',
      name: 'WhatsApp Business Cloud API',
      category: 'communication',
      description: 'Automated payment reminder dispatches via official WhatsApp Business API.',
      icon: 'MessageSquare',
      isConnected: false,
      config: {},
      features: ['Automated delivery receipts', 'Rich payment link templates', 'Read receipt tracking'],
    },
    {
      id: 'int-razorpay',
      name: 'Razorpay Payment Gateway',
      category: 'payments',
      description: 'One-click payment links, UPI intent, and instant reconciliation.',
      icon: 'CreditCard',
      isConnected: false,
      config: {},
      features: ['Instant UPI intent', 'Real-time webhook reconciliation', 'QR generation'],
    },
    {
      id: 'int-tally',
      name: 'TallyPrime ERP Connector',
      category: 'accounting',
      description: 'Bi-directional sync of sales ledgers, debit notes, and payment receipts.',
      icon: 'Layers',
      isConnected: false,
      config: {},
      features: ['Ledger synchronization', 'Automated debit note posting', 'GST reconciliation'],
    },
    {
      id: 'int-zoho',
      name: 'Zoho Books Sync',
      category: 'accounting',
      description: 'Automatic import of unpaid invoices and contact registries.',
      icon: 'RefreshCw',
      isConnected: false,
      config: {},
      features: ['Invoice status sync', 'Contact deduplication', 'Aging report sync'],
    },
  ],
  notificationSettings: {
    email: {
      enabled: true,
      fromName: 'CollectIQ Billing',
      fromEmail: 'billing@collectiq.io',
      replyTo: 'support@collectiq.io',
      apiKeyConfigured: false,
      dailyLimit: 500,
      costPerUnit: 0.1,
    },
    whatsapp: {
      enabled: true,
      phoneNumberId: '',
      wabaId: '',
      optInEnforced: true,
      templateNamespace: 'collectiq_notifications',
      tokenConfigured: false,
      costPerUnit: 0.8,
      requireAdminApproval: false,
    },
    sms: {
      enabled: false,
      senderId: 'CLCTIQ',
      dltEntityId: '',
      dltRegistered: false,
      route: 'transactional',
      authKeyConfigured: false,
      costPerUnit: 0.25,
      requireAdminApproval: true,
    },
    push: {
      enabled: false,
      fcmConfigured: false,
      vapidKey: '',
      costPerUnit: 0,
    },
    monthlySpendLimit: 2500,
    currentMonthSpend: 0,
    currentMonthCount: { email: 0, whatsapp: 0, sms: 0, push: 0 },
    autoPauseOnSpendLimit: true,
    alertThresholdPercent: 80,
    requireAdminApprovalForPaid: false,
    sandboxSimulationMode: true,
  },
  notificationLogs: [],
  notificationTemplates: [
    {
      id: 'tpl-wa-invoice-created',
      name: 'Invoice Created',
      eventType: 'invoice_reminder',
      channel: 'whatsapp',
      metaTemplateName: 'collectiq_invoice_created',
      metaTemplateCategory: 'UTILITY',
      metaStatus: 'APPROVED',
      subject: '',
      body: 'Hello {{customerName}}, your invoice {{invoiceNumber}} for {{amount}} is ready. Payment is due on {{dueDate}}. Thank you.',
      variables: ['customerName', 'invoiceNumber', 'amount', 'dueDate'],
      isDefault: true,
    },
    {
      id: 'tpl-wa-payment-reminder',
      name: 'Payment Reminder',
      eventType: 'invoice_reminder',
      channel: 'whatsapp',
      metaTemplateName: 'collectiq_payment_reminder',
      metaTemplateCategory: 'UTILITY',
      metaStatus: 'APPROVED',
      subject: '',
      body: 'Hello {{customerName}}, this is a friendly reminder that invoice {{invoiceNumber}} has an outstanding balance of {{amount}}. Please make your payment by {{dueDate}}.',
      variables: ['customerName', 'invoiceNumber', 'amount', 'dueDate'],
      isDefault: true,
    },
    {
      id: 'tpl-wa-overdue-payment',
      name: 'Overdue Payment Notice',
      eventType: 'overdue_alert',
      channel: 'whatsapp',
      metaTemplateName: 'collectiq_overdue_payment',
      metaTemplateCategory: 'UTILITY',
      metaStatus: 'APPROVED',
      subject: '',
      body: 'Hello {{customerName}}, invoice {{invoiceNumber}} for {{amount}} is overdue. Please contact us if you need assistance with payment.',
      variables: ['customerName', 'invoiceNumber', 'amount'],
      isDefault: true,
    },
    {
      id: 'tpl-wa-payment-received',
      name: 'Payment Received Voucher',
      eventType: 'payment_confirmation',
      channel: 'whatsapp',
      metaTemplateName: 'collectiq_payment_received',
      metaTemplateCategory: 'UTILITY',
      metaStatus: 'APPROVED',
      subject: '',
      body: 'Hello {{customerName}}, we have received your payment of {{amount}} for invoice {{invoiceNumber}}. Thank you!',
      variables: ['customerName', 'amount', 'invoiceNumber'],
      isDefault: true,
    },
    {
      id: 'tpl-wa-promise-reminder',
      name: 'Payment Promise Reminder',
      eventType: 'followup_reminder',
      channel: 'whatsapp',
      metaTemplateName: 'collectiq_promise_reminder',
      metaTemplateCategory: 'UTILITY',
      metaStatus: 'APPROVED',
      subject: '',
      body: 'Hello {{customerName}}, this is a reminder of your promised payment of {{amount}} scheduled for {{dueDate}}.',
      variables: ['customerName', 'amount', 'dueDate'],
      isDefault: true,
    },
    {
      id: 'tpl-wa-hello-world',
      name: 'Meta Connection Test (Hello World)',
      eventType: 'followup_reminder',
      channel: 'whatsapp',
      metaTemplateName: 'hello_world',
      metaTemplateCategory: 'UTILITY',
      metaStatus: 'APPROVED',
      subject: '',
      body: 'Hello World',
      variables: [],
      isDefault: false,
    },
  ],
});

export const createEmptyBusinessData = createCleanBusinessState;
export const initialData = createCleanBusinessState();

type Subscriber = (state: AppState) => void;

class StorageService {
  private currentBusinessId: string = 'biz-default';
  private state: AppState;
  private subscribers: Set<Subscriber> = new Set();
  private firestoreUnsubscribers: Unsubscribe[] = [];

  constructor() {
    const savedBizId = localStorage.getItem('collectiq_active_biz_id') || 'biz-default';
    this.currentBusinessId = savedBizId;
    this.state = this.loadLocalState();
    this.setupFirestoreListeners();
  }

  private getStorageKey(): string {
    return `collectiq_biz_${this.currentBusinessId}`;
  }

  public setBusiness(
    businessId: string,
    businessName?: string,
    ownerEmail?: string,
    ownerName?: string
  ): void {
    if (this.currentBusinessId !== businessId) {
      this.teardownFirestoreListeners();
      this.currentBusinessId = businessId;
      localStorage.setItem('collectiq_active_biz_id', businessId);
      this.state = this.loadLocalState(businessName, ownerEmail, ownerName);
      this.setupFirestoreListeners();
      this.notify();
    }
  }

  public getActiveBusinessId(): string {
    return this.currentBusinessId;
  }

  private loadLocalState(
    businessName?: string,
    ownerEmail?: string,
    ownerName?: string
  ): AppState {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...createCleanBusinessState(businessName, ownerEmail, ownerName),
          ...parsed,
          settings: {
            ...createCleanBusinessState(businessName, ownerEmail, ownerName).settings,
            ...(parsed.settings || {}),
          },
          invoices: parsed.invoices || [],
          customers: parsed.customers || [],
          payments: parsed.payments || [],
          followUps: parsed.followUps || [],
          promisesToPay: parsed.promisesToPay || [],
          tasks: parsed.tasks || [],
          activities: parsed.activities || [],
          teamMembers: parsed.teamMembers || [],
        };
      }
    } catch (e) {
      console.warn('Failed to parse local cached state', e);
    }
    return createCleanBusinessState(businessName, ownerEmail, ownerName);
  }

  private saveLocalState() {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state));
    } catch {
      // Ignored
    }
  }

  private teardownFirestoreListeners() {
    this.firestoreUnsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // Ignored
      }
    });
    this.firestoreUnsubscribers = [];
  }

  private setupFirestoreListeners() {
    if (!db || !this.currentBusinessId) return;
    const bizId = this.currentBusinessId;

    try {
      // Invoices
      const invPath = `businesses/${bizId}/invoices`;
      const unsubInvoices = onSnapshot(
        collection(db, 'businesses', bizId, 'invoices'),
        (snapshot) => {
          const invoices: Invoice[] = [];
          snapshot.forEach((d) => {
            invoices.push(d.data() as Invoice);
          });
          this.state.invoices = this.recalculateInvoiceAging(invoices);
          this.recalculateCustomerBalances();
          this.saveLocalState();
          this.notify();
        },
        (err) => {
          console.warn('Firestore onSnapshot invoices error', err.message);
        }
      );
      this.firestoreUnsubscribers.push(unsubInvoices);

      // Customers
      const unsubCustomers = onSnapshot(
        collection(db, 'businesses', bizId, 'customers'),
        (snapshot) => {
          const customers: Customer[] = [];
          snapshot.forEach((d) => {
            customers.push(d.data() as Customer);
          });
          this.state.customers = customers;
          this.recalculateCustomerBalances();
          this.saveLocalState();
          this.notify();
        },
        (err) => {
          console.warn('Firestore onSnapshot customers error', err.message);
        }
      );
      this.firestoreUnsubscribers.push(unsubCustomers);

      // Payments
      const unsubPayments = onSnapshot(
        collection(db, 'businesses', bizId, 'payments'),
        (snapshot) => {
          const payments: Payment[] = [];
          snapshot.forEach((d) => {
            payments.push(d.data() as Payment);
          });
          this.state.payments = payments;
          this.saveLocalState();
          this.notify();
        },
        (err) => {
          console.warn('Firestore onSnapshot payments error', err.message);
        }
      );
      this.firestoreUnsubscribers.push(unsubPayments);

      // Follow-ups
      const unsubFollowUps = onSnapshot(
        collection(db, 'businesses', bizId, 'followUps'),
        (snapshot) => {
          const followUps: FollowUp[] = [];
          snapshot.forEach((d) => {
            followUps.push(d.data() as FollowUp);
          });
          this.state.followUps = followUps;
          this.saveLocalState();
          this.notify();
        },
        (err) => {
          console.warn('Firestore onSnapshot followUps error', err.message);
        }
      );
      this.firestoreUnsubscribers.push(unsubFollowUps);

      // Promises to Pay
      const unsubPromises = onSnapshot(
        collection(db, 'businesses', bizId, 'promisesToPay'),
        (snapshot) => {
          const promises: PromiseToPay[] = [];
          snapshot.forEach((d) => {
            promises.push(d.data() as PromiseToPay);
          });
          this.state.promisesToPay = promises;
          this.saveLocalState();
          this.notify();
        },
        (err) => {
          console.warn('Firestore onSnapshot promises error', err.message);
        }
      );
      this.firestoreUnsubscribers.push(unsubPromises);

      // Tasks
      const unsubTasks = onSnapshot(
        collection(db, 'businesses', bizId, 'tasks'),
        (snapshot) => {
          const tasks: Task[] = [];
          snapshot.forEach((d) => {
            tasks.push(d.data() as Task);
          });
          this.state.tasks = tasks;
          this.saveLocalState();
          this.notify();
        },
        (err) => {
          console.warn('Firestore onSnapshot tasks error', err.message);
        }
      );
      this.firestoreUnsubscribers.push(unsubTasks);

      // Activities
      const unsubActivities = onSnapshot(
        collection(db, 'businesses', bizId, 'activities'),
        (snapshot) => {
          const activities: ActivityLog[] = [];
          snapshot.forEach((d) => {
            activities.push(d.data() as ActivityLog);
          });
          this.state.activities = activities;
          this.saveLocalState();
          this.notify();
        },
        (err) => {
          console.warn('Firestore onSnapshot activities error', err.message);
        }
      );
      this.firestoreUnsubscribers.push(unsubActivities);

      // Team
      const unsubTeam = onSnapshot(
        collection(db, 'businesses', bizId, 'team'),
        (snapshot) => {
          const team: TeamMember[] = [];
          snapshot.forEach((d) => {
            team.push(d.data() as TeamMember);
          });
          this.state.teamMembers = team;
          this.saveLocalState();
          this.notify();
        },
        (err) => {
          console.warn('Firestore onSnapshot team error', err.message);
        }
      );
      this.firestoreUnsubscribers.push(unsubTeam);
    } catch (e) {
      console.warn('Firestore listener attachment error', e);
    }
  }

  public subscribe(sub: Subscriber): () => void {
    this.subscribers.add(sub);
    return () => {
      this.subscribers.delete(sub);
    };
  }

  private notify() {
    this.subscribers.forEach((sub) => sub(this.state));
  }

  public getState(): AppState {
    return this.state;
  }

  // --- Financial Calculations ---
  private recalculateInvoiceAging(invoices: Invoice[]): Invoice[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return invoices.map((inv) => {
      const balance = Math.max(0, inv.amount - (inv.paidAmount || 0));
      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      let status = inv.status;
      if (balance <= 0) {
        status = 'paid';
      } else if (diffDays > 0) {
        status = 'overdue';
      } else {
        status = 'pending';
      }

      return {
        ...inv,
        balance,
        status,
        overdueDays: status === 'overdue' ? diffDays : 0,
      };
    });
  }

  private recalculateCustomerBalances() {
    this.state.customers = this.state.customers.map((cust) => {
      const custInvoices = this.state.invoices.filter((i) => i.customerId === cust.id);
      const totalBilled = custInvoices.reduce((sum, i) => sum + i.amount, 0);
      const totalPaid = custInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
      const outstandingBalance = Math.max(0, totalBilled - totalPaid);
      const overdueInvoices = custInvoices.filter((i) => i.status === 'overdue');
      const maxOverdueDays = overdueInvoices.reduce((max, i) => Math.max(max, i.overdueDays || 0), 0);

      let status: Customer['status'] = 'good';
      if (maxOverdueDays > 30) {
        status = 'overdue';
      } else if (maxOverdueDays > 0) {
        status = 'pending';
      } else if (outstandingBalance > 0) {
        status = 'active';
      }

      return {
        ...cust,
        totalBilled,
        outstandingBalance,
        overdueDays: maxOverdueDays,
        status,
      };
    });
  }

  // --- Invoices ---
  public addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Invoice {
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();
    const balance = Math.max(0, invoice.amount - (invoice.paidAmount || 0));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(invoice.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));

    let status = invoice.status;
    if (balance <= 0) {
      status = 'paid';
    } else if (diffDays > 0) {
      status = 'overdue';
    } else {
      status = 'pending';
    }

    const newInvoice: Invoice = {
      ...invoice,
      id,
      balance,
      status,
      overdueDays: status === 'overdue' ? diffDays : 0,
      createdAt,
    };

    this.state.invoices = [newInvoice, ...this.state.invoices];
    this.recalculateCustomerBalances();
    this.saveLocalState();
    this.notify();

    // Firestore sync
    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/invoices/${id}`;
      setDoc(doc(db, 'businesses', this.currentBusinessId, 'invoices', id), {
        ...newInvoice,
        businessId: this.currentBusinessId,
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    }

    this.addActivity({
      type: 'invoice_created',
      title: `Invoice created: ${newInvoice.invoiceNumber}`,
      description: `Billed to ${newInvoice.customerName} • ${this.state.settings.currencySymbol}${newInvoice.amount.toLocaleString('en-IN')}`,
      amount: newInvoice.amount,
      customerName: newInvoice.customerName,
      iconType: 'plus',
    });

    return newInvoice;
  }

  public updateInvoice(id: string, updates: Partial<Invoice>): void {
    this.state.invoices = this.state.invoices.map((inv) => {
      if (inv.id !== id) return inv;
      const merged = { ...inv, ...updates };
      const balance = Math.max(0, merged.amount - (merged.paidAmount || 0));
      return {
        ...merged,
        balance,
        status: balance <= 0 ? 'paid' : merged.status,
      };
    });

    this.state.invoices = this.recalculateInvoiceAging(this.state.invoices);
    this.recalculateCustomerBalances();
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/invoices/${id}`;
      updateDoc(doc(db, 'businesses', this.currentBusinessId, 'invoices', id), updates).catch(
        (err) => handleFirestoreError(err, OperationType.UPDATE, path)
      );
    }
  }

  public deleteInvoice(id: string): void {
    const target = this.state.invoices.find((i) => i.id === id);
    this.state.invoices = this.state.invoices.filter((i) => i.id !== id);
    this.recalculateCustomerBalances();
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/invoices/${id}`;
      deleteDoc(doc(db, 'businesses', this.currentBusinessId, 'invoices', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }

    if (target) {
      this.addActivity({
        type: 'status_updated',
        title: `Invoice cancelled: ${target.invoiceNumber}`,
        description: `Removed from active ledger`,
        customerName: target.customerName,
        iconType: 'alert',
      });
    }
  }

  // --- Payments ---
  public recordPayment(paymentData: {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    referenceNote?: string;
    paymentDate?: string;
  }): Payment {
    const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const paymentDate = paymentData.paymentDate || new Date().toISOString();

    const payment: Payment = {
      id,
      transactionId: `TXN-${Date.now().toString().slice(-6)}`,
      customerId: paymentData.customerId,
      customerName: paymentData.customerName,
      invoiceId: paymentData.invoiceId,
      invoiceNumber: paymentData.invoiceNumber,
      paymentDate,
      paymentMethod: paymentData.paymentMethod,
      amount: paymentData.amount,
      status: 'success',
      reconciliationStatus: 'reconciled',
      referenceNote: paymentData.referenceNote,
      receivedBy: 'CollectIQ Accounts',
    };

    this.state.payments = [payment, ...this.state.payments];

    // Update invoice balance
    const inv = this.state.invoices.find((i) => i.id === paymentData.invoiceId);
    if (inv) {
      const newPaid = (inv.paidAmount || 0) + paymentData.amount;
      const newBalance = Math.max(0, inv.amount - newPaid);
      const newStatus = newBalance <= 0 ? 'paid' : inv.status;

      this.updateInvoice(inv.id, {
        paidAmount: newPaid,
        balance: newBalance,
        status: newStatus,
      });
    }

    // Update promises if matching
    this.state.promisesToPay = this.state.promisesToPay.map((ptp) => {
      if (ptp.invoiceId === paymentData.invoiceId || ptp.invoiceNumber === paymentData.invoiceNumber) {
        return { ...ptp, status: 'fulfilled' };
      }
      return ptp;
    });

    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/payments/${id}`;
      setDoc(doc(db, 'businesses', this.currentBusinessId, 'payments', id), {
        ...payment,
        businessId: this.currentBusinessId,
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    }

    this.addActivity({
      type: 'payment_received',
      title: `Payment received from ${payment.customerName}`,
      description: `${this.state.settings.currencySymbol}${payment.amount.toLocaleString('en-IN')} • ${payment.paymentMethod} • ${payment.invoiceNumber}`,
      amount: payment.amount,
      customerName: payment.customerName,
      iconType: 'check',
    });

    return payment;
  }

  // --- Customers ---
  public addCustomer(
    customerData: Omit<Customer, 'id' | 'totalBilled' | 'outstandingBalance' | 'lastPaymentDate' | 'lastPaymentAmount'>
  ): Customer {
    const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCust: Customer = {
      ...customerData,
      id,
      totalBilled: 0,
      outstandingBalance: 0,
      lastPaymentDate: '',
      lastPaymentAmount: 0,
      status: 'active',
      overdueDays: 0,
      avatarColor: customerData.avatarColor || 'bg-indigo-100 text-indigo-700',
    };

    this.state.customers = [newCust, ...this.state.customers];
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/customers/${id}`;
      setDoc(doc(db, 'businesses', this.currentBusinessId, 'customers', id), {
        ...newCust,
        businessId: this.currentBusinessId,
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    }

    this.addActivity({
      type: 'customer_added',
      title: `Customer added: ${newCust.name}`,
      description: `${newCust.company} • ${newCust.email}`,
      customerName: newCust.name,
      iconType: 'user',
    });

    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): void {
    this.state.customers = this.state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/customers/${id}`;
      updateDoc(doc(db, 'businesses', this.currentBusinessId, 'customers', id), updates).catch(
        (err) => handleFirestoreError(err, OperationType.UPDATE, path)
      );
    }
  }

  public deleteCustomer(id: string): void {
    this.state.customers = this.state.customers.filter((c) => c.id !== id);
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/customers/${id}`;
      deleteDoc(doc(db, 'businesses', this.currentBusinessId, 'customers', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  }

  // --- Follow Ups ---
  public addFollowUp(followUpData: Omit<FollowUp, 'id'>): FollowUp {
    const id = `fol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newFollowUp: FollowUp = {
      ...followUpData,
      id,
    };

    this.state.followUps = [newFollowUp, ...this.state.followUps];
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/followUps/${id}`;
      setDoc(doc(db, 'businesses', this.currentBusinessId, 'followUps', id), {
        ...newFollowUp,
        businessId: this.currentBusinessId,
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    }

    return newFollowUp;
  }

  public updateFollowUp(id: string, updates: Partial<FollowUp>): void {
    this.state.followUps = this.state.followUps.map((f) => (f.id === id ? { ...f, ...updates } : f));
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/followUps/${id}`;
      updateDoc(doc(db, 'businesses', this.currentBusinessId, 'followUps', id), updates).catch(
        (err) => handleFirestoreError(err, OperationType.UPDATE, path)
      );
    }
  }

  public completeFollowUp(id: string): void {
    this.updateFollowUp(id, { status: 'completed' });
  }

  public sendFollowUpReminder(id: string, channel: FollowUp['channel']): void {
    const target = this.state.followUps.find((f) => f.id === id);
    if (!target) return;

    this.updateFollowUp(id, {
      status: 'sent',
      lastReminderDate: new Date().toISOString(),
      channel,
    });

    this.addActivity({
      type: 'reminder_sent',
      title: `Reminder sent to ${target.customerName}`,
      description: `via ${channel.toUpperCase()} • ${target.invoiceNumber} (${this.state.settings.currencySymbol}${target.amountDue.toLocaleString('en-IN')})`,
      amount: target.amountDue,
      customerName: target.customerName,
      iconType: 'mail',
    });
  }

  // --- Promises to Pay ---
  public addPromise(ptpData: Omit<PromiseToPay, 'id' | 'createdAt'>): PromiseToPay {
    const id = `ptp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPromise: PromiseToPay = {
      ...ptpData,
      id,
      createdAt: new Date().toISOString(),
    };

    this.state.promisesToPay = [newPromise, ...this.state.promisesToPay];
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/promisesToPay/${id}`;
      setDoc(doc(db, 'businesses', this.currentBusinessId, 'promisesToPay', id), {
        ...newPromise,
        businessId: this.currentBusinessId,
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    }

    this.addActivity({
      type: 'promise_recorded',
      title: `Promise to pay logged: ${newPromise.customerName}`,
      description: `${this.state.settings.currencySymbol}${newPromise.promisedAmount.toLocaleString('en-IN')} promised by ${newPromise.promisedDate}`,
      amount: newPromise.promisedAmount,
      customerName: newPromise.customerName,
      iconType: 'check',
    });

    return newPromise;
  }

  public updatePromise(id: string, updates: Partial<PromiseToPay>): void {
    this.state.promisesToPay = this.state.promisesToPay.map((p) => (p.id === id ? { ...p, ...updates } : p));
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/promisesToPay/${id}`;
      updateDoc(doc(db, 'businesses', this.currentBusinessId, 'promisesToPay', id), updates).catch(
        (err) => handleFirestoreError(err, OperationType.UPDATE, path)
      );
    }
  }

  public fulfillPromise(id: string): void {
    this.updatePromise(id, { status: 'fulfilled' });
  }

  // --- Tasks ---
  public toggleTask(id: string): void {
    const target = this.state.tasks.find((t) => t.id === id);
    if (!target) return;
    const newStatus = !target.completed;
    this.state.tasks = this.state.tasks.map((t) => (t.id === id ? { ...t, completed: newStatus } : t));
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/tasks/${id}`;
      updateDoc(doc(db, 'businesses', this.currentBusinessId, 'tasks', id), { completed: newStatus }).catch(
        (err) => handleFirestoreError(err, OperationType.UPDATE, path)
      );
    }
  }

  public addTask(taskData: Omit<Task, 'id'>): Task {
    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTask: Task = { ...taskData, id };
    this.state.tasks = [newTask, ...this.state.tasks];
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/tasks/${id}`;
      setDoc(doc(db, 'businesses', this.currentBusinessId, 'tasks', id), {
        ...newTask,
        businessId: this.currentBusinessId,
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    }

    return newTask;
  }

  // --- Team ---
  public addTeamMember(memberData: Omit<TeamMember, 'id' | 'joinedDate'>): TeamMember {
    const id = `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMember: TeamMember = {
      ...memberData,
      id,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    this.state.teamMembers = [...this.state.teamMembers, newMember];
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/team/${id}`;
      setDoc(doc(db, 'businesses', this.currentBusinessId, 'team', id), {
        ...newMember,
        businessId: this.currentBusinessId,
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    }

    return newMember;
  }

  public updateTeamMember(id: string, updates: Partial<TeamMember>): void {
    this.state.teamMembers = this.state.teamMembers.map((m) => (m.id === id ? { ...m, ...updates } : m));
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/team/${id}`;
      updateDoc(doc(db, 'businesses', this.currentBusinessId, 'team', id), updates).catch(
        (err) => handleFirestoreError(err, OperationType.UPDATE, path)
      );
    }
  }

  public deleteTeamMember(id: string): void {
    this.state.teamMembers = this.state.teamMembers.filter((m) => m.id !== id);
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/team/${id}`;
      deleteDoc(doc(db, 'businesses', this.currentBusinessId, 'team', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  }

  // --- Integrations ---
  public toggleIntegration(id: string, isConnected: boolean, config?: Record<string, string>): void {
    this.state.integrations = this.state.integrations.map((i) =>
      i.id === id
        ? {
            ...i,
            isConnected,
            connectedAt: isConnected ? new Date().toISOString() : undefined,
            config: config || i.config,
          }
        : i
    );
    this.saveLocalState();
    this.notify();
  }

  // --- Settings ---
  public updateSettings(updates: Partial<BusinessSettings>): void {
    this.state.settings = { ...this.state.settings, ...updates };
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}`;
      setDoc(doc(db, 'businesses', this.currentBusinessId), updates, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, path)
      );
    }
  }

  // --- Activities ---
  public addActivity(activityData: Omit<ActivityLog, 'id'>): void {
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAct: ActivityLog = {
      ...activityData,
      id,
      timestamp: activityData.timestamp || new Date().toISOString(),
    };
    this.state.activities = [newAct, ...this.state.activities.slice(0, 49)];
    this.saveLocalState();
    this.notify();

    if (db && this.currentBusinessId) {
      const path = `businesses/${this.currentBusinessId}/activities/${id}`;
      setDoc(doc(db, 'businesses', this.currentBusinessId, 'activities', id), {
        ...newAct,
        businessId: this.currentBusinessId,
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    }
  }

  // --- Notifications ---
  public addNotificationLog(log: NotificationLog): void {
    this.state.notificationLogs = [log, ...this.state.notificationLogs.slice(0, 99)];
    this.saveLocalState();
    this.notify();
  }

  public updateNotificationLog(id: string, updates: Partial<NotificationLog>): void {
    this.state.notificationLogs = this.state.notificationLogs.map((l) =>
      l.id === id ? { ...l, ...updates } : l
    );
    this.saveLocalState();
    this.notify();
  }

  public recordNotificationUsage(_channel: NotificationChannel, _cost: number): void {
    this.saveLocalState();
    this.notify();
  }

  public updateNotificationSettings(updates: Partial<NotificationSettings>): void {
    this.state.notificationSettings = { ...this.state.notificationSettings, ...updates };
    this.saveLocalState();
    this.notify();
  }

  public updateNotificationTemplate(template: NotificationTemplate): void {
    this.state.notificationTemplates = this.state.notificationTemplates.map((t) =>
      t.id === template.id ? template : t
    );
    this.saveLocalState();
    this.notify();
  }

  public addNotificationTemplate(template: NotificationTemplate): void {
    this.state.notificationTemplates.push(template);
    this.saveLocalState();
    this.notify();
  }

  public deleteNotificationTemplate(id: string): void {
    this.state.notificationTemplates = this.state.notificationTemplates.filter((t) => t.id !== id);
    this.saveLocalState();
    this.notify();
  }

  public resetNotificationTemplates(): void {
    this.state.notificationTemplates = createCleanBusinessState().notificationTemplates;
    this.saveLocalState();
    this.notify();
  }

  public resetToDefault(): void {
    this.state = createCleanBusinessState();
    this.saveLocalState();
    this.notify();
  }
}

export const storageService = new StorageService();
