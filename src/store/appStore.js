import create from "zustand";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://housing-editor.pages.dev/api";

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("auth_token") || null,
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  setToken: (token) => {
    if (token) {
      localStorage.setItem("auth_token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("auth_token");
      delete axios.defaults.headers.common["Authorization"];
    }
    set({ token });
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name,
      });
      const { user, token } = response.data;
      set({
        user,
        token,
        isLoading: false,
      });
      localStorage.setItem("auth_token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Registration failed";
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      const { user, token } = response.data;
      set({
        user,
        token,
        isLoading: false,
      });
      localStorage.setItem("auth_token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Login failed";
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    delete axios.defaults.headers.common["Authorization"];
    set({ user: null, token: null, error: null });
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    const token = localStorage.getItem("auth_token");
    if (!token) {
      set({ user: null, token: null, isCheckingAuth: false });
      return false;
    }

    try {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await axios.get(`${API_URL}/auth/me`);
      if (response.data && response.data.user) {
        set({ user: response.data.user, token, isCheckingAuth: false });
        return true;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.warn("Auth check failed:", error.response?.status, error.message);
      localStorage.removeItem("auth_token");
      delete axios.defaults.headers.common["Authorization"];
      set({ user: null, token: null, isCheckingAuth: false });
      return false;
    }
  },
}));

export const useHousingStore = create((set) => ({
  houses: [],
  currentHouse: null,
  isLoading: false,
  error: null,

  fetchHouses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/houses`);
      set({ houses: response.data.houses || [], isLoading: false });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to fetch houses";
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  createHouse: async (name, description) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/houses`, {
        name,
        description,
      });
      set((state) => ({
        houses: [...state.houses, response.data.house],
        isLoading: false,
      }));
      return response.data.house;
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Failed to create house";
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  deleteHouse: async (houseId) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${API_URL}/houses/${houseId}`);
      set((state) => ({
        houses: state.houses.filter((h) => h.id !== houseId),
        isLoading: false,
      }));
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete house";
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  fetchHouse: async (houseId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/houses/${houseId}`);
      set({ currentHouse: response.data.house, isLoading: false });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to fetch house";
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  updateHouse: async (houseId, updates) => {
    try {
      const response = await axios.put(`${API_URL}/houses/${houseId}`, updates);
      set((state) => ({
        currentHouse: response.data.house,
        houses: state.houses.map((h) => (h.id === houseId ? response.data.house : h)),
      }));
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update house";
      set((state) => ({ error: msg }));
      throw error;
    }
  },
}));
