import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { BookOpen, Bookmark, Check, ExternalLink, ShoppingBag } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookCover, LikedHeart, Stars, formatRating } from "@/components/book";
import { EntrySheet } from "@/components/entry-sheet";
import { ReadingSection } from "@/components/reading";
import { ReviewCard } from "@/components/review-card";
import { Button, Empty, Loading, Text } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { EMPTY_ENTRY, todayISO, useMyEntry, useSaveEntry } from "@/lib/shelf";
import { statusColor, useColors } from "@/lib/theme";
import type { BookPage, Status } from "@/lib/types";

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const q = useQuery({ queryKey: ["book", id], queryFn: () => api<BookPage>(`/books/${id}`) });
  const { status } = useAuth();

  if (q.isPending) return <Loading />;
  if (q.isError || !q.data) return <Empty title="Livro não encontrado">Tente de novo em instantes.</Empty>;
  const { book, stats, reviews, buy } = q.data;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      <View style={{ backgroundColor: book.color + "33", paddingTop: insets.top + 56, paddingBottom: 24, alignItems: "center", gap: 16 }}>
        <BookCover book={book} width={150} />
        <View style={{ alignItems: "center", paddingHorizontal: 24, gap: 4 }}>
          <Text variant="title" style={{ textAlign: "center" }}>
            {book.title}
          </Text>
          <Text tone="ink2" style={{ textAlign: "center" }}>
            {book.author}
          </Text>
          <Text variant="small" tone="ink3">
            {[book.year, book.pages ? `${book.pages} páginas` : null].filter(Boolean).join(" · ")}
          </Text>
        </View>
      </View>

      <View style={{ padding: 16, gap: 20 }}>
        <MyActions page={q.data} />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Metric icon={<Text style={{ color: c.ambar }}>★</Text>} value={formatRating(stats.avg)} label="média" />
          <Metric icon={<Check size={14} color={c.musgo} />} value={compact(stats.readers)} label="leram" />
          <Metric icon={<BookOpen size={14} color={c.ameixa} />} value={compact(stats.reading)} label="lendo" />
          <Metric icon={<Bookmark size={14} color={c.anil} />} value={compact(stats.wantToRead)} label="querem ler" />
        </View>

        {book.synopsis ? <Synopsis text={book.synopsis} /> : null}

        {status === "user" ? <ReadingSection book={book} /> : null}

        {book.genres.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {book.genres.map((g) => (
              <View key={g} style={{ backgroundColor: c.sunken, borderRadius: 999, paddingHorizontal: 10, height: 26, justifyContent: "center" }}>
                <Text variant="caption" tone="ink2">
                  {g}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {buy ? (
          <Button
            variant="secondary"
            icon={<ShoppingBag size={16} color={c.ambarInk} />}
            onPress={() => void Linking.openURL(buy.href)}
            accessibilityHint="Abre a Amazon no navegador. Link de afiliado."
          >
            <Text weight="semibold">Comprar na {buy.store}</Text>
            <ExternalLink size={14} color={c.ink4} />
          </Button>
        ) : null}

        <View>
          <Text variant="section">Reviews</Text>
          {reviews.length ? (
            reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          ) : (
            <Text tone="ink3" style={{ marginTop: 8 }}>
              Ninguém escreveu sobre este livro ainda.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

/** Status rápido (um toque) e o botão que abre o registro completo. */
function MyActions({ page }: { page: BookPage }) {
  const c = useColors();
  const { status } = useAuth();
  const cached = useMyEntry(page.book.id);
  const entry = status === "user" ? (cached ?? page.myEntry) : null;
  const save = useSaveEntry();
  const [open, setOpen] = useState(false);

  if (status !== "user") {
    return <Button onPress={() => router.push("/entrar")}>Entrar para registrar a leitura</Button>;
  }

  const quick = (s: Status) => {
    const base = entry ?? EMPTY_ENTRY;
    const next = base.status === s ? null : s;
    save.mutate({
      book: page.book,
      entry: { ...base, status: next, finishedOn: next === "lido" ? (base.finishedOn ?? todayISO()) : next ? null : base.finishedOn, updatedAt: Date.now() },
    });
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(
          [
            ["quero-ler", "Quero ler", Bookmark],
            ["lendo", "Lendo", BookOpen],
            ["lido", "Lido", Check],
          ] as const
        ).map(([s, label, Icon]) => {
          const active = entry?.status === s;
          const color = statusColor(c, s);
          return (
            <Pressable
              key={s}
              onPress={() => quick(s)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                flex: 1,
                height: 64,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                backgroundColor: active ? color : c.sunken,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Icon size={18} color={active ? c.onBrand : color} />
              <Text variant="small" weight="medium" style={{ color: active ? c.onBrand : c.ink2 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button variant="primary" onPress={() => setOpen(true)}>
        {entry?.rating || entry?.review ? "Editar registro" : "Registrar leitura"}
      </Button>
      {entry?.rating || entry?.liked ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Text variant="small" tone="ink3">
            Sua nota
          </Text>
          {entry.rating ? <Stars rating={entry.rating} size={14} /> : null}
          {entry.liked ? <LikedHeart /> : null}
        </View>
      ) : null}

      {open ? <EntrySheet book={page.book} entry={entry} visible={open} onClose={() => setOpen(false)} /> : null}
    </View>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, paddingVertical: 10, alignItems: "center", gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {icon}
        <Text variant="label">{value}</Text>
      </View>
      <Text variant="caption" tone="ink3">
        {label}
      </Text>
    </View>
  );
}

function Synopsis({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityHint={open ? "Recolher sinopse" : "Ler a sinopse inteira"}>
      <Text tone="ink2" numberOfLines={open ? undefined : 5}>
        {text}
      </Text>
      {!open ? (
        <Text variant="small" tone="anil" weight="medium" style={{ marginTop: 4 }}>
          Ler mais
        </Text>
      ) : null}
    </Pressable>
  );
}

function compact(n: number) {
  return n >= 1000 ? `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : String(n);
}
