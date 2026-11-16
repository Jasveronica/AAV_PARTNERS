import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  FileText,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Search,
  Lock,
  History,
  Check,
  ChevronRight,
  RefreshCw,
  Edit3,
  Trash2,
} from 'lucide-react';

export const DocumentsPage = () => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Forms
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'Corporate Contract',
    client_reference: '',
    assigned_to: '',
    received_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    priority: 'Medium',
    is_confidential: false,
    manager_remarks: '',
  });

  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: 'In Progress',
    notes: '',
    manager_remarks: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  const fetchDocuments = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      let url = `/documents?search=${search}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;

      const res = await api.get(url);
      setDocuments(res.data.documents || []);
      setSummary(res.data.summary || {});
    } catch (e) {
      console.error(e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(true);
  }, [statusFilter, categoryFilter, search]);

  // Real-time polling every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      fetchDocuments(false);
    }, 15000);
    return () => clearInterval(timer);
  }, [statusFilter, categoryFilter, search]);

  useEffect(() => {
    if (isAdmin || isManager) {
      api.get('/employees').then((res) => {
        setEmployees(res.data.employees || []);
      });
    }
  }, []);

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/documents', docForm);
      setAlertMsg({ text: `Document ${res.data.document.reference_number} registered.`, type: 'success' });
      setAddModalOpen(false);
      setDocForm({
        title: '',
        category: 'Corporate Contract',
        client_reference: '',
        assigned_to: '',
        received_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        priority: 'Medium',
        is_confidential: false,
        manager_remarks: '',
      });
      fetchDocuments();
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Failed to register document.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditDocument = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setActionLoading(true);
    try {
      await api.put(`/documents/${selectedDoc.id}`, docForm);
      setAlertMsg({ text: `Document ${selectedDoc.reference_number} updated successfully.`, type: 'success' });
      setEditModalOpen(false);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Failed to update document.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setActionLoading(true);
    try {
      await api.post(`/documents/${selectedDoc.id}/status`, statusUpdateForm);
      setAlertMsg({ text: `Status updated to ${statusUpdateForm.status}.`, type: 'success' });
      setStatusModalOpen(false);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDoc) return;
    setActionLoading(true);
    try {
      await api.delete(`/documents/${selectedDoc.id}`);
      setAlertMsg({ text: `Document ${selectedDoc.reference_number} deleted successfully.`, type: 'success' });
      setDeleteModalOpen(false);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document.');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusModal = (doc) => {
    setSelectedDoc(doc);
    const defaultStatus = isEmployee ? 'In Progress' : doc.status;
    setStatusUpdateForm({
      status: defaultStatus,
      notes: '',
      manager_remarks: doc.manager_remarks || '',
    });
    setStatusModalOpen(true);
  };

  const openEditModal = (doc) => {
    setSelectedDoc(doc);
    setDocForm({
      title: doc.title,
      category: doc.category,
      client_reference: doc.client_reference || '',
      assigned_to: doc.assigned_to || '',
      received_date: doc.received_date,
      due_date: doc.due_date,
      priority: doc.priority,
      is_confidential: Boolean(doc.is_confidential),
      manager_remarks: doc.manager_remarks || '',
    });
    setEditModalOpen(true);
  };

  const openHistoryModal = (doc) => {
    setSelectedDoc(doc);
    setHistoryModalOpen(true);
  };

  const isFinalized = (status) => ['Completed', 'Delivered'].includes(status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-navy-900">Legal Document Tracking</h1>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end documentation lifecycle: Received &rarr; Assigned &rarr; In Progress &rarr; Manager Review &rarr; Completed &rarr; Delivered.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDocuments(true)}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Documents"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {(isAdmin || isManager) && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-gold-400" />
              Register Legal Document
            </button>
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

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Documents</span>
          <div className="text-xl font-bold text-navy-900 mt-0.5">{summary.total || 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">In Progress</span>
          <div className="text-xl font-bold text-blue-700 mt-0.5">{summary.in_progress || 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">Manager Review</span>
          <div className="text-xl font-bold text-purple-700 mt-0.5">{summary.manager_review || 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Completed</span>
          <div className="text-xl font-bold text-emerald-700 mt-0.5">{summary.completed || 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">Delivered</span>
          <div className="text-xl font-bold text-teal-700 mt-0.5">{summary.delivered || 0}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search ref #, title, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
          >
            <option value="">All Categories</option>
            <option value="Corporate Contract">Corporate Contract</option>
            <option value="Court Pleadings">Court Pleadings</option>
            <option value="Affidavit">Affidavit</option>
            <option value="Conveyance Deed">Conveyance Deed</option>
            <option value="Legal Opinion">Legal Opinion</option>
            <option value="Power of Attorney">Power of Attorney</option>
            <option value="Arbitration Petition">Arbitration Petition</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-medium text-navy-900"
          >
            <option value="">All Workflow Stages</option>
            <option value="Received">Received</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Manager Review">Manager Review</option>
            <option value="Completed">Completed</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Document Title & Client</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Assigned To</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Workflow State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading documents...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">No documents found matching filters.</td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-navy-900">
                      <div className="flex items-center gap-1.5">
                        {doc.is_confidential && <Lock className="w-3 h-3 text-gold-500" title="Confidential Matter" />}
                        <span>{doc.reference_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-bold text-navy-900">{doc.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Client: <span className="font-medium text-slate-700">{doc.client_reference || 'Confidential'}</span>
                      </div>
                      {doc.manager_remarks && (
                        <div className="mt-1 text-[10px] text-slate-600 bg-slate-50 p-1 rounded border border-slate-200">
                          {doc.manager_remarks}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-navy-900">{doc.assignee?.full_name || <span className="text-slate-400 italic">Unassigned</span>}</div>
                      {doc.assignee && <div className="text-[10px] text-slate-500">{doc.assignee.designation}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={doc.priority} size="xs">{doc.priority}</Badge>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-rose-700">{doc.due_date}</td>
                    <td className="py-3 px-3">
                      <Badge variant={doc.status} size="xs">{doc.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openHistoryModal(doc)}
                          className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded transition-colors"
                          title="View Workflow History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {(isAdmin || isManager || (isEmployee && doc.assigned_to === user?.employee?.id)) && (
                          <button
                            onClick={() => openStatusModal(doc)}
                            className="px-2.5 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded text-[11px] font-semibold transition-colors"
                          >
                            Update
                          </button>
                        )}

                        {(isAdmin || isManager) && (
                          <>
                            <button
                              onClick={() => openEditModal(doc)}
                              className="p-1.5 text-slate-400 hover:text-navy-900 transition-colors"
                              title="Edit Details / Reassign"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {!isFinalized(doc.status) && (
                              <button
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

      {/* Add Document Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register Legal Document Matter"
        subtitle="Automatic unique reference format: DOC-{BRANCH}-{YEAR}-{SEQ}"
      >
        <form onSubmit={handleCreateDocument} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Document Subject / Matter Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Conveyance Title Scrutiny - High Ground Industrial Plot"
              value={docForm.title}
              onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Document Category</label>
              <select
                value={docForm.category}
                onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="Corporate Contract">Corporate Contract</option>
                <option value="Court Pleadings">Court Pleadings</option>
                <option value="Affidavit">Affidavit</option>
                <option value="Conveyance Deed">Conveyance Deed</option>
                <option value="Legal Opinion">Legal Opinion</option>
                <option value="Power of Attorney">Power of Attorney</option>
                <option value="Arbitration Petition">Arbitration Petition</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Client Reference / Matter Name</label>
              <input
                type="text"
                placeholder="e.g. Southern Agro-Tech Infra Pvt Ltd"
                value={docForm.client_reference}
                onChange={(e) => setDocForm({ ...docForm, client_reference: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Assigned Associate</label>
              <select
                value={docForm.assigned_to}
                onChange={(e) => setDocForm({ ...docForm, assigned_to: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="">&mdash; Leave Unassigned for Intake &mdash;</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Priority</label>
              <select
                value={docForm.priority}
                onChange={(e) => setDocForm({ ...docForm, priority: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Intake Received Date</label>
              <input
                type="date"
                required
                value={docForm.received_date}
                onChange={(e) => setDocForm({ ...docForm, received_date: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={docForm.due_date}
                onChange={(e) => setDocForm({ ...docForm, due_date: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-navy-900">
              <input
                type="checkbox"
                checked={docForm.is_confidential}
                onChange={(e) => setDocForm({ ...docForm, is_confidential: e.target.checked })}
                className="h-4 w-4 text-navy-900 focus:ring-navy-900 rounded"
              />
              <span>Mark as Confidential Matter (Restricts client visibility to assigned counsel & partners)</span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Manager Instructions / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Scrutinize 30-year parent chain documents thoroughly..."
              value={docForm.manager_remarks}
              onChange={(e) => setDocForm({ ...docForm, manager_remarks: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
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
              {actionLoading ? 'Registering...' : 'Register Document'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Document Modal (Manager) */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Document Details / Reassign"
        subtitle={selectedDoc ? `Editing ${selectedDoc.reference_number}` : ''}
      >
        <form onSubmit={handleEditDocument} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Subject / Matter Title</label>
            <input
              type="text"
              required
              value={docForm.title}
              onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Document Category</label>
              <select
                value={docForm.category}
                onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="Corporate Contract">Corporate Contract</option>
                <option value="Court Pleadings">Court Pleadings</option>
                <option value="Affidavit">Affidavit</option>
                <option value="Conveyance Deed">Conveyance Deed</option>
                <option value="Legal Opinion">Legal Opinion</option>
                <option value="Power of Attorney">Power of Attorney</option>
                <option value="Arbitration Petition">Arbitration Petition</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Client Reference</label>
              <input
                type="text"
                value={docForm.client_reference}
                onChange={(e) => setDocForm({ ...docForm, client_reference: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Assigned Associate</label>
              <select
                value={docForm.assigned_to}
                onChange={(e) => setDocForm({ ...docForm, assigned_to: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="">&mdash; Unassigned &mdash;</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={docForm.due_date}
                onChange={(e) => setDocForm({ ...docForm, due_date: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Priority</label>
              <select
                value={docForm.priority}
                onChange={(e) => setDocForm({ ...docForm, priority: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-navy-900">
                <input
                  type="checkbox"
                  checked={docForm.is_confidential}
                  onChange={(e) => setDocForm({ ...docForm, is_confidential: e.target.checked })}
                  className="h-4 w-4 text-navy-900 focus:ring-navy-900 rounded"
                />
                <span>Confidential</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Manager Remarks</label>
            <input
              type="text"
              value={docForm.manager_remarks}
              onChange={(e) => setDocForm({ ...docForm, manager_remarks: e.target.value })}
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
              {actionLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Document Workflow Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Document Workflow Stage"
        subtitle={selectedDoc ? `${selectedDoc.reference_number}: ${selectedDoc.title}` : ''}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Advance Workflow Stage</label>
            <select
              value={statusUpdateForm.status}
              onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none bg-white font-bold text-navy-900"
            >
              {isEmployee ? (
                <>
                  <option value="In Progress">In Progress (Active Drafting)</option>
                  <option value="Manager Review">Manager Review (Submit to Partner)</option>
                </>
              ) : (
                <>
                  <option value="Received">1. Received (Intake Logged)</option>
                  <option value="Assigned">2. Assigned (Associate Allocated)</option>
                  <option value="In Progress">3. In Progress (Active Drafting)</option>
                  <option value="Manager Review">4. Manager Review (Awaiting Partner Sign-off)</option>
                  <option value="Completed">5. Completed (Final Opinion/Draft Sealed)</option>
                  <option value="Delivered">6. Delivered (Dispatched to Client/Filed in Court)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Status Transition Notes</label>
            <textarea
              rows={3}
              required
              placeholder="Record exact progress made, verified citations, or filing acknowledgement numbers..."
              value={statusUpdateForm.notes}
              onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, notes: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
            >
              {actionLoading ? 'Saving...' : 'Update Status'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Document Confirmation Modal (Manager) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Document Deletion"
        subtitle={selectedDoc ? `Deleting ${selectedDoc.reference_number}` : ''}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700">
            Are you sure you want to permanently delete document <strong className="text-navy-900">{selectedDoc?.reference_number} &mdash; {selectedDoc?.title}</strong>?
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
            This operation will remove the document reference and its history. Completed and Delivered legal documents cannot be deleted.
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
              onClick={handleDeleteDocument}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {actionLoading ? 'Deleting...' : 'Delete Document'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Workflow History Audit Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Document Lifecycle Audit Trail"
        subtitle={selectedDoc ? `${selectedDoc.reference_number}: ${selectedDoc.title}` : ''}
      >
        <div className="space-y-4 text-xs">
          <div className="max-h-80 overflow-y-auto space-y-3">
            {selectedDoc?.history?.length === 0 ? (
              <div className="py-6 text-center text-slate-400">No transition history logged.</div>
            ) : (
              selectedDoc?.history?.map((h, i) => (
                <div key={h.id || i} className="relative pl-6 pb-3 border-l-2 border-gold-400/60 last:border-transparent last:pb-0">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-navy-900 ring-2 ring-gold-400" />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-navy-900">{h.action}</span>
                    <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{h.notes}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Updated by: {h.user?.name || 'System'}</div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 text-right">
            <button
              onClick={() => setHistoryModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
