import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { getAttendanceLogs, checkIn, checkOut, getCurrentStatus, getTodayStatus } from '../services/attendanceService';
import { useAuth } from './AuthContext';
import { useProjectFilter } from './ProjectFilterContext';
import FaceVerificationModal from '../components/FaceVerificationModal';

const AttendanceContext = createContext();

export const useAttendance = () => {
    const context = useContext(AttendanceContext);
    if (context === undefined) {
        // Fallback to avoid complete crash on dashboard
        return {
            logs: [],
            activeLog: null,
            handleCheckIn: () => { },
            handleCheckOut: () => { }
        };
    }
    return context;
};

const getISTDate = () => {
    const utc = Date.now() + (new Date().getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));
    const year = ist.getFullYear();
    const month = String(ist.getMonth() + 1).padStart(2, '0');
    const day = String(ist.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    const clean = String(dateStr).trim();
    if (clean.match(/^\d{4}-\d{2}-\d{2}$/)) return clean;
    const parts = clean.split(/[-/]/);
    if (parts.length === 3) {
        if (parts[0].length === 2 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    return clean;
};

export const AttendanceProvider = ({ children }) => {
    const { user } = useAuth();
    const { selectedProjectId } = useProjectFilter();
    const [logs, setLogs] = useState([]);
    
    const [activeLog, setActiveLog] = useState(null);
    const [attendanceState, setAttendanceState] = useState({
        checked_in: false,
        checked_out: false
    });

    const [isUpdating, setIsUpdating] = useState(false);
    const [locationStatus, setLocationStatus] = useState(''); // '', 'Searching GPS...', 'Falling back to IP...', 'Success'
    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
    const [pendingCheckInData, setPendingCheckInData] = useState(null);

    const updatingRef = React.useRef(false);

    const fetchLogs = useCallback(async (isBackground = false) => {
        if (!user || updatingRef.current) return;

        updatingRef.current = true;
        setIsUpdating(true);
        try {
            const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';
            const projId = isAdmin ? selectedProjectId : (user.projectId || user.project_id);
            
            // 🚀 Fetch history and today's status in parallel to prevent N+1 and slow query blocking
            const [logsData, statusData] = await Promise.all([
                getAttendanceLogs(projId).catch(err => {
                    console.error("Failed to fetch history logs:", err);
                    return [];
                }),
                getTodayStatus().catch(err => {
                    console.error("Failed to fetch today status:", err);
                    return null;
                })
            ]);

            setLogs(logsData);

            if (statusData) {
                setAttendanceState({
                    checked_in: statusData.checked_in,
                    checked_out: statusData.checked_out
                });
                if (statusData.checked_in && !statusData.checked_out) {
                    setActiveLog(statusData.active_log || { check_in: statusData.check_in_raw });
                } else {
                    setActiveLog(null);
                }
            }
        } catch (error) {
            console.error("❌ Failed to fetch attendance logs:", error);
        } finally {
            updatingRef.current = false;
            setIsUpdating(false);
        }
    }, [user, selectedProjectId]); // Removed isUpdating from deps to prevent re-creation loop
    
    // Removed localStorage sync effect

    useEffect(() => {
        fetchLogs();
    }, [selectedProjectId, user?.id]); // Only re-fetch on project change or user change

    const [loading, setLoading] = useState(false);

    const [popup, setPopup] = useState(null); // { title: '...', message: '...', type: '...' }

    const checkTodayAttendanceStatus = () => {
        if (!user) return { canCheckIn: false, error: 'User not loaded' };
        
        const empId = user.employee_id || user.employeeId || user.id;
        const todayStr = getISTDate();
        
        // Find if there is an attendance log for today
        const todayLog = logs.find(l => 
            String(l.employeeId) === String(empId) && 
            normalizeDate(l.date) === todayStr
        );
        
        if (todayLog) {
            if (todayLog.checkOutTime || todayLog.check_out || todayLog.checkOut) {
                return {
                    canCheckIn: false,
                    error: "Today's Check-In & Check-Out Already Completed"
                };
            } else {
                return {
                    canCheckIn: false,
                    error: "Already Checked In"
                };
            }
        }
        
        // Check activeLog as well to be absolutely sure
        if (activeLog && normalizeDate(activeLog.date) === todayStr) {
             return {
                 canCheckIn: false,
                 error: "Already Checked In"
             };
        }
        
        return { canCheckIn: true };
    };

    const handleCheckIn = async (descriptorArg = null, faceImageArg = null) => {
        if (!user || loading) return;

        const isEvent = descriptorArg && (descriptorArg.nativeEvent || descriptorArg instanceof Event);
        const faceDescriptor = isEvent ? null : descriptorArg;
        const faceImage = isEvent ? null : faceImageArg;

        // If no face descriptor provided, check status first
        if (!faceDescriptor) {
            const statusCheck = checkTodayAttendanceStatus();
            if (!statusCheck.canCheckIn) {
                setPopup({
                    title: "Attendance Restricted",
                    message: statusCheck.error,
                    type: "warning"
                });
                return;
            }
            
            // Check if user has face registered
            const hasFace = user.hasFaceEncoding || user.has_face_encoding;
            if (!hasFace) {
                setPopup({
                    title: "Biometric Registration Required",
                    message: "You haven't registered your face yet. Please go to your Profile and click 'Register My Face' to enable attendance features.",
                    type: "error"
                });
                return;
            }

            setIsFaceModalOpen(true);
            return;
        }

        setLoading(true);
        
        const empId = user.employee_id || user.employeeId;

        // 🕒 1. Strict Time Check (IST: UTC+5:30)
        const utc = Date.now() + (new Date().getTimezoneOffset() * 60000);
        const ist = new Date(utc + (3600000 * 5.5));
        const hour = ist.getHours();
        
        if (hour < 8) {
            setPopup({
                title: "Check-in Blocked",
                message: "Check-in not started. Standard check-in time begins at 8:00 AM.",
                type: "warning"
            });
            setLoading(false);
            return;
        }
        if (hour >= 21) {
            setPopup({
                title: "Check-in Blocked",
                message: "Check-in closed after 9 PM",
                type: "warning"
            });
            setLoading(false);
            return;
        }

        let latitude = null;
        let longitude = null;
        let locationName = null;
        let locationSource = null;

        // 🌐 Try browser geolocation — Prioritize this for "LIVE" location
        const getBrowserLocation = () => {
            return new Promise((resolve) => {
                const isSecure = window.isSecureContext || 
                               window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1';

                if (!navigator.geolocation) {
                    console.warn("📍 Geolocation API not supported or blocked by browser.");
                    resolve({ error: 'unsupported' });
                    return;
                }

                if (!isSecure) {
                    const hostname = window.location.hostname;
                    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
                    
                    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !isIpAddress) {
                        const httpsUrl = `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
                        console.warn(`🔒 Insecure context. Redirecting to Secure HTTPS for GPS: ${httpsUrl}`);
                        
                        setTimeout(() => {
                            window.location.replace(httpsUrl);
                        }, 1000);
                        
                        resolve({ error: 'redirecting_https' });
                        return;
                    }

                    console.warn("📍 Geolocation not available: insecure context (HTTP). GPS access is restricted to HTTPS.");
                    resolve({ error: 'insecure_or_unsupported' });
                    return;
                }

                let best = null;
                const startedAt = Date.now();
                const maxWaitMs = 15000;
                const targetAccuracyM = 100;

                const stopAndResolve = (payload) => {
                    if (watchId != null) navigator.geolocation.clearWatch(watchId);
                    clearTimeout(finalTimeout);
                    resolve(payload);
                };

                const watchId = navigator.geolocation.watchPosition(
                    (pos) => {
                        const candidate = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            accuracy: pos.coords.accuracy,
                            source: 'gps'
                        };
                        
                        if (!best || candidate.accuracy < best.accuracy) {
                            best = candidate;
                        }

                        const elapsed = Date.now() - startedAt;
                        console.log(`📍 GPS Candidate: accuracy=${Math.round(candidate.accuracy)}m elapsed=${elapsed}ms`);

                        if (candidate.accuracy <= targetAccuracyM) {
                            stopAndResolve(candidate);
                        }
                    },
                    (err) => {
                        console.warn(`❌ GPS Capture Error: ${err.message} (Code: ${err.code})`);
                        if (!best) {
                            stopAndResolve({ error: `gps_failed_${err.code}`, message: err.message });
                        }
                    },
                    {
                        timeout: 10000,
                        enableHighAccuracy: true,
                        maximumAge: 0
                    }
                );

                const finalTimeout = setTimeout(() => {
                    if (best) {
                        console.log("📍 GPS Timeout: Using best candidate found so far");
                        stopAndResolve(best);
                    } else {
                        console.warn("📍 GPS Timeout: No position found");
                        stopAndResolve({ error: 'gps_timeout' });
                    }
                }, maxWaitMs);
            });
        };

        try {
            setLocationStatus('Searching GPS...');
            let coords = await getBrowserLocation();
            
            if (coords?.error) {
                if (coords.error === 'redirecting_https') return;
                
                console.warn("🚨 Check-in rejected: GPS unavailable/denied:", coords.error);
                throw new Error('Location permission is required to check in. Please enable GPS and try again.');
            } else {
                setLocationStatus('GPS Fix Found! Resolving address...');
            }

            if (coords?.source === 'gps' && coords?.accuracy && coords.accuracy > 150) {
                console.warn(`⚠️ GPS accuracy is low (${Math.round(coords.accuracy)}m)`);
            }

            if (coords) {
                latitude = coords.lat;
                longitude = coords.lng;
                locationSource = coords.source || null;
                
                if (!locationName) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                            { signal: controller.signal, headers: { 'Accept-Language': 'en', 'User-Agent': 'EduProva' } }
                        );
                        clearTimeout(timeoutId);
                        const data = await response.json();
                        
                        if (data && data.address) {
                            const addr = data.address;
                            const detail = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
                            const city = addr.city || addr.town || addr.village || addr.state_district || '';
                            const state = addr.state || '';
                            
                            const parts = [detail, city, state].filter(Boolean);
                            locationName = parts.length > 0 ? parts.join(', ') : 'Location Captured';
                            
                            if (coords.source === 'gps') {
                                locationName = `📍 ${locationName}`;
                            }
                        }
                    } catch (err) {
                        console.error("Reverse geocode error:", err);
                        locationName = coords.source === 'gps' ? '📍 GPS Location Captured' : 'IP Location Captured';
                    }
                }
            }

            setLocationStatus('Finalizing check-in...');
            const payload = {
                employeeId: empId,
                location_name: locationName || 'Auto-detected Location',
                face_descriptor: faceDescriptor,
                face_image: faceImage
            };
            if (latitude !== null) payload.latitude = Number(latitude);
            if (longitude !== null) payload.longitude = Number(longitude);
            if (locationSource) payload.location_source = locationSource;
            if (coords?.accuracy != null) payload.location_accuracy = Number(coords.accuracy);

            const newLog = await checkIn(payload);
            setLocationStatus('Success!');

            if (newLog.already_checked_in) {
                setLogs(prev => prev.map(l => l.id === newLog.id ? { ...l, ...newLog } : l));
                setActiveLog(newLog);
                setAttendanceState({
                    checked_in: true,
                    checked_out: false
                });
                setPopup({
                    title: "Already Checked In",
                    message: "Already Checked In",
                    type: "warning"
                });
                setTimeout(() => setLocationStatus(''), 2000);
                return;
            }

            setLogs(prev => [newLog, ...prev]);
            setActiveLog(newLog);
            setAttendanceState({
                checked_in: true,
                checked_out: false
            });
            setPopup({
                title: "Check-In Successful",
                message: "Your attendance check-in is complete.",
                type: "success"
            });
            setTimeout(() => setLocationStatus(''), 2000);
        } catch (error) {
            setLocationStatus('Error');
            const msg = error.message || '';

            if (msg.includes('Face not registered') || msg.includes('Face Not Registered')) {
                setPopup({
                    title: "Biometric Registration Required",
                    message: "You haven't registered your face yet. Please go to your Profile and click 'Register My Face' to enable attendance features.",
                    type: "error"
                });
            } else if (msg.includes('Today\'s Attendance Already Completed') || msg.includes('Today\'s Check-In & Check-Out Already Completed')) {
                setPopup({
                    title: "Attendance Completed",
                    message: "Today's Check-In & Check-Out Already Completed",
                    type: "warning"
                });
                await fetchLogs(true);
            } else if (msg.includes('Already Checked In')) {
                setPopup({
                    title: "Attendance Warning",
                    message: "Already Checked In",
                    type: "warning"
                });
                await fetchLogs(true);
            } else if (msg.includes('Already Checked Out')) {
                setPopup({
                    title: "Attendance Warning",
                    message: "Already Checked Out",
                    type: "warning"
                });
                await fetchLogs(true);
            } else if (msg.includes('Face Not Matched')) {
                setPopup({
                    title: "Verification Failed",
                    message: "Face Not Matched",
                    type: "error"
                });
            } else {
                const display = (msg.includes('[object Object]') || !msg)
                    ? 'A connection error occurred. Please try again.'
                    : msg;
                setPopup({
                    title: "Check-In Failed",
                    message: display,
                    type: "error"
                });
            }
            
            setTimeout(() => setLocationStatus(''), 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!user) return;
        
        if (!activeLog) {
            setPopup({
                title: "Check-Out Blocked",
                message: "No active check-in found for today.",
                type: "error"
            });
            return;
        }

        const empId = user.employee_id || user.employeeId;
        try {
            const updatedLog = await checkOut(user.id, empId);
            if (updatedLog) {
                setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
                setActiveLog(null);
                setAttendanceState({
                    checked_in: false,
                    checked_out: true
                });
                setPopup({
                    title: "Check-Out Successful",
                    message: "You have checked out successfully for today.",
                    type: "success"
                });
            }
        } catch (error) {
            const msg = error.message || "Check-out failed.";
            if (msg.includes('Already Checked Out')) {
                setPopup({
                    title: "Already Checked Out",
                    message: "Already Checked Out",
                    type: "warning"
                });
                await fetchLogs(true);
            } else if (msg.includes('Already Checked In')) {
                setPopup({
                    title: "Attendance Warning",
                    message: "Already Checked In",
                    type: "warning"
                });
                await fetchLogs(true);
            } else if (msg.includes('Today\'s Attendance Already Completed') || msg.includes('Today\'s Check-In & Check-Out Already Completed')) {
                setPopup({
                    title: "Attendance Completed",
                    message: "Today's Check-In & Check-Out Already Completed",
                    type: "warning"
                });
                await fetchLogs(true);
            } else {
                setPopup({
                    title: "Check-Out Failed",
                    message: msg,
                    type: "error"
                });
            }
        }
    };



    const value = useMemo(() => ({
        logs,
        activeLog,
        attendanceState,
        loading,
        locationStatus,
        fetchLogs,
        handleCheckIn,
        handleCheckOut
    }), [logs, activeLog, attendanceState, loading, locationStatus, fetchLogs, handleCheckIn, handleCheckOut]);

    return (
        <AttendanceContext.Provider value={value}>
            {children}
            {isFaceModalOpen && (
                <FaceVerificationModal 
                    isOpen={isFaceModalOpen}
                    onClose={() => setIsFaceModalOpen(false)}
                    onVerified={(descriptor, faceImage) => {
                        setIsFaceModalOpen(false);
                        handleCheckIn(descriptor, faceImage);
                    }}
                />
            )}
            {popup && (
                <AttendancePopup
                    title={popup.title}
                    message={popup.message}
                    type={popup.type}
                    onClose={() => setPopup(null)}
                />
            )}
        </AttendanceContext.Provider>
    );
};

// =================== PREMIUM GLASSMORPHIC POPUP COMPONENT ===================
const AttendancePopup = ({ title, message, type, onClose }) => {
    // Choose icon based on type
    const Icon = () => {
        if (type === 'success') {
            return (
                <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
        } else if (type === 'error') {
            return (
                <div className="h-16 w-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 animate-shake">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
            );
        } else {
            return (
                <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 animate-pulse">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in text-center flex flex-col items-center">
                <Icon />
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full py-3 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all transform active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                    Dismiss
                </button>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .animate-scale-in {
                    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                @keyframes scaleIn {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                @keyframes fadeIn {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
                    40%, 60% { transform: translate3d(3px, 0, 0); }
                }
            ` }} />
        </div>
    );
};
