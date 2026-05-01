import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FileText, Search, Download, Plus, Filter, Mail } from 'lucide-react';
import { useProjectFilter } from '../context/ProjectFilterContext';

import { generatePaySlip, getAllPaySlips, downloadPaySlip, sendPaySlipEmail } from '../services/paySlipService';

const PaySlipPanel = () => {
    const { selectedProjectId } = useProjectFilter();
    const [searchQuery, setSearchQuery] = useState('');
    const [payslips, setPayslips] = useState([]);
    const [fetching, setFetching] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        employee_id: '',
        month: '',
        amount: '',
        status: 'Generated'
    });
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedProjectId]);

    const fetchData = async () => {
        setFetching(true);
        try {
            const data = await getAllPaySlips(selectedProjectId);
            setPayslips(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    const handleDownload = async (id) => {
        try {
            await downloadPaySlip(id);
        } catch (err) {
            alert("Download failed. Please try again.");
        }
    };

    const handleEmail = async (id) => {
        try {
            await sendPaySlipEmail(id);
            alert("Pay slip sent to employee email!");
        } catch (err) {
            alert("Email failed to send");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await generatePaySlip({ ...formData, project_id: selectedProjectId });
            alert("Pay slip generated successfully!");
            setShowForm(false);
            setFormData({ employee_id: '', month: '', amount: '', status: 'Generated' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to generate pay slip");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPayslips = payslips.filter(ps =>
        (ps.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ps.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout>
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Pay Slips Management</h1>
                        <p className="text-slate-500 dark:text-slate-400">Generate and manage employee pay slips globally.</p>
                    </div>
                    <button
                        onClick={() => {
                            console.log("Form Toggled!");
                            setShowForm(!showForm);
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        {showForm ? 'Cancel' : 'Generate New Pay Slip'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900 shadow-inner animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">🚀 New Salary Distribution Form</h3>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">Debug: Form Active</span>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            name="employee_id"
                            placeholder="Employee ID (e.g. EMP001)"
                            required
                            className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-2.5 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.employee_id}
                            onChange={handleChange}
                        />
                        <input
                            name="month"
                            placeholder="Month (e.g. March 2026)"
                            required
                            className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-2.5 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.month}
                            onChange={handleChange}
                        />
                        <input
                            name="amount"
                            placeholder="Amount (e.g. ₹75,000)"
                            required
                            className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-2.5 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.amount}
                            onChange={handleChange}
                        />
                        <button
                            disabled={submitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50"
                        >
                            {submitting ? 'Generating...' : 'Save Record'}
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Employee</th>
                                <th className="px-6 py-4 font-semibold">Month</th>
                                <th className="px-6 py-4 font-semibold">Amount</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Created Date</th>
                                <th className="px-6 py-4 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {fetching ? (
                                <tr><td colSpan="6" className="p-8 text-center animate-pulse">Loading real-time records...</td></tr>
                            ) : filteredPayslips.map((ps) => (
                                <tr key={ps.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{ps.employeeName || 'Processing...'}</p>
                                            <p className="text-xs text-slate-500">{ps.employeeId}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{ps.month}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{ps.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${ps.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                                            ps.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {ps.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(ps.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleEmail(ps.id)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Send to Email"
                                            >
                                                <Mail className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(ps.id)}
                                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                title="Download PDF"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!fetching && filteredPayslips.length === 0 && (
                    <div className="py-20 text-center">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">No records found. Click "Generate" to create your first salary slip.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PaySlipPanel;
