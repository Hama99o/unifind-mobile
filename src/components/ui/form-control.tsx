/** FormControl — wrapper for labeled form inputs with error display. */
import { View, ViewProps } from "react-native";
import { Text } from "@/components/ui/text";

interface FormControlProps extends ViewProps {
  isInvalid?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function FormControl({ isInvalid, children, className, ...props }: FormControlProps) {
  return (
    <View className={`gap-1 ${className ?? ""}`} {...props}>
      {children}
    </View>
  );
}

interface FormControlLabelProps { children?: React.ReactNode }
export function FormControlLabel({ children }: FormControlLabelProps) {
  return <View>{children}</View>;
}

interface FormControlLabelTextProps { children?: React.ReactNode; className?: string }
export function FormControlLabelText({ children, className }: FormControlLabelTextProps) {
  return <Text className={`text-sm font-medium text-foreground ${className ?? ""}`}>{children}</Text>;
}

interface FormControlErrorProps { children?: React.ReactNode }
export function FormControlError({ children }: FormControlErrorProps) {
  return <View>{children}</View>;
}

interface FormControlErrorTextProps { children?: React.ReactNode }
export function FormControlErrorText({ children }: FormControlErrorTextProps) {
  return <Text className="text-xs text-destructive">{children}</Text>;
}
