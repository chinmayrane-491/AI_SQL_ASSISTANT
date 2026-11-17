import apiClient from "./api";

/**
 * Authentication Service
 * Centralized auth methods to interface with backend JWT endpoints.
 * Placeholder endpoints marked for Step 2 integration.
 */
export const authService = {
  // Step 2 endpoint: Login with credentials & receive verified user + role JWT
  login: async (credentials) => {
    // Endpoint placeholder to be confirmed with backend in Step 2:
    // return apiClient.post("/auth/login", credentials);
    return Promise.resolve({
      success: true,
      data: {
        token: "placeholder_token",
        user: { email: credentials.email, role: credentials.requestedRole },
      },
    });
  },

  logout: async () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    return Promise.resolve({ success: true });
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("auth_user");
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
};
