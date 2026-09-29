import { ActivityIndicator, Pressable, Text as RNText, View, type PressableProps, type TextProps, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";

import { font, useColors } from "@/lib/theme";

type Variant = "body" | "small" | "caption" | "title" | "hero" | "section" | "label";

const VARIANTS: Record<Variant, { size: number; line: number; family: string; spacing?: number }> = {
  hero: { size: 30, line: 34, family: font.bold, spacing: -0.8 },
  title: { size: 22, line: 27, family: font.bold, spacing: -0.5 },
  section: { size: 17, line: 22, family: font.semibold, spacing: -0.3 },
  body: { size: 15, line: 21, family: font.regular },
  label: { size: 15, line: 20, family: font.medium },
  small: { size: 13, line: 18, family: font.regular },
  caption: { size: 11, line: 14, family: font.medium },
};

/** Texto com a fonte Inter e as cores do tema. */
export function Text({
  variant = "body",
  tone = "ink",
  weight,
  style,
  ...props
}: TextProps & { variant?: Variant; tone?: "ink" | "ink2" | "ink3" | "ink4" | "anil" | "danger" | "onBrand"; weight?: keyof typeof font }) {
  const c = useColors();
  const v = VARIANTS[variant];
  return (
    <RNText
      {...props}
      style={[
        { fontSize: v.size, lineHeight: v.line, fontFamily: weight ? font[weight] : v.family, letterSpacing: v.spacing ?? 0, color: c[tone] },
        style,
      ]}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  loading,
  disabled,
  icon,
  style,
  onPress,
  ...props
}: Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
}) {
  const c = useColors();
  const bg = variant === "primary" ? c.anil : variant === "secondary" ? c.sunken : "transparent";
  const fg = variant === "primary" ? c.onBrand : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={(e) => {
        void Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          height: 48,
          borderRadius: 999,
          paddingHorizontal: 20,
          backgroundColor: bg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon}
      {typeof children === "string" ? (
        <RNText style={{ color: fg, fontFamily: font.semibold, fontSize: 15 }}>{children}</RNText>
      ) : (
        children
      )}
    </Pressable>
  );
}

/** Pílula selecionável (filtros, status). */
export function Chip({ label, active, color, onPress }: { label: string; active: boolean; color?: string; onPress: () => void }) {
  const c = useColors();
  const accent = color ?? c.anil;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => ({
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 999,
        justifyContent: "center",
        backgroundColor: active ? accent : c.sunken,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <RNText style={{ fontFamily: font.medium, fontSize: 14, color: active ? c.onBrand : c.ink2 }}>{label}</RNText>
    </Pressable>
  );
}

export function Loading() {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
      <ActivityIndicator color={c.anil} />
    </View>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 24, gap: 8 }}>
      <Text variant="section" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {children ? (
        <Text tone="ink3" style={{ textAlign: "center" }}>
          {children}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 12 }}>{action}</View> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return <View style={[{ backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.line, padding: 16 }, style]}>{children}</View>;
}
