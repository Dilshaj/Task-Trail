import axios from 'axios';

// ✅ YOUR SERVER IP + PORT
const API_BASE_URL = "/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
});

// 🔐 Attach token
api.interceptors.request.use(
    (config) => {
        // Try both keys to be safe
        const savedUserV2 = localStorage.getItem('user_v2');
        const savedUserLegacy = localStorage.getItem('user');
        const savedUser = savedUserV2 || savedUserLegacy;

        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                const token = userData.token || userData.accessToken;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    // console.debug(`[API] Attached token for ${config.url}`);
                } else if (!config.url.includes('auth/login')) {
                    console.warn(`[API] User found in storage but no token present for ${config.url}`);
                }
            } catch (e) {
                console.error("[API] Failed to parse user from localStorage", e);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🔄 Auto-Refresh Logic with Request Queuing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

/** Clears all auth storage keys and redirects to login */
const forceLogout = () => {
    localStorage.removeItem('user_v2');
    localStorage.removeItem('user'); // Also clear legacy key
    window.location.href = '/';
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            // ✅ FIX 1: Check both storage keys (legacy 'user' + current 'user_v2')
            const savedUser = localStorage.getItem('user_v2') || localStorage.getItem('user');
            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    const { refreshToken } = userData;

                    if (refreshToken) {
                        console.log("🔄 [AUTH] Access token expired. Attempting refresh...");
                        // Call refresh endpoint
                        const res = await axios.post(`${API_BASE_URL}/auth/refresh?refresh_token=${refreshToken}`);

                        if (res.status === 200) {
                            const { token: newToken } = res.data;

                            // Update storage
                            const updatedUser = { ...userData, token: newToken };
                            localStorage.setItem('user_v2', JSON.stringify(updatedUser));

                            // Update original request and retry
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;

                            processQueue(null, newToken);
                            isRefreshing = false;

                            return api(originalRequest);
                        } else {
                            // Unexpected non-200 — treat as failed refresh
                            console.error('[AUTH] Refresh returned unexpected status:', res.status);
                            processQueue(new Error('Refresh failed'), null);
                            isRefreshing = false;
                            forceLogout();
                            return Promise.reject(error);
                        }
                    } else {
                        // ✅ FIX 2: Use forceLogout to clear both storage keys
                        console.error("[AUTH] No refresh token found. Logging out.");
                        processQueue(new Error("No refresh token"), null);
                        isRefreshing = false;
                        forceLogout();
                        return Promise.reject(error);
                    }
                } catch (refreshError) {
                    // ✅ FIX 2: Use forceLogout to clear both storage keys
                    console.error("[AUTH] Refresh token failed/expired. Logging out.");
                    processQueue(refreshError, null);
                    isRefreshing = false;
                    forceLogout();
                    return Promise.reject(refreshError);
                }
            } else {
                // ✅ FIX 3: CRITICAL - Reset isRefreshing & drain queue before rejecting.
                // Without this, isRefreshing stays true forever → all future requests
                // are queued but never resolved (permanent deadlock).
                console.warn("[AUTH] 401 received but no auth data in storage. Redirecting to login.");
                processQueue(error, null);
                isRefreshing = false;
                forceLogout();
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
