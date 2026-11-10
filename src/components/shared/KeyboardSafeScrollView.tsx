/**
 * KeyboardSafeScrollView — a ScrollView that stays usable with the keyboard open.
 *
 * The app runs edge-to-edge on Android, where neither `adjustResize` nor
 * KeyboardAvoidingView moves content: a focused field near the bottom (e.g. the
 * footer newsletter) ended up under the keyboard with its button (QA BUG-13).
 *
 * While the keyboard is open we (1) add its height as bottom padding so the end of
 * the content can scroll above it and (2) scroll the focused input so that it, plus
 * `focusedExtraSpace` px below it (room for its button / error), sits above the
 * keyboard. Taps on buttons work with the keyboard open; dragging dismisses it.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";

interface Props extends ScrollViewProps {
  /** Space (px) to keep visible below the focused field, e.g. its submit button. */
  focusedExtraSpace?: number;
}

export const KeyboardSafeScrollView = forwardRef<ScrollView, Props>(function KeyboardSafeScrollView(
  { contentContainerStyle, focusedExtraSpace = 24, onScroll, ...props },
  ref
) {
  const innerRef = useRef<ScrollView>(null);
  useImperativeHandle(ref, () => innerRef.current as ScrollView);
  const offsetY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const revealFocusedInput = useCallback(
    (keyboardTop: number) => {
      const input = TextInput.State.currentlyFocusedInput() as unknown as {
        measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
      } | null;
      if (!input?.measureInWindow || !innerRef.current) return;
      input.measureInWindow((_x, y, _w, h) => {
        const overflow = y + h + focusedExtraSpace - keyboardTop;
        if (overflow > 0) {
          innerRef.current?.scrollTo({ y: offsetY.current + overflow, animated: true });
        }
      });
    },
    [focusedExtraSpace]
  );

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvt, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      // Wait one frame so the extra bottom padding exists before scrolling.
      requestAnimationFrame(() => revealFocusedInput(e.endCoordinates.screenY));
    });
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [revealFocusedInput]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = e.nativeEvent.contentOffset.y;
    onScroll?.(e);
  };

  const base = StyleSheet.flatten(contentContainerStyle) ?? {};
  const basePad = typeof base.paddingBottom === "number" ? base.paddingBottom : 0;

  return (
    <ScrollView
      ref={innerRef}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      scrollEventThrottle={16}
      {...props}
      onScroll={handleScroll}
      contentContainerStyle={[base, { paddingBottom: basePad + keyboardHeight }]}
    />
  );
});
