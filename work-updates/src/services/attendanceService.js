import api from './api';
const API_URL = 'attendance';

// 🛠️ Universal Error Translator (Atomic-Hardened)
const extractError = async (error) => {
    // 1. If it's a blob error, we need to read it as text first
    let data = error.response?.data;
    if (data instanceof Blob && data.type === 'application/json') {
        try {
            const text = await data.text();
            data = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse blob error as JSON", e);
        }
    }

    // 2. Direct Detail (FastAPI Standard)
    const detail = data?.detail || error.response?.data?.detail;

    // 3. Fallback to whole response data if detail is missing
    const rawData = data || error.response?.data;

    let result = "";

    if (detail) {
        if (typeof detail === 'string') {
            result = detail;
        } else if (Array.isArray(detail)) {
            result = detail.map(err => err.msg || JSON.stringify(err)).join(', ');
        } else if (typeof detail === 'object') {
            result = detail.message || detail.msg || JSON.stringify(detail);
        } else {
            result = String(detail);
        }
    } else if (rawData) {
        // If no detail, but we have data (some frameworks return { error: "..." })
        result = rawData.message || rawData.msg || rawData.error || JSON.stringify(rawData);
    } else {
        // Network errors or unexpected crashes
        result = error.message || 'An unexpected error occurred';
    }

    // Final Guard: If we STILL have [object Object], show a generic meaningful error
    if (result === "[object Object]" || !result || result === "{}") {
        return "Internal server error. Please check your connection or try again.";
    }

    return result;
};

export const getAttendanceLogs = async (projectId = null) => {
    try {
        const params = { _t: Date.now() }; // 🚀 Cache-buster
        if (projectId) params.project_id = projectId;
        const response = await api.get(`${API_URL}`, { params });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch attendance logs:', error);
        return [];
    }
};

export const getMyAttendance = async () => {
    try {
        const response = await api.get(`${API_URL}/my`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch my attendance:', error);
        return [];
    }
};

export const getEmployeeAttendance = async (employeeId) => {
    try {
        const response = await api.get(`${API_URL}/${employeeId}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch attendance for ${employeeId}:`, error);
        return [];
    }
};

export const checkIn = async (payload) => {
    try {
        // payload should contain employeeId (camelCase) to match the alias
        const response = await api.post(`${API_URL}/check-in`, payload);
        return response.data;
    } catch (error) {
        throw new Error(await extractError(error));
    }
};

export const checkOut = async (userId, employeeId) => {
    try {
        const response = await api.post(`${API_URL}/employee/check-out`, {
            employeeId
        });
        return response.data;
    } catch (error) {
        throw new Error(await extractError(error));
    }
};

export const exportAttendanceToExcel = async () => {
    try {
        const response = await api.get(`${API_URL}/admin/export`, {
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'attendance_report.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export failed:', error);
        throw new Error(await extractError(error));
    }
};
