import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  UserX,
  UserCheck,
  CheckCircle2,
  Calendar,
  Clock,
  CheckSquare,
  TrendingUp,
  Mail,
  Phone,
  Building2,
  RefreshCw,
  Edit3,
  Trash2,
} from 'lucide-react';

export const EmployeesPage = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // profile, attendance, tasks, performance
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    branch_id: user?.branch_id || 1,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    designation: '',
    department: 'Corporate & Conveyancing',
    joining_date: new Date().toISOString().split('T')[0],
    role: 'employee',
    password: 'Password123!',
    emergency_contact: '',
    employment_status: 'active',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  const fetchEmployees = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      let url = `/employees?search=${search}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (departmentFilter) url += `&department=${departmentFilter}`;
      const res = await api.get(url);
      setEmployees(res.data.employees || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(true);
  }, [search, statusFilter, departmentFilter]);

  // Real-time polling every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      fetchEmployees(false);
    }, 15000);
    return () => clearInterval(timer);
  }, [search, statusFilter, departmentFilter]);

  useEffect(() => {
    api.get('/branches').then((res) => {
      setBranches(res.data.branches || []);
    });
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback({ text: '', type: '' });

    try {
      const res = await api.post('/employees', formData);
      setFeedback({
        text: `Employee created successfully with generated ID: ${res.data.employee.employee_id}`,
        type: 'success',
      });
      setAddModalOpen(false);
      setFormData({
        branch_id: user?.branch_id || 1,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        designation: '',
        department: 'Corporate & Conveyancing',
        joining_date: new Date().toISOString().split('T')[0],
        role: 'employee',
        password: 'Password123!',
        emergency_contact: '',
        employment_status: 'active',
      });
      fetchEmployees();
    } catch (err) {
      setFeedback({
        text: err.response?.data?.message || 'Failed to create employee.',
        type: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setActionLoading(true);

    try {
      await api.put(`/employees/${selectedEmployee.id}`, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        designation: formData.designation,
        department: formData.department,
        emergency_contact: formData.emergency_contact,
        employment_status: formData.employment_status,
      });
      setFeedback({ text: `Employee ${selectedEmployee.employee_id} updated successfully.`, type: 'success' });
      setEditModalOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err) {
      setFeedback({ text: err.response?.data?.message || 'Failed to update employee.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    setActionLoading(true);

    try {
      await api.delete(`/employees/${selectedEmployee.id}`);
      setFeedback({ text: `Employee ${selectedEmployee.employee_id} removed from branch.`, type: 'success' });
      setDeleteModalOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete employee.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetails = async (emp) => {
    setSelectedEmployee(emp);
    setViewModalOpen(true);
    setDetailsLoading(true);
    setActiveTab('profile');

    try {
      const res = await api.get(`/employees/${emp.id}`);
      setEmployeeDetails(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      phone: emp.phone || '',
      designation: emp.designation,
      department: emp.department,
      emergency_contact: emp.emergency_contact || '',
      employment_status: emp.employment_status,
    });
    setEditModalOpen(true);
  };

  const handleToggleStatus = async (empId) => {
    try {
      await api.post(`/employees/${empId}/deactivate`);
      fetchEmployees();
      if (selectedEmployee) {
        handleOpenDetails(selectedEmployee);
      }
    } catch (e) {
      alert('Failed to change status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-navy-900">Associate & Staff Management</h1>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chambers personnel directory, credentials, assignments, and professional histories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchEmployees(true)}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {(isAdmin || isManager) && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-gold-400" />
              Add Legal Associate
            </button>
          )}
        </div>
      </div>

      {feedback.text && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback({ text: '', type: '' })} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
          >
            <option value="">All Legal Practice Areas</option>
            <option value="Corporate & Conveyancing">Corporate & Conveyancing</option>
            <option value="Litigation & Corporate">Litigation & Corporate</option>
            <option value="Civil Litigation & Arbitration">Civil Litigation & Arbitration</option>
            <option value="Regulatory & Documentation">Regulatory & Documentation</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium text-navy-900"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-3">Designation & Area</th>
                <th className="py-3 px-3">Chambers Branch</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading associates...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No associates found matching criteria.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-navy-900">
                      {emp.employee_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-navy-900">{emp.full_name}</div>
                      <div className="text-[11px] text-slate-500">{emp.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{emp.designation}</div>
                      <div className="text-[10px] text-slate-500">{emp.department}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-navy-900">{emp.branch?.name}</span>
                      <span className="text-[10px] block font-mono text-slate-500">{emp.branch?.code}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{emp.phone || '&mdash;'}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={emp.employment_status === 'active' ? 'Active' : 'Rejected'} size="xs">
                        {emp.employment_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(emp)}
                          className="p-1.5 text-navy-800 hover:text-gold-600 hover:bg-slate-100 rounded transition-colors"
                          title="View Profile & Records"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(isAdmin || isManager) && (
                          <>
                            <button
                              onClick={() => openEditModal(emp)}
                              className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded transition-colors"
                              title="Edit Associate Profile"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(emp.id)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title={emp.employment_status === 'active' ? 'Deactivate Associate' : 'Activate Associate'}
                            >
                              {emp.employment_status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4 text-emerald-600" />}
                            </button>

                            <button
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Remove Employee"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* Add Employee Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register Legal Associate"
        subtitle="Generates unique branch ID (e.g. AAV-TNV-005) and platform login"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
          {isAdmin && (
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Chambers Branch</label>
              <select
                required
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">First Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Suresh"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Last Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Balakrishnan"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Official Email Address</label>
              <input
                type="email"
                required
                placeholder="suresh.b@aavpartners.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Direct Phone</label>
              <input
                type="text"
                placeholder="+91 94444 55555"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Designation</label>
              <input
                type="text"
                required
                placeholder="e.g. Associate Advocate"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Practice Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="Corporate & Conveyancing">Corporate & Conveyancing</option>
                <option value="Civil Litigation & Arbitration">Civil Litigation & Arbitration</option>
                <option value="Regulatory & Documentation">Regulatory & Documentation</option>
                <option value="Litigation & Corporate">Litigation & Corporate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Joining Date</label>
              <input
                type="date"
                required
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Platform Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="employee">Employee / Associate</option>
                {isAdmin && <option value="branch_manager">Branch Manager</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Initial Password</label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Emergency Contact</label>
              <input
                type="text"
                placeholder="Parent/Spouse Name (+91...)"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
            >
              {actionLoading ? 'Creating...' : 'Register Associate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal (Manager / Admin) */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Associate Profile"
        subtitle={selectedEmployee ? `${selectedEmployee.full_name} (${selectedEmployee.employee_id})` : ''}
      >
        <form onSubmit={handleEditEmployee} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Direct Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Employment Status</label>
              <select
                value={formData.employment_status}
                onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium text-navy-900"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="probation">Probation</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Designation</label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Practice Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="Corporate & Conveyancing">Corporate & Conveyancing</option>
                <option value="Civil Litigation & Arbitration">Civil Litigation & Arbitration</option>
                <option value="Regulatory & Documentation">Regulatory & Documentation</option>
                <option value="Litigation & Corporate">Litigation & Corporate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Emergency Contact</label>
            <input
              type="text"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
            >
              {actionLoading ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Manager / Admin) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Remove Employee from Directory"
        subtitle={selectedEmployee ? `${selectedEmployee.full_name} (${selectedEmployee.employee_id})` : ''}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700">
            Are you sure you want to remove <strong className="text-navy-900">{selectedEmployee?.full_name}</strong>?
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
            This action will deactivate their login access and archive the associate profile. Associates with active pending tasks cannot be deleted until briefs are reassigned.
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDeleteEmployee}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {actionLoading ? 'Removing...' : 'Confirm Removal'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Profile & Comprehensive Records Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedEmployee ? `${selectedEmployee.full_name} (${selectedEmployee.employee_id})` : 'Associate Profile'}
        subtitle={selectedEmployee ? `${selectedEmployee.designation} &bull; ${selectedEmployee.branch?.name}` : ''}
        maxWidth="max-w-4xl"
      >
        {detailsLoading || !employeeDetails ? (
          <div className="py-12 text-center text-slate-400">Loading comprehensive associate records...</div>
        ) : (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 text-xs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2.5 font-semibold border-b-2 transition-all ${
                  activeTab === 'profile'
                    ? 'border-navy-900 text-navy-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Profile & Details
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-4 py-2.5 font-semibold border-b-2 transition-all ${
                  activeTab === 'attendance'
                    ? 'border-navy-900 text-navy-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Attendance Records ({employeeDetails.attendances?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2.5 font-semibold border-b-2 transition-all ${
                  activeTab === 'tasks'
                    ? 'border-navy-900 text-navy-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Tasks History ({employeeDetails.tasks?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-4 py-2.5 font-semibold border-b-2 transition-all ${
                  activeTab === 'performance'
                    ? 'border-navy-900 text-navy-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Monthly Appraisals ({employeeDetails.performance_history?.length || 0})
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Employee ID</span>
                    <div className="font-mono font-bold text-navy-900 mt-0.5">{employeeDetails.employee.employee_id}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Chambers Branch</span>
                    <div className="font-bold text-navy-900 mt-0.5">{employeeDetails.employee.branch?.name}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Joining Date</span>
                    <div className="font-semibold text-slate-700 mt-0.5">{employeeDetails.employee.joining_date}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Email Address</span>
                    <div className="font-semibold text-slate-700 mt-0.5">{employeeDetails.employee.email}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Phone Number</span>
                    <div className="font-semibold text-slate-700 mt-0.5">{employeeDetails.employee.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Emergency Contact</span>
                    <div className="font-semibold text-slate-700 mt-0.5">{employeeDetails.employee.emergency_contact || 'N/A'}</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-navy-900 mb-2 uppercase text-[10px] tracking-wider font-serif">Leave Balances</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="font-bold text-navy-900 text-sm">{employeeDetails.employee.leave_balance_casual}</div>
                      <div className="text-[10px] text-slate-500">Casual Leave</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="font-bold text-navy-900 text-sm">{employeeDetails.employee.leave_balance_sick}</div>
                      <div className="text-[10px] text-slate-500">Sick Leave</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="font-bold text-navy-900 text-sm">{employeeDetails.employee.leave_balance_emergency}</div>
                      <div className="text-[10px] text-slate-500">Emergency Leave</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                {employeeDetails.attendances?.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">No attendance records found.</div>
                ) : (
                  employeeDetails.attendances?.map((att) => (
                    <div key={att.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-navy-900">{att.date}</div>
                        <div className="text-[10px] text-slate-500">
                          In: <span className="font-mono">{att.check_in || 'N/A'}</span> &bull; Out: <span className="font-mono">{att.check_out || 'N/A'}</span> &bull; Hours: {att.working_hours}
                        </div>
                      </div>
                      <Badge variant={att.status} size="xs">{att.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                {employeeDetails.tasks?.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">No tasks assigned yet.</div>
                ) : (
                  employeeDetails.tasks?.map((t) => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="font-mono text-[10px] text-slate-500">{t.task_id} &bull; Deadline: {t.deadline}</div>
                        <div className="font-semibold text-navy-900 line-clamp-1">{t.title}</div>
                      </div>
                      <Badge variant={t.status} size="xs">{t.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                {employeeDetails.performance_history?.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">No performance summaries recorded.</div>
                ) : (
                  employeeDetails.performance_history?.map((s) => (
                    <div key={s.id} className="py-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-navy-900 text-sm">Month: {s.month}/{s.year}</div>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Score: {s.overall_performance_score} / 100
                        </span>
                      </div>
                      <p className="text-slate-600 italic">"{s.manager_remarks || 'Quality and turnaround consistent with expectations.'}"</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
