/**
 * useSignInSheet — hook to open/close the global SignInSheet.
 *
 * Usage:
 *   const { open, close, isOpen } = useSignInSheet();
 *   open(); // show the sign-in upsell sheet
 */

import { useSignInSheetStore } from "./signInSheetStore";

export function useSignInSheet() {
  return useSignInSheetStore();
}

/** Imperative open (usable from services/plain functions, not just React). */
export const openSignInSheet = () => useSignInSheetStore.getState().open();
export const closeSignInSheet = () => useSignInSheetStore.getState().close();
