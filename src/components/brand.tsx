import Svg, { Path, Rect } from "react-native-svg";
import { View } from "react-native";

import { Text } from "@/components/ui";
import { useColors } from "@/lib/theme";

/**
 * Mark da Estante: três camadas, uma para cada estado de leitura
 * (anil = quero ler, ameixa = lendo, musgo = lido), e o marcador âmbar da avaliação.
 */
export function Mark({ size = 24 }: { size?: number }) {
  const c = useColors();
  return (
    <View aria-hidden style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Rect x={3} y={2} width={26} height={28} rx={6} fill={c.anil} />
        <Path d="M10 12a4 4 0 0 1 4-4h15v16a6 6 0 0 1-6 6H10z" fill={c.ameixa} />
        <Path d="M17 18a4 4 0 0 1 4-4h8v10a6 6 0 0 1-6 6h-6z" fill={c.musgo} />
        <Path d="M5.5 2h4v8.5l-2-1.6-2 1.6z" fill={c.ambar} />
      </Svg>
    </View>
  );
}

export function Wordmark() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }} accessibilityRole="header" accessibilityLabel="Estante">
      <Mark size={26} />
      <Text variant="title" style={{ fontSize: 21 }}>
        Estante
      </Text>
    </View>
  );
}
