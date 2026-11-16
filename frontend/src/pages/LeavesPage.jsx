import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  CalendarDays,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Calendar,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';

export const LeavesPage = () => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Apply Modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leave_type_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  // Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [managerRemarks, setManagerRemarks] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      let url = `/leaves?`;
      if (statusFilter) url += `status=${statusFilter}`;
      const res = await api.get(url);
      setLeaves(res.data.leave_requests || []);
      setSummary(res.data.summary || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  useEffect(() => {
    api.get('/leave-types').then((res) => {
      setLeaveTypes(res.data.leave_types || []);
      if (res.data.leave_types?.length > 0) {
        setLeaveForm((prev) => ({ ...prev, leave_type_id: res.data.leave_types[0].id }));
      }
    });
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/leaves', leaveForm);
      setAlertMsg({ text: 'Leave application submitted for approval.', type: 'success' });
      setApplyModalOpen(false);
      setLeaveForm({
        leave_type_id: leaveTypes[0]?.id || '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
      });
      fetchLeaves();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Failed to submit leave application.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewLeave = async (status) => {
    if (!selectedLeave) return;
    setActionLoading(true);
    try {
      await api.post(`/leaves/${selectedLeave.id}/review`, {
        status,
        manager_remarks: managerRemarks,
      });
      setAlertMsg({ text: `Leave application marked as ${status}.`, type: 'success' });
      setReviewModalOpen(false);
      setSelectedLeave(null);
      setManagerRemarks('');
      fetchLeaves();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review leave.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Cancel this pending leave application?')) return;
    try {
      await api.post(`/leaves/${id}/cancel`);
      setAlertMsg({ text: 'Leave application cancelled.', type: 'success' });
      fetchLeaves();
    } catch (e) {
      alert('Failed to cancel leave.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-navy-900">Leave Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Statutory leave entitlements, absence tracking, Sunday-excluded calculations, and partner authorizations.
          </p>
        </div>

        {isEmployee && (
          <button
            onClick={() => setApplyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            Apply For Leave
          </button>
        )}
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

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Applications</span>
          <div className="text-2xl font-bold text-navy-900 mt-1">{summary.total || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Pending Review</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">{summary.pending || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Approved Leaves</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{summary.approved || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Rejected</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">{summary.rejected || 0}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
          >
            <option value="">All Application Statuses</option>
            <option value="pending">Pending Partner Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Associate</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-3">Date Range</th>
                <th className="py-3 px-3 text-center">Days (excl. Sun)</th>
                <th className="py-3 px-4">Reason for Leave</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading leave records...</td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No leave applications found.</td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-navy-900">{leave.employee?.full_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{leave.employee?.employee_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-navy-900">{leave.leave_type?.name}</span>
                      <span className="text-[10px] block font-mono text-slate-500">{leave.leave_type?.code}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {leave.start_date ? format(new Date(leave.start_date.substring(0, 10) + 'T00:00:00'), 'dd MMM yyyy') : ''}
                      {leave.start_date?.substring(0, 10) !== leave.end_date?.substring(0, 10) && (
                        <span> &rarr; {leave.end_date ? format(new Date(leave.end_date.substring(0, 10) + 'T00:00:00'), 'dd MMM yyyy') : ''}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-navy-900">
                      {leave.days_count} day(s)
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      <div>{leave.reason}</div>
                      {leave.manager_remarks && (
                        <div className="mt-1 text-[10px] text-slate-500 bg-slate-50 p-1 rounded border border-slate-200">
                          <strong>Partner Note:</strong> {leave.manager_remarks}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={leave.status} size="xs">{leave.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isEmployee && leave.status === 'pending' && (
                        <button
                          onClick={() => handleCancelLeave(leave.id)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                        >
                          Cancel
                        </button>
                      )}

                      {(isAdmin || isManager) && leave.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setReviewModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply For Leave"
        subtitle="Sundays are automatically excluded; validates against remaining quota"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Leave Category</label>
            <select
              required
              value={leaveForm.leave_type_id}
              onChange={(e) => setLeaveForm({ ...leaveForm, leave_type_id: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium"
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.code}) &mdash; {t.days_per_year} days/yr</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={leaveForm.start_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">End Date</label>
              <input
                type="date"
                required
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Reason for Absence</label>
            <textarea
              rows={3}
              required
              placeholder="State reason for leave (medical, personal commitment, court seminar)..."
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
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
              {actionLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Authorise Associate Leave"
        subtitle={selectedLeave ? `Application from ${selectedLeave.employee?.full_name} for ${selectedLeave.days_count} day(s)` : ''}
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="text-slate-700"><strong>Type:</strong> {selectedLeave?.leave_type?.name}</div>
            <div className="text-slate-700 font-mono"><strong>Dates:</strong> {selectedLeave?.start_date} &rarr; {selectedLeave?.end_date}</div>
            <div className="text-slate-700"><strong>Reason:</strong> {selectedLeave?.reason}</div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Partner Remarks / Sanction Notes</label>
            <input
              type="text"
              placeholder="e.g. Approved. Briefs re-allocated to Meera Krishnan."
              value={managerRemarks}
              onChange={(e) => setManagerRemarks(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleReviewLeave('rejected')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold transition-colors"
            >
              Reject Application
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleReviewLeave('approved')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Approve Leave & Deduct Balance
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
