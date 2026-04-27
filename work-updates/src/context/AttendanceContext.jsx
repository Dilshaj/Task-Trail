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

        console.log("Checking in...", empId);

        let latitude = null;
        let longitude = null;
        let locationName = null;

        const getBrowserLocation = () => {
            return new Promise((resolve) => {
                if (!navigator.geolocation) {
                    console.warn("Geolocation not supported by this browser.");
                    resolve(null);
                } else {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        (err) => {
                            console.warn("Geolocation denied/failed:", err.message);
                            resolve(null);
                        },
                        { timeout: 10000, enableHighAccuracy: true }
                    );
                }
            });
        };

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
            } catch (err) {
                console.warn("IP Location fallback failed/timed out");
            }
            return null;
        };

        let coords = await getBrowserLocation();
        if (!coords) {
            const ipData = await getIPLocation();
            if (ipData) {
                coords = { lat: ipData.lat, lng: ipData.lng };
                locationName = `${ipData.city}, ${ipData.region}`;
            }
        }

        if (coords) {
            latitude = coords.lat;
            longitude = coords.lng;
            if (!locationName) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000); // 🚀 3s max for address lookup
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
                        signal: controller.signal,
                        headers: { 'Accept-Language': 'en', 'User-Agent': 'EduProva' }
                    });
                    clearTimeout(timeoutId);
                    const data = await response.json();
                    if (data && data.address) {
                        const addr = data.address;
                        const mainPart = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || addr.village || "";
                        const cityPart = addr.city || addr.town || addr.state_district || addr.state || "";
                        locationName = mainPart;
                        if (cityPart && cityPart !== mainPart) locationName = `${cityPart}${mainPart ? ', ' + mainPart : ''}`;
                    }
                } catch (err) {
                    console.warn("Reverse geocoding timed out or failed - proceeding with coordinates");
                    locationName = "Location Captured (GPS)";
                }
            }
        } else {
            locationName = "Location access denied";
        }

        try {
            // 🛡️ Clean Payload: Only send what the schema expects
            const payload = {
                employeeId: empId,
                location_name: locationName || "Auto-detected Location"
            };

            // Only add coords if we have them (as numbers)
            if (latitude !== null) payload.latitude = Number(latitude);
            if (longitude !== null) payload.longitude = Number(longitude);

            const newLog = await checkIn(payload);
            setLogs(prev => [newLog, ...prev]);
            setActiveLog(newLog);
        } catch (error) {
            // 🔍 Smart Unpacker: Get the clean message from our hardened service
            const msg = error.message || "Check-in failed. Please try again.";

            // Final check to prevent exactly what the user saw
            if (msg.includes("[object Object]") || typeof msg === 'object') {
                alert("A technical connection error occurred. Please refresh the page.");
            } else {
                alert(msg);
            }
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
