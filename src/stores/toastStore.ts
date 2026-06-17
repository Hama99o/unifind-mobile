import { create } from "zustand";

interface ToastState {
  message: string | null;
  /** Increments on every show() so the host re-animates even for the same text. */
  seq: number;
  show: (message: string) => void;
  hide: () => void;
}

/** Lightweight global toast. Cross-platform (web + native); used for transient
 * feedback like "coming soon" on actions whose target screen isn't built yet.
 * Never use raw Alert.alert (no-op on web preview). */
export const useToastStore = create<ToastState>((set) => ({
  message: null,
  seq: 0,
  show: (message) => set((s) => ({ message, seq: s.seq + 1 })),
  hide: () => set({ message: null }),
}));

/** Show a toast from anywhere (components or plain functions). */
export const showToast = (message: string) => useToastStore.getState().show(message);
