import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  CheckSquare,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Search,
  Star,
  User,
  Calendar,
  Check,
  RotateCcw,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  History,
  TrendingUp,
  AlertTriangle,
  BellRing,
} from 'lucide-react';

export const TasksPage = () => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [requestUpdateModalOpen, setRequestUpdateModalOpen] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    branch_id: user?.branch_id || 1,
    assigned_to: '',
    priority: 'Medium',
    complexity: 'Medium',
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    requires_review: true,
  });

  const [progressForm, setProgressForm] = useState({
    progress_percent: 50,
    progress_notes: '',
    time_spent_minutes: 60,
  });

  const [submissionForm, setSubmissionForm] = useState({
    submission_notes: '',
    time_spent_minutes: 60,
  });

  const [reviewForm, setReviewForm] = useState({
    action: 'approved',
    rating: 5,
    remarks: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  const fetchTasks = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      let url = `/tasks?search=${search}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;

      const res = await api.get(url);
      setTasks(res.data.tasks || []);
      setSummary(res.data.summary || {});
      setLastRefreshed(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(true);
  }, [statusFilter, priorityFilter, search]);

  // Real-time automatic polling every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchTasks(false);
    }, 15000);
    return () => clearInterval(timer);
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    if (isAdmin || isManager) {
      api.get('/employees').then((res) => {
        setEmployees(res.data.employees || []);
        if (res.data.employees?.length > 0 && !taskForm.assigned_to) {
          setTaskForm((prev) => ({ ...prev, assigned_to: res.data.employees[0].id }));
        }
      });
      api.get('/branches').then((res) => setBranches(res.data.branches || []));
    }
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/tasks', taskForm);
      setAlertMsg({ text: `Task ${res.data.task.task_id} assigned successfully.`, type: 'success' });
      setAddModalOpen(false);
      setTaskForm({
        title: '',
        description: '',
        branch_id: user?.branch_id || 1,
        assigned_to: employees[0]?.id || '',
        priority: 'Medium',
        complexity: 'Medium',
        deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        requires_review: true,
      });
      fetchTasks();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Failed to assign task.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      await api.put(`/tasks/${selectedTask.id}`, taskForm);
      setAlertMsg({ text: `Task ${selectedTask.task_id} updated successfully.`, type: 'success' });
      setEditModalOpen(false);
      setSelectedTask(null);
      fetchTasks();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Failed to update task.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      await api.put(`/tasks/${selectedTask.id}`, {
        progress_percent: parseInt(progressForm.progress_percent, 10),
        progress_notes: progressForm.progress_notes,
        time_spent_minutes: parseInt(progressForm.time_spent_minutes, 10),
        status: 'IN_PROGRESS',
      });
      setAlertMsg({ text: `Progress updated for ${selectedTask.task_id}.`, type: 'success' });
      setProgressModalOpen(false);
      setSelectedTask(null);
      fetchTasks();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Failed to update progress.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      await api.post(`/tasks/${selectedTask.id}/submit`, {
        submission_notes: submissionForm.submission_notes,
        time_spent_minutes: parseInt(submissionForm.time_spent_minutes, 10),
      });
      setAlertMsg({ text: 'Task work submitted successfully for partner review.', type: 'success' });
      setSubmitModalOpen(false);
      setSelectedTask(null);
      setSubmissionForm({ submission_notes: '', time_spent_minutes: 60 });
      fetchTasks();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit work.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      await api.post(`/tasks/${selectedTask.id}/review`, reviewForm);
      setAlertMsg({ text: `Task review completed: Status updated.`, type: 'success' });
      setReviewModalOpen(false);
      setSelectedTask(null);
      setReviewForm({ action: 'approved', rating: 5, remarks: '' });
      fetchTasks();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record review.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      setAlertMsg({ text: `Task ${selectedTask.task_id} deleted successfully.`, type: 'success' });
      setDeleteModalOpen(false);
      setSelectedTask(null);
      fetchTasks();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/tasks/${selectedTask.id}/request-update`, {
        message: nudgeMessage,
      });
      setAlertMsg({ text: res.data.message || 'Status update requested from associate.', type: 'success' });
      setRequestUpdateModalOpen(false);
      setNudgeMessage('');
      fetchTasks();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request update.');
    } finally {
      setActionLoading(false);
    }
  };

  const openInspectModal = async (task) => {
    setSelectedTask(task);
    setInspectModalOpen(true);
    try {
      const res = await api.get(`/tasks/${task.id}`);
      setSelectedTask(res.data.task);
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      branch_id: task.branch_id,
      assigned_to: task.assigned_to,
      priority: task.priority,
      complexity: task.complexity,
      deadline: task.deadline,
      requires_review: task.requires_review,
    });
    setEditModalOpen(true);
  };

  const openProgressModal = (task) => {
    setSelectedTask(task);
    setProgressForm({
      progress_percent: task.progress_percent || 50,
      progress_notes: '',
      time_spent_minutes: 60,
    });
    setProgressModalOpen(true);
  };

  const isCompleted = (status) => ['COMPLETED', 'Completed'].includes(status);
  const isSubmitted = (status) => ['SUBMITTED', 'Submitted'].includes(status);
  const isNeedsRevision = (status) => ['NEEDS_REVISION', 'Rejected / Needs Revision'].includes(status);

  // Check if management has requested a status update that hasn't been answered yet
  const getPendingUpdateRequest = (task) => {
    if (!task?.histories || task.histories.length === 0) return null;
    if (isCompleted(task.status) || isSubmitted(task.status)) return null;

    // Sort histories by id descending (most recent first)
    const sorted = [...task.histories].sort((a, b) => (b.id || 0) - (a.id || 0));
    const latestUpdateRequest = sorted.find(h => h.action === 'Update Requested by Management');
    if (!latestUpdateRequest) return null;

    // Check if associate responded with Progress Updated or Work Submitted after this request
    const hasResponded = sorted.some(h =>
      (h.id || 0) > (latestUpdateRequest.id || 0) &&
      (h.action === 'Progress Updated' || h.action === 'Work Submitted for Review')
    );

    return hasResponded ? null : latestUpdateRequest;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-navy-900">Task Management</h1>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Brief allocations, active progression, partner quality sign-offs, and complete lifecycle audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTasks(true)}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Tasks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {(isAdmin || isManager) && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-gold-400" />
              Assign New Task
            </button>
          )}
        </div>
      </div>

      {alertMsg.text && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between shadow-subtle ${alertMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg({ text: '', type: '' })} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Briefs</span>
          <div className="text-xl font-bold text-navy-900 mt-0.5">{summary.total || 0}</div>
          <div className="text-[10px] text-slate-400">Allocated matters</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">In Progress</span>
          <div className="text-xl font-bold text-blue-700 mt-0.5">{summary.in_progress || 0}</div>
          <div className="text-[10px] text-blue-600">Active drafting</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Submitted</span>
          <div className="text-xl font-bold text-indigo-700 mt-0.5">{summary.submitted || 0}</div>
          <div className="text-[10px] text-indigo-600">Awaiting review</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Needs Revision</span>
          <div className="text-xl font-bold text-rose-700 mt-0.5">{summary.needs_revision || 0}</div>
          <div className="text-[10px] text-rose-600">Returned to staff</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Completed</span>
          <div className="text-xl font-bold text-emerald-700 mt-0.5">{summary.completed || 0}</div>
          <div className="text-[10px] text-emerald-600">Accepted & signed off</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search task title, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
          >
            <option value="">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium text-navy-900"
          >
            <option value="">All Statuses</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="NEEDS_REVISION">NEEDS_REVISION</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Title & Progress</th>
                <th className="py-3 px-3">Assignee</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Complexity</th>
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading tasks...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">No tasks found matching criteria.</td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-navy-900">
                      <button
                        onClick={() => openInspectModal(task)}
                        className="hover:text-gold-600 transition-colors flex items-center gap-1"
                        title="View Full Task Timeline"
                      >
                        {task.task_id}
                        <Eye className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-bold text-navy-900 cursor-pointer hover:text-gold-600" onClick={() => openInspectModal(task)}>
                        {task.title}
                      </div>
                      <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{task.description}</div>

                      {/* Progress bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="w-28 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isCompleted(task.status) ? 'bg-emerald-600' : isNeedsRevision(task.status) ? 'bg-rose-500' : 'bg-navy-900'}`}
                            style={{ width: `${task.progress_percent || (isCompleted(task.status) ? 100 : 0)}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-slate-600">
                          {task.progress_percent || (isCompleted(task.status) ? 100 : 0)}%
                        </span>
                        {task.time_spent_minutes > 0 && (
                          <span className="text-[10px] text-slate-400">
                            • {Math.round(task.time_spent_minutes / 60 * 10) / 10}h logged
                          </span>
                        )}
                      </div>

                      {isNeedsRevision(task.status) && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Revision requested by partner. Update work and re-submit.</span>
                        </div>
                      )}

                      {task.reviews?.length > 0 && isCompleted(task.status) && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-800">
                          <Star className="w-3 h-3 text-gold-500 fill-gold-400" />
                          <span>Rating: {task.reviews[task.reviews.length - 1].rating}/5 &mdash; {task.reviews[task.reviews.length - 1].remarks}</span>
                        </div>
                      )}

                      {/* Management Update Request Notice */}
                      {(() => {
                        const updateReq = getPendingUpdateRequest(task);
                        if (!updateReq) return null;
                        return (
                          <div className="mt-2 p-2.5 bg-amber-50/90 border border-amber-300/90 rounded-lg shadow-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                            <div className="p-1 bg-amber-200/70 rounded-md text-amber-800 shrink-0 mt-0.5">
                              <BellRing className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 font-bold text-amber-950 text-[11px]">
                                <span>Management Requested Status Update</span>
                                {updateReq.created_at && (
                                  <span className="text-[10px] text-amber-700 font-normal font-mono">
                                    ({format(new Date(updateReq.created_at), 'dd MMM, HH:mm')})
                                  </span>
                                )}
                              </div>
                              {updateReq.notes && (
                                <p className="text-amber-900 text-[11px] mt-1 italic bg-white/90 p-1.5 rounded border border-amber-200">
                                  "{updateReq.notes}"
                                </p>
                              )}
                              <div className="mt-1 text-[10px] text-amber-800 font-medium">
                                Please click <span className="font-bold underline text-navy-950">Reply Progress</span> or <span className="font-bold underline text-navy-950">Submit</span> to respond to partner.
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-navy-900">{task.assignee?.full_name}</div>
                      <div className="text-[10px] text-slate-500">{task.assignee?.designation}</div>
                    </td>

                    <td className="py-3 px-3">
                      <Badge variant={task.priority} size="xs">{task.priority}</Badge>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-700">{task.complexity}</td>

                    <td className="py-3 px-3 font-mono font-semibold text-rose-700">{task.deadline}</td>

                    <td className="py-3 px-3">
                      <Badge variant={task.status} size="xs">{task.status}</Badge>
                      {getPendingUpdateRequest(task) && (
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs animate-pulse">
                          <BellRing className="w-2.5 h-2.5 text-amber-600" />
                          <span>Update Req</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Employee Actions */}
                        {isEmployee && !isCompleted(task.status) && !isSubmitted(task.status) && (
                          <>
                            <button
                              onClick={() => openProgressModal(task)}
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                                getPendingUpdateRequest(task)
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm ring-2 ring-amber-300 animate-pulse font-bold'
                                  : 'bg-white hover:bg-slate-100 text-navy-900 border border-slate-300'
                              }`}
                              title={getPendingUpdateRequest(task) ? 'Management requested update - click to respond' : 'Update Progress & Time Spent'}
                            >
                              <TrendingUp className={`w-3 h-3 ${getPendingUpdateRequest(task) ? 'text-white' : 'text-blue-600'}`} />
                              {getPendingUpdateRequest(task) ? 'Reply Progress' : 'Progress'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setSubmitModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <Send className="w-3 h-3 text-gold-400" />
                              Submit
                            </button>
                          </>
                        )}

                        {/* Manager Review Action */}
                        {(isAdmin || isManager) && isSubmitted(task.status) && (
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setReviewModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Star className="w-3 h-3 text-gold-300 fill-gold-200" />
                            Review & Rate
                          </button>
                        )}

                        {/* Manager Nudge / Request Status Update */}
                        {(isAdmin || isManager) && !isCompleted(task.status) && !isSubmitted(task.status) && (
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setNudgeMessage('');
                              setRequestUpdateModalOpen(true);
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Request progress update from associate"
                          >
                            <BellRing className="w-3 h-3 text-amber-700" />
                            Request Update
                          </button>
                        )}

                        {/* Manager Edit & Delete Actions */}
                        {(isAdmin || isManager) && (
                          <>
                            <button
                              onClick={() => openEditModal(task)}
                              className="p-1 text-slate-400 hover:text-navy-900 transition-colors"
                              title="Edit Instructions / Reassign"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {!isCompleted(task.status) && (
                              <button
                                onClick={() => {
                                  setSelectedTask(task);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details & Audit Timeline Modal */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title={selectedTask ? `${selectedTask.task_id}: ${selectedTask.title}` : 'Task Details'}
        subtitle="Complete legal brief instructions and chronological history"
      >
        {selectedTask && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Assignee</span>
                <div className="font-bold text-navy-900 mt-0.5">{selectedTask.assignee?.full_name}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Priority</span>
                <div className="mt-0.5"><Badge variant={selectedTask.priority} size="xs">{selectedTask.priority}</Badge></div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                <div className="mt-0.5"><Badge variant={selectedTask.status} size="xs">{selectedTask.status}</Badge></div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Deadline</span>
                <div className="font-mono font-bold text-rose-700 mt-0.5">{selectedTask.deadline}</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-navy-900 uppercase tracking-wider text-[11px] mb-1">Matter Instructions</h3>
              <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedTask.description}
              </p>
            </div>

            {selectedTask.submission_notes && (
              <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200">
                <span className="font-bold text-indigo-950 uppercase tracking-wider text-[10px]">Associate Submission Notes:</span>
                <p className="text-indigo-900 mt-1">{selectedTask.submission_notes}</p>
              </div>
            )}

            {/* History Timeline */}
            <div>
              <div className="flex items-center gap-1.5 mb-2 font-bold text-navy-900 uppercase tracking-wider text-[11px]">
                <History className="w-3.5 h-3.5 text-gold-600" />
                <span>Task History & Audit Timeline</span>
              </div>

              <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-2 max-h-56 overflow-y-auto">
                {selectedTask.histories?.length > 0 ? (
                  selectedTask.histories.map((h, i) => (
                    <div key={h.id || i} className="relative pb-2">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-gold-500 border-2 border-white"></div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-navy-900">{h.action}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{new Date(h.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        By {h.user?.name || 'System'}
                        {h.new_status && ` • Status: ${h.new_status}`}
                        {h.progress_percent !== null && ` • Progress: ${h.progress_percent}%`}
                      </div>
                      {h.notes && (
                        <p className="mt-0.5 text-slate-600 italic bg-slate-50 p-1 rounded border border-slate-100">
                          "{h.notes}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs py-2">No historical events recorded yet.</div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Task Modal (Manager) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Assign Legal Brief / Task"
        subtitle="Allocate case research or drafting to an associate"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Brief Title / Matter</label>
            <input
              type="text"
              required
              placeholder="e.g. Draft Special Leave Petition before Supreme Court"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Assigned Associate</label>
              <select
                required
                value={taskForm.assigned_to}
                onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Statutory Deadline</label>
              <input
                type="date"
                required
                value={taskForm.deadline}
                onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Immediate Court Filing)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Complexity</label>
              <select
                value={taskForm.complexity}
                onChange={(e) => setTaskForm({ ...taskForm, complexity: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="Simple">Simple</option>
                <option value="Medium">Medium</option>
                <option value="Complex">Complex (Multi-precedent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Instructions & Description</label>
            <textarea
              rows={3}
              required
              placeholder="Outline specific legal points, relevant acts, and expected output..."
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
            >
              {actionLoading ? 'Allocating...' : 'Assign Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal (Manager) */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Legal Brief / Reassign"
        subtitle={selectedTask ? `Editing ${selectedTask.task_id}` : ''}
      >
        <form onSubmit={handleEditTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Title</label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Reassign Associate</label>
              <select
                required
                value={taskForm.assigned_to}
                onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Deadline</label>
              <input
                type="date"
                required
                value={taskForm.deadline}
                onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Complexity</label>
              <select
                value={taskForm.complexity}
                onChange={(e) => setTaskForm({ ...taskForm, complexity: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="Simple">Simple</option>
                <option value="Medium">Medium</option>
                <option value="Complex">Complex</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Description / Instructions</label>
            <textarea
              rows={3}
              required
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
            >
              {actionLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Progress Update Modal (Employee) */}
      <Modal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        title="Update Task Progress & Work Log"
        subtitle={selectedTask ? `${selectedTask.task_id}: ${selectedTask.title}` : ''}
      >
        <form onSubmit={handleUpdateProgress} className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-navy-900">Progress: {progressForm.progress_percent}%</label>
              <span className="text-[10px] text-slate-400">Moves status to IN_PROGRESS</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={progressForm.progress_percent}
              onChange={(e) => setProgressForm({ ...progressForm, progress_percent: e.target.value })}
              className="w-full accent-navy-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Time Spent Today (Minutes)</label>
            <input
              type="number"
              min="15"
              max="720"
              required
              value={progressForm.time_spent_minutes}
              onChange={(e) => setProgressForm({ ...progressForm, time_spent_minutes: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Progress Notes / Activities Executed</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Scrutinized relevant Supreme Court decisions from 2018-2024 and completed section 2 of draft..."
              value={progressForm.progress_notes}
              onChange={(e) => setProgressForm({ ...progressForm, progress_notes: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setProgressModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-gold-400" />
              {actionLoading ? 'Recording...' : 'Update Progress'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Submit Completed Work Modal (Employee) */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Submit Work for Partner Review"
        subtitle={selectedTask ? `${selectedTask.task_id}: ${selectedTask.title}` : ''}
      >
        <form onSubmit={handleSubmitWork} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Time Spent Today (Minutes)</label>
            <input
              type="number"
              min="0"
              max="720"
              value={submissionForm.time_spent_minutes}
              onChange={(e) => setSubmissionForm({ ...submissionForm, time_spent_minutes: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Final Submission Notes & Annexures Prepared</label>
            <textarea
              rows={4}
              required
              placeholder="Detail final draft copy prepared, verified citations, statutory provisions incorporated, or court filing ready..."
              value={submissionForm.submission_notes}
              onChange={(e) => setSubmissionForm({ ...submissionForm, submission_notes: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSubmitModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-gold-400" />
              {actionLoading ? 'Submitting...' : 'Submit to Partner (Status: SUBMITTED)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review & Rate Task Modal (Manager) */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Partner Task Quality Review & Rating"
        subtitle={selectedTask ? `Reviewing submission for ${selectedTask.task_id}` : ''}
      >
        <form onSubmit={handleReviewTask} className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-navy-900">Associate Submission Notes:</span>
            <p className="text-slate-700 mt-1">{selectedTask?.submission_notes || 'No notes provided.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Review Decision</label>
              <select
                value={reviewForm.action}
                onChange={(e) => setReviewForm({ ...reviewForm, action: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-semibold text-navy-900"
              >
                <option value="approved">Approve & Complete Task (COMPLETED)</option>
                <option value="revision_requested">Request Revision (NEEDS_REVISION)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Quality Rating (1 to 5 Stars)</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value, 10) })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-bold text-navy-900"
              >
                <option value={5}>★★★★★ 5 - Exceptional Legal Accuracy</option>
                <option value={4}>★★★★☆ 4 - High Quality / Minor Edits</option>
                <option value={3}>★★★☆☆ 3 - Acceptable Standard</option>
                <option value={2}>★★☆☆☆ 2 - Below Firm Standard</option>
                <option value={1}>★☆☆☆☆ 1 - Unsatisfactory</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Partner Appraisal Remarks</label>
            <textarea
              rows={3}
              required
              placeholder="Feedback on legal reasoning, formatting, and client readiness..."
              value={reviewForm.remarks}
              onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Save Partner Review
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Manager) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Task Deletion"
        subtitle={selectedTask ? `Deleting ${selectedTask.task_id}` : ''}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700">
            Are you sure you want to permanently delete task <strong className="text-navy-900">{selectedTask?.task_id} &mdash; {selectedTask?.title}</strong>?
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
            This operation will remove the brief allocation and notify the assigned associate. Completed tasks cannot be deleted.
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDeleteTask}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {actionLoading ? 'Deleting...' : 'Delete Task'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Request Status Update Modal (Manager Nudge) */}
      <Modal
        isOpen={requestUpdateModalOpen}
        onClose={() => setRequestUpdateModalOpen(false)}
        title="Request Status Follow-up from Associate"
        subtitle={selectedTask ? `${selectedTask.task_id} • Assigned to ${selectedTask.assignee?.full_name}` : ''}
      >
        <form onSubmit={handleRequestUpdate} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2.5">
            <BellRing className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Follow up on In-Progress Legal Matter</span>
              This sends an immediate high-priority alert to <strong>{selectedTask?.assignee?.full_name}</strong> and records a formal follow-up inquiry in this matter's official timeline.
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">
              Follow-up Note / Inquiry Instructions
            </label>
            <textarea
              rows="3"
              value={nudgeMessage}
              onChange={(e) => setNudgeMessage(e.target.value)}
              placeholder="e.g. Please provide an interim status update on this draft before today's 4 PM review..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          {/* Quick preset templates */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Quick inquiry templates:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {[
                "Please provide an interim status report on this draft.",
                "Upcoming court hearing date; kindly update current progress.",
                "Client requested a status update on this matter today.",
                "Do you need partner guidance or additional resources?"
              ].map((msg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNudgeMessage(msg)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-medium transition-colors text-left"
                >
                  &ldquo;{msg}&rdquo;
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRequestUpdateModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-gold-400" />
              {actionLoading ? 'Sending...' : 'Send Follow-up to Associate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
