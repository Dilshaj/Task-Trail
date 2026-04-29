import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { getAttendanceLogs, checkIn, checkOut } from '../services/attendanceService';
import { useAuth } from './AuthContext';
import { useProjectFilter } from './ProjectFilterContext';

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

export const AttendanceProvider = ({ children }) => {
    const { user } = useAuth();
    const { selectedProjectId } = useProjectFilter();
    const [logs, setLogs] = useState([]);
    const [activeLog, setActiveLog] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchLogs = useCallback(async (isBackground = false) => {
        if (!user || isUpdating) return;

        setIsUpdating(true);
        try {
            const isAdmin = user?.role === 'admin';
            const projId = isAdmin ? selectedProjectId : null;
            const data = await getAttendanceLogs(projId);

            setLogs(data);

            const today = new Date().toISOString().split('T')[0];
            const empId = user.employeeId || user.employee_id || user.id;
            const active = data.find(l =>
                String(l.employeeId) === String(empId) &&
                l.date === today &&
                l.status === 'Checked In'
            );
            setActiveLog(active || null);
        } catch (error) {
            console.error("❌ Failed to fetch attendance logs:", error);
        } finally {
            setIsUpdating(false);
        }
    }, [user, selectedProjectId, isUpdating]);

    useEffect(() => {
        fetchLogs();
    }, [selectedProjectId, user?.id]); // Only re-fetch on project change or user change

    const [loading, setLoading] = useState(false);

    const handleCheckIn = async () => {
        if (!user) return;
        const empId = user.employee_id || user.employeeId;

        let latitude = null;
        let longitude = null;
        let locationName = null;

        // 🌐 Try browser geolocation (HTTPS only) — silently fall back on HTTP
        const getBrowserLocation = () => {
            return new Promise((resolve) => {
                // Geolocation requires HTTPS; skip silently on plain HTTP
                const isSecure = window.location.protocol === 'https:' ||
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

                if (!isSecure || !navigator.geolocation) {
                    resolve(null);
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => resolve(null),  // silently fall back
                    { timeout: 8000, enableHighAccuracy: false }
                );
            });
        };

        // 📡 IP-based fallback (always works, no HTTPS required)
        const getIPLocation = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await res.json();
                if (data && data.latitude) {
                    return { lat: data.latitude, lng: data.longitude, city: data.city, region: data.region };
                }
            } catch (_) { /* silent */ }
            return null;
        };

        let coords = await getBrowserLocation();
        if (!coords) {
            const ipData = await getIPLocation();
            if (ipData) {
                coords = { lat: ipData.lat, lng: ipData.lng };
                locationName = [ipData.city, ipData.region].filter(Boolean).join(', ');
            }
        }

        if (coords) {
            latitude = coords.lat;
            longitude = coords.lng;
            if (!locationName) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        { signal: controller.signal, headers: { 'Accept-Language': 'en', 'User-Agent': 'EduProva' } }
                    );
                    clearTimeout(timeoutId);
                    const data = await response.json();
                    if (data && data.address) {
                        const addr = data.address;
                        const main = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || addr.village || '';
                        const city = addr.city || addr.town || addr.state_district || addr.state || '';
                        locationName = city && city !== main ? `${city}${main ? ', ' + main : ''}` : main;
                    }
                } catch (_) {
                    locationName = 'Location Captured';
                }
            }
        } else {
            locationName = 'Remote Check-in';
        }

        try {
            const payload = {
                employeeId: empId,
                location_name: locationName || 'Auto-detected Location'
            };
            if (latitude !== null) payload.latitude = Number(latitude);
            if (longitude !== null) payload.longitude = Number(longitude);

            const newLog = await checkIn(payload);

            // ✅ Backend returns 200 with already_checked_in flag (not a 400 anymore)
            if (newLog.already_checked_in) {
                // Just update the active log silently
                setActiveLog(newLog);
                return;
            }

            setLogs(prev => [newLog, ...prev]);
            setActiveLog(newLog);
        } catch (error) {
            const msg = error.message || '';

            // Fallback: handle old-style 'already' errors just in case
            if (msg.toLowerCase().includes('already')) {
                await fetchLogs(true);
                return;
            }

            // Only alert on genuine failures
            const display = (msg.includes('[object Object]') || !msg)
                ? 'A connection error occurred. Please try again.'
                : msg;
            alert(display);
        }
    };

    const handleCheckOut = async () => {
        if (!user) return;
        const empId = user.employee_id || user.employeeId;
        try {
            const updatedLog = await checkOut(user.id, empId);
            if (updatedLog) {
                setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
                setActiveLog(null);
            }
        } catch (error) {
            const msg = error.message || "Check-out failed.";
            if (msg.includes("[object Object]") || typeof msg === 'object') {
                alert("Communication error with server. Please try again.");
            } else {
                alert(msg);
            }
        }
    };

    // 🚀 High-frequency sync for Admin Panel
    useEffect(() => {
        if (!user) return;

        // Fast interval (10s)
        const interval = setInterval(() => {
            fetchLogs(true);
        }, 10000);

        // Immediate sync on tab focus or window focus
        const handleFocus = () => {
            console.log("🔦 Tab focused - triggering immediate sync");
            fetchLogs(true);
        };

        window.addEventListener('focus', handleFocus);
        const onVisible = () => { if (document.visibilityState === 'visible') handleFocus(); };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [user, fetchLogs]);

    const value = useMemo(() => ({
        logs,
        activeLog,
        fetchLogs,
        handleCheckIn,
        handleCheckOut
    }), [logs, activeLog, fetchLogs, handleCheckIn, handleCheckOut]);

    return (
        <AttendanceContext.Provider value={value}>
            {children}
        </AttendanceContext.Provider>
    );
};
