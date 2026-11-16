import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Terminal,
  User,
  MapPin,
} from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = `/audit-logs?search=${search}`;
      if (actionFilter) url += `&action=${actionFilter}`;
      const res = await api.get(url);
      setLogs(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold font-serif text-navy-900">Activity & Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete organizational audit trail recording authenticated operations, approvals, and system state transitions.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search action, user, or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-mono"
        >
          <option value="">All Audit Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
          <option value="CHECK_IN">CHECK_IN</option>
          <option value="CHECK_OUT">CHECK_OUT</option>
          <option value="CREATE_TASK">CREATE_TASK</option>
          <option value="REVIEW_TASK">REVIEW_TASK</option>
          <option value="CREATE_DOCUMENT">CREATE_DOCUMENT</option>
          <option value="SAVE_EOM_REPORT">SAVE_EOM_REPORT</option>
          <option value="APPROVE_EOM_REPORT">APPROVE_EOM_REPORT</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Authenticated User</th>
                <th className="py-3 px-3">Audit Action</th>
                <th className="py-3 px-3">Entity Type</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-3 font-mono">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">No audit events found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-navy-900">{log.user?.name || 'System Guest'}</div>
                      <div className="text-[10px] text-slate-400">{log.user?.email || 'API Service'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-navy-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {log.entity_type ? `${log.entity_type} #${log.entity_id || ''}` : '&mdash;'}
                    </td>
                    <td className="py-3 px-4 max-w-xs font-mono text-[10px] text-slate-600 truncate">
                      {log.details ? JSON.stringify(log.details) : 'None'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
