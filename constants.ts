
import { TaskType, Skill } from './types';

export const MODULE_CODE = 'UMPD7G-15-3';
export const MODULE_NAME = 'International Human Resource Management';
export const UNIVERSITY = 'University of the West of England (UWE)';
export const CASE_STUDY = 'OwlTech Solutions';

export const TASK_MODELS: Record<TaskType, string[]> = {
  [TaskType.NATIONAL_CULTURE]: ['Hofstede', 'Hall', 'Trompenaars', 'GLOBE'],
  [TaskType.SELECTION_STAFFING]: ['Perlmutter (EPRG)', 'Harris & Brewster (Typology)'],
  [TaskType.EXPATRIATE_ADJUSTMENT]: ['Black, Mendenhall & Oddou (U-Curve)', 'Copeland & Griggs'],
  [TaskType.TRAINING_IHRM]: ['Tung’s Contingency Framework', 'Mendenhall & Oddou (Training Levels)'],
  [TaskType.PERFORMANCE_MANAGEMENT]: ['Schuler et al. (IHRM Strategic Model)', 'Dowling’s Performance Variables'],
  [TaskType.VIRTUAL_TEAMS]: ['Gibson & Cohen', 'Hertel et al. (Lifecycle)']
};

export const GRADE_BANDS = [
  { label: 'Fail', range: '0-39%' },
  { label: 'Pass (Marginal)', range: '40-49%' },
  { label: 'Satisfactory', range: '50-59%' },
  { label: 'Good', range: '60-69%' },
  { label: 'Excellent / Distinction', range: '70%+' }
];

export const SKILLS: Skill[] = [
  {
    name: 'Strategic IHRM',
    category: 'Management',
    description: 'Critical analysis of global staffing models and organizational development.',
    icon: 'target'
  },
  {
    name: 'Cultural Intelligence',
    category: 'Interpersonal',
    description: 'Expertise in Hofstede, GLOBE, and Trompenaars cultural frameworks.',
    icon: 'globe'
  },
  {
    name: 'Data Visualization',
    category: 'Technical',
    description: 'Transforming complex HR metrics into actionable visual dashboards.',
    icon: 'bar-chart'
  },
  {
    name: 'AI Integration',
    category: 'Technical',
    description: 'Implementing LLMs for unbiased recruitment and talent mapping.',
    icon: 'zap'
  }
];
