import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  Building2,
  Plus,
  Users,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Shield,
} from 'lucide-react';

export const BranchesPage = () => {
  const { isAdmin } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    phone: '',
    email: '',
    work_start_time: '10:00:00',
    work_end_time: '18:00:00',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/branches');
      setBranches(res.data.branches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback({ text: '', type: '' });

    try {
      await api.post('/branches', formData);
      setFeedback({ text: 'Branch established successfully.', type: 'success' });
      setModalOpen(false);
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        state: 'Tamil Nadu',
        phone: '',
        email: '',
        work_start_time: '10:00:00',
        work_end_time: '18:00:00',
      });
      fetchBranches();
    } catch (err) {
      setFeedback({
        text: err.response?.data?.message || 'Failed to establish branch.',
        type: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDeactivate = async (branchId, isCurrentlyActive) => {
    if (!window.confirm(`Are you sure you want to deactivate this branch?`)) return;
    try {
      await api.delete(`/branches/${branchId}`);
      fetchBranches();
    } catch (e) {
      alert('Action failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-navy-900">Branch Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Chambers locations, jurisdictional coverage, operational hours, and facility coordination.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            Add New Branch
          </button>
        )}
      </div>

      {feedback.text && (
        <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Branches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-56 bg-slate-200 rounded-xl"></div>
          <div className="h-56 bg-slate-200 rounded-xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((b) => (
            <div
              key={b.id}
              className={`bg-white rounded-2xl border transition-all shadow-subtle hover:shadow-card flex flex-col justify-between p-6 ${
                b.is_active ? 'border-slate-200/80 hover:border-gold-400' : 'border-rose-200 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-navy-900 text-gold-400 flex items-center justify-center font-bold text-sm">
                      {b.code}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-navy-900 font-serif">{b.name}</h2>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-gold-600" />
                        <span>{b.city}, {b.state}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={b.is_active ? 'Active' : 'Rejected'} size="xs">
                    {b.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {b.address || 'Address details pending registry filing.'}
                </p>

                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-navy-700" />
                    <span>Working Hours: <strong className="text-navy-900 font-mono">{b.work_start_time.substring(0, 5)} - {b.work_end_time.substring(0, 5)}</strong></span>
                  </div>
                  {b.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-navy-700" />
                      <span>{b.phone}</span>
                    </div>
                  )}
                  {b.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-navy-700" />
                      <span>{b.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-navy-900 font-semibold">
                  <Users className="w-4 h-4 text-gold-600" />
                  <span>{b.active_employees_count || 0} Staff</span>
                </div>

                {isAdmin && b.is_active && (
                  <button
                    onClick={() => handleToggleDeactivate(b.id, b.is_active)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Branch Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Establish New Firm Branch"
        subtitle="Add a new city chamber to AAV Partners corporate registry"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Branch Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Coimbatore Regional Chambers"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Branch Code (3-5 letters)</label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="e.g. CBE"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Chambers Address</label>
            <input
              type="text"
              required
              placeholder="e.g. 54, Race Course Road, Near District Court Complex"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">City</label>
              <input
                type="text"
                required
                placeholder="e.g. Coimbatore"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">State</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Official Telephone</label>
              <input
                type="text"
                placeholder="+91 422 2345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Official Email</label>
              <input
                type="email"
                placeholder="coimbatore@aavpartners.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Daily Start Time</label>
              <input
                type="time"
                required
                value={formData.work_start_time}
                onChange={(e) => setFormData({ ...formData, work_start_time: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Daily End Time</label>
              <input
                type="time"
                required
                value={formData.work_end_time}
                onChange={(e) => setFormData({ ...formData, work_end_time: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
            >
              {actionLoading ? 'Creating...' : 'Establish Branch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
