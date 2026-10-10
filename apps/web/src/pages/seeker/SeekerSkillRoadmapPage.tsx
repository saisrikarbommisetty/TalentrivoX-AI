import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Compass,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Check
} from 'lucide-react';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const SeekerSkillRoadmapPage: React.FC = () => {
  const [roadmap, setRoadmap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('Backend & Data Architecture');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [whyItMatters, setWhyItMatters] = useState('');
  const [recommendedActivity, setRecommendedActivity] = useState('');
  const [practicalProjectIdea, setPracticalProjectIdea] = useState('');
  const [interviewValidationTask, setInterviewValidationTask] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const fetchRoadmap = async () => {
    try {
      const res = await api.getSeekerRoadmap();
      setRoadmap(res.roadmap);
    } catch (err) {
      console.error('Failed to load roadmap', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleStatusToggle = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'not_started' ? 'in_progress' : currentStatus === 'in_progress' ? 'completed' : 'not_started';
    try {
      const res = await api.updateSeekerRoadmapTask(taskId, { status: nextStatus });
      setRoadmap(res.roadmap);
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Remove this task from your roadmap?')) return;
    try {
      const res = await api.deleteSeekerRoadmapTask(taskId);
      setRoadmap(res.roadmap);
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName) return;
    try {
      const res = await api.createSeekerRoadmapTask({
        skillName,
        category,
        priority,
        whyItMatters: whyItMatters || 'Target role core competency requirement',
        recommendedActivity: recommendedActivity || 'Study documentation and architecture whitepapers.',
        practicalProjectIdea: practicalProjectIdea || 'Build a verified module in GitHub portfolio.',
        interviewValidationTask: interviewValidationTask || 'Structure STAR response for technical interview.',
        targetDate: targetDate || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
      });
      setRoadmap(res.roadmap);
      setShowAddModal(false);
      setSkillName('');
      setWhyItMatters('');
      setRecommendedActivity('');
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;

  const tasks = roadmap?.tasks || [];
  const completedCount = tasks.filter((t: any) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t: any) => t.status === 'in_progress').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone dark:border-stone-dark">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark tracking-tight">
            Personalized Skill Development Roadmap
          </h1>
          <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
            Turn evidence gaps into actionable milestones, practical project exercises, and interview narratives
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Milestone</span>
        </button>
      </div>

      {/* Progress & Target Role Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/20 uppercase tracking-wider">
              Target Track: {roadmap?.targetJobTitle || 'Full-Stack Software Engineer'}
            </span>
            <h2 className="text-xl font-serif font-bold text-ink dark:text-ink-dark">
              Career Competency Progress
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-forest dark:text-emerald-400 font-bold">{completedCount} Completed</span>
            <span className="text-amber dark:text-amber-400 font-bold">{inProgressCount} In Progress</span>
            <span className="text-ink-muted dark:text-ink-dark-muted font-bold">{tasks.length - completedCount - inProgressCount} Pending</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-ink dark:text-ink-dark">Milestone Completion</span>
            <span className="font-mono font-bold text-forest dark:text-emerald-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-stone-light dark:bg-stone-dark rounded-full overflow-hidden border border-stone dark:border-stone-dark">
            <div
              className="h-full bg-forest rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task Milestones List */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark flex items-center gap-2">
          <Compass className="w-4 h-4 text-forest dark:text-emerald-400" />
          <span>Actionable Skill Milestones ({tasks.length})</span>
        </h3>

        {tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task: any) => {
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';

              return (
                <div
                  key={task.id}
                  className={`p-6 rounded-2xl bg-surface dark:bg-surface-dark border transition-all shadow-xs space-y-4 ${
                    isCompleted
                      ? 'border-forest/40 bg-forest-faint/10 dark:bg-forest/5'
                      : isInProgress
                      ? 'border-amber/40 dark:border-amber/30'
                      : 'border-stone dark:border-stone-dark'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ivory dark:bg-ivory-dark text-ink-light dark:text-ink-dark-secondary border border-stone dark:border-stone-dark">
                          {task.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          task.priority === 'high'
                            ? 'bg-brand-error-light dark:bg-rose-950/40 text-brand-error dark:text-rose-300'
                            : 'bg-amber-light dark:bg-amber/20 text-amber dark:text-amber-300'
                        }`}>
                          {task.priority} Priority
                        </span>
                        <span className="text-[10px] text-ink-muted dark:text-ink-dark-muted capitalize">
                          {task.gapType?.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className={`text-base font-serif font-bold text-ink dark:text-ink-dark pt-1 ${isCompleted ? 'line-through text-ink-muted dark:text-ink-dark-muted' : ''}`}>
                        {task.skillName}
                      </h4>
                      <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                        {task.whyItMatters}
                      </p>
                    </div>

                    {/* Status Toggle Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(task.id, task.status)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isCompleted
                            ? 'bg-forest text-surface'
                            : isInProgress
                            ? 'bg-amber text-surface'
                            : 'bg-ivory dark:bg-ivory-dark text-ink dark:text-ink-dark border border-stone dark:border-stone-dark hover:border-forest'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Completed
                          </>
                        ) : isInProgress ? (
                          <>
                            <Clock className="w-3.5 h-3.5" /> In Progress
                          </>
                        ) : (
                          <span>Mark In Progress</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-ink-muted dark:text-ink-dark-muted hover:text-brand-error transition-colors cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Deep Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-1">
                      <strong className="text-[10px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400 block">
                        Recommended Learning Activity:
                      </strong>
                      <p className="text-ink-light dark:text-ink-dark-secondary">{task.recommendedActivity}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-1">
                      <strong className="text-[10px] font-bold uppercase tracking-wider text-amber dark:text-amber-400 block">
                        Practical Portfolio Project:
                      </strong>
                      <p className="text-ink-light dark:text-ink-dark-secondary">{task.practicalProjectIdea}</p>
                    </div>
                  </div>

                  {/* Target Date Footer */}
                  {task.targetDate && (
                    <div className="flex items-center gap-2 text-[11px] text-ink-muted dark:text-ink-dark-muted pt-1">
                      <Calendar className="w-3.5 h-3.5 text-forest dark:text-emerald-400" />
                      <span>Target Milestone Date: <strong>{task.targetDate}</strong></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-surface dark:bg-surface-dark rounded-2xl border border-stone dark:border-stone-dark text-xs text-ink-muted dark:text-ink-dark-muted">
            No skill milestones in your roadmap. Click "Add Custom Milestone" to begin.
          </div>
        )}
      </div>

      {/* Add Custom Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <div className="bg-surface dark:bg-surface-dark p-6 md:p-8 rounded-3xl border border-stone dark:border-stone-dark max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark">
              Add Skill Milestone to Roadmap
            </h3>

            <form onSubmit={handleAddTaskSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ink dark:text-ink-dark mb-1">
                  Skill / Competency Name *
                </label>
                <input
                  type="text"
                  required
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. Distributed Caching with Redis"
                  className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink dark:text-ink-dark mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink dark:text-ink-dark mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs text-ink dark:text-ink-dark font-semibold focus:outline-none"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink dark:text-ink-dark mb-1">Why It Matters</label>
                <input
                  type="text"
                  value={whyItMatters}
                  onChange={(e) => setWhyItMatters(e.target.value)}
                  placeholder="e.g. Required for Senior backend architecture questions"
                  className="w-full px-3.5 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark"
                />
              </div>

              <div>
                <label className="block font-bold text-ink dark:text-ink-dark mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone dark:border-stone-dark">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted dark:text-ink-dark-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-forest text-surface text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
