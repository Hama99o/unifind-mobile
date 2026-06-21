import type { ReactNode } from "react";
import { Inbox } from "lucide-react-native";
import { Center } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useColors } from "@/hooks/useColors";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  /** Optional action (e.g. a Retry button) rendered centered just below the
   *  text — so it stays with the message instead of dropping to the bottom. */
  action?: ReactNode;
}) {
  const colors = useColors();
  return (
    <Center className="flex-1 gap-2 px-8 py-16">
      <Inbox size={48} color={colors.mutedForeground} />
      <Heading size="md" className="text-center">
        {title}
      </Heading>
      {description ? (
        <Text className="text-center text-muted-foreground">{description}</Text>
      ) : null}
      {action ? <Center className="mt-4 w-full max-w-[260px]">{action}</Center> : null}
    </Center>
  );
}
