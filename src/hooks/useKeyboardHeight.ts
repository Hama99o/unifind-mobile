/**
 * useKeyboardHeight — the software keyboard's height in px (0 when hidden).
 * Android edge-to-edge does not resize the window or a Modal for the keyboard,
 * so anything that must stay visible while typing offsets itself by this.
 */
import { useEffect, useState } from "react";
import { Keyboard, type KeyboardEvent } from "react-native";

export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e: KeyboardEvent) =>
      setHeight(e?.endCoordinates?.height ?? 0)
    );
    const hide = Keyboard.addListener("keyboardDidHide", () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}
