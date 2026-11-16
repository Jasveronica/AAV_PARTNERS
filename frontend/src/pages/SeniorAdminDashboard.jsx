import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Badge } from '../components/Badge';
import {
  Building2,
  Users,
  UserCheck,
  UserX,
  CheckCircle2,
  Clock,
  CalendarDays,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Shield,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const SeniorAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => {
      api.get('/dashboard/admin').then((res) => setData(res.data)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load senior admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-80 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const branches = data?.branches || [];
  const activities = data?.recent_activities || [];
  const deadlines = data?.upcoming_deadlines || [];
  const pendingReports = data?.pending_eom_reports || [];

  // Data for Branch Attendance Comparison Chart
  const branchAttendanceData = branches.map((b) => ({
    name: b.name.replace(' Branch', '').replace(' Chambers', ''),
    AttendanceRate: b.attendance_rate,
    TaskCompletion: b.task_completion_rate,
  }));

  // Task distribution data
  const taskStatusData = [
    { name: 'Completed', value: kpis.completed_tasks, color: '#168653' },
    { name: 'Pending Review / Active', value: kpis.pending_tasks, color: '#D69E36' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-navy-900">Organisation Operations Overview</h1>
            <span className="bg-gold-100 text-gold-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-gold-300">
              Senior Management
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-branch firm metrics, compliance indicators, and operational telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg shadow-sm transition-all"
          >
            <FileCheck className="w-4 h-4 text-gold-400" />
            Review EOM Reports
          </Link>
          <Link
            to="/branches"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-navy-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-all"
          >
            <Building2 className="w-4 h-4 text-navy-700" />
            Manage Branches
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Branches */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle hover:border-gold-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Branches</span>
            <Building2 className="w-4 h-4 text-navy-700" />
          </div>
          <div className="text-2xl font-bold text-navy-900">{kpis.total_branches}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>Tirunelveli & Madurai</span>
          </div>
        </div>

        {/* Total Employees */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle hover:border-gold-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Associates</span>
            <Users className="w-4 h-4 text-navy-700" />
          </div>
          <div className="text-2xl font-bold text-navy-900">{kpis.total_employees}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active advocates & paralegals</div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Present Today</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{kpis.employees_present_today}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {kpis.total_employees > 0 ? Math.round((kpis.employees_present_today / kpis.total_employees) * 100) : 0}% Turnout
          </div>
        </div>

        {/* Absent Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle hover:border-rose-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Absent / Off</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{kpis.employees_absent_today}</div>
          <div className="text-[11px] text-slate-500 mt-1">Includes approved leaves</div>
        </div>

        {/* Total Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle hover:border-gold-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-navy-700" />
          </div>
          <div className="text-2xl font-bold text-navy-900">{kpis.total_tasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all legal briefs</div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{kpis.completed_tasks}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {kpis.total_tasks > 0 ? Math.round((kpis.completed_tasks / kpis.total_tasks) * 100) : 0}% Completion
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Tasks</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{kpis.pending_tasks}</div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">Awaiting review or drafting</div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Leave Requests</span>
            <CalendarDays className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-navy-900">{kpis.pending_leave_requests}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending approval</div>
        </div>
      </div>

      {/* Analytics & Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Attendance & Task Completion Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider font-serif">
                Branch Performance & Attendance Comparison
              </h2>
              <p className="text-xs text-slate-500">Live comparison across firm branches</p>
            </div>
            <span className="text-xs text-gold-600 font-semibold bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
              Benchmark: 90%+
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#627D98' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#627D98' }} unit="%" />
                <Tooltip
                  formatter={(val) => [`${val}%`, '']}
                  contentStyle={{ backgroundColor: '#172D43', color: '#FFFFFF', borderRadius: '8px', border: '1px solid #243B53', fontSize: '12px' }}
                  itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                  labelStyle={{ color: '#C5A36B', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="AttendanceRate" name="Attendance Rate" fill="#172D43" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TaskCompletion" name="Task Completion Rate" fill="#C5A36B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Allocation Breakdown Pie */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider font-serif mb-1">
              Task Completion Status
            </h2>
            <p className="text-xs text-slate-500 mb-4">Total active vs completed matters</p>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#172D43', color: '#FFFFFF', borderRadius: '8px', border: '1px solid #243B53', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
                  itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                  labelStyle={{ color: '#C5A36B', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span className="text-slate-600 font-medium">Done: {kpis.completed_tasks}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-600 font-medium">Active: {kpis.pending_tasks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Alert Banner (If Any EOM Reports Pending) */}
      {pendingReports.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Monthly EOM Reports Awaiting Senior Admin Review
              </div>
              <div className="text-xs text-amber-800">
                {pendingReports.length} branch report(s) submitted by branch managers require your formal review and seal.
              </div>
            </div>
          </div>
          <Link
            to="/reports"
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shrink-0"
          >
            Review & Seal Reports
          </Link>
        </div>
      )}

      {/* Two Column Grid: Upcoming Deadlines & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Court & Legal Deadlines */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-navy-900" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 font-serif">
                Imminent Case & Filing Deadlines
              </h2>
            </div>
            <Link to="/tasks" className="text-xs text-gold-600 hover:text-gold-700 font-medium flex items-center gap-0.5">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {deadlines.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No imminent deadlines.</div>
            ) : (
              deadlines.map((t) => (
                <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">{t.task_id}</span>
                      <Badge variant={t.priority} size="xs">{t.priority}</Badge>
                    </div>
                    <div className="text-xs font-semibold text-navy-900 mt-1 line-clamp-1">{t.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Assigned to: <span className="font-medium text-slate-700">{t.assignee?.first_name} {t.assignee?.last_name}</span> &bull; {t.branch?.name}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-rose-700">{t.deadline}</div>
                    <Badge variant={t.status} size="xs">{t.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Organization Audit & Activity Log */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-navy-900" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 font-serif">
                Recent Organizational Audit Events
              </h2>
            </div>
            <Link to="/audit-logs" className="text-xs text-gold-600 hover:text-gold-700 font-medium flex items-center gap-0.5">
              Full Log <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No recent activity recorded.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-navy-900">{act.user?.name || 'System Operator'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Executed action <strong className="font-mono text-navy-800">{act.action}</strong>
                      {act.entity_type && <span> on {act.entity_type}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
