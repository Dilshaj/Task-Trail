import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjectFilter } from '../context/ProjectFilterContext';
import { Home, FolderKanban, Users, CheckSquare, Settings, X, LogOut, CalendarClock, FileText, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';
import dilshajLogo from '../pages/dilshaj-logo.jpg';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { selectedProject, clearProject } = useProjectFilter();
    const isAdmin = user?.role === 'admin';

    const menu = [
        // Common Dashboard
        {
            label: 'Dashboard',
            path: isAdmin ? (selectedProject ? '/project-dashboard' : '/admin') : '/dashboard',
            icon: <Home className="h-5 w-5" />
        },

        // Global Admin Items (Visible when NOT in a project context)
        { label: 'Projects', path: '/admin', icon: <FolderKanban className="h-5 w-5" />, hidden: !isAdmin || !!selectedProject },
        { label: 'Offer Letter', path: '/admin/offer-letter', icon: <FileText className="h-5 w-5" />, hidden: !isAdmin || !!selectedProject },
        { label: 'Pay Slip', path: '/admin/pay-slip', icon: <FileText className="h-5 w-5" />, hidden: !isAdmin || !!selectedProject },

        // Project-Specific Admin Items (Visible ONLY when a project is active)
        { label: 'Employees', path: '/admin/employees', icon: <Users className="h-5 w-5" />, hidden: !isAdmin },
        { label: 'Attendance', path: '/admin/attendance', icon: <CalendarClock className="h-5 w-5" />, hidden: !isAdmin || !selectedProject },
        { label: 'Leaves', path: '/admin/leaves', icon: <CalendarClock className="h-5 w-5" />, hidden: !isAdmin || !selectedProject },

        // Employee Sidebar Items
        { label: 'Tasks', path: '/dashboard', icon: <CheckSquare className="h-5 w-5" />, hidden: isAdmin },
        { label: 'Leaves', path: '/leaves', icon: <CalendarClock className="h-5 w-5" />, hidden: isAdmin },
        { label: 'Offer Letter', path: '/offer-letter', icon: <FileText className="h-5 w-5" />, hidden: isAdmin },
    ].filter(item => !item.hidden);

    return (
        <aside className={clsx(
            "fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200/40 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 lg:translate-x-0 lg:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#3b82f6] px-6">
                <div className="flex items-center gap-3">
                    <img src={dilshajLogo} alt="Dilshaj Infotech" className="h-11 w-auto object-contain rounded-lg shadow-sm" />
                </div>
                <button onClick={onClose} className="lg:hidden text-white hover:bg-white/10 p-1.5 rounded-xl transition">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-auto py-4">
                {isAdmin && selectedProject && (
                    <div className="mx-4 mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 animate-fade-in">
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Active Project</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate pr-2">{selectedProject.name}</span>
                            <button
                                onClick={clearProject}
                                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition text-blue-600 dark:text-blue-400"
                                title="Exit Project Context"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
                <nav className="grid gap-1 px-4">
                    {isAdmin && selectedProject && (
                        <NavLink
                            to="/admin"
                            onClick={() => { clearProject(); onClose(); }}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all mb-1"
                        >
                            <ChevronLeft className="h-5 w-5" />
                            Back to Global
                        </NavLink>
                    )}
                    {menu.map((item, idx) => (
                        <NavLink
                            key={idx}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                                isActive
                                    ? "bg-blue-50 text-blue-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                    : "text-slate-600 dark:text-slate-400"
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-slate-200/40 dark:border-slate-800 flex flex-col gap-2">
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Settings className="h-5 w-5" />
                    Settings
                </button>
                <button
                    onClick={user ? logout : undefined}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                    <LogOut className="h-5 w-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
