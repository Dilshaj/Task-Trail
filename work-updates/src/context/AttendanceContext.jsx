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

    const updatingRef = React.useRef(false);

    const fetchLogs = useCallback(async (isBackground = false) => {
        if (!user || updatingRef.current) return;

        updatingRef.current = true;
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
            updatingRef.current = false;
            setIsUpdating(false);
        }
    }, [user, selectedProjectId]); // Removed isUpdating from deps to prevent re-creation loop

    useEffect(() => {
        fetchLogs();
    }, [selectedProjectId, user?.id]); // Only re-fetch on project change or user change

    const [loading, setLoading] = useState(false);

    const handleCheckIn = async () => {
        if (!user || loading) return;
        setLoading(true);
        
        const empId = user.employee_id || user.employeeId;

        let latitude = null;
        let longitude = null;
        let locationName = null;
        let locationSource = null;

        // 🌐 Try browser geolocation (HTTPS only) — Prioritize this for "LIVE" location
        const getBrowserLocation = () => {
            return new Promise((resolve) => {
                const isSecure = window.location.protocol === 'https:' ||
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

                if (!isSecure || !navigator.geolocation) {
                    console.warn("📍 Geolocation not available: insecure context or unsupported browser");
                    resolve({ error: 'insecure_or_unsupported' });
                    return;
                }

                let best = null;
                const startedAt = Date.now();
                const maxWaitMs = 20000;
                const targetAccuracyM = 80;

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
                        console.log(`📍 GPS fix accuracy=${Math.round(candidate.accuracy)}m elapsed=${elapsed}ms`);

                        // Accept early once high-precision fix is available.
                        if (candidate.accuracy <= targetAccuracyM) {
                            stopAndResolve(candidate);
                        }
                    },
                    (err) => {
                        console.warn(`❌ GPS Capture Failed: ${err.message} (Code: ${err.code})`);
                        stopAndResolve({ error: 'gps_failed' });
                    },
                    {
                        timeout: 12000,
                        enableHighAccuracy: true,
                        maximumAge: 0
                    }
                );

                const finalTimeout = setTimeout(() => {
                    if (best) {
                        stopAndResolve(best);
                    } else {
                        stopAndResolve({ error: 'gps_timeout' });
                    }
                }, maxWaitMs);
            });
        };

        // 📡 IP fallback location (only used when GPS fails)
        const getIPLocation = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await res.json();
                if (data && data.latitude && data.longitude) {
                    return {
                        lat: Number(data.latitude),
                        lng: Number(data.longitude),
                        city: data.city,
                        region: data.region,
                        source: 'ip'
                    };
                }
            } catch (_) {
                // fallback provider below
            }

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const res = await fetch('http://ip-api.com/json/', { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await res.json();
                if (data && data.status === 'success') {
                    return {
                        lat: Number(data.lat),
                        lng: Number(data.lon),
                        city: data.city,
                        region: data.regionName,
                        source: 'ip'
                    };
                }
            } catch (_) {
                // no-op
            }
            return null;
        };

        try {
            // 1. Try Browser first (Live Location)
            let coords = await getBrowserLocation();
            if (coords?.error) {
                console.warn("⚠️ GPS unavailable, switching to IP fallback:", coords.error);
                const ipCoords = await getIPLocation();
                if (ipCoords) {
                    coords = ipCoords;
                    locationName = [ipCoords.city, ipCoords.region].filter(Boolean).join(', ');
                } else {
                    throw new Error('Unable to capture location from GPS or IP. Please check location and internet permissions.');
                }
            }
            if (coords?.source === 'gps' && coords?.accuracy && coords.accuracy > 150) {
                console.warn(`⚠️ GPS accuracy is low (${Math.round(coords.accuracy)}m)`);
            }

            // 2. Reverse Geocode for Human-readable address
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
                            // 🚀 Build a detailed address: Road, Suburb, City, State
                            const detail = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
                            const city = addr.city || addr.town || addr.village || addr.state_district || '';
                            const state = addr.state || '';
                            
                            const parts = [detail, city, state].filter(Boolean);
                            locationName = parts.length > 0 ? parts.join(', ') : 'Location Captured';
                            
                            // Prefix with 📍 if it's high-accuracy GPS
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

            const payload = {
                employeeId: empId,
                location_name: locationName || 'Auto-detected Location'
            };
            if (latitude !== null) payload.latitude = Number(latitude);
            if (longitude !== null) payload.longitude = Number(longitude);
            if (locationSource) payload.location_source = locationSource;
            if (coords?.accuracy != null) payload.location_accuracy = Number(coords.accuracy);

            const newLog = await checkIn(payload);

            // ✅ Backend returns 200 with already_checked_in flag (not a 400 anymore)
            if (newLog.already_checked_in) {
                // Refresh current active log location details immediately.
                setLogs(prev => prev.map(l => l.id === newLog.id ? { ...l, ...newLog } : l));
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
        } finally {
            setLoading(false);
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

    // 🚀 High-frequency sync for Admin Panel (Optimized)
    const lastSyncRef = React.useRef(0);

    useEffect(() => {
        if (!user) return;

        // Interval sync for near-live location visibility in admin dashboard
        const interval = setInterval(() => {
            fetchLogs(true);
        }, 5000);

        // Immediate sync on tab focus (Throttled to once every 5s)
        const handleFocus = () => {
            const now = Date.now();
            if (now - lastSyncRef.current < 5000) return; 
            lastSyncRef.current = now;
            
            console.log("🔦 Tab focused - triggering immediate sync");
            fetchLogs(true);
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleFocus();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [user, fetchLogs]);

    const value = useMemo(() => ({
        logs,
        activeLog,
        loading,
        fetchLogs,
        handleCheckIn,
        handleCheckOut
    }), [logs, activeLog, loading, fetchLogs, handleCheckIn, handleCheckOut]);

    return (
        <AttendanceContext.Provider value={value}>
            {children}
        </AttendanceContext.Provider>
    );
};
