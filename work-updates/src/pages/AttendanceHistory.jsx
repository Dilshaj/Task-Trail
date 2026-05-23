import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getMyAttendance } from '../services/attendanceService';
import { CalendarRange, LogIn, LogOut, Clock, Filter, ChevronRight, MapPin } from 'lucide-react';
import PageLoader from '../components/PageLoader';

const AttendanceHistory = () => {
    const { user } = useAuth();
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getMyAttendance();
                console.log("Fetched Attendance Data:", data);
                if (!data || data.length === 0) {
                    console.warn("No attendance logs returned from API");
                }
                setAttendanceHistory(data || []);
            } catch (err) {
                console.error("Failed to fetch attendance history:", err);
                setError(err.message || "Failed to load attendance history");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const filteredLogs = attendanceHistory.filter(log => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'completed') return !!log.checkOutTime;
        if (filterStatus === 'ongoing') return !log.checkOutTime;
        return true;
    });

    const getStatusStyles = (hasCheckedOut) => {
        if (hasCheckedOut) {
            return "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
        }
        return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 animate-pulse";
    };

    if (loading) return <PageLoader />;

    return (
        <Layout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="animate-fade-in-left">
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            <CalendarRange className="h-6 w-6" />
                        </div>
                        Attendance History
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                        Track your daily working hours and check-in locations. (ID: {user?.employee_id || user?.employeeId || 'Unknown'})
                    </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 animate-fade-in-right">
                    {['all', 'completed', 'ongoing'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                                filterStatus === status 
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-slate-800/50 rounded-[32px] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden animate-fade-in-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-5 px-6 font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em]">Date & Day</th>
                                    <th className="py-5 px-6 font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em]">In / Out Session</th>
                                    <th className="py-5 px-6 font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em]">Total Hours</th>
                                    <th className="py-5 px-6 font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em]">Captured Location</th>
                                    <th className="py-5 px-6 font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                                {error ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center text-rose-500 font-bold">
                                            {error}
                                        </td>
                                    </tr>
                                ) : filteredLogs.length > 0 ? (
                                    filteredLogs.map((log, idx) => {
                                        const checkInDate = log.checkInTime ? new Date(log.checkInTime) : null;
                                        const checkOutDate = log.checkOutTime ? new Date(log.checkOutTime) : null;
                                        
                                        // Calculate duration if both exist
                                        let duration = "On-going";
                                        if (checkInDate && checkOutDate) {
                                            const diffMs = checkOutDate - checkInDate;
                                            const diffHrs = Math.floor(diffMs / 3600000);
                                            const diffMins = Math.floor((diffMs % 3600000) / 60000);
                                            duration = `${diffHrs}h ${diffMins}m`;
                                        }

                                        return (
                                            <tr key={log.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-all duration-300 group">
                                                <td className="py-6 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                            {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                                                            <LogIn className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                                                {checkInDate ? checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                            </span>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-slate-300" />
                                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${log.checkOutTime ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                                            <LogOut className={`h-3.5 w-3.5 ${log.checkOutTime ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                                                            <span className={`text-xs font-bold ${log.checkOutTime ? 'text-rose-700 dark:text-rose-300' : 'text-slate-400'}`}>
                                                                {checkOutDate ? checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-2 rounded-full ${log.checkOutTime ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}></div>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{duration}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="flex items-start gap-2 max-w-[200px]">
                                                        <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic" title={log.locationName}>
                                                            {log.locationName || 'GPS Location Captured'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6 text-center">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${getStatusStyles(!!log.checkOutTime)}`}>
                                                        {log.checkOutTime ? 'Completed' : 'On-going'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center grayscale opacity-50">
                                                <CalendarRange className="h-16 w-16 text-slate-300 mb-4" />
                                                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">No attendance records found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-4">
                        <span>Showing {filteredLogs.length} Records</span>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
                        <span>Authorized Access Only</span>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Last Sync: {new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AttendanceHistory;
