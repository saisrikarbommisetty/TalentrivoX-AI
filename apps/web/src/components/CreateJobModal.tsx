import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Sparkles, Plus, Trash2, Briefcase } from 'lucide-react';
import { JobRequirement } from '@avengercoders/shared';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (job: any) => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Core Engineering');
  const [location, setLocation] = useState('San Francisco, CA (Hybrid)');
  const [employmentType, setEmploymentType] = useState('full-time');
  const [seniority, setSeniority] = useState('senior');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<JobRequirement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddResponsibility = () => {
    setResponsibilities([...responsibilities, '']);
  };

  const handleResponsibilityChange = (index: number, val: string) => {
    const updated = [...responsibilities];
    updated[index] = val;
    setResponsibilities(updated);
  };

  const handleRemoveResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Please provide a job title and description');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.createJob({
        title,
        department,
        location,
        employmentType,
        seniority,
        description,
        responsibilities: responsibilities.filter(Boolean),
        requirements: requirements.length > 0 ? requirements : undefined
      });

      onSuccess(res.job);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 dark:bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between p-6 border-b border-stone dark:border-stone-dark bg-stone-light/60 dark:bg-stone-dark/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light flex items-center justify-center border border-forest/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-ink dark:text-ink-dark">Create Job Opening</h2>
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">Define role details; requirements are extracted automatically</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark hover:bg-stone-warm dark:hover:bg-stone-dark cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 bg-surface dark:bg-surface-dark">
          {error && (
            <div className="p-3 rounded-xl bg-brand-error-light dark:bg-rose-950/40 border border-brand-error/20 dark:border-rose-900/40 text-brand-error dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink dark:text-ink-dark">Job Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer"
              className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
              >
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark">Seniority Level</label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead / Principal</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink dark:text-ink-dark">Job Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste or write role responsibilities and criteria. The screening engine will extract structured requirements."
              className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark">Key Responsibilities</label>
              <button
                type="button"
                onClick={handleAddResponsibility}
                className="text-xs text-forest dark:text-forest-light hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            {responsibilities.map((resp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={resp}
                  onChange={(e) => handleResponsibilityChange(idx, e.target.value)}
                  placeholder={`Responsibility #${idx + 1}`}
                  className="flex-1 px-3 py-1.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark"
                />
                {responsibilities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveResponsibility(idx)}
                    className="p-1.5 text-ink-muted dark:text-ink-muted-dark hover:text-brand-error cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-stone dark:border-stone-dark flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-warm dark:bg-stone-dark text-ink-light dark:text-ink-light-dark hover:bg-stone dark:hover:bg-stone-dark/80 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Extracting Criteria...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber" />
                  Create Role & Extract
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
