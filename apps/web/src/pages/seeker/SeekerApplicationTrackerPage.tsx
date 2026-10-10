import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  Clock, 
  Trash2, 
  Edit3, 
  LayoutGrid,
  List
} from 'lucide-react';
import { seekerApi } from '../../services/api';
import { SeekerJobApplication, SeekerResume, ApplicationStatus } from '@avengercoders/shared';

const STATUS_COLUMNS = [
  { key: ApplicationStatus.INTERESTED, label: 'Interested', color: 'border-stone dark:border-stone-dark bg-stone-warm dark:bg-stone-dark/40 text-ink-muted dark:text-ink-dark-muted' },
  { key: ApplicationStatus.PREPARING, label: 'Preparing', color: 'border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300' },
  { key: ApplicationStatus.APPLIED, label: 'Applied', color: 'border-sky-200 dark:border-sky-900/40 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300' },
  { key: ApplicationStatus.INTERVIEW, label: 'Interviewing', color: 'border-forest/25 dark:border-forest/40 bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300' },
  { key: ApplicationStatus.OFFER, label: 'Offer Received', color: 'border-lime-dark/30 dark:border-lime/30 bg-lime-light/40 dark:bg-lime/15 text-forest-dark dark:text-lime' },
  { key: ApplicationStatus.REJECTED, label: 'Archived / Rejected', color: 'border-rose/20 dark:border-rose/30 bg-rose-50 dark:bg-rose-950/20 text-rose dark:text-rose' }
];

