import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  FileSpreadsheet,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Search,
  Check,
  RotateCcw,
  RefreshCw,
  Edit3,
  Trash2,
  AlertTriangle,
  FileCheck,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';

export const WorkSheetsPage = () => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [managerStatusFilter, setManagerStatusFilter] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    work_date: format(new Date(), 'yyyy-MM-dd'),
    task_title: '',
    task_description: '',
    work_category: 'Drafting',
    time_spent_minutes: '120',
    work_status: 'In Progress',
    pending_reason: '',
    employee_remarks: '',
  });

  const [reviewForm, setReviewForm] = useState({
    manager_status: 'approved',
    manager_remarks: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  const fetchWorkLogs = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      let url = `/work-logs?`;
      if (filterDate) url += `date=${filterDate}&`;
      if (statusFilter) url += `work_status=${statusFilter}&`;
      if (managerStatusFilter) url += `manager_status=${managerStatusFilter}&`;

      const res = await api.get(url);
      setLogs(res.data.work_logs || []);
      setSummary(res.data.summary || {});
    } catch (e) {
      console.error(e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkLogs(true);
  }, [filterDate, statusFilter, managerStatusFilter]);

  // Real-time automatic polling every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchWorkLogs(false);
    }, 15000);
    return () => clearInterval(timer);
  }, [filterDate, statusFilter, managerStatusFilter]);

  const handleSaveLog = async (e, isDraft = false) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/work-logs', {
        ...formData,
        time_spent_minutes: parseInt(formData.time_spent_minutes, 10),
        is_draft: isDraft,
      });
      setAlertMsg({
        text: isDraft ? 'Daily work entry saved as Draft.' : 'Daily work entry submitted for partner sign-off.',
        type: 'success',
      });
      setAddModalOpen(false);
      setFormData({
        work_date: format(new Date(), 'yyyy-MM-dd'),
        task_title: '',
        task_description: '',
        work_category: 'Drafting',
        time_spent_minutes: '120',
        work_status: 'In Progress',
        pending_reason: '',
        employee_remarks: '',
      });
      fetchWorkLogs();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Failed to submit work log.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLog = async (e, isDraft = false) => {
    e.preventDefault();
    if (!selectedLog) return;
    setActionLoading(true);
    try {
      await api.put(`/work-logs/${selectedLog.id}`, {
        ...formData,
        time_spent_minutes: parseInt(formData.time_spent_minutes, 10),
        is_draft: isDraft,
      });
      setAlertMsg({
        text: isDraft ? 'Work entry draft updated.' : 'Work entry submitted to manager for review.',
        type: 'success',
      });
      setEditModalOpen(false);
      setSelectedLog(null);
      fetchWorkLogs();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Failed to update work log.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitDraft = async (logId) => {
    setActionLoading(true);
    try {
      await api.post(`/work-logs/${logId}/submit`);
      setAlertMsg({ text: 'Draft work sheet submitted for partner review.', type: 'success' });
      fetchWorkLogs();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit draft.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLog = async () => {
    if (!selectedLog) return;
    setActionLoading(true);
    try {
      await api.delete(`/work-logs/${selectedLog.id}`);
      setAlertMsg({ text: 'Work sheet entry deleted successfully.', type: 'success' });
      setDeleteModalOpen(false);
      setSelectedLog(null);
      fetchWorkLogs();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete work log.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewLog = async (e) => {
    e.preventDefault();
    if (!selectedLog) return;
    setActionLoading(true);
    try {
      await api.post(`/work-logs/${selectedLog.id}/review`, reviewForm);
      setAlertMsg({ text: `Work entry marked as ${reviewForm.manager_status}.`, type: 'success' });
      setReviewModalOpen(false);
      setSelectedLog(null);
      setReviewForm({ manager_status: 'approved', manager_remarks: '' });
      fetchWorkLogs();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record review.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (log) => {
    setSelectedLog(log);
    setFormData({
      work_date: log.work_date,
      task_title: log.task_title,
      task_description: log.task_description,
      work_category: log.work_category,
      time_spent_minutes: String(log.time_spent_minutes),
      work_status: log.work_status,
      pending_reason: log.pending_reason || '',
      employee_remarks: log.employee_remarks || '',
    });
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-navy-900">Daily Legal Work Sheets</h1>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Activity logs, billable hourly records, court appearances, drafting logs, and partner sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchWorkLogs(true)}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isEmployee && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-gold-400" />
              Log Legal Activity
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Entries</span>
          <div className="text-xl font-bold text-navy-900 mt-0.5">{summary.total_entries || 0}</div>
          <div className="text-[10px] text-slate-400">Total activities logged</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-navy-800 uppercase tracking-wider">Total Hours</span>
          <div className="text-xl font-bold text-navy-900 mt-0.5">{summary.total_hours || 0} hrs</div>
          <div className="text-[10px] text-slate-400">Cumulative time logged</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Drafts</span>
          <div className="text-xl font-bold text-slate-600 mt-0.5">{summary.draft_count || 0}</div>
          <div className="text-[10px] text-slate-400">Saved locally</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Pending Sign-off</span>
          <div className="text-xl font-bold text-amber-700 mt-0.5">{summary.pending_approval_count || 0}</div>
          <div className="text-[10px] text-amber-600">Awaiting partner review</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Approved</span>
          <div className="text-xl font-bold text-emerald-700 mt-0.5">{summary.approved_count || 0}</div>
          <div className="text-[10px] text-emerald-600">Signed off by Partner</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
          />

          <select
            value={managerStatusFilter}
            onChange={(e) => setManagerStatusFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium text-navy-900"
          >
            <option value="">All Sign-off Statuses</option>
            <option value="draft">Drafts Only</option>
            <option value="pending">Submitted (Pending Review)</option>
            <option value="approved">Approved</option>
            <option value="correction_requested">Correction Requested</option>
          </select>
        </div>

        {(filterDate || managerStatusFilter) && (
          <button
            onClick={() => {
              setFilterDate('');
              setManagerStatusFilter('');
            }}
            className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
          </button>
        )}
      </div>

      {/* Work Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Associate</th>
                <th className="py-3 px-4">Category & Matter Title</th>
                <th className="py-3 px-3">Hours</th>
                <th className="py-3 px-3">Activity Status</th>
                <th className="py-3 px-3">Sign-Off Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading work logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No daily work entries found.</td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isDraft = log.manager_status === 'draft';
                  const isPending = log.manager_status === 'pending';
                  const isApproved = log.manager_status === 'approved';
                  const isCorrection = log.manager_status === 'correction_requested';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {log.work_date}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-navy-900">{log.employee?.full_name}</div>
                        <div className="text-[10px] text-slate-400">{log.employee?.employee_id}</div>
                      </td>

                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                            {log.work_category}
                          </span>
                        </div>
                        <div className="font-bold text-navy-900">{log.task_title}</div>
                        <div className="text-slate-600 text-[11px] line-clamp-2 mt-0.5">{log.task_description}</div>

                        {/* Manager Feedback / Remarks */}
                        {log.manager_remarks && (
                          <div className={`mt-1.5 text-[10px] p-1.5 rounded border ${isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                            <strong>Partner Feedback:</strong> {log.manager_remarks}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-navy-900 whitespace-nowrap">
                        {Math.round(log.time_spent_minutes / 60 * 10) / 10}h
                        <div className="text-[10px] text-slate-400 font-normal">{log.time_spent_minutes}m</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge variant={log.work_status} size="xs">{log.work_status}</Badge>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge variant={log.manager_status} size="xs">
                          {log.manager_status === 'draft' ? 'Draft' : log.manager_status === 'pending' ? 'Pending Review' : log.manager_status === 'approved' ? 'Approved' : 'Correction Needed'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Employee Actions */}
                          {isEmployee && (
                            <>
                              {isDraft && (
                                <button
                                  onClick={() => handleSubmitDraft(log.id)}
                                  className="px-2 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                                  title="Submit Draft for Review"
                                >
                                  <Send className="w-3 h-3 text-gold-400" />
                                  Submit
                                </button>
                              )}

                              {(isDraft || isCorrection) && (
                                <>
                                  <button
                                    onClick={() => openEditModal(log)}
                                    className="p-1 text-slate-400 hover:text-navy-900 transition-colors"
                                    title="Edit Draft / Corrections"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {isDraft && (
                                    <button
                                      onClick={() => {
                                        setSelectedLog(log);
                                        setDeleteModalOpen(true);
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                      title="Delete Draft"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}

                              {isApproved && (
                                <span className="text-[10px] text-slate-400 italic">Signed Off</span>
                              )}
                            </>
                          )}

                          {/* Manager Review Action */}
                          {(isAdmin || isManager) && isPending && (
                            <button
                              onClick={() => {
                                setSelectedLog(log);
                                setReviewModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <FileCheck className="w-3 h-3 text-gold-300" />
                              Sign Off
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Activity Modal (Employee) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Log Daily Legal Work"
        subtitle="Record activities executed today with billable duration"
      >
        <form className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Work Date</label>
              <input
                type="date"
                required
                value={formData.work_date}
                onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Legal Work Category</label>
              <select
                value={formData.work_category}
                onChange={(e) => setFormData({ ...formData, work_category: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium text-navy-900"
              >
                <option value="Drafting">Drafting Petitions / Briefs</option>
                <option value="Court Appearance">Court Appearance / Hearing</option>
                <option value="Case Research">Precedent & Statutory Research</option>
                <option value="Client Consultation">Client Consultation & Conferencing</option>
                <option value="Filing & Scrutiny">Registry Filing & Registry Scrutiny</option>
                <option value="Documentation">Due Diligence & Documentation</option>
                <option value="Administrative">Administrative Office Task</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Matter / Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Scrutiny of High Court Writ Petition No. 1824/2026"
              value={formData.task_title}
              onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Time Spent (Minutes)</label>
              <input
                type="number"
                min="15"
                max="720"
                required
                value={formData.time_spent_minutes}
                onChange={(e) => setFormData({ ...formData, time_spent_minutes: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Execution Status</label>
              <select
                value={formData.work_status}
                onChange={(e) => setFormData({ ...formData, work_status: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium text-navy-900"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending External Input</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Activity Description</label>
            <textarea
              rows={3}
              required
              placeholder="Detailed description of legal research conducted, authorities cited, or documents drafted..."
              value={formData.task_description}
              onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Employee Remarks / Next Steps (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Awaiting client signature on affidavit; court hearing listed tomorrow."
              value={formData.employee_remarks}
              onChange={(e) => setFormData({ ...formData, employee_remarks: e.target.value })}
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
              type="button"
              disabled={actionLoading}
              onClick={(e) => handleSaveLog(e, true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save as Draft
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={(e) => handleSaveLog(e, false)}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-gold-400" />
              {actionLoading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Work Log Modal (Employee) */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Work Sheet Entry"
        subtitle={selectedLog ? `Editing ${selectedLog.task_title}` : ''}
      >
        <form className="space-y-4 text-xs">
          {selectedLog?.manager_status === 'correction_requested' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
              <strong>Partner requested corrections:</strong> {selectedLog.manager_remarks}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Work Date</label>
              <input
                type="date"
                required
                value={formData.work_date}
                onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Legal Work Category</label>
              <select
                value={formData.work_category}
                onChange={(e) => setFormData({ ...formData, work_category: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium text-navy-900"
              >
                <option value="Drafting">Drafting Petitions / Briefs</option>
                <option value="Court Appearance">Court Appearance / Hearing</option>
                <option value="Case Research">Precedent & Statutory Research</option>
                <option value="Client Consultation">Client Consultation & Conferencing</option>
                <option value="Filing & Scrutiny">Registry Filing & Registry Scrutiny</option>
                <option value="Documentation">Due Diligence & Documentation</option>
                <option value="Administrative">Administrative Office Task</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Matter / Task Title</label>
            <input
              type="text"
              required
              value={formData.task_title}
              onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Time Spent (Minutes)</label>
              <input
                type="number"
                min="15"
                max="720"
                required
                value={formData.time_spent_minutes}
                onChange={(e) => setFormData({ ...formData, time_spent_minutes: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Execution Status</label>
              <select
                value={formData.work_status}
                onChange={(e) => setFormData({ ...formData, work_status: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium text-navy-900"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Activity Description</label>
            <textarea
              rows={3}
              required
              value={formData.task_description}
              onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
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
              type="button"
              disabled={actionLoading}
              onClick={(e) => handleUpdateLog(e, true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Draft
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={(e) => handleUpdateLog(e, false)}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-gold-400" />
              {actionLoading ? 'Updating...' : 'Submit to Partner'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Sign-off Modal (Manager) */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Partner Work Sheet Sign-Off"
        subtitle={selectedLog ? `Reviewing log: ${selectedLog.task_title}` : ''}
      >
        <form onSubmit={handleReviewLog} className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-navy-900">{selectedLog?.employee?.full_name}</span>
              <span className="font-mono text-slate-500">{selectedLog?.work_date} &bull; {selectedLog?.time_spent_minutes}m</span>
            </div>
            <p className="text-slate-700 mt-1 whitespace-pre-wrap">{selectedLog?.task_description}</p>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Review Decision</label>
            <select
              value={reviewForm.manager_status}
              onChange={(e) => setReviewForm({ ...reviewForm, manager_status: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-semibold text-navy-900"
            >
              <option value="approved">Approve & Sign Off Work Entry</option>
              <option value="correction_requested">Request Corrections / Revisions</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Partner Remarks & Feedback</label>
            <textarea
              rows={3}
              required
              placeholder="Enter feedback or specify required corrections..."
              value={reviewForm.manager_remarks}
              onChange={(e) => setReviewForm({ ...reviewForm, manager_remarks: e.target.value })}
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
              <Check className="w-3.5 h-3.5" /> Save Sign-Off
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Work Sheet Deletion"
        subtitle={selectedLog ? `Deleting draft: ${selectedLog.task_title}` : ''}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700">
            Are you sure you want to delete this draft work log?
          </p>

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
              onClick={handleDeleteLog}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {actionLoading ? 'Deleting...' : 'Delete Draft'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
