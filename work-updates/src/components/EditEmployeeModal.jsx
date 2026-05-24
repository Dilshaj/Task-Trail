import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle, Shield, User } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';

const domainOptions = [
    "Frontend Developer",
    "Backend Developer",
    "Python Developer",
    "Data Analyst",
    "DevOps",
    "Cyber Security",
    "UI/UX Designer",
    "QA Tester",
    "Other"
];

const EditEmployeeModal = ({ isOpen, onClose, onSave, employee }) => {
    const { projects } = useProjects();
    const { user } = useAuth();
    const isTeamLead = user?.role?.toUpperCase() === 'TEAM_LEAD';

    const [formState, setFormState] = useState({
        name: '',
        role: '',
        email: '',
        projectId: '',
        joiningDate: '',
        password: ''
    });

    const [selectedDomain, setSelectedDomain] = useState('Frontend Developer');
    const [customRole, setCustomRole] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Format ISO/other date string to YYYY-MM-DD for date input
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (e) {
            console.error('Date parsing error:', e);
        }
        return '';
    };

    // Load employee details into formState
    useEffect(() => {
        if (isOpen && employee) {
            const empRole = employee.role || '';
            const isPredefined = domainOptions.includes(empRole);
            setFormState({
                name: employee.name || '',
                role: empRole,
                email: employee.email || '',
                projectId: employee.projectId || employee.project_id || '',
                joiningDate: formatDateForInput(employee.joiningDate || employee.joining_date),
                password: ''
            });
            setSelectedDomain(isPredefined ? empRole : (empRole ? 'Other' : 'Frontend Developer'));
            setCustomRole(isPredefined ? '' : empRole);
            setSubmitError('');
        }
    }, [isOpen, employee]);

    const handleDomainChange = (e) => {
        const val = e.target.value;
        setSelectedDomain(val);
        if (val !== 'Other') {
            handleChange('role', val);
        } else {
            handleChange('role', customRole);
        }
    };

    const handleCustomRoleChange = (e) => {
        const val = e.target.value;
        setCustomRole(val);
        handleChange('role', val);
    };

    if (!isOpen || !employee) return null;

    const handleChange = (field, value) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitting(true);

        const payload = {
            name: formState.name,
            role: formState.role,
            email: formState.email,
            project_id: formState.projectId || null,
            joining_date: formState.joiningDate || null
        };

        // Include password if populated
        if (formState.password.trim()) {
            if (formState.password.length < 6) {
                setSubmitError('Password must be at least 6 characters.');
                setSubmitting(false);
                return;
            }
            payload.password = formState.password;
        }

        try {
            await onSave(employee.id, payload);
            onClose();
        } catch (err) {
            setSubmitError(err.message || 'Failed to update employee details. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const inputBase = 'w-full rounded-xl border bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none transition focus:ring-2 dark:text-white dark:placeholder:text-slate-500 border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-blue-100 dark:focus:ring-indigo-900/50';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-8 py-5 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            Edit Employee Details
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Modify profile and project settings for {employee.name}</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Employee Name</label>
                            <input
                                type="text"
                                required
                                value={formState.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className={inputBase}
                                placeholder="Employee Name..."
                            />
                        </div>

                        {/* Email */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                            <input
                                type="email"
                                required
                                value={formState.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className={inputBase}
                                placeholder="email@worksheet.local"
                            />
                        </div>

                        {/* Domain Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Domain</label>
                            <select
                                value={selectedDomain}
                                onChange={handleDomainChange}
                                className={inputBase}
                            >
                                {domainOptions.map((opt) => (
                                    <option key={opt} value={opt} className="dark:bg-slate-900">{opt}</option>
                                ))}
                            </select>
                        </div>

                        {selectedDomain === 'Other' && (
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Custom Role / Job Title</label>
                                <input
                                    type="text"
                                    required
                                    value={customRole}
                                    onChange={handleCustomRoleChange}
                                    className={inputBase}
                                    placeholder="e.g. Sales Manager"
                                />
                            </div>
                        )}

                        {/* Project */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Project</label>
                            <select
                                value={formState.projectId}
                                onChange={(e) => handleChange('projectId', e.target.value)}
                                disabled={isTeamLead}
                                className={`${inputBase} appearance-none ${isTeamLead ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                <option value="">No Project Assigned</option>
                                {projects.map(proj => (
                                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Joining Date */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Joining Date</label>
                            <input
                                type="date"
                                required
                                value={formState.joiningDate}
                                onChange={(e) => handleChange('joiningDate', e.target.value)}
                                className={inputBase}
                            />
                        </div>

                        {/* Password Reset */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Password (Optional)</label>
                            <input
                                type="password"
                                value={formState.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                className={inputBase}
                                placeholder="New password (min 6 chars)"
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    {/* Error Alerts */}
                    {submitError && (
                        <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 animate-fade-in">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">{submitError}</span>
                        </div>
                    )}

                    {/* Footer Buttons */}
                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 active:scale-95 transition-all"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEmployeeModal;
