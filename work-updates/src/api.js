import axios from "axios";

// 🔥 CHANGE THIS ONLY
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// Automatically attach Bearer token from localStorage to every request.
api.interceptors.request.use(
  (config) => {
    const savedUser = localStorage.getItem("user_v2");
    if (savedUser) {
      try {
        const { token } = JSON.parse(savedUser);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        // Corrupted storage — ignore and continue unauthenticated
        localStorage.removeItem("user_v2");
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR (JWT Refresh Token Rotation) ──────────────────────
let _isRefreshing = false;
let _refreshQueue = []; // Queued requests waiting for the new token

const processQueue = (error, token = null) => {
  _refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  _refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and avoid infinite retry loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retried &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retried = true;

      // If a refresh is already in progress, queue this request
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      _isRefreshing = true;

      try {
        const savedUser = localStorage.getItem("user_v2");
        if (!savedUser) throw new Error("No user session found");

        const parsed = JSON.parse(savedUser);
        const refreshToken = parsed?.refreshToken;
        if (!refreshToken) throw new Error("No refresh token available");

        // 🔄 Exchange refresh token for a new access token
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          null,
          { params: { refresh_token: refreshToken } }
        );

        const newAccessToken = data.token;

        // Persist the new token into localStorage
        const updatedUser = { ...parsed, token: newAccessToken };
        localStorage.setItem("user_v2", JSON.stringify(updatedUser));

        // Resolve all queued requests
        processQueue(null, newAccessToken);

        // Retry the original failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear session and force re-login
        processQueue(refreshError, null);
        localStorage.removeItem("user_v2");
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const getData = async () => {
  const res = await api.get("/");
  return res.data;
};

export default api;
