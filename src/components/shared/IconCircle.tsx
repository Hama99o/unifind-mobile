/**
 * IconCircle — circular icon container with bg-lightgreen background.
 *
 * Props:
 *   size     — diameter in px (default 40)
 *   className — extra NativeWind classes (merged with base classes)
 *   children  — icon element (e.g. a lucide-react-native icon)
 *
 * Visual contract: rounded-full bg-lightgreen, centred children.
 * Used by: InfoCard (size 40), ProgramExplorerHubCards ExplorerTile (size 40),
 *          SignInSheet BenefitRow (size 36).
 */

import { View } from "react-native";

interface IconCircleProps {
  size?: number;
  className?: string;
  children: React.ReactNode;
}

export function IconCircle({ size = 40, className, children }: IconCircleProps) {
  return (
    <View
      className={`rounded-full bg-lightgreen items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {children}
    </View>
  );
}
