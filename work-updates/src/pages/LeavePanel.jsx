import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useLeaves } from '../context/LeaveContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Trash2, CheckCircle, XCircle, Clock, Plus, Filter } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const LeavePanel = ({ isAdmin }) => {
    const { user } = useAuth();
    const { leaves, applyLeave, updateLeaveStatus, deleteLeave } = useLeaves();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        type: 'Sick Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const userLeaves = leaves.filter(l => l.userId === user?.id);
    const displayLeaves = isAdmin ? leaves : userLeaves;

    const handleSubmit = (e) => {
        e.preventDefault();
        applyLeave(formData);
        setIsModalOpen(false);
        setFormData({ type: 'Sick Leave', startDate: '', endDate: '', reason: '' });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
            case 'Rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
            default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
        }
    };

    return (
        <Layout>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {isAdmin ? 'Leave Management' : 'My Leave Requests'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {isAdmin ? 'Review and manage employee leave applications.' : 'Track your leave history and apply for new leaves.'}
                    </p>
                </div>

                {!isAdmin && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <Plus className="h-4 w-4" />
                        Apply for Leave
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="card-modern overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    {isAdmin && <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Employee</th>}
                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Leave Type</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Period</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Reason</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {displayLeaves.length > 0 ? (
                                    displayLeaves.map((leave) => (
                                        <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                                            {isAdmin && <td className="px-6 py-4 font-medium">{leave.userName}</td>}
                                            <td className="px-6 py-4">
                                                <span className="font-medium">{leave.type}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                                                        {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate">{leave.reason}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(leave.status)}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {isAdmin && leave.status === 'Pending' && (
                                                        <>
                                                            <button 
                                                                onClick={() => updateLeaveStatus(leave.id, 'Approved')}
                                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="h-5 w-5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => updateLeaveStatus(leave.id, 'Rejected')}
                                                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {!isAdmin && leave.status === 'Pending' && (
                                                        <button 
                                                            onClick={() => deleteLeave(leave.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAdmin ? '6' : '5'} className="px-6 py-12 text-center text-slate-500">
                                            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                                            <p>No leave requests found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Apply Leave Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-800">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Apply for Leave</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Leave Type</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                >
                                    <option>Sick Leave</option>
                                    <option>Casual Leave</option>
                                    <option>Paternal/Maternal Leave</option>
                                    <option>Unpaid Leave</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-center"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-center"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                                <textarea 
                                    required
                                    rows="3"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    placeholder="Brief description of your leave request..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                ></textarea>
                            </div>
                            <button type="submit" className="w-full btn-gradient py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 transition-all">
                                Submit Application
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default LeavePanel;
