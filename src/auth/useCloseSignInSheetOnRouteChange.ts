/**
 * useCloseSignInSheetOnRouteChange — closes the global SignInSheet when the user
 * navigates away from the route it was opened on.
 *
 * The sheet is one global Actionsheet (SignInSheetHost in app/_layout.tsx). Without
 * this it stays on top of every next screen and blocks the tab bar.
 *
 * The route is remembered when the sheet opens (not when the route changes), so a
 * screen that opens the sheet on mount (e.g. /compare) keeps it on that screen.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "expo-router";
import { useSignInSheetStore } from "./signInSheetStore";

export function useCloseSignInSheetOnRouteChange() {
  const pathname = usePathname();
  const isOpen = useSignInSheetStore((s) => s.isOpen);
  const close = useSignInSheetStore((s) => s.close);
  const openedOn = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      openedOn.current = null;
      return;
    }
    if (openedOn.current === null) {
      openedOn.current = pathname;
      return;
    }
    if (openedOn.current !== pathname) {
      openedOn.current = null;
      close();
    }
  }, [isOpen, pathname, close]);
}
