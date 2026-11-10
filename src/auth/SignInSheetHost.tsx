/**
 * SignInSheetHost — mounts the global SignInSheet once in app/_layout.tsx.
 * Any screen can open it via useAuthGate() or useSignInSheet().open().
 * The sheet closes itself when the user navigates to another route.
 */

import { SignInSheet } from "@/components/shared/SignInSheet";
import { useCloseSignInSheetOnRouteChange } from "./useCloseSignInSheetOnRouteChange";

export function SignInSheetHost() {
  useCloseSignInSheetOnRouteChange();
  return <SignInSheet />;
}
