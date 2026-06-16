import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export function Box({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={className} {...props} />;
}

export function VStack({
  className,
  ...props
}: ViewProps & { className?: string }) {
  return <View className={cn("flex flex-col", className)} {...props} />;
}

export function HStack({
  className,
  ...props
}: ViewProps & { className?: string }) {
  return <View className={cn("flex flex-row items-center", className)} {...props} />;
}

export function Center({
  className,
  ...props
}: ViewProps & { className?: string }) {
  return (
    <View className={cn("items-center justify-center", className)} {...props} />
  );
}
