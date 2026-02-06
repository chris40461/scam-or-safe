import { create } from "zustand";

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: false,
  isLoading: true,
  setIsAdmin: (isAdmin: boolean) => set({ isAdmin }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  logout: () => set({ isAdmin: false }),
}));
