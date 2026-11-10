/**
 * useKeyboardVisible — true while the software keyboard is shown.
 * Used to give a form the room the keyboard takes (e.g. Profile hides its big
 * header band so the focused field can sit above the keyboard).
 */
import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}
