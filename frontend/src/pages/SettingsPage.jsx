import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  Settings,
  Building2,
  Clock,
  Calendar,
  Percent,
  Lock,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const SettingsPage = () => {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Security password state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  // Holiday Modal
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'State',
    branch_id: '',
    description: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const settingsMap = {};
      Object.keys(res.data.settings || {}).forEach((k) => {
        settingsMap[k] = res.data.settings[k].value;
      });
      setSettings(settingsMap);
      setHolidays(res.data.holidays || []);
      setBranches(res.data.branches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/settings', { settings });
      setAlertMsg({ text: 'Firm settings updated successfully.', type: 'success' });
    } catch (err) {
      setAlertMsg({ text: 'Failed to update settings.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/update-password', passwordForm);
      setAlertMsg({ text: 'Your password has been changed securely.', type: 'success' });
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Password update failed.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/settings/holidays', holidayForm);
      setAlertMsg({ text: 'Holiday added to calendar.', type: 'success' });
      setHolidayModalOpen(false);
      setHolidayForm({
        title: '',
        date: new Date().toISOString().split('T')[0],
        type: 'State',
        branch_id: '',
        description: '',
      });
      fetchSettings();
    } catch (err) {
      alert('Failed to add holiday.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      await api.delete(`/settings/holidays/${id}`);
      fetchSettings();
    } catch (e) {
      alert('Failed to remove holiday.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold font-serif text-navy-900">Firm Settings & Policies</h1>
        <p className="text-xs text-slate-500 mt-1">
          Operating parameters, legal calendar, performance scoring weights, and credential controls.
        </p>
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

      {/* Form Settings */}
      {isAdmin && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* General Information Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-navy-900" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
                Firm Identity & Contact
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">Firm Brand Name</label>
                <input
                  type="text"
                  value={settings.firm_name || 'AAV PARTNERS'}
                  onChange={(e) => setSettings({ ...settings, firm_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Corporate Tagline</label>
                <input
                  type="text"
                  value={settings.firm_tagline || 'Professional Excellence. Trusted Management.'}
                  onChange={(e) => setSettings({ ...settings, firm_tagline: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Primary Official Email</label>
                <input
                  type="email"
                  value={settings.primary_email || 'contact@aavpartners.com'}
                  onChange={(e) => setSettings({ ...settings, primary_email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Chambers Telephone</label>
                <input
                  type="text"
                  value={settings.phone_number || '+91 462 2501234'}
                  onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Attendance Rules Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Clock className="w-4 h-4 text-navy-900" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
                Working Hours & Attendance Policy
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">Default Start Time</label>
                <input
                  type="time"
                  value={settings.work_start_time || '10:00'}
                  onChange={(e) => setSettings({ ...settings, work_start_time: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Default End Time</label>
                <input
                  type="time"
                  value={settings.work_end_time || '18:00'}
                  onChange={(e) => setSettings({ ...settings, work_end_time: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Grace Period (Minutes)</label>
                <input
                  type="number"
                  value={settings.grace_period_minutes || '15'}
                  onChange={(e) => setSettings({ ...settings, grace_period_minutes: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Performance Evaluation Weightages */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Percent className="w-4 h-4 text-navy-900" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
                5-Pillar Performance Weightage Allocation (% must sum to 100)
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">Task Completion (%)</label>
                <input
                  type="number"
                  value={settings.weight_task_completion || '25'}
                  onChange={(e) => setSettings({ ...settings, weight_task_completion: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Work Quality (%)</label>
                <input
                  type="number"
                  value={settings.weight_work_quality || '30'}
                  onChange={(e) => setSettings({ ...settings, weight_work_quality: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Deadlines Adherence (%)</label>
                <input
                  type="number"
                  value={settings.weight_deadline_management || '20'}
                  onChange={(e) => setSettings({ ...settings, weight_deadline_management: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Doc Accuracy (%)</label>
                <input
                  type="number"
                  value={settings.weight_doc_accuracy || '15'}
                  onChange={(e) => setSettings({ ...settings, weight_doc_accuracy: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Coordination (%)</label>
                <input
                  type="number"
                  value={settings.weight_coordination || '10'}
                  onChange={(e) => setSettings({ ...settings, weight_coordination: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-gold-400" />
              {actionLoading ? 'Saving...' : 'Save Firm Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Holidays Calendar Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-navy-900" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
              Statutory Court & Public Holidays
            </h2>
          </div>

          {isAdmin && (
            <button
              onClick={() => setHolidayModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 text-gold-400" /> Add Holiday
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {holidays.map((h) => (
            <div key={h.id} className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-navy-900">{h.title}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {h.date} &bull; Type: <span className="font-medium text-slate-700">{h.type}</span> {h.branch && `(${h.branch.name})`}
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleDeleteHoliday(h.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Password & Security Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Lock className="w-4 h-4 text-navy-900" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
            Security & Password Change
          </h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs max-w-md">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">New Password (min 8 chars)</label>
            <input
              type="password"
              required
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={passwordForm.new_password_confirmation}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900"
            />
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
          >
            {actionLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Add Holiday Modal */}
      <Modal
        isOpen={holidayModalOpen}
        onClose={() => setHolidayModalOpen(false)}
        title="Add Court or Public Holiday"
        subtitle="Mark holiday in chambers operational attendance calendar"
      >
        <form onSubmit={handleAddHoliday} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Holiday Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Tamil New Year / Chithirai Thirunal"
              value={holidayForm.title}
              onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Date</label>
              <input
                type="date"
                required
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Holiday Type</label>
              <select
                value={holidayForm.type}
                onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="National">National Holiday</option>
                <option value="State">State Holiday (Tamil Nadu)</option>
                <option value="Branch">Local Court / Bar Holiday</option>
                <option value="Restricted">Restricted Holiday</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Branch Scope (Optional)</label>
            <select
              value={holidayForm.branch_id}
              onChange={(e) => setHolidayForm({ ...holidayForm, branch_id: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
            >
              <option value="">&mdash; Applicable to All Chambers &mdash;</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setHolidayModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
            >
              {actionLoading ? 'Saving...' : 'Add Holiday'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
