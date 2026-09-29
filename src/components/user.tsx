import { Image } from "expo-image";
import { router } from "expo-router";
import { BadgeCheck, Lock } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui";
import { SITE_URL } from "@/lib/api";
import { font, toneColors, useColors } from "@/lib/theme";
import type { UserRef } from "@/lib/types";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/** Avatar: a foto, se houver, sobre as iniciais na cor escolhida pela pessoa. */
export function Avatar({ user, size = 36, link = false }: { user: UserRef; size?: number; link?: boolean }) {
  const c = useColors();
  const tone = toneColors(c, user.tone);
  const avatar = (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone.bg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Text style={{ color: tone.fg, fontFamily: font.semibold, fontSize: size * 0.38, lineHeight: size * 0.46 }}>{initials(user.name)}</Text>
      {user.avatarUrl ? (
        <Image
          source={photoUrl(user.avatarUrl)}
          style={{ position: "absolute", width: size, height: size }}
          contentFit="cover"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
  if (!link) return avatar;
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={user.name} onPress={() => router.push(`/u/${user.handle}`)} hitSlop={6}>
      {avatar}
    </Pressable>
  );
}

/** Fotos do ambiente de desenvolvimento do site vêm com caminho relativo. */
function photoUrl(url: string) {
  return url.startsWith("http") ? url : SITE_URL + url;
}

export function FounderBadge() {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.ambarSoft, borderRadius: 999, paddingHorizontal: 8, height: 22 }}>
      <BadgeCheck size={13} color={c.ambarInk} />
      <Text variant="caption" style={{ color: c.ambarInk }}>
        Fundador
      </Text>
    </View>
  );
}

export function PrivateBadge() {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.sunken, borderRadius: 999, paddingHorizontal: 8, height: 22 }}>
      <Lock size={11} color={c.ink3} />
      <Text variant="caption" tone="ink3">
        Privado
      </Text>
    </View>
  );
}
