import axios from "axios";
import Cookies from "js-cookie";
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    Cookies.set("token", response.data.access_token, { expires: 1 });
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      "/auth/register",
      credentials
    );
    Cookies.set("token", response.data.access_token, { expires: 1 });
    return response.data;
  },

  async getProfile() {
    return api.get("/auth/profile");
  },

  logout() {
    Cookies.remove("token");
  },

  isAuthenticated(): boolean {
    return !!Cookies.get("token");
  },
};

export const UserService = {
  async updateProfile(profileData: { messageColor?: string }) {
    return api.patch("/users/profile", profileData);
  },
};

export default api;
