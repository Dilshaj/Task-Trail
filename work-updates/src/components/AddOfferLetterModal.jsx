import React, { useState } from 'react';
import { X, FileText, Send, Building, User, Briefcase, Calendar, MapPin, DollarSign } from 'lucide-react';
import { saveOfferLetter } from '../services/offerLetterService';

const AddOfferLetterModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        employee_id: '',
        employee_name: '',
        role: '',
        joining_date: '',
        location: '',
        package: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            await saveOfferLetter(formData);
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setFormData({
                    employee_id: '',
                    employee_name: '',
                    role: '',
                    joining_date: '',
                    location: '',
                    package: ''
                });
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg card-modern dark:bg-slate-900 overflow-hidden shadow-2xl animate-fade-in-up">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-white/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Generate Offer Letter</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Employee ID</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    name="employee_id"
                                    type="text"
                                    required
                                    value={formData.employee_id}
                                    onChange={handleChange}
                                    className="input-modern pl-10 h-11 text-sm bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 dark:text-white w-full rounded-xl"
                                    placeholder="EMP-001"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Employee Name</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    name="employee_name"
                                    type="text"
                                    required
                                    value={formData.employee_name}
                                    onChange={handleChange}
                                    className="input-modern pl-10 h-11 text-sm bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 dark:text-white w-full rounded-xl"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Role / Designation</label>
                            <div className="relative group">
                                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    name="role"
                                    type="text"
                                    required
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="input-modern pl-10 h-11 text-sm bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 dark:text-white w-full rounded-xl"
                                    placeholder="Full Stack Developer"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Joining Date</label>
                            <div className="relative group">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    name="joining_date"
                                    type="text"
                                    required
                                    value={formData.joining_date}
                                    onChange={handleChange}
                                    className="input-modern pl-10 h-11 text-sm bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 dark:text-white w-full rounded-xl"
                                    placeholder="e.g. 15th Sept 2025"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Location</label>
                            <div className="relative group">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    name="location"
                                    type="text"
                                    required
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="input-modern pl-10 h-11 text-sm bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 dark:text-white w-full rounded-xl"
                                    placeholder="Remote / Bangalore"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Package (CTC)</label>
                            <div className="relative group">
                                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    name="package"
                                    type="text"
                                    required
                                    value={formData.package}
                                    onChange={handleChange}
                                    className="input-modern pl-10 h-11 text-sm bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 dark:text-white w-full rounded-xl"
                                    placeholder="e.g. 6.5 LPA"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium animate-in slide-in-from-top duration-300">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-top duration-300">
                            Offer Letter details saved successfully!
                        </div>
                    )}

                    <div className="mt-8 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] rounded-xl btn-gradient px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {loading ? 'Processing...' : 'Generate & Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddOfferLetterModal;
