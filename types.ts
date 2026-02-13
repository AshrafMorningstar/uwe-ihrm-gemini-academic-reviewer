
export enum TaskType {
  NATIONAL_CULTURE = 'National Culture',
  SELECTION_STAFFING = 'International Selection and Staffing',
  EXPATRIATE_ADJUSTMENT = 'Expatriate Adjustment',
  TRAINING_IHRM = 'Training and IHRM',
  PERFORMANCE_MANAGEMENT = 'International Performance Management',
  VIRTUAL_TEAMS = 'Managing Virtual Teams'
}

export interface TaskFeedback {
  taskName: TaskType;
  provisionalGrade: string;
  gradeBand: string;
  strengths: string[];
  weaknesses: string[];
  criticalEvaluationScore: number;
  actionableSuggestions: string[];
  detailedCritique: string;
  referencingFeedback: string;
  wordCountAnalysis: string;
}

export interface PortfolioReview {
  overallGrade: string;
  summativeOverview: string;
  learningOutcomeCheck: {
    mo1: string;
    mo2: string;
    mo3: string;
    mo4: string;
  };
  taskReviews: TaskFeedback[];
}

export interface StudentData {
  name: string;
  githubLink?: string;
  linkedinLink?: string;
  portfolioContent: {
    [key in TaskType]?: string;
  };
}

export interface Project {
  id: string;
  title: string;
  category: 'AI' | 'HR' | 'Web' | 'Strategy';
  description: string;
  image: string;
  tags: string[];
  link: string;
  liveUrl?: string;
}

export interface Skill {
  name: string;
  category: string;
  description: string;
  icon: string;
}

// New Billing and Customer Interfaces
export interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  billIds: string[];
}

export interface Bill {
  id: string;
  customerId: string; // Linked profile
  vendor: string;
  date: string;
  dueDate: string;
  total: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}
