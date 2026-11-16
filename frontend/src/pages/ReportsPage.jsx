import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { Logo } from '../components/Logo';
import {
  FileCheck,
  Download,
  Printer,
  Send,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  Eye,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Save,
  Check,
} from 'lucide-react';

export const ReportsPage = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [reports, setReports] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branch_id || 1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Generated Report Data
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [operationalHighlights, setOperationalHighlights] = useState('');
  const [managerClosingRemarks, setManagerClosingRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  // Senior Admin Approval Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [adminFeedback, setAdminFeedback] = useState('');

  const fetchExistingReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data.reports || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    api.get('/branches').then((res) => {
      setBranches(res.data.branches || []);
      if (res.data.branches?.length > 0 && !user?.branch_id) {
        setSelectedBranchId(res.data.branches[0].id);
      }
    });
    fetchExistingReports();
  }, []);

  const handleGeneratePreview = async () => {
    try {
      setLoading(true);
      setAlertMsg({ text: '', type: '' });
      const res = await api.get(`/reports/generate?branch_id=${selectedBranchId}&month=${selectedMonth}&year=${selectedYear}`);
      setPreviewData(res.data);
      setOperationalHighlights(
        `High volume of corporate conveyancing and litigation matters processed in ${res.data.period?.month_name}. Total attendance turnout maintained at ${res.data.branch_summary?.present_rate}%.`
      );
      setManagerClosingRemarks(
        `All statutory court limitation dates complied with zero defaults. Commendable diligence exhibited by team associates.`
      );
    } catch (e) {
      setAlertMsg({ text: 'Failed to generate report from live database.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async (status) => {
    if (!previewData) return;
    setActionLoading(true);
    try {
      const payload = {
        branch_id: selectedBranchId,
        report_month: selectedMonth,
        report_year: selectedYear,
        status: status, // 'Draft' or 'Submitted'
        operational_highlights: operationalHighlights,
        manager_remarks: managerClosingRemarks,
        employee_reports: previewData.employee_reports,
      };

      const res = await api.post('/reports', payload);
      setAlertMsg({
        text: `EOM Report ${status === 'Submitted' ? 'submitted to Senior Admin for approval.' : 'saved as Draft.'}`,
        type: 'success',
      });
      fetchExistingReports();
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Failed to save report.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveReport = async (status) => {
    if (!selectedReportId) return;
    setActionLoading(true);
    try {
      await api.post(`/reports/${selectedReportId}/approve`, {
        status,
        admin_feedback: adminFeedback,
      });
      setAlertMsg({ text: `EOM Report marked as ${status}.`, type: 'success' });
      setApproveModalOpen(false);
      setSelectedReportId(null);
      setAdminFeedback('');
      fetchExistingReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve report.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async (reportId) => {
    try {
      const token = localStorage.getItem('aav_token');
      window.open(`${API_BASE_URL}/reports/${reportId}/pdf?token=${token}`, '_blank');
    } catch (e) {
      alert('Could not download PDF.');
    }
  };

  const handleDownloadExcel = async (reportId) => {
    try {
      const token = localStorage.getItem('aav_token');
      window.open(`${API_BASE_URL}/reports/${reportId}/excel?token=${token}`, '_blank');
    } catch (e) {
      alert('Could not download Excel.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold font-serif text-navy-900">Automatic End-of-Month (EOM) Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Official monthly legal operations appraisal, associate productivity indices, and executive approval snapshots.
          </p>
        </div>

        {previewData && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-navy-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={() => handleSaveReport('Draft')}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            >
              <Save className="w-4 h-4" /> Save as Draft
            </button>
            <button
              onClick={() => handleSaveReport('Submitted')}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
            >
              <Send className="w-4 h-4 text-gold-400" /> Submit for Senior Review
            </button>
          </div>
        )}
      </div>

      {alertMsg.text && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between shadow-subtle no-print ${alertMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg({ text: '', type: '' })} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
      )}

      {/* Generator Configuration Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-wrap items-end gap-4 no-print">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Chambers Branch</label>
          <select
            value={selectedBranchId}
            disabled={!isAdmin && user?.branch_id}
            onChange={(e) => setSelectedBranchId(parseInt(e.target.value, 10))}
            className="text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium min-w-[200px]"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reporting Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reporting Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-mono"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        <button
          onClick={handleGeneratePreview}
          disabled={loading}
          className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
        >
          <FileCheck className="w-4 h-4 text-gold-400" />
          {loading ? 'Synthesizing Data...' : 'Compile Live EOM Report'}
        </button>
      </div>

      {/* Persisted Historical Reports Drawer / Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 font-serif">
              Persisted Historical EOM Snapshots
            </h2>
            <p className="text-[11px] text-slate-500">Official monthly filings preserved with immutability</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Period</th>
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3 text-center">Turnout Rate</th>
                <th className="py-2.5 px-3 text-center">Tasks (Done/All)</th>
                <th className="py-2.5 px-3 text-center">Branch Performance</th>
                <th className="py-2.5 px-3">Approval Status</th>
                <th className="py-2.5 px-4 text-right">Exports & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">No monthly snapshots filed yet.</td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-navy-900">
                      {new Date(r.report_year, r.report_month - 1, 1).toLocaleString('default', { month: 'short' })} {r.report_year}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{r.branch?.name}</td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-semibold">{r.present_rate}%</td>
                    <td className="py-3 px-3 text-center font-mono">{r.tasks_completed} / {r.tasks_assigned}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700">{r.average_performance_score} / 100</td>
                    <td className="py-3 px-3">
                      <Badge variant={r.status} size="xs">{r.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadPdf(r.id)}
                          className="p-1.5 text-navy-900 hover:text-gold-600 hover:bg-slate-100 rounded transition-colors"
                          title="Download Formatted PDF"
                        >
                          <FileText className="w-4 h-4 text-rose-700" />
                        </button>
                        <button
                          onClick={() => handleDownloadExcel(r.id)}
                          className="p-1.5 text-navy-900 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
                          title="Export CSV / Spreadsheet"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                        </button>

                        {isAdmin && r.status === 'Submitted' && (
                          <button
                            onClick={() => {
                              setSelectedReportId(r.id);
                              setApproveModalOpen(true);
                            }}
                            className="px-2 py-1 bg-navy-900 text-white rounded text-[10px] font-semibold hover:bg-navy-800"
                          >
                            Review & Seal
                          </button>
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

      {/* Official Formatted EOM Report Document (Matches PDF / Print Template) */}
      {previewData && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 md:p-10 space-y-6 print-page">
          {/* Document Header */}
          <div className="border-b-2 border-gold-400 pb-4 flex items-start justify-between">
            <div>
              <Logo size="md" light={false} showTagline={true} />
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-navy-900 font-serif uppercase tracking-wider">
                End-of-Month Performance Report
              </div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                Period: <strong className="text-navy-900">{previewData.period?.month_name}</strong>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Chambers: {previewData.branch?.name} ({previewData.branch?.code})
              </div>
            </div>
          </div>

          {/* Operational Metrics Banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Chambers Location</span>
              <div className="font-bold text-navy-900 mt-0.5">{previewData.branch?.city}, Tamil Nadu</div>
              <div className="text-[10px] text-slate-500">{previewData.period?.eligible_working_days} Eligible Working Days</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Staff & Turnout</span>
              <div className="font-bold text-navy-900 mt-0.5">{previewData.branch_summary?.total_employees} Active Associates</div>
              <div className="text-[10px] text-emerald-600 font-bold">{previewData.branch_summary?.present_rate}% Turnout Rate</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Legal Deliverables</span>
              <div className="font-bold text-navy-900 mt-0.5">
                {previewData.branch_summary?.tasks_completed} / {previewData.branch_summary?.tasks_assigned} Tasks Completed
              </div>
              <div className="text-[10px] text-slate-600">{previewData.branch_summary?.documents_completed} Docs Executed</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Chambers Index Score</span>
              <div className="text-xl font-bold text-emerald-700 mt-0.5">
                {previewData.branch_summary?.average_performance_score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
              <div className="text-[10px] text-slate-500">Firm Evaluation Model</div>
            </div>
          </div>

          {/* Operational Highlights & Remarks */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider font-serif border-l-4 border-gold-400 pl-2">
              Monthly Operational Highlights & Practice Commentary
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Operational Highlights:</label>
                <textarea
                  rows={2}
                  value={operationalHighlights}
                  onChange={(e) => setOperationalHighlights(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Branch Partner's Closing Review:</label>
                <textarea
                  rows={2}
                  value={managerClosingRemarks}
                  onChange={(e) => setManagerClosingRemarks(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Associate Productivity & Quality Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider font-serif border-l-4 border-gold-400 pl-2">
              Associate Productivity & Evaluation Ledger
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-navy-900 text-white text-[10px] font-semibold uppercase tracking-wider">
                    <th className="py-2 px-3">Emp ID</th>
                    <th className="py-2 px-3">Associate</th>
                    <th className="py-2 px-3">Practice Role</th>
                    <th className="py-2 px-2 text-center">Att. %</th>
                    <th className="py-2 px-2 text-center">Tasks (Done/All)</th>
                    <th className="py-2 px-2 text-center">Docs</th>
                    <th className="py-2 px-2 text-center">Quality</th>
                    <th className="py-2 px-3 text-right">Performance Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.employee_reports?.map((emp) => (
                    <tr key={emp.employee_id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-navy-900">{emp.employee_code}</td>
                      <td className="py-2.5 px-3 font-semibold text-navy-900">{emp.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{emp.designation}</td>
                      <td className="py-2.5 px-2 text-center">{emp.attendance_percentage}%</td>
                      <td className="py-2.5 px-2 text-center font-mono">{emp.tasks_completed} / {emp.tasks_assigned}</td>
                      <td className="py-2.5 px-2 text-center">{emp.documents_completed}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700">{emp.work_quality_score}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{emp.overall_performance_score} / 100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Qualitative Appraisals Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider font-serif border-l-4 border-gold-400 pl-2">
              Qualitative Associate Assessments
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {previewData.employee_reports?.map((emp) => (
                <div key={emp.employee_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-navy-900 mb-1">{emp.name} ({emp.employee_code})</div>
                  <div className="text-[11px] text-slate-600 mb-1">
                    <strong>Achievements:</strong> {emp.key_achievements}
                  </div>
                  <div className="text-[11px] text-slate-600 mb-1">
                    <strong>Strengths:</strong> {emp.strengths}
                  </div>
                  <div className="text-[11px] text-slate-700 italic">
                    <strong>Review:</strong> "{emp.manager_remarks}"
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Signatures Section */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
            <div className="border-t border-navy-900 pt-2">
              <div className="font-bold text-navy-900 font-serif">Branch Head / Principal Partner</div>
              <div className="text-slate-600 text-[11px]">{previewData.branch?.name}</div>
              <div className="text-slate-400 text-[10px] mt-1">Date: {format(new Date(), 'dd MMMM yyyy')}</div>
            </div>

            <div className="border-t border-navy-900 pt-2 text-right">
              <div className="font-bold text-navy-900 font-serif">Senior Managing Partner</div>
              <div className="text-slate-600 text-[11px]">AAV PARTNERS Executive Council</div>
              <div className="text-slate-400 text-[10px] mt-1">Official Legal Seal</div>
            </div>
          </div>
        </div>
      )}

      {/* Senior Admin Review Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Senior Admin EOM Report Authorization"
        subtitle="Formal ratification of branch performance snapshot"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Senior Admin Executive Commentary</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Approved by Senior Partner. Impressive efficiency metrics and spotless audit trail."
              value={adminFeedback}
              onChange={(e) => setAdminFeedback(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleApproveReport('Rejected')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold transition-colors"
            >
              Reject / Return for Revision
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleApproveReport('Approved')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Approve & Ratify Report
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
