import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function resolveQueue() {
  refreshQueue.forEach((resolve) => resolve());
  refreshQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    /**
     * Never refresh for authentication endpoints themselves.
     *
     * /auth/me:
     *   A 401 simply means "there is no authenticated user".
     *   This is expected on the login page and should not trigger
     *   a refresh attempt.
     *
     * /auth/refresh:
     *   A 401 means the refresh token is invalid/expired.
     *   The session is over.
     */
    if (
      originalRequest.url === "/auth/me" ||
      originalRequest.url === "/auth/refresh"
    ) {
      return Promise.reject(error);
    }

    // Don't retry the same request twice.
    if ((originalRequest as { _retried?: boolean })._retried) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      await new Promise<void>((resolve) => refreshQueue.push(resolve));

      (originalRequest as { _retried?: boolean })._retried = true;

      return apiClient(originalRequest);
    }

    isRefreshing = true;

    try {
      await apiClient.post("/auth/refresh");

      isRefreshing = false;
      resolveQueue();

      (originalRequest as { _retried?: boolean })._retried = true;

      return apiClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      resolveQueue();

      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  },
);
