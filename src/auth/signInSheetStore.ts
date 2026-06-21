/**
 * signInSheetStore — global state for the SignInSheet.
 *
 * Shared across the whole app so any screen can open the sheet
 * without prop-drilling. Consumed by useSignInSheet() and SignInSheet component.
 */

import { create } from "zustand";

interface SignInSheetState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useSignInSheetStore = create<SignInSheetState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
