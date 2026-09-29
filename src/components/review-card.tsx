import { useState } from "react";
import { Pressable, View } from "react-native";
import { Heart, ThumbsDown } from "lucide-react-native";

import { BookLink, LikedHeart, Stars } from "@/components/book";
import { Text } from "@/components/ui";
import { Avatar, FounderBadge } from "@/components/user";
import { useColors } from "@/lib/theme";
import type { Review } from "@/lib/types";

/** Review com autor, nota e texto. `showBook` põe a capa ao lado (listas fora da página do livro). */
export function ReviewCard({ review, showBook = false }: { review: Review; showBook?: boolean }) {
  const c = useColors();
  const [open, setOpen] = useState(!review.spoiler);
  const likes = review.reactions?.likes ?? review.likes ?? 0;

  return (
    <View style={{ flexDirection: "row", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderColor: c.line }}>
      {showBook ? <BookLink book={review.book} width={56} /> : null}
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Avatar user={review.user} size={24} link />
          <Text variant="small" weight="semibold" numberOfLines={1} style={{ flexShrink: 1 }}>
            {review.user.name}
          </Text>
          {review.user.founder ? <FounderBadge /> : null}
          {review.rating !== null ? <Stars rating={review.rating} size={12} /> : null}
          {review.liked ? <LikedHeart size={12} /> : null}
        </View>
        {showBook ? (
          <Text variant="small" tone="ink3" numberOfLines={1}>
            {review.book.title}
            {review.book.year ? ` · ${review.book.year}` : ""}
          </Text>
        ) : null}
        {open ? (
          <Text variant="body" tone="ink2">
            {review.text}
          </Text>
        ) : (
          <Pressable onPress={() => setOpen(true)} accessibilityRole="button">
            <Text variant="small" tone="ink3">
              Esta review tem spoiler. Toque para ler.
            </Text>
          </Pressable>
        )}
        <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Heart size={13} color={c.ink4} />
            <Text variant="caption" tone="ink4">
              {likes}
            </Text>
          </View>
          {review.reactions?.dislikes ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <ThumbsDown size={13} color={c.ink4} />
              <Text variant="caption" tone="ink4">
                {review.reactions.dislikes}
              </Text>
            </View>
          ) : null}
          <Text variant="caption" tone="ink4">
            {formatDate(review.date)}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** "29 de set. de 2026", ou "29 set." com short (listas estreitas, como o diário). */
export function formatDate(iso: string, short = false) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  if (short) return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(" de ", " ");
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}
