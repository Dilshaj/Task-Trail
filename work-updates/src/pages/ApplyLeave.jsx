import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { CalendarRange, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { applyLeave } from '../services/leaveService';

const ApplyLeave = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        employee_id: user?.employee_id || user?.employeeId || '',
        leave_type: 'Sick',
        from_date: '',
        to_date: '',
        reason: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            await applyLeave(formData);
            setMessage({ type: 'success', text: 'Leave request submitted successfully!' });
            setFormData({
                employee_id: user?.employee_id || user?.employeeId || '',
                leave_type: 'Sick',
                from_date: '',
                to_date: '',
                reason: ''
            });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="mb-8 flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <CalendarRange className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Apply for Leave</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Submit your time off request for approval.</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="card-modern p-8 animate-fade-in-up">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {message.text && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                <span className="text-sm font-medium">{message.text}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Employee ID</label>
                                <input
                                    type="text"
                                    name="employee_id"
                                    value={formData.employee_id}
                                    disabled
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none cursor-not-allowed text-slate-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Leave Type</label>
                                <select
                                    name="leave_type"
                                    value={formData.leave_type}
                                    onChange={handleChange}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-sm"
                                    required
                                >
                                    <option value="Sick">Sick Leave</option>
                                    <option value="Casual">Casual Leave</option>
                                    <option value="Paid">Paid Leave</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">From Date</label>
                                <input
                                    type="date"
                                    name="from_date"
                                    value={formData.from_date}
                                    onChange={handleChange}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">To Date</label>
                                <input
                                    type="date"
                                    name="to_date"
                                    value={formData.to_date}
                                    onChange={handleChange}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Reason</label>
                            <textarea
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                rows="4"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-sm resize-none"
                                placeholder="Please provide a brief reason for your leave request..."
                                required
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-gradient rounded-xl py-4 text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting Request...
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    Submit Leave Application
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <CheckCircle2 className="h-3 w-3" />
                    Pending requests are usually reviewed within 24 hours
                </div>
            </div>
        </Layout>
    );
};

export default ApplyLeave;
