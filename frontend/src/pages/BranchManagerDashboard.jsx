import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Badge } from '../components/Badge';
import {
  Building2,
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  FileCheck,
  AlertCircle,
  Eye,
  PlusCircle,
  Filter,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const BranchManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchManagerDashboard();
    const interval = setInterval(() => {
      api.get('/dashboard/manager').then((res) => setData(res.data)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchManagerDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/manager');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load manager dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  const branch = data?.branch || {};
  const kpis = data?.kpis || {};
  const employees = data?.employee_activity_table || [];
  const pendingDocs = data?.pending_documents || [];

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart data for team task completion
  const taskChartData = employees.map((emp) => ({
    name: emp.name.split(' ')[1] || emp.name,
    Assigned: emp.tasks_assigned,
    Completed: emp.tasks_completed,
  }));

  return (
    <div className="space-y-8">
      {/* Branch Header */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-card border border-navy-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-gold-400/20 text-gold-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gold-400/40">
              Branch Operational Console
            </span>
            <span className="text-xs text-slate-300">Code: {branch.code}</span>
          </div>
          <h1 className="text-2xl font-bold font-serif mt-1 text-white">{branch.name}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Chambers hours: {branch.work_start_time ? branch.work_start_time.substring(0, 5) : '10:00'} &mdash; {branch.work_end_time ? branch.work_end_time.substring(0, 5) : '18:00'} &bull; Tirunelveli High Ground
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-navy-950 bg-gold-400 hover:bg-gold-300 rounded-lg shadow-sm transition-all"
          >
            <FileCheck className="w-4 h-4" />
            Generate EOM Report
          </Link>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-navy-800 hover:bg-navy-700 border border-navy-700 rounded-lg shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 text-gold-400" />
            Assign Task
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Present Today */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Present</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{kpis.present_today}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">out of {kpis.total_employees} staff</div>
        </div>

        {/* Absent */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Absent</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{kpis.absent_today}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">unplanned absence</div>
        </div>

        {/* On Leave */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">On Leave</span>
            <CalendarDays className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">{kpis.on_leave}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">approved requests</div>
        </div>

        {/* Tasks Pending */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Tasks Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{kpis.tasks_pending}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{kpis.tasks_completed} completed</div>
        </div>

        {/* Docs Awaiting Review */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Docs In Review</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{kpis.documents_awaiting_review}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{kpis.documents_in_progress} in progress</div>
        </div>

        {/* Pending Leave Approvals */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Leave Approvals</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-navy-900">{kpis.pending_leave_approvals}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">action required</div>
        </div>
      </div>

      {/* Main Section: Live Employee Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
              Today's Associate Activity & Attendance
            </h2>
            <p className="text-xs text-slate-500">Live check-in times and current legal work engagements</p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search associate or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Associate</th>
                <th className="py-2.5 px-3">Check-In</th>
                <th className="py-2.5 px-3">Check-Out</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Tasks (Done/All)</th>
                <th className="py-2.5 px-4">Current Work Activity</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-navy-900">{emp.name}</div>
                    <div className="text-[10px] text-slate-500">
                      <span className="font-mono text-slate-600 font-semibold">{emp.employee_id}</span> &bull; {emp.designation}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {emp.check_in || <span className="text-slate-400">&mdash;</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {emp.check_out || <span className="text-slate-400">&mdash;</span>}
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={emp.attendance_status} size="xs">{emp.attendance_status}</Badge>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-semibold text-emerald-700">{emp.tasks_completed}</span>
                    <span className="text-slate-400 font-normal"> / {emp.tasks_assigned}</span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                    {emp.current_activity}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/employees`}
                      className="inline-flex items-center gap-1 text-[11px] text-navy-800 hover:text-gold-600 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Task Progress Chart & Pending Documents List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Progress Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
                Branch Task Allocation & Progress
              </h2>
              <p className="text-xs text-slate-500">Associate workload distribution</p>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#627D98' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#627D98' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#172D43', color: '#FFFFFF', borderRadius: '8px', border: '1px solid #243B53', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
                  itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                  labelStyle={{ color: '#C5A36B', fontWeight: 'bold' }}
                />
                <Bar dataKey="Assigned" name="Assigned Tasks" fill="#243B53" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" name="Completed Tasks" fill="#168653" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Documents List */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
                Critical Legal Documents in Workflow
              </h2>
              <p className="text-xs text-slate-500">Awaiting partner review or client execution</p>
            </div>
            <Link to="/documents" className="text-xs text-gold-600 hover:text-gold-700 font-medium">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingDocs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No documents in review.</div>
            ) : (
              pendingDocs.map((doc) => (
                <div key={doc.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-slate-500">{doc.reference_number}</span>
                      <Badge variant={doc.priority} size="xs">{doc.priority}</Badge>
                    </div>
                    <div className="text-xs font-semibold text-navy-900 mt-0.5 line-clamp-1">{doc.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Assigned: <span className="font-medium text-slate-700">{doc.assignee?.first_name} {doc.assignee?.last_name}</span> &bull; Due: {doc.due_date}
                    </div>
                  </div>
                  <Badge variant={doc.status} size="xs">{doc.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
