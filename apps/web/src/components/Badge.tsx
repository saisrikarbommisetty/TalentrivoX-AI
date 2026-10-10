import React from 'react';
import { AssessmentStatusType, CandidateWorkflowStatusType } from '@avengercoders/shared';
import { CheckCircle2, AlertCircle, HelpCircle, XCircle, Clock, Check, UserCheck, Calendar } from 'lucide-react';

interface EvidenceBadgeProps {
  status: AssessmentStatusType | string;
  className?: string;
  showIcon?: boolean;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ status, className = '', showIcon = true }) => {
  switch (status) {
    case 'demonstrated':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light border border-forest/30 dark:border-forest/40 ${className}`}>
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-forest dark:text-forest-light" />}
          Demonstrated
        </span>
      );
    case 'partial':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-light dark:bg-amber/20 text-amber dark:text-amber-light border border-amber/30 dark:border-amber/40 ${className}`}>
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber dark:text-amber-light" />}
          Partial Match
        </span>
      );
    case 'needs_review':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-warm dark:bg-stone-dark text-ink-light dark:text-ink-light-dark border border-stone dark:border-stone-dark ${className}`}>
          {showIcon && <HelpCircle className="w-3.5 h-3.5 text-ink-muted dark:text-ink-muted-dark" />}
          Needs Review
        </span>
      );
    case 'not_evidenced':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-light dark:bg-stone-dark/60 text-ink-muted dark:text-ink-muted-dark border border-stone dark:border-stone-dark ${className}`}>
          {showIcon && <XCircle className="w-3.5 h-3.5 text-ink-muted dark:text-ink-muted-dark" />}
          Not Evidenced
        </span>
      );
  }
};

interface WorkflowBadgeProps {
  status: CandidateWorkflowStatusType | string;
  className?: string;
}

export const WorkflowBadge: React.FC<WorkflowBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'shortlisted':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest-faint dark:bg-forest/25 text-forest dark:text-forest-light border border-forest/20 dark:border-forest/30 ${className}`}>
          <UserCheck className="w-3 h-3 text-forest dark:text-forest-light" />
          Shortlisted
        </span>
      );
    case 'interview_planned':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-light dark:bg-amber/20 text-amber dark:text-amber-light border border-amber/30 ${className}`}>
          <Calendar className="w-3 h-3 text-amber dark:text-amber-light" />
          Interview Planned
        </span>
      );
    case 'interview_completed':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest text-white dark:bg-forest shadow-2xs ${className}`}>
          <Check className="w-3 h-3" />
          Interview Completed
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-error-light dark:bg-rose-950/40 text-brand-error dark:text-rose-300 border border-brand-error/20 dark:border-rose-900/40 ${className}`}>
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    case 'awaiting_review':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-light dark:bg-stone-dark text-ink-light dark:text-ink-light-dark border border-stone dark:border-stone-dark ${className}`}>
          <Clock className="w-3 h-3 text-ink-muted dark:text-ink-muted-dark" />
          Awaiting Review
        </span>
      );
  }
};

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  let variantStyles = 'bg-stone-warm dark:bg-stone-dark text-ink-light dark:text-ink-light-dark border border-stone dark:border-stone-dark';
  
  if (variant === 'success') {
    variantStyles = 'bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light border border-forest/30';
  } else if (variant === 'warning') {
    variantStyles = 'bg-amber-light dark:bg-amber/20 text-amber dark:text-amber-light border border-amber/30';
  } else if (variant === 'error') {
    variantStyles = 'bg-brand-error-light dark:bg-rose-950/40 text-brand-error dark:text-rose-300 border border-brand-error/20';
  } else if (variant === 'primary' || variant === 'info') {
    variantStyles = 'bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light border border-forest/30';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles} ${className}`}>
      {children}
    </span>
  );
};
