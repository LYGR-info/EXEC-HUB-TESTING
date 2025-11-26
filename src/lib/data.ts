

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  avatarId: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  accountId?: string;
  createdBy?: string;
  creatorName?: string;
  importBatchId?: string;
};

export type Expense = {
  id: string;
  date: string;
  category: 'Travel' | 'Meals' | 'Accommodation' | 'Transport' | 'Other';
  amount: number;
  description: string;
  status: 'Approved' | 'Pending' | 'Rejected';
};

export type CalendarEvent = {
  id: string;
  time: string;
  title: string;
  duration: string;
};

export type AccountStatus = 'Ongoing' | 'Established' | 'Potential' | 'Lost';
export type OpportunityType = 'Sell-side' | 'Referral' | 'Other';
export type CalculationType = "Sale-side" | "Monthly Fee" | "Equity";


export type RevenueStream = {
  id: string;
  type: CalculationType;
  opportunityValue?: number;
  monthlyFee?: number;
  contractTerm?: number;
  equityPercentage?: number;
  companyValuation?: number;
  confidenceRate: number;
  commission?: number;
  isCommissionApplied?: boolean;
};

export type ActivityLogType = 'Meeting (online)' | 'Meeting (in person)' | 'Email' | 'Phonecall';

export interface ActivityLogEvent {
  id: string;
  accountId: string;
  date: any; // Timestamp
  type: ActivityLogType;
  description?: string;
  contactIds?: string[];
  createdAt: any;
}

export type Account = {
  id: string;
  name: string;
  industry: string;
  status: AccountStatus;
  logoId: string;
  opportunityType: OpportunityType;
  revenueStreams: RevenueStream[];
  // Deprecated fields kept optional for backward compatibility if needed, 
  // but ideally we migrate away from them.
  calculationType?: CalculationType;
  opportunityValue?: number;
  monthlyFee?: number;
  contractTerm?: number;
  equityPercentage?: number;
  companyValuation?: number;
  confidenceRate?: number;
  commission?: number;
  createdAt?: any;
  updatedAt?: any;
};

export const expenses: Expense[] = [
  {
    id: '1',
    date: '2024-07-22',
    category: 'Travel',
    amount: 1250.0,
    description: 'Flight to NYC for deal closing',
    status: 'Approved',
  },
  {
    id: '2',
    date: '2024-07-21',
    category: 'Meals',
    amount: 150.75,
    description: 'Client Dinner with Synergy LLC',
    status: 'Pending',
  },
  {
    id: '3',
    date: '2024-07-20',
    category: 'Accommodation',
    amount: 800.0,
    description: 'Hotel in NYC (3 nights)',
    status: 'Approved',
  },
  {
    id: '4',
    date: '2024-07-19',
    category: 'Transport',
    amount: 75.5,
    description: 'Taxis and ride-sharing',
    status: 'Rejected',
  },
  {
    id: '5',
    date: '2024-07-18',
    category: 'Other',
    amount: 250.0,
    description: 'Due diligence report printing',
    status: 'Approved',
  },
];

export const calendarEvents: CalendarEvent[] = [
  { id: '1', time: '09:00 AM', title: 'Q3 Strategy Meeting', duration: '1h' },
  {
    id: '2',
    time: '11:00 AM',
    title: 'Project Phoenix Pitch',
    duration: '1.5h',
  },
  {
    id: '3',
    time: '02:00 PM',
    title: 'Lunch with Innovate Corp Investors',
    duration: '1h',
  },
  { id: '4', time: '04:30 PM', title: 'Internal Team Sync-up', duration: '30m' },
];

export const accounts: Account[] = [
  {
    id: 'acc-1',
    name: 'QuantumLeap Tech',
    industry: 'Artificial Intelligence',
    status: 'Ongoing',
    logoId: 'logo-1',
    opportunityType: 'Sell-side',
    revenueStreams: [
      {
        id: 'rs-1',
        type: 'Equity',
        equityPercentage: 5,
        companyValuation: 100000000,
        confidenceRate: 75,
        commission: 10,
      }
    ],
    calculationType: 'Equity',
    opportunityValue: 0,
    equityPercentage: 5,
    companyValuation: 100000000,
    confidenceRate: 75,
    commission: 10,
  },
  {
    id: 'acc-2',
    name: 'Stellar Solutions',
    industry: 'Aerospace',
    status: 'Established',
    logoId: 'logo-2',
    opportunityType: 'Referral',
    revenueStreams: [
      {
        id: 'rs-2',
        type: 'Sale-side',
        opportunityValue: 12000000,
        confidenceRate: 95,
        commission: 5,
        isCommissionApplied: true,
      }
    ],
    calculationType: 'Sale-side',
    opportunityValue: 12000000,
    confidenceRate: 95,
    commission: 5,
  },
  {
    id: 'acc-3',
    name: 'BioGen Innovations',
    industry: 'Biotechnology',
    status: 'Potential',
    logoId: 'logo-3',
    opportunityType: 'Sell-side',
    revenueStreams: [
      {
        id: 'rs-3',
        type: 'Monthly Fee',
        monthlyFee: 50000,
        contractTerm: 24,
        confidenceRate: 60,
        commission: 12,
      }
    ],
    calculationType: 'Monthly Fee',
    opportunityValue: 0,
    monthlyFee: 50000,
    contractTerm: 24,
    confidenceRate: 60,
    commission: 12,
  },
  {
    id: 'acc-4',
    name: 'FinTrust Capital',
    industry: 'Financial Services',
    status: 'Established',
    logoId: 'logo-4',
    opportunityType: 'Other',
    revenueStreams: [
      {
        id: 'rs-4',
        type: 'Sale-side',
        opportunityValue: 25000000,
        confidenceRate: 90,
        commission: 0,
      }
    ],
    calculationType: 'Sale-side',
    opportunityValue: 25000000,
    confidenceRate: 90,
    commission: 0,
  },
  {
    id: 'acc-5',
    name: 'GreenScape Energy',
    industry: 'Renewable Energy',
    status: 'Potential',
    logoId: 'logo-5',
    opportunityType: 'Referral',
    revenueStreams: [
      {
        id: 'rs-5',
        type: 'Sale-side',
        opportunityValue: 3000000,
        confidenceRate: 50,
        commission: 8,
        isCommissionApplied: true,
      }
    ],
    calculationType: 'Sale-side',
    opportunityValue: 3000000,
    confidenceRate: 50,
    commission: 8,
  },
  {
    id: 'acc-6',
    name: 'DataWeave Analytics',
    industry: 'Data Science',
    status: 'Lost',
    logoId: 'logo-6',
    opportunityType: 'Sell-side',
    revenueStreams: [
      {
        id: 'rs-6',
        type: 'Monthly Fee',
        monthlyFee: 15000,
        contractTerm: 12,
        confidenceRate: 10,
        commission: 10,
      }
    ],
    calculationType: 'Monthly Fee',
    opportunityValue: 0,
    monthlyFee: 15000,
    contractTerm: 12,
    confidenceRate: 10,
    commission: 10,
  },
];
