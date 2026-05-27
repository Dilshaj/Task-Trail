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

            const savedUser = localStorage.getItem('user_v2');
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
                        }
                    } else {
                        console.error("❌ [AUTH] No refresh token found. Logging out.");
                        processQueue(new Error("No refresh token"), null);
                        isRefreshing = false;
                        localStorage.removeItem('user_v2');
                        window.location.href = "/";
                        return Promise.reject(error);
                    }
                } catch (refreshError) {
                    console.error("❌ [AUTH] Refresh token failed/expired. Logging out.");
                    processQueue(refreshError, null);
                    isRefreshing = false;
                    localStorage.removeItem('user_v2');
                    window.location.href = "/";
                    return Promise.reject(refreshError);
                }
            } else {
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
