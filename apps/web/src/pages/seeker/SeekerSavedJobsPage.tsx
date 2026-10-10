import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  Plus, 
  Search, 
  ExternalLink, 
  MapPin, 
  Trash2, 
  Edit3, 
  FileSearch,
  MessageSquare
} from 'lucide-react';
import { seekerApi } from '../../services/api';
import { SeekerSavedJob } from '@avengercoders/shared';

export const SeekerSavedJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<SeekerSavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<SeekerSavedJob> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      const data = await seekerApi.getSavedJobs();
      setSavedJobs(data);
    } catch (err) {
      console.error('Failed to load saved jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingJob({
      company: '',
      title: '',
      description: '',
      location: 'Remote',
      jobUrl: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (job: SeekerSavedJob) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob || !editingJob.title || !editingJob.description) return;

    try {
      setSubmitting(true);
      if (editingJob.id) {
        const updated = await seekerApi.updateSavedJob(editingJob.id, editingJob);
        setSavedJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
      } else {
        const created = await seekerApi.createSavedJob(editingJob as any);
        setSavedJobs(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
      setEditingJob(null);
    } catch (err) {
      console.error('Failed to save target job', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!window.confirm('Delete this saved target job?')) return;
    try {
      await seekerApi.deleteSavedJob(id);
      setSavedJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) {
      console.error('Failed to delete job', err);
    }
  };

  const filteredJobs = savedJobs.filter(job => {
    const q = searchQuery.toLowerCase();
    return job.company?.toLowerCase().includes(q) ||
           job.title.toLowerCase().includes(q) ||
           job.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-bold text-ink dark:text-ink-dark tracking-tight">Saved Target Jobs</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/25">
              {savedJobs.length} Saved
            </span>
          </div>
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
            Save job postings and role descriptions to run continuous resume gap analysis and generate tailored interview prep.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-surface font-semibold text-sm transition shadow-xs self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Save Target Job</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3 bg-surface dark:bg-surface-dark p-3 rounded-2xl border border-stone dark:border-stone-dark shadow-2xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-ink-muted dark:text-ink-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search saved target roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:outline-none focus:border-forest"
          />
        </div>
      </div>

      {/* Grid of Saved Jobs */}
      {loading ? (
        <div className="p-12 text-center text-ink-muted dark:text-ink-dark-muted">Loading saved jobs...</div>
      ) : savedJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-stone dark:border-stone-dark bg-surface dark:bg-surface-dark shadow-2xs">
          <Bookmark className="w-12 h-12 text-ink-muted dark:text-ink-dark-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold text-ink dark:text-ink-dark mb-1">No saved target jobs yet</h3>
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted max-w-md mx-auto mb-4">
            Save job postings you aspire to target so you can test multiple resume iterations against their requirements.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-surface text-sm font-semibold transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Save Your First Role</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map(job => (
            <div 
              key={job.id} 
              className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark hover:border-forest/40 transition flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-base font-bold text-ink dark:text-ink-dark group-hover:text-forest dark:group-hover:text-emerald-400 transition">
                      {job.title}
                    </h3>
                    <div className="text-xs text-ink-muted dark:text-ink-dark-muted flex items-center space-x-2 mt-0.5">
                      <span className="font-semibold text-ink-light dark:text-ink-dark-secondary">{job.company || 'Target Role'}</span>
                      {job.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-ink-muted" />
                            <span>{job.location}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(job)}
                      className="p-1.5 hover:text-ink dark:hover:text-ink-dark text-ink-muted rounded-lg hover:bg-stone-warm dark:hover:bg-stone-dark/50 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-1.5 hover:text-rose dark:hover:text-rose text-ink-muted rounded-lg hover:bg-stone-warm dark:hover:bg-stone-dark/50 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-ink-muted dark:text-ink-dark-muted line-clamp-3 mb-4 leading-relaxed bg-ivory dark:bg-ivory-dark p-3 rounded-xl border border-stone dark:border-stone-dark">
                  {job.description}
                </p>

                {job.notes && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 mb-4 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/30">
                    <span className="font-semibold text-amber-800 dark:text-amber-200">Notes:</span> {job.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone dark:border-stone-dark flex items-center justify-between gap-2">
                {job.jobUrl ? (
                  <a
                    href={job.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-forest dark:text-emerald-400 hover:underline inline-flex items-center space-x-1 font-medium"
                  >
                    <span>View Post</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/app/seeker/analysis`)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-forest-faint dark:bg-forest/20 hover:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/25 text-xs font-semibold transition cursor-pointer"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>Run Match Analysis</span>
                  </button>
                  <button
                    onClick={() => navigate(`/app/seeker/interview-prep`)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-warm dark:bg-surface-dark border border-stone dark:border-stone-dark hover:border-forest/40 text-ink dark:text-ink-dark text-xs font-semibold transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Mock Prep</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Saved Job Modal */}
      {isModalOpen && editingJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-ink dark:text-ink-dark">
              {editingJob.id ? 'Edit Target Job' : 'Save Target Job Description'}
            </h3>

            <form onSubmit={handleSaveJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={editingJob.company || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })}
                    placeholder="e.g. Anthropic, Google"
                    className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    value={editingJob.title || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                    placeholder="e.g. Staff AI Platform Engineer"
                    className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Location</label>
                <input
                  type="text"
                  value={editingJob.location || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                  placeholder="e.g. Remote / NYC"
                  className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Job Posting URL</label>
                <input
                  type="url"
                  value={editingJob.jobUrl || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, jobUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Job Description & Requirements *</label>
                <textarea
                  rows={6}
                  required
                  value={editingJob.description || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  placeholder="Paste the full job description, qualifications, and responsibilities here..."
                  className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Personal Notes</label>
                <input
                  type="text"
                  value={editingJob.notes || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, notes: e.target.value })}
                  placeholder="Why this role aligns, team notes, referral contacts..."
                  className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone dark:border-stone-dark">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-surface text-sm font-semibold transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Target Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
