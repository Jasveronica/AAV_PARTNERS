import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  CalendarCheck,
  Clock,
  LogIn,
  LogOut,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileQuestion,
  UserCheck,
  Check,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

export const AttendancePage = () => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Corrections Tab / Review
  const [activeView, setActiveView] = useState('records'); // 'records' | 'corrections'
  const [corrections, setCorrections] = useState([]);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    requested_check_in: '10:00',
    requested_check_out: '18:00',
    requested_status: 'Present',
    reason: '',
  });

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [managerRemarks, setManagerRemarks] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let url = `/attendance?month=${selectedMonth}&year=${selectedYear}`;
      if (selectedDate) url += `&date=${selectedDate}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await api.get(url);
      setRecords(res.data.records || []);
      setSummary(res.data.summary || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCorrections = async () => {
    try {
      const res = await api.get('/attendance/corrections');
      setCorrections(res.data.corrections || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, statusFilter, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchCorrections();
  }, []);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/check-in');
      setAlertMsg({ text: res.data.message, type: 'success' });
      fetchAttendance();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Check-in failed.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/check-out');
      setAlertMsg({ text: res.data.message, type: 'success' });
      fetchAttendance();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Check-out failed.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestCorrection = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/attendance/corrections', correctionForm);
      setAlertMsg({ text: 'Attendance correction submitted for review.', type: 'success' });
      setCorrectionModalOpen(false);
      setCorrectionForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        requested_check_in: '10:00',
        requested_check_out: '18:00',
        requested_status: 'Present',
        reason: '',
      });
      fetchCorrections();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Failed to submit correction.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewCorrection = async (status) => {
    if (!selectedCorrection) return;
    setActionLoading(true);
    try {
      await api.post(`/attendance/corrections/${selectedCorrection.id}/review`, {
        status,
        manager_remarks: managerRemarks,
      });
      setAlertMsg({ text: `Correction request marked ${status}.`, type: 'success' });
      setReviewModalOpen(false);
      setSelectedCorrection(null);
      setManagerRemarks('');
      fetchCorrections();
      fetchAttendance();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review correction.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-navy-900">Attendance Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Chambers biometric logs, punctuality records, duration tracking, and verified correction workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEmployee && (
            <>
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" /> Check In
              </button>
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" /> Check Out
              </button>
              <button
                onClick={() => setCorrectionModalOpen(true)}
                className="px-3.5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
              >
                <FileQuestion className="w-4 h-4 text-gold-400" /> Request Correction
              </button>
            </>
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Records</div>
          <div className="text-2xl font-bold text-navy-900 mt-1">{summary.total_records || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Month: {selectedMonth}/{selectedYear}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Present Days</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{summary.total_present || 0}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Verified attendance</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Late Arrivals</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{summary.total_late || 0}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Past threshold grace</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="text-[10px] font-semibold text-navy-900 uppercase tracking-wider">Total Working Hours</div>
          <div className="text-2xl font-bold text-navy-900 mt-1">{summary.total_working_hours || 0} <span className="text-xs font-normal text-slate-500">hrs</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cumulative duration</div>
        </div>
      </div>

      {/* View Switcher: Attendance Logs vs Corrections */}
      <div className="flex border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveView('records')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-all ${
            activeView === 'records'
              ? 'border-navy-900 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Daily Attendance Logs
        </button>
        <button
          onClick={() => setActiveView('corrections')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeView === 'corrections'
              ? 'border-navy-900 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Correction Requests
          {corrections.filter(c => c.status === 'pending').length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {corrections.filter(c => c.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {activeView === 'records' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
                <option value="Approved Leave">Approved Leave</option>
                <option value="Weekly Off">Weekly Off</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-mono"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Associate</th>
                    <th className="py-3 px-3">Check In</th>
                    <th className="py-3 px-3">Check Out</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4">Notes / Biometrics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">Loading attendance records...</td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">No attendance records found.</td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-navy-900">
                          {r.date ? format(new Date(r.date.substring(0, 10) + 'T00:00:00'), 'dd MMM yyyy') : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-navy-900">{r.employee?.full_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{r.employee?.employee_id}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {r.check_in ? r.check_in.substring(0, 5) : <span className="text-slate-400">&mdash;</span>}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {r.check_out ? r.check_out.substring(0, 5) : <span className="text-slate-400">&mdash;</span>}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-navy-900">
                          {r.working_hours > 0 ? `${r.working_hours} hrs` : <span className="text-slate-400">&mdash;</span>}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={r.status} size="xs">{r.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                          {r.notes || (r.check_in_ip ? `IP: ${r.check_in_ip}` : 'Regular entry')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Correction Requests View */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Associate</th>
                  <th className="py-3 px-3">Requested In / Out</th>
                  <th className="py-3 px-3">Requested Status</th>
                  <th className="py-3 px-4">Reason for Correction</th>
                  <th className="py-3 px-3">Status</th>
                  {(isAdmin || isManager) && <th className="py-3 px-4 text-right">Review Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {corrections.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">No correction requests found.</td>
                  </tr>
                ) : (
                  corrections.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-navy-900">
                        {c.date ? format(new Date(c.date.substring(0, 10) + 'T00:00:00'), 'dd MMM yyyy') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-navy-900">{c.employee?.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{c.employee?.employee_id}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {c.requested_check_in ? c.requested_check_in.substring(0, 5) : 'N/A'} &mdash; {c.requested_check_out ? c.requested_check_out.substring(0, 5) : 'N/A'}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">{c.requested_status || 'Present'}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">{c.reason}</td>
                      <td className="py-3 px-3">
                        <Badge variant={c.status} size="xs">{c.status}</Badge>
                      </td>
                      {(isAdmin || isManager) && (
                        <td className="py-3 px-4 text-right">
                          {c.status === 'pending' ? (
                            <button
                              onClick={() => {
                                setSelectedCorrection(c);
                                setReviewModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded text-[11px] font-semibold transition-colors"
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Reviewed by {c.reviewer?.name || 'Manager'}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Correction Modal */}
      <Modal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        title="Request Attendance Correction"
        subtitle="Submit missed biometric or out-of-office client conference log"
      >
        <form onSubmit={handleRequestCorrection} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Date Requiring Correction</label>
            <input
              type="date"
              required
              value={correctionForm.date}
              onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Requested Check-In</label>
              <input
                type="time"
                value={correctionForm.requested_check_in}
                onChange={(e) => setCorrectionForm({ ...correctionForm, requested_check_in: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Requested Check-Out</label>
              <input
                type="time"
                value={correctionForm.requested_check_out}
                onChange={(e) => setCorrectionForm({ ...correctionForm, requested_check_out: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Reason for Exception</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Attended client conference at District Court before reaching chambers..."
              value={correctionForm.reason}
              onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCorrectionModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
            >
              {actionLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manager Review Correction Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Attendance Correction"
        subtitle={selectedCorrection ? `Submitted by ${selectedCorrection.employee?.full_name} for ${selectedCorrection.date}` : ''}
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <div>
              <span className="font-bold text-navy-900">Reason Stated:</span>
              <p className="text-slate-700 mt-0.5">{selectedCorrection?.reason}</p>
            </div>
            <div className="flex gap-4 pt-1 font-mono text-[11px] text-slate-600">
              <span>Req In: <strong>{selectedCorrection?.requested_check_in || 'N/A'}</strong></span>
              <span>Req Out: <strong>{selectedCorrection?.requested_check_out || 'N/A'}</strong></span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Manager Remarks / Verification Note</label>
            <input
              type="text"
              placeholder="e.g. Verified with court appearance cause list. Approved."
              value={managerRemarks}
              onChange={(e) => setManagerRemarks(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleReviewCorrection('rejected')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold transition-colors"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleReviewCorrection('approved')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Approve & Update Attendance
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
