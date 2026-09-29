import { Image } from "expo-image";
import { router } from "expo-router";
import { Heart, Star } from "lucide-react-native";
import { Pressable, View, type ViewStyle } from "react-native";

import { Text } from "@/components/ui";
import { coverUrl, useColors } from "@/lib/theme";
import type { BookSummary } from "@/lib/types";

type CoverBook = Pick<BookSummary, "id" | "title" | "coverId" | "color">;

/** Capa do livro (Open Library). Sem capa, um bloco na cor do livro com o título. */
export function BookCover({ book, width, style }: { book: CoverBook; width: number; style?: ViewStyle }) {
  const height = Math.round(width * 1.5);
  const url = coverUrl(book.coverId, width > 120 ? "L" : "M");
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: Math.max(4, width * 0.04),
          backgroundColor: book.color,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        },
        style,
      ]}
    >
      {url ? (
        <Image source={url} style={{ width, height }} contentFit="cover" transition={200} recyclingKey={book.id} accessibilityIgnoresInvertColors />
      ) : (
        <View style={{ flex: 1, padding: width * 0.1 }}>
          <Text numberOfLines={5} style={{ color: "#fff", fontSize: Math.max(9, width * 0.1), lineHeight: Math.max(11, width * 0.12) }} weight="semibold">
            {book.title}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Capa que abre a página do livro. */
export function BookLink({ book, width, caption }: { book: CoverBook & { author?: string }; width: number; caption?: boolean }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={book.title}
      onPress={() => router.push(`/livro/${book.id}`)}
      style={({ pressed }) => ({ width, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
    >
      <BookCover book={book} width={width} />
      {caption ? (
        <View style={{ marginTop: 8, gap: 1 }}>
          <Text variant="small" weight="medium" numberOfLines={2}>
            {book.title}
          </Text>
          {book.author ? (
            <Text variant="small" tone="ink3" numberOfLines={1}>
              {book.author}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

/** Nota em estrelas (de meia em meia), só leitura. */
export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const c = useColors();
  return (
    <View accessibilityLabel={`${formatRating(rating)} de 5 estrelas`} style={{ flexDirection: "row", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0;
        return (
          <View key={i} style={{ width: size, height: size }}>
            <Star size={size} color={c.lineStrong} fill={c.lineStrong} strokeWidth={0} />
            {fill > 0 ? (
              <View style={{ position: "absolute", top: 0, left: 0, width: size * fill, height: size, overflow: "hidden" }}>
                <Star size={size} color={c.ambar} fill={c.ambar} strokeWidth={0} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function LikedHeart({ size = 13 }: { size?: number }) {
  const c = useColors();
  return <Heart size={size} color={c.ameixa} fill={c.ameixa} accessibilityLabel="Curtiu" />;
}

export function formatRating(r: number) {
  return r.toLocaleString("pt-BR", { minimumFractionDigits: r % 1 ? 1 : 0, maximumFractionDigits: 1 });
}
