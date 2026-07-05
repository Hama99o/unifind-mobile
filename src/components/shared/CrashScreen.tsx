// Deliberately plain React Native primitives (no Gluestack/theme/i18n) so this
// still renders even if the crash originated inside one of those providers.
import { ScrollView, Text, View } from "react-native";

export function CrashScreen({ error }: { error: Error }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a", paddingTop: 60 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          UniFind hit an error
        </Text>
        <Text style={{ color: "#f87171", fontSize: 14, marginBottom: 12 }}>
          {error.name}: {error.message}
        </Text>
        <Text style={{ color: "#999", fontSize: 12 }}>{error.stack}</Text>
      </ScrollView>
    </View>
  );
}
