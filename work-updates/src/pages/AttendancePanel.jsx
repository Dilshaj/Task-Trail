import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAttendance } from '../context/AttendanceContext';
import { Calendar, Clock, User, LogIn, LogOut, Search, X, Download, FileSpreadsheet, MapPin, RotateCw, ExternalLink } from 'lucide-react';
import { formatDate, calculateActiveHours } from '../utils/helpers';
import { exportAttendanceToExcel } from '../services/attendanceService';

const AttendancePanel = () => {
    const { logs, fetchLogs } = useAttendance();
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await fetchLogs();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const getLocalDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [filterDate, setFilterDate] = useState(getLocalDate());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // 🛡️ Data Resilience: Handle multiple date formats (DD-MM-YYYY, YYYY-MM-DD, etc)
    const normalizeDate = (dateStr) => {
        if (!dateStr) return "";
        const clean = String(dateStr).trim();
        // If already YYYY-MM-DD, return as is
        if (clean.match(/^\d{4}-\d{2}-\d{2}$/)) return clean;
        // If DD-MM-YYYY, convert to YYYY-MM-DD
        const parts = clean.split(/[-/]/);
        if (parts.length === 3) {
            if (parts[0].length === 2 && parts[2].length === 4) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
        return clean;
    };

    const filteredLogs = logs.filter(log => {
        const userName = log.userName || log.employeeId || 'Unknown';
        const matchName = userName.toLowerCase().includes(searchQuery.toLowerCase());

        const normLogDate = normalizeDate(log.date);
        const normFilterDate = normalizeDate(filterDate);
        const matchDate = filterDate ? normLogDate === normFilterDate : true;

        return matchName && matchDate;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // 🚨 EMERGENCY DEBUG
    React.useEffect(() => {
        if (logs.length > 0) {
            console.log("�️ DASHBOARD DATA DUMP:", logs[0]);
            console.log("📅 CURRENT FILTER DATE:", filterDate);
            console.log("📋 FILTERED COUNT:", filteredLogs.length);
        }
    }, [logs, filteredLogs.length, filterDate]);

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        const sanitized = typeof isoString === 'string' ? isoString.replace('+00:00Z', 'Z') : isoString;
        const d = new Date(sanitized);
        if (isNaN(d.getTime())) return '--:--';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const exportToExcel = (dataToExport, fileName) => {
        const headers = ['Employee Name', 'Date', 'Check In Time', 'Check Out Time', 'Active Hours', 'Status'];
        const csvRows = dataToExport.map(log => [
            `"${log.userName}"`,
            log.date,
            `"${formatTime(log.checkInTime)}"`,
            `"${formatTime(log.checkOutTime)}"`,
            `"${calculateActiveHours(log.checkInTime, log.checkOutTime)}"`,
            log.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + csvRows.map(row => row.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const employeeHistoryLogs = selectedEmployee
        ? logs.filter(log => log.userId === selectedEmployee.userId).sort((a, b) => new Date(b.date) - new Date(a.date))
        : [];

    return (
        <Layout>
            <div className="mb-6 flex flex-col items-start gap-5">
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Employee Attendance</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track check-ins and check-outs across the team.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border ${isRefreshing
                                ? 'bg-slate-50 text-slate-400 border-slate-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                                }`}
                        >
                            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Syncing...' : 'Refresh'}
                        </button>

                        <button
                            onClick={exportAttendanceToExcel}
                            className="flex items-center justify-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    {/* Search Field */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto">
                        <Search className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="text-sm outline-none bg-transparent font-medium text-slate-700 dark:text-slate-200 w-full sm:w-48 placeholder:text-slate-400"
                        />
                        {searchQuery && (
                            <X
                                className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition"
                                onClick={() => setSearchQuery('')}
                            />
                        )}
                    </div>

                    {/* Date Picker */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto">
                        <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="text-sm outline-none bg-transparent font-medium text-slate-700 dark:text-slate-200 w-full sm:w-auto"
                        />
                        {filterDate && (
                            <X
                                className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition"
                                onClick={() => setFilterDate('')}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="card-modern overflow-hidden animate-fade-in-up stagger-1 shadow-sm hover:shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/40 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Employee</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Check In</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Check Out</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Active Hours</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Location</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y border-t-0 border-slate-200/40 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                        <td
                                            className="px-6 py-4 font-medium flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                                            onClick={() => setSelectedEmployee({ userId: log.userId, userName: log.userName })}
                                        >
                                            <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                            {log.userName}
                                        </td>
                                        <td className="px-6 py-4">
                                            {formatDate(log.date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-blue-600">
                                                <LogIn className="h-4 w-4" />
                                                {formatTime(log.checkInTime)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <LogOut className="h-4 w-4" />
                                                {formatTime(log.checkOutTime)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-indigo-300">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-4 w-4 text-indigo-500" />
                                                {calculateActiveHours(log.checkInTime, log.checkOutTime)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.locationName ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                        <MapPin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                                        <span className="text-xs font-medium truncate max-w-[180px] lg:max-w-[250px]" title={log.locationName}>
                                                            {log.locationName}
                                                        </span>
                                                    </div>
                                                    {log.latitude && log.longitude && (
                                                        <a 
                                                            href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold ml-5 transition-colors group"
                                                        >
                                                            <span>View Exact Live Location</span>
                                                            <ExternalLink className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">Not captured</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${log.status === 'Checked In'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                {log.status === 'Checked In' && (
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                )}
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                                        <p>No attendance logs found for this date.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Employee History Modal */}
            {selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
                    <div className="card-modern w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
                            <div className="flex flex-col">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                    {selectedEmployee.userName}'s Attendance History
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Complete track record of check-ins and check-outs.</p>
                            </div>
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto bg-white dark:bg-slate-900 transition-colors duration-300">
                            <div className="mb-4 flex justify-end">
                                <button
                                    onClick={exportAttendanceToExcel}
                                    className="flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Export User Data to Excel
                                </button>
                            </div>
                            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Check In</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Check Out</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Active Hours</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Location</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y border-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                        {employeeHistoryLogs.length > 0 ? (
                                            employeeHistoryLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                                    <td className="px-4 py-3 font-medium dark:text-slate-200">{formatDate(log.date)}</td>
                                                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">
                                                        {formatTime(log.checkInTime)}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                                        {formatTime(log.checkOutTime)}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-indigo-600 dark:text-indigo-400">
                                                        {calculateActiveHours(log.checkInTime, log.checkOutTime)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {log.locationName ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                                                                    <MapPin className="h-3 w-3 text-blue-400 flex-shrink-0" />
                                                                    <span className="truncate max-w-[150px]" title={log.locationName}>{log.locationName}</span>
                                                                </div>
                                                                {log.latitude && log.longitude && (
                                                                    <a 
                                                                        href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="text-[9px] text-indigo-500 hover:underline ml-4 font-bold flex items-center gap-0.5"
                                                                    >
                                                                        Exact Map <ExternalLink className="h-2 w-2" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ) : "--"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${log.status === 'Checked In'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-6 text-center text-slate-500 text-sm">
                                                    <Clock className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                                                    No attendance logs available.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AttendancePanel;
