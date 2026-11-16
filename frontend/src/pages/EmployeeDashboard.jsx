import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  CalendarCheck,
  FileSpreadsheet,
  CheckSquare,
  CalendarDays,
  FileText,
  AlertCircle,
  TrendingUp,
  Star,
  ChevronRight,
  Send,
  BellRing,
} from 'lucide-react';
import { format } from 'date-fns';

export const EmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Quick Work Log Modal State
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [workCategory, setWorkCategory] = useState('Drafting');
  const [timeSpent, setTimeSpent] = useState('120');
  const [workStatus, setWorkStatus] = useState('In Progress');
  const [remarks, setRemarks] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/employee');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => {
      api.get('/dashboard/employee').then((res) => setData(res.data)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      setMsg({ text: '', type: '' });
      const res = await api.post('/attendance/check-in');
      setMsg({ text: res.data.message, type: 'success' });
      fetchDashboard();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || 'Check-in failed.',
        type: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      setMsg({ text: '', type: '' });
      const res = await api.post('/attendance/check-out');
      setMsg({ text: res.data.message, type: 'success' });
      fetchDashboard();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || 'Check-out failed.',
        type: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitWorkLog = async (e, isDraft = false) => {
    if (e?.preventDefault) e.preventDefault();
    try {
      setActionLoading(true);
      await api.post('/work-logs', {
        work_date: format(new Date(), 'yyyy-MM-dd'),
        task_title: taskTitle,
        task_description: taskDescription,
        work_category: workCategory,
        time_spent_minutes: parseInt(timeSpent, 10),
        work_status: isDraft ? 'Draft' : workStatus,
        employee_remarks: remarks,
        is_draft: isDraft,
      });
      setMsg({
        text: isDraft ? 'Daily work entry saved as Draft.' : 'Daily work log submitted for partner review.',
        type: 'success',
      });
      setWorkModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setRemarks('');
      fetchDashboard();
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit work log.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const employee = data?.employee || {};
  const attendance = data?.attendance_today || {};
  const tasksKpi = data?.tasks_kpi || {};
  const upcomingTasks = data?.upcoming_tasks || [];
  const feedback = data?.recent_feedback || {};
  const todayWorkLogs = data?.today_work_logs || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Alert message if any */}
      {msg.text && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-subtle ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{msg.text}</span>
          </div>
          <button onClick={() => setMsg({ text: '', type: '' })} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-card border border-navy-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold-400 font-semibold">
            {employee.branch_name} &bull; Associate Portal
          </div>
          <h1 className="text-2xl font-bold font-serif text-white mt-1">
            Welcome, {employee.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            <span className="font-mono bg-navy-800 text-gold-300 px-2 py-0.5 rounded mr-2 font-semibold">
              {employee.employee_id}
            </span>
            {employee.designation} &mdash; {employee.department}
          </p>
        </div>

        {/* Live Attendance Clock & Action Buttons */}
        <div className="bg-navy-950/70 p-4 rounded-xl border border-navy-800 flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <div className="text-center sm:text-left">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Today's Attendance</div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={attendance.status} size="sm">{attendance.status}</Badge>
              {attendance.working_hours > 0 && (
                <span className="text-xs font-mono text-gold-300 font-bold">
                  {attendance.working_hours} hrs
                </span>
              )}
            </div>
            {attendance.check_in && (
              <div className="text-[10px] text-slate-400 mt-1">
                In: <span className="text-white font-mono">{attendance.check_in}</span>
                {attendance.check_out && <span> &bull; Out: <span className="text-white font-mono">{attendance.check_out}</span></span>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!attendance.has_checked_in ? (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" /> Check In
              </button>
            ) : !attendance.has_checked_out ? (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" /> Check Out
              </button>
            ) : (
              <div className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Completed Today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/attendance"
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle hover:border-gold-400 hover:bg-gold-50/20 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-900 group-hover:bg-navy-900 group-hover:text-gold-400 transition-colors flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-navy-900">Attendance</div>
            <div className="text-[10px] text-slate-500">History & Corrections</div>
          </div>
        </Link>

        <button
          onClick={() => setWorkModalOpen(true)}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle hover:border-gold-400 hover:bg-gold-50/20 transition-all flex items-center gap-3 group text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-900 group-hover:bg-navy-900 group-hover:text-gold-400 transition-colors flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-navy-900">Submit Work Log</div>
            <div className="text-[10px] text-slate-500">Daily reporting</div>
          </div>
        </button>

        <Link
          to="/tasks"
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle hover:border-gold-400 hover:bg-gold-50/20 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-900 group-hover:bg-navy-900 group-hover:text-gold-400 transition-colors flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-navy-900">My Tasks</div>
            <div className="text-[10px] text-slate-500">{tasksKpi.pending || 0} active matters</div>
          </div>
        </Link>

        <Link
          to="/leaves"
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle hover:border-gold-400 hover:bg-gold-50/20 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-900 group-hover:bg-navy-900 group-hover:text-gold-400 transition-colors flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-navy-900">Apply Leave</div>
            <div className="text-[10px] text-slate-500">{employee.leave_balance?.casual || 0} CL available</div>
          </div>
        </Link>
      </div>

      {/* Metrics Row: Tasks & Leave Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Task Counters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Briefs</span>
            <div className="text-2xl font-bold text-navy-900 mt-0.5">{tasksKpi.assigned || 0}</div>
            <div className="text-[10px] text-slate-500 mt-1">Total matters allocated</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-navy-50 text-navy-800 flex items-center justify-center font-bold">
            <CheckSquare className="w-5 h-5 text-navy-700" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Completed Matters</span>
            <div className="text-2xl font-bold text-emerald-700 mt-0.5">{tasksKpi.completed || 0}</div>
            <div className="text-[10px] text-emerald-600 mt-1">Accepted by Partner</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Leave Balances Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Leave Entitlement</span>
            <CalendarDays className="w-4 h-4 text-gold-600" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
              <div className="text-xs font-bold text-navy-900">{employee.leave_balance?.casual || 0}</div>
              <div className="text-[9px] text-slate-500">Casual</div>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
              <div className="text-xs font-bold text-navy-900">{employee.leave_balance?.sick || 0}</div>
              <div className="text-[9px] text-slate-500">Sick</div>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
              <div className="text-xs font-bold text-navy-900">{employee.leave_balance?.emergency || 0}</div>
              <div className="text-[9px] text-slate-500">Emergency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Assigned Tasks & Partner Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Tasks & Deadlines */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 font-serif">
                Active Briefs & Upcoming Deadlines
              </h2>
            </div>
            <Link to="/tasks" className="text-xs text-gold-600 hover:text-gold-700 font-medium">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No active tasks pending.</div>
            ) : (
              upcomingTasks.map((t) => (
                <div key={t.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">{t.task_id}</span>
                      <Badge variant={t.priority} size="xs">{t.priority}</Badge>
                      {t.histories?.some(h => h.action === 'Update Requested by Management') && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          <BellRing className="w-2.5 h-2.5 text-amber-600" /> Update Requested
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-navy-900 mt-1 line-clamp-1">{t.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Deadline: <strong className="text-rose-700">{t.deadline}</strong>
                    </div>
                  </div>
                  <Link
                    to="/tasks"
                    className="px-2.5 py-1 text-[11px] font-medium text-navy-900 bg-slate-100 hover:bg-navy-900 hover:text-white rounded transition-colors shrink-0"
                  >
                    Update
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manager Feedback & Performance Overview */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 font-serif">
                  Partner Appraisal & Feedback
                </h2>
              </div>
              {feedback.score && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Rating: {feedback.score} / 100
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="bg-gold-50/40 border border-gold-200/70 rounded-lg p-3 text-xs">
                <div className="font-bold text-navy-900 mb-1 text-[11px] uppercase tracking-wider">
                  Partner Assessment Remarks:
                </div>
                <p className="text-slate-700 italic">
                  "{feedback.monthly_remarks || 'Consistent precision in legal drafting and adherence to statutory court timelines. Continue upholding this high standard.'}"
                </p>
              </div>

              {/* Recent Review Ratings */}
              <div className="text-xs">
                <span className="font-bold text-slate-700 block mb-1 text-[11px]">Recent Task Quality Reviews:</span>
                <div className="space-y-1.5">
                  {feedback.reviews?.map((r) => (
                    <div key={r.id} className="p-2 bg-slate-50 rounded border border-slate-200/60 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-navy-900 line-clamp-1">{r.task?.title}</span>
                        <span className="text-[10px] text-slate-500">{r.remarks}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-gold-500 shrink-0">
                        {[...Array(r.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-gold-400" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
            <Link
              to="/performance"
              className="text-xs font-semibold text-gold-700 hover:text-gold-800 flex items-center justify-end gap-1"
            >
              View Full Performance Breakdown <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Submitted Work Entries */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 font-serif">
            Today's Submitted Work Sheet Logs
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Total entries: {todayWorkLogs.length}
          </span>
        </div>

        {todayWorkLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            No work logs logged for today yet. Use the "Submit Work Log" button above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todayWorkLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-navy-900">{log.task_title}</div>
                  <div className="text-[10px] text-slate-500">
                    Category: <span className="font-medium text-slate-700">{log.work_category}</span> &bull; {log.time_spent_minutes} mins &bull; Status: {log.work_status}
                  </div>
                </div>
                <Badge variant={log.manager_status} size="xs">{log.manager_status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Daily Work Log Modal */}
      <Modal
        isOpen={workModalOpen}
        onClose={() => setWorkModalOpen(false)}
        title="Submit Daily Legal Activity"
        subtitle="Log activity details for Partner review"
      >
        <form onSubmit={handleSubmitWorkLog} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Task Title / Brief Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Drafting Writ Petition WP(MD) 4412/2026 Counter"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Work Category</label>
              <select
                value={workCategory}
                onChange={(e) => setWorkCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              >
                <option value="Drafting">Drafting (Pleadings/Contracts)</option>
                <option value="Case Research">Case Law Research</option>
                <option value="Client Consultation">Client Consultation</option>
                <option value="Court Appearance">Court Appearance / Hearing</option>
                <option value="Filing & Scrutiny">Registry Filing & Scrutiny</option>
                <option value="Administrative">Legal Administration</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Time Spent (Minutes)</label>
              <input
                type="number"
                min="10"
                max="720"
                required
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Activity Description</label>
            <textarea
              rows={3}
              required
              placeholder="Summarize specific statutes studied, clauses drafted, or court arguments made..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Current Work Status</label>
              <select
                value={workStatus}
                onChange={(e) => setWorkStatus(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Submitted for Review">Submitted for Review</option>
                <option value="Pending">Pending Instructions</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Employee Remarks</label>
              <input
                type="text"
                placeholder="Optional notes or pending bottlenecks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setWorkModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={(e) => handleSubmitWorkLog(e, true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={(e) => handleSubmitWorkLog(e, false)}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-gold-400" />
              {actionLoading ? 'Saving...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
