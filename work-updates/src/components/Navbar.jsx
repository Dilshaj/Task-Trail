import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, X, Users, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useProjectFilter } from '../context/ProjectFilterContext';
import dilshajLogo from '../pages/dilshaj-logo.jpg';

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { employees } = useTasks();
    const { theme, toggleTheme } = useTheme();
    const { selectedProject } = useProjectFilter();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const searchContainerRef = useRef(null);
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setIsDropdownOpen(e.target.value.trim() !== '');
    };

    const handleEmployeeClick = (employee) => {
        setSearchQuery('');
        setIsDropdownOpen(false);
        setIsMobileSearchOpen(false);
        navigate(`/admin/employee/${employee.id}?project=${employee.projectId || ''}`);
    };

    const searchResults = isAdmin && employees
        ? employees
            .filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, 5)
        : [];

    return (
        <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 w-full sticky-header bg-white dark:bg-slate-900 border-b border-slate-200/40 dark:border-slate-800 transition-colors duration-300">

            {/* Logo and Menu Trigger */}
            <div className={`flex items-center gap-3 w-fit ${isMobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
                <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-md transition micro-interaction">
                    <Menu className="h-5 w-5" />
                </button>
                <div className="hidden md:block">
                    <img src={dilshajLogo} alt="Dilshaj Infotech" className="h-10 w-auto object-contain rounded-md" />
                </div>
                {selectedProject && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 ml-2 animate-in fade-in zoom-in duration-300">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Project: {selectedProject.name}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">

                {/* Search Bar Container */}
                <div
                    ref={searchContainerRef}
                    className={`relative w-full sm:w-64 sm:block ${isMobileSearchOpen ? 'block' : 'hidden'}`}
                >
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                        type="search"
                        placeholder="Search employee..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => { if (searchQuery.trim() !== '') setIsDropdownOpen(true) }}
                        className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-10 sm:pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white"
                    />

                    {/* Mobile Close Search */}
                    {isMobileSearchOpen && (
                        <button
                            className="absolute right-1 top-1 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 sm:hidden"
                            onClick={() => {
                                setIsMobileSearchOpen(false);
                                setSearchQuery('');
                                setIsDropdownOpen(false);
                            }}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {/* Search Dropdown */}
                    {isDropdownOpen && isAdmin && (
                        <div className="absolute top-11 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg overflow-hidden py-1 z-50">
                            {searchResults.length > 0 ? (
                                searchResults.map(emp => (
                                    <div
                                        key={emp.id}
                                        onClick={() => handleEmployeeClick(emp)}
                                        className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition border-b border-slate-50 dark:border-slate-700 last:border-none"
                                    >
                                        <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 object-cover" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{emp.name}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{emp.role}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400 text-center flex flex-col items-center gap-2">
                                    <Users className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                                    No employees found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile Search Trigger */}
                {!isMobileSearchOpen && isAdmin && (
                    <button
                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full sm:hidden transition micro-interaction"
                        onClick={() => setIsMobileSearchOpen(true)}
                    >
                        <Search className="h-5 w-5" />
                    </button>
                )}

                <button className={`relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition micro-interaction ${isMobileSearchOpen ? 'hidden sm:block' : 'block'}`}>
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500 border border-white dark:border-slate-900"></span>
                </button>

                {/* Theme Toggle Button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleTheme();
                    }}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition micro-interaction relative z-50"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>

                <div
                    onClick={() => navigate('/profile')}
                    className={`flex items-center gap-3 border-l border-slate-200/40 dark:border-slate-700 pl-4 ml-2 sm:ml-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 py-1.5 px-2 rounded-lg transition ${isMobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}
                >
                    <div className="text-right hidden sm:flex flex-col">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{employees?.find(e => e.id === user?.id)?.role || user?.role}</span>
                    </div>
                    <img src={user?.avatar} alt={user?.name} className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover shadow-sm bg-slate-100 dark:bg-slate-800" />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            logout();
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium ml-1 sm:ml-2 transition hidden sm:block"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
