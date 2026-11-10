/**
 * useScrollToSection — scroll a ScrollView to a section that sits inside a
 * wrapper View. onLayout's y is relative to the direct parent, so the wrapper's
 * own y must be added (the Book a Seat scroll used to stop a hero-height short,
 * leaving the specialist picker under the sticky bar).
 */

import { useCallback, useRef } from "react";
import type { LayoutChangeEvent, ScrollView } from "react-native";

export function useScrollToSection(topGap = 16) {
  const scrollRef = useRef<ScrollView>(null);
  const parentY = useRef(0);
  const sectionY = useRef<number | null>(null);

  const onParentLayout = useCallback((e: LayoutChangeEvent) => {
    parentY.current = e.nativeEvent.layout.y;
  }, []);
  const onSectionLayout = useCallback((e: LayoutChangeEvent) => {
    sectionY.current = e.nativeEvent.layout.y;
  }, []);

  const scrollToSection = useCallback(() => {
    if (sectionY.current == null) return;
    scrollRef.current?.scrollTo({
      y: Math.max(0, parentY.current + sectionY.current - topGap),
      animated: true,
    });
  }, [topGap]);

  return { scrollRef, onParentLayout, onSectionLayout, scrollToSection };
}
