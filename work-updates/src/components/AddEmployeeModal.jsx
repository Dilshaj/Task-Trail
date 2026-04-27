import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { searchEmployee, assignEmployeeToProject } from '../services/taskService';
import { useTasks } from '../context/TaskContext';

const DEBOUNCE_MS = 500;

const AddEmployeeModal = ({ isOpen, onClose, onAdd, projectId, projectName }) => {
    const { refreshEmployees } = useTasks();
    const [employeeId, setEmployeeId] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('');

    // Holds the UUID of the employee found in DB (null if new / not found)
    const [foundEmployee, setFoundEmployee] = useState(null);

    // Per-field search status: idle | searching | found | not-found
    const [idStatus, setIdStatus] = useState('idle');
    const [nameStatus, setNameStatus] = useState('idle');

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Debounce timers
    const idTimer = useRef(null);
    const nameTimer = useRef(null);

    // Reset when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setEmployeeId('');
            setName('');
            setRole('');
            setFoundEmployee(null);
            setIdStatus('idle');
            setNameStatus('idle');
            setSubmitError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // ── Helpers ────────────────────────────────────────────
    const applyFound = (emp) => {
        setFoundEmployee(emp);
        setEmployeeId(emp.employeeId || '');
        setName(emp.name || '');
        setRole(emp.role || emp.title || '');
    };

    const clearFound = () => setFoundEmployee(null);

    // ── Employee ID change ─────────────────────────────────
    const handleIdChange = (e) => {
        const val = e.target.value.replace(/\D/g, ''); // digits only
        setEmployeeId(val);
        clearFound();
        setIdStatus('idle');

        clearTimeout(idTimer.current);
        if (!val) return;

        idTimer.current = setTimeout(async () => {
            setIdStatus('searching');
            const emp = await searchEmployee({ employeeId: val });
            if (emp) {
                applyFound(emp);
                setIdStatus('found');
                setNameStatus('idle');
            } else {
                setIdStatus('not-found');
            }
        }, DEBOUNCE_MS);
    };

    // ── Employee Name change ───────────────────────────────
    const handleNameChange = (e) => {
        const val = e.target.value;
        setName(val);
        clearFound();
        setNameStatus('idle');

        clearTimeout(nameTimer.current);
        if (!val || val.length < 2) return;

        nameTimer.current = setTimeout(async () => {
            setNameStatus('searching');
            const emp = await searchEmployee({ name: val });
            if (emp) {
                applyFound(emp);
                setNameStatus('found');
                setIdStatus('idle');
            } else {
                setNameStatus('not-found');
            }
        }, DEBOUNCE_MS);
    };

    // ── Submit ─────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        if (!employeeId || !name || !role) return;

        setSubmitting(true);
        try {
            if (foundEmployee) {
                // Employee already exists in DB → reassign to this project
                await assignEmployeeToProject(foundEmployee.id, projectId);
                await refreshEmployees(); // sync context state from server
            } else {
                // Brand-new employee → create via context/API
                await onAdd({ employeeId, name, role, projectId });
            }
            onClose();
        } catch (err) {
            setSubmitError(err.message || 'Failed to add employee. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── CSS helpers ────────────────────────────────────────
    const inputBase = 'w-full rounded-xl border bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none transition focus:ring-2 dark:text-white dark:placeholder:text-slate-500';
    const inputNormal = `${inputBase} border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-blue-100 dark:focus:ring-indigo-900/50`;
    const inputFound = `${inputBase} border-emerald-400 dark:border-emerald-600 focus:border-emerald-500 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20`;

    const getInput = (status) => status === 'found' ? inputFound : inputNormal;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-all duration-300">
            <div className="w-full max-w-md card-modern dark:bg-slate-900 animate-fade-in-up">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Add Employee
                    </h2>
                    <button onClick={onClose} className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                        Adding an employee to <span className="font-semibold text-slate-700 dark:text-slate-200">{projectName}</span>.
                    </div>

                    <div className="space-y-4">

                        {/* ── Employee ID ── */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Employee ID
                                <span className="ml-1 text-xs font-normal text-slate-400">(numbers only)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    required
                                    value={employeeId}
                                    onChange={handleIdChange}
                                    className={getInput(idStatus)}
                                    placeholder="e.g. 1001"
                                />
                                {idStatus === 'searching' && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
                                )}
                                {idStatus === 'found' && (
                                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                )}
                            </div>
                            {idStatus === 'found' && (
                                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Employee found — fields auto-filled.
                                </p>
                            )}
                            {idStatus === 'not-found' && (
                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Not found — fill details below to create a new employee.
                                </p>
                            )}
                        </div>

                        {/* ── Employee Name ── */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Employee Name
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={handleNameChange}
                                    className={getInput(nameStatus)}
                                    placeholder="e.g. Michael Scott"
                                />
                                {nameStatus === 'searching' && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
                                )}
                                {nameStatus === 'found' && (
                                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                )}
                            </div>
                            {nameStatus === 'found' && (
                                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Employee found — fields auto-filled.
                                </p>
                            )}
                            {nameStatus === 'not-found' && (
                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Not found — fill details below to create a new employee.
                                </p>
                            )}
                        </div>

                        {/* ── Role ── */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Role / Job Title
                            </label>
                            <input
                                type="text"
                                required
                                value={role}
                                onChange={(e) => { setRole(e.target.value); clearFound() }}
                                className={getInput(foundEmployee ? 'found' : 'idle')}
                                placeholder="e.g. Backend Developer"
                            />
                        </div>

                    </div>

                    {/* Submit error */}
                    {submitError && (
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {submitError}
                        </div>
                    )}

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg btn-gradient px-4 py-2 text-sm font-medium text-white shadow-shadow-soft disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {submitting ? 'Adding...' : 'Add Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
