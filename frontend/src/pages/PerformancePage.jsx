import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  TrendingUp,
  Star,
  CheckCircle2,
  Clock,
  FileCheck,
  Award,
  ChevronRight,
  Filter,
  Edit,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

export const PerformancePage = () => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [weights, setWeights] = useState({});
  const [loading, setLoading] = useState(true);

  // Month / Year filter
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Appraisal Feedback Modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    key_achievements: '',
    strengths: '',
    improvement_areas: '',
    manager_remarks: '',
    overall_review: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/performance?month=${month}&year=${year}`);
      setSummaries(res.data.summaries || []);
      setWeights(res.data.weights || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [month, year]);

  const openFeedbackModal = (summary) => {
    setSelectedSummary(summary);
    setFeedbackForm({
      key_achievements: summary.key_achievements || '',
      strengths: summary.strengths || '',
      improvement_areas: summary.improvement_areas || '',
      manager_remarks: summary.manager_remarks || '',
      overall_review: summary.overall_review || '',
    });
    setFeedbackModalOpen(true);
  };

  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    if (!selectedSummary) return;
    setActionLoading(true);
    try {
      await api.post(`/performance/${selectedSummary.id}/feedback`, feedbackForm);
      setAlertMsg({ text: 'Manager appraisal and feedback saved successfully.', type: 'success' });
      setFeedbackModalOpen(false);
      setSelectedSummary(null);
      fetchPerformance();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save feedback.');
    } finally {
      setActionLoading(false);
    }
  };

  // Bar chart data for scores comparison
  const comparisonData = summaries.map((s) => ({
    name: s.employee?.full_name ? s.employee.full_name.split(' ')[1] || s.employee.full_name : 'Staff',
    OverallScore: parseFloat(s.overall_performance_score),
    TaskScore: parseFloat(s.task_completion_score),
    QualityScore: parseFloat(s.work_quality_score),
    DeadlineScore: parseFloat(s.deadline_score),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-navy-900">Associate Performance Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Transparent multi-indicator evaluation based exclusively on verified legal deliverables, quality ratings, and statutory deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-mono"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
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

      {/* Transparent Evaluation Pillar Weights Banner */}
      <div className="bg-navy-900 text-white rounded-xl p-4 shadow-sm border border-navy-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-gold-400 uppercase tracking-wider font-serif">
            5-Pillar Transparent Scoring Model (Configurable Weights)
          </span>
          <span className="text-[10px] text-slate-400">Total: 100%</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
          <div className="bg-navy-800/80 p-2 rounded-lg border border-navy-700">
            <div className="text-gold-300 font-bold text-sm">{weights.task_completion || 25}%</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Task Completion Rate</div>
          </div>
          <div className="bg-navy-800/80 p-2 rounded-lg border border-navy-700">
            <div className="text-gold-300 font-bold text-sm">{weights.work_quality || 30}%</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Work Quality / Rating</div>
          </div>
          <div className="bg-navy-800/80 p-2 rounded-lg border border-navy-700">
            <div className="text-gold-300 font-bold text-sm">{weights.deadline_management || 20}%</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Deadline Adherence</div>
          </div>
          <div className="bg-navy-800/80 p-2 rounded-lg border border-navy-700">
            <div className="text-gold-300 font-bold text-sm">{weights.documentation_accuracy || 15}%</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Doc Accuracy (Low Rework)</div>
          </div>
          <div className="bg-navy-800/80 p-2 rounded-lg border border-navy-700">
            <div className="text-gold-300 font-bold text-sm">{weights.team_coordination || 10}%</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Team Coordination</div>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      {comparisonData.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
                Multi-Associate Performance Comparison
              </h2>
              <p className="text-xs text-slate-500">Benchmark across practice indicators (Target: 85%+)</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#627D98' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#627D98' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#172D43', color: '#FFFFFF', borderRadius: '8px', border: '1px solid #243B53', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
                  itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                  labelStyle={{ color: '#C5A36B', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="OverallScore" name="Overall Index" fill="#172D43" radius={[4, 4, 0, 0]} />
                <Bar dataKey="QualityScore" name="Quality Score" fill="#C5A36B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="DeadlineScore" name="Deadline Adherence" fill="#168653" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Associate Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
          Detailed Associate Appraisals & Calculation Breakdown
        </h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading performance summaries...</div>
        ) : summaries.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            No performance summaries generated for this month yet. Check EOM Reports module.
          </div>
        ) : (
          summaries.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200/80 shadow-subtle p-5 hover:border-gold-400 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500 font-semibold">{s.employee?.employee_id}</span>
                    <h3 className="text-base font-bold text-navy-900 font-serif">{s.employee?.full_name}</h3>
                    <span className="text-xs text-slate-500">&bull; {s.employee?.designation}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Chambers: <span className="font-semibold text-navy-900">{s.employee?.branch?.name}</span> &bull; Eligible Days: {s.working_days} &bull; Attendance: {s.attendance_percentage}%
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Overall Score</div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {s.overall_performance_score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                    </div>
                  </div>

                  {(isAdmin || isManager) && (
                    <button
                      onClick={() => openFeedbackModal(s)}
                      className="px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Edit className="w-3.5 h-3.5 text-gold-400" />
                      Appraisal Feedback
                    </button>
                  )}
                </div>
              </div>

              {/* Score Breakdown Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Tasks Completed</span>
                  <div className="text-base font-bold text-navy-900 mt-0.5">{s.tasks_completed} / {s.tasks_assigned}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Score: {s.task_completion_score}%</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Quality Index</span>
                  <div className="text-base font-bold text-navy-900 mt-0.5">{s.work_quality_score}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Verified review rating</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">On-Time Rate</span>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">{s.on_time_rate}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Score: {s.deadline_score}%</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Docs & Rework</span>
                  <div className="text-base font-bold text-navy-900 mt-0.5">{s.documents_completed} docs</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Rework: {s.rework_count} instances</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Team Coordination</span>
                  <div className="text-base font-bold text-navy-900 mt-0.5">{s.coordination_score}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Baseline compliance</div>
                </div>
              </div>

              {/* Qualitative Assessment Box */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <strong className="text-navy-900 block mb-0.5">Key Achievements:</strong>
                  <p className="text-slate-600">{s.key_achievements || 'Briefs filed within limitation dates.'}</p>
                  <strong className="text-navy-900 block mt-2 mb-0.5">Demonstrated Strengths:</strong>
                  <p className="text-slate-600">{s.strengths || 'Strong research acumen on civil and corporate procedure.'}</p>
                </div>
                <div>
                  <strong className="text-navy-900 block mb-0.5">Areas for Professional Growth:</strong>
                  <p className="text-slate-600">{s.improvement_areas || 'Continue expediting initial drafting revisions.'}</p>
                  <strong className="text-navy-900 block mt-2 mb-0.5">Partner Appraisal Notes:</strong>
                  <p className="text-slate-700 italic">"{s.manager_remarks || 'Valuable associate with commendable legal ethics.'}"</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Appraisal Feedback Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title="Partner Qualitative Appraisal"
        subtitle={selectedSummary ? `${selectedSummary.employee?.full_name} (${selectedSummary.employee?.employee_id})` : ''}
      >
        <form onSubmit={handleSaveFeedback} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Key Monthly Achievements</label>
            <textarea
              rows={2}
              value={feedbackForm.key_achievements}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, key_achievements: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              placeholder="e.g. Secured stay order in High Court writ petition..."
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Demonstrated Strengths</label>
            <input
              type="text"
              value={feedbackForm.strengths}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, strengths: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              placeholder="e.g. In-depth understanding of CPC and Tamil Nadu stamp laws..."
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Areas for Professional Growth</label>
            <input
              type="text"
              value={feedbackForm.improvement_areas}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, improvement_areas: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              placeholder="e.g. Reduce turnaround on preliminary conveyance drafts..."
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Partner Review Remarks</label>
            <textarea
              rows={3}
              required
              value={feedbackForm.manager_remarks}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, manager_remarks: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              placeholder="Formal supervisory remarks that appear in the End-of-Month official report..."
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFeedbackModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
            >
              {actionLoading ? 'Saving...' : 'Save Appraisal Feedback'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
