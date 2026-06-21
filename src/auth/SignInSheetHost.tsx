/**
 * SignInSheetHost — mounts the global SignInSheet once in app/_layout.tsx.
 * Any screen can open it via useAuthGate() or useSignInSheet().open().
 */

import { SignInSheet } from "@/components/shared/SignInSheet";

export function SignInSheetHost() {
  return <SignInSheet />;
}
