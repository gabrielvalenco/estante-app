import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BookCover } from "@/components/book";
import { Chip, Empty, Loading, Text } from "@/components/ui";
import { Avatar, FounderBadge, PrivateBadge } from "@/components/user";
import { api } from "@/lib/api";
import { font, useColors } from "@/lib/theme";
import type { BookSummary, ProfileCard } from "@/lib/types";

/** Busca de livros (Open Library) e de leitores. */
export default function SearchScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ leitores?: string }>();
  const [mode, setMode] = useState<"livros" | "leitores">(params.leitores ? "leitores" : "livros");
  const [text, setText] = useState("");
  const q = useDebounced(text.trim(), 350);

  const books = useQuery({
    queryKey: ["search", "books", q],
    queryFn: () => api<{ books: BookSummary[] }>(`/books/search?q=${encodeURIComponent(q)}`, { auth: false }),
    enabled: mode === "livros" && q.length >= 2,
    staleTime: 5 * 60_000,
  });
  const readers = useQuery({
    queryKey: ["search", "readers", q],
    queryFn: () => api<{ readers: ProfileCard[] }>(`/users/search?q=${encodeURIComponent(q)}`, { auth: false }),
    enabled: mode === "leitores" && q.length >= 2,
  });
  const active = mode === "livros" ? books : readers;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.canvas }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text variant="title">Buscar</Text>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.sunken, borderRadius: 14, paddingHorizontal: 12, height: 46, gap: 8 }}>
          <Search size={18} color={c.ink4} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={mode === "livros" ? "Título, autor ou ISBN" : "Nome ou @ do leitor"}
            placeholderTextColor={c.ink4}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Buscar"
            style={{ flex: 1, color: c.ink, fontFamily: font.regular, fontSize: 16 }}
          />
          {text ? (
            <Pressable onPress={() => setText("")} accessibilityLabel="Limpar busca" hitSlop={8}>
              <X size={18} color={c.ink4} />
            </Pressable>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip label="Livros" active={mode === "livros"} onPress={() => setMode("livros")} />
          <Chip label="Leitores" active={mode === "leitores"} onPress={() => setMode("leitores")} />
        </View>
      </View>

      {q.length < 2 ? (
        <Empty title={mode === "livros" ? "Encontre um livro" : "Encontre leitores"}>
          {mode === "livros" ? "Busque por título, autor ou ISBN." : "Busque pelo nome ou pelo @."}
        </Empty>
      ) : active.isPending ? (
        <Loading />
      ) : mode === "livros" ? (
        <FlatList
          data={books.data?.books ?? []}
          keyExtractor={(b) => b.id}
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListEmptyComponent={<Empty title="Nenhum livro encontrado">Tente outro título ou o nome do autor.</Empty>}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${item.title}, ${item.author}`}
              onPress={() => router.push(`/livro/${item.id}`)}
              style={({ pressed }) => ({ flexDirection: "row", gap: 14, paddingVertical: 10, alignItems: "center", opacity: pressed ? 0.7 : 1 })}
            >
              <BookCover book={item} width={48} />
              <View style={{ flex: 1 }}>
                <Text variant="label" numberOfLines={2}>
                  {item.title}
                </Text>
                <Text variant="small" tone="ink3" numberOfLines={1}>
                  {item.author}
                  {item.year ? ` · ${item.year}` : ""}
                </Text>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={readers.data?.readers ?? []}
          keyExtractor={(r) => r.handle}
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListEmptyComponent={<Empty title="Nenhum leitor encontrado" />}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${item.name}, @${item.handle}`}
              onPress={() => router.push(`/u/${item.handle}`)}
              style={({ pressed }) => ({ flexDirection: "row", gap: 12, paddingVertical: 10, alignItems: "center", opacity: pressed ? 0.7 : 1 })}
            >
              <Avatar user={item} size={44} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {item.name}
                  </Text>
                  {item.founder ? <FounderBadge /> : null}
                  {item.isPrivate ? <PrivateBadge /> : null}
                </View>
                <Text variant="small" tone="ink3">
                  @{item.handle}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
