import { Inbox } from "lucide-react-native";
import { Center } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useColors } from "@/hooks/useColors";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
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
    </Center>
  );
}
