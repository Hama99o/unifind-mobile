/**
 * GradientView — linear gradient container built on react-native-svg.
 *
 * Drop-in replacement for expo-linear-gradient. Renders a LinearGradient
 * SVG behind its children, sized via onLayout.
 *
 * Props:
 *   colors     — hex/rgba/transparent array of gradient stops
 *   start      — { x, y } 0..1 (default { x:0, y:0 })
 *   end        — { x, y } 0..1 (default { x:1, y:0 })
 *   locations  — optional stop positions 0..1
 *   style      — ViewStyle (applied to the outer View)
 *   children   — rendered on top of the gradient
 */

import React, { useId, useState } from "react";
import { View, type ViewStyle, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from "react-native-svg";

interface GradientViewProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  style?: ViewStyle | ViewStyle[];
  className?: string;
  children?: React.ReactNode;
}

/** Convert "transparent" keyword to rgba(0,0,0,0) so SVG understands it. */
function normalizeColor(color: string): { color: string; opacity: number } {
  if (color === "transparent") return { color: "#000000", opacity: 0 };
  // rgba(r,g,b,a) — split alpha for SVG stop-opacity
  const rgbaMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    return { color: hex, opacity: a };
  }
  return { color, opacity: 1 };
}

export function GradientView({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  locations,
  style,
  className,
  children,
}: GradientViewProps) {
  const uid = useId();
  const [size, setSize] = useState({ w: 1, h: 1 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: Math.max(width, 1), h: Math.max(height, 1) });
  };

  const gradId = `gv-${uid.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <View
      style={[{ overflow: "hidden" }, style as ViewStyle]}
      className={className}
      onLayout={onLayout}
    >
      {/* Gradient fills the View's entire measured area */}
      <Svg
        width={size.w}
        height={size.h}
        style={{ position: "absolute", top: 0, left: 0 }}
        pointerEvents="none"
      >
        <Defs>
          <SvgLinearGradient
            id={gradId}
            x1={`${start.x * 100}%`}
            y1={`${start.y * 100}%`}
            x2={`${end.x * 100}%`}
            y2={`${end.y * 100}%`}
          >
            {colors.map((color, i) => {
              const pos =
                locations != null
                  ? locations[i]
                  : i / Math.max(colors.length - 1, 1);
              const { color: stopColor, opacity: stopOpacity } = normalizeColor(color);
              return (
                <Stop
                  key={i}
                  offset={`${pos * 100}%`}
                  stopColor={stopColor}
                  stopOpacity={stopOpacity}
                />
              );
            })}
          </SvgLinearGradient>
        </Defs>
        <Rect x={0} y={0} width={size.w} height={size.h} fill={`url(#${gradId})`} />
      </Svg>
      {children}
    </View>
  );
}