export const SeekerApplicationTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<SeekerJobApplication[]>([]);
  const [resumes, setResumes] = useState<SeekerResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Partial<SeekerJobApplication> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsData, resumesData] = await Promise.all([
        seekerApi.getApplications(),
        seekerApi.getResumes()
      ]);
      setApplications(appsData);
      setResumes(resumesData);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    const activeRes = resumes.find(r => r.isActive);
    setEditingApp({
      company: '',
      jobTitle: '',
      status: ApplicationStatus.APPLIED,
      location: 'Remote',
      salaryRange: '',
      jobUrl: '',
      notes: '',
      nextStep: 'Follow up with recruiter',
      appliedDate: new Date().toISOString().split('T')[0],
      resumeId: activeRes ? activeRes.id : undefined
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app: SeekerJobApplication) => {
    setEditingApp(app);
    setIsModalOpen(true);
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !editingApp.company || !editingApp.jobTitle) return;

    try {
      setSubmitting(true);
      if (editingApp.id) {
        const updated = await seekerApi.updateApplication(editingApp.id, editingApp);
        setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await seekerApi.createApplication(editingApp as any);
        setApplications(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
      setEditingApp(null);
    } catch (err) {
      console.error('Failed to save application', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this application record?')) return;
    try {
      await seekerApi.deleteApplication(id);
      setApplications(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete application', err);
    }
  };

  const handleQuickStatusChange = async (appId: string, newStatus: any) => {
    try {
      const updated = await seekerApi.updateApplication(appId, { status: newStatus });
      setApplications(prev => prev.map(a => a.id === appId ? updated : a));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (app.notes && app.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-bold text-ink dark:text-ink-dark tracking-tight">Job Application Tracker</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/25">
              {applications.length} Tracked
            </span>
          </div>
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
            Manage your opportunities, interview rounds, tailored resume versions, and next action items.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${viewMode === 'board' ? 'bg-forest text-surface shadow-xs' : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'}`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${viewMode === 'list' ? 'bg-forest text-surface shadow-xs' : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'}`}
              title="List Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-surface font-semibold text-sm transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface dark:bg-surface-dark p-3 rounded-2xl border border-stone dark:border-stone-dark shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-muted dark:text-ink-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by role or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:outline-none focus:border-forest"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-ink-muted dark:text-ink-dark-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:outline-none focus:border-forest"
          >
            <option value="all">All Stages</option>
            {STATUS_COLUMNS.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-12 text-center text-ink-muted dark:text-ink-dark-muted">Loading your applications...</div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-stone dark:border-stone-dark bg-surface dark:bg-surface-dark shadow-2xs">
          <Briefcase className="w-12 h-12 text-ink-muted dark:text-ink-dark-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold text-ink dark:text-ink-dark mb-1">No job applications tracked yet</h3>
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted max-w-md mx-auto mb-4">
            Track applications, interview schedules, next follow-ups, and link matching resumes for each opportunity.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-surface text-sm font-semibold transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Track Your First Application</span>
          </button>
        </div>
      ) : viewMode === 'board' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {STATUS_COLUMNS.map((col) => {
            const colApps = filteredApps.filter(a => a.status === col.key);
            return (
              <div key={col.key} className="bg-surface dark:bg-surface-dark rounded-2xl border border-stone dark:border-stone-dark p-3 min-h-[500px] flex flex-col shadow-2xs">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone dark:border-stone-dark">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.key === ApplicationStatus.INTERVIEW ? 'bg-forest' : col.key === ApplicationStatus.OFFER ? 'bg-lime-dark' : col.key === ApplicationStatus.APPLIED ? 'bg-sky-500' : 'bg-stone-dark'}`}></span>
                    <span className="text-xs font-semibold text-ink dark:text-ink-dark uppercase tracking-wider">{col.label}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-ivory dark:bg-ivory-dark text-ink-muted dark:text-ink-dark-muted font-medium border border-stone dark:border-stone-dark">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-0.5">
                  {colApps.map(app => (
                    <div 
                      key={app.id} 
                      className="p-3.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark hover:border-forest/40 transition shadow-2xs group relative"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-semibold text-ink dark:text-ink-dark group-hover:text-forest dark:group-hover:text-emerald-400 transition line-clamp-1">
                          {app.jobTitle}
                        </h4>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                          <button 
                            onClick={() => handleOpenEdit(app)} 
                            className="p-1 hover:text-ink dark:hover:text-ink-dark text-ink-muted cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteApp(app.id)} 
                            className="p-1 hover:text-rose dark:hover:text-rose text-ink-muted cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs font-medium text-ink-light dark:text-ink-dark-secondary mb-2.5 flex items-center justify-between">
                        <span>{app.company}</span>
                        {app.location && (
                          <span className="text-[11px] text-ink-muted">{app.location}</span>
                        )}
                      </div>

                      {app.nextStep && (
                        <div className="p-2 rounded-lg bg-forest-faint dark:bg-forest/20 border border-forest/20 text-[11px] text-forest dark:text-emerald-300 mb-2 flex items-start space-x-1.5">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-forest dark:text-emerald-400" />
                          <span className="line-clamp-2">{app.nextStep}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-stone dark:border-stone-dark flex items-center justify-between text-[11px] text-ink-muted">
                        <span>{app.appliedDate || 'Date unset'}</span>
                        <select
                          value={app.status}
                          onChange={(e) => handleQuickStatusChange(app.id, e.target.value)}
                          className="bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-lg px-1.5 py-0.5 text-[10px] text-ink dark:text-ink-dark focus:outline-none"
                        >
                          {STATUS_COLUMNS.map(c => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-surface dark:bg-surface-dark rounded-2xl border border-stone dark:border-stone-dark overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink dark:text-ink-dark">
              <thead className="bg-ivory dark:bg-ivory-dark text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider border-b border-stone dark:border-stone-dark">
                <tr>
                  <th className="px-6 py-4">Role & Company</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Location / Salary</th>
                  <th className="px-6 py-4">Next Step</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone dark:divide-stone-dark">
                {filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-stone-warm/50 dark:hover:bg-stone-dark/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink dark:text-ink-dark">{app.jobTitle}</div>
                      <div className="text-xs text-ink-muted dark:text-ink-dark-muted flex items-center space-x-2 mt-0.5">
                        <span>{app.company}</span>
                        {app.jobUrl && (
                          <a href={app.jobUrl} target="_blank" rel="noreferrer" className="text-forest dark:text-emerald-400 hover:underline inline-flex items-center space-x-0.5 font-medium">
                            <span>Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLUMNS.find(c => c.key === app.status)?.color || 'border-stone text-ink-muted'}`}>
                        {STATUS_COLUMNS.find(c => c.key === app.status)?.label || app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-ink-muted dark:text-ink-dark-muted">
                      <div>{app.location || 'Remote'}</div>
                      {app.salaryRange && <div className="text-forest dark:text-emerald-400 font-semibold mt-0.5">{app.salaryRange}</div>}
                    </td>
                    <td className="px-6 py-4 text-xs text-ink-light dark:text-ink-dark-secondary max-w-xs truncate">
                      {app.nextStep || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-ink-muted dark:text-ink-dark-muted">
                      {app.appliedDate || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(app)}
                          className="p-1.5 hover:text-ink dark:hover:text-ink-dark text-ink-muted rounded-lg hover:bg-stone-warm dark:hover:bg-stone-dark/50 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteApp(app.id)}
                          className="p-1.5 hover:text-rose dark:hover:text-rose text-ink-muted rounded-lg hover:bg-stone-warm dark:hover:bg-stone-dark/50 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Application Modal */}
      {isModalOpen && editingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-ink dark:text-ink-dark">
              {editingApp.id ? 'Edit Application' : 'Track New Job Application'}
            </h3>

            <form onSubmit={handleSaveApp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={editingApp.company || ''}
                    onChange={(e) => setEditingApp({ ...editingApp, company: e.target.value })}
                    placeholder="e.g. Stripe, OpenAI"
                    className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={editingApp.jobTitle || ''}
                    onChange={(e) => setEditingApp({ ...editingApp, jobTitle: e.target.value })}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Stage / Status</label>
                  <select
                    value={editingApp.status || ApplicationStatus.APPLIED}
                    onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                  >
                    {STATUS_COLUMNS.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Applied Date</label>
                  <input
                    type="date"
                    value={editingApp.appliedDate || ''}
                    onChange={(e) => setEditingApp({ ...editingApp, appliedDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Location</label>
                  <input
                    type="text"
                    value={editingApp.location || ''}
                    onChange={(e) => setEditingApp({ ...editingApp, location: e.target.value })}
                    placeholder="e.g. Remote, San Francisco"
                    className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={editingApp.salaryRange || ''}
                    onChange={(e) => setEditingApp({ ...editingApp, salaryRange: e.target.value })}
                    placeholder="e.g. $140k - $165k"
                    className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Posting URL</label>
                <input
                  type="url"
                  value={editingApp.jobUrl || ''}
                  onChange={(e) => setEditingApp({ ...editingApp, jobUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Next Action / Next Round</label>
                <input
                  type="text"
                  value={editingApp.nextStep || ''}
                  onChange={(e) => setEditingApp({ ...editingApp, nextStep: e.target.value })}
                  placeholder="e.g. Technical screen scheduled on Friday 2pm"
                  className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Linked Resume Version</label>
                <select
                  value={editingApp.resumeId || ''}
                  onChange={(e) => setEditingApp({ ...editingApp, resumeId: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink dark:text-ink-dark text-sm focus:border-forest focus:outline-none"
                >
                  <option value="">None selected</option>
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.fileName} {r.isActive ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={editingApp.notes || ''}
                  onChange={(e) => setEditingApp({ ...editingApp, notes: e.target.value })}
                  placeholder="Recruiter contact, interview panel names, key talking points..."
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
                  {submitting ? 'Saving...' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
