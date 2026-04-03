import create from "zustand";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("auth_token") || null,
  isLoading: false,
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
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        name,
      });
      set({
        user: response.data.user,
        token: response.data.token,
        isLoading: false,
      });
      localStorage.setItem("auth_token", response.data.token);
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.token}`;
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Registration failed";
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      set({
        user: response.data.user,
        token: response.data.token,
        isLoading: false,
      });
      localStorage.setItem("auth_token", response.data.token);
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.token}`;
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
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
    const token = localStorage.getItem("auth_token");
    if (!token) {
      set({ user: null, token: null });
      return false;
    }

    try {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await axios.get(`${API_URL}/api/auth/me`);
      set({ user: response.data, token });
      return true;
    } catch (error) {
      localStorage.removeItem("auth_token");
      delete axios.defaults.headers.common["Authorization"];
      set({ user: null, token: null });
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
      const response = await axios.get(`${API_URL}/api/houses`);
      set({ houses: response.data, isLoading: false });
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
      const response = await axios.post(`${API_URL}/api/houses`, {
        name,
        description,
        code: "",
      });
      set((state) => ({
        houses: [...state.houses, response.data],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create house";
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  deleteHouse: async (houseId) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${API_URL}/api/houses/${houseId}`);
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
      const response = await axios.get(`${API_URL}/api/houses/${houseId}`);
      set({ currentHouse: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to fetch house";
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  updateHouse: async (houseId, updates) => {
    try {
      const response = await axios.put(`${API_URL}/api/houses/${houseId}`, updates);
      set((state) => ({
        currentHouse: response.data,
        houses: state.houses.map((h) => (h.id === houseId ? response.data : h)),
      }));
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update house";
      set((state) => ({ error: msg }));
      throw error;
    }
  },
}));
