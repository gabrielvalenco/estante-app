import { router } from "expo-router";
import { NotebookPen } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BookLink, LikedHeart, Stars } from "@/components/book";
import { Button, Chip, Empty, Text } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { percent, useAllAnnotations } from "@/lib/reading";
import { statusColor, useColors } from "@/lib/theme";
import type { ShelfEntry } from "@/lib/types";

type Filter = "lendo" | "quero-ler" | "lido" | "curtidos";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "lendo", label: "Lendo" },
  { key: "quero-ler", label: "Quero ler" },
  { key: "lido", label: "Lidos" },
  { key: "curtidos", label: "Curtidos" },
];

export default function ShelfScreen() {
  const c = useColors();
  const { status, account } = useAuth();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>("lendo");
  const reading = useAllAnnotations(status === "user");
  const progress = reading.data?.progress ?? {};

  if (status !== "user" || !account) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.canvas }}>
        <Empty title="Sua estante mora na sua conta" action={<Button onPress={() => router.push("/entrar")}>Entrar ou criar conta</Button>}>
          Entre para guardar o que você lê, quer ler e já leu, e ver tudo também no site.
        </Empty>
      </SafeAreaView>
    );
  }

  const shelf = account.shelf;
  const year = String(new Date().getFullYear());
  const readThisYear = shelf.filter((e) => e.status === "lido" && (e.finishedOn ?? "").startsWith(year)).length;
  const goal = account.profile.goal;
  const items = shelf.filter((e) => (filter === "curtidos" ? e.liked : e.status === filter));
  const columns = 3;
  const gap = 14;
  const coverWidth = Math.floor((width - 32 - gap * (columns - 1)) / columns);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.canvas }}>
      <FlatList
        data={items}
        key={columns}
        numColumns={columns}
        keyExtractor={(e) => e.book.id}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 18 }}
        ListHeaderComponent={
          <View style={{ gap: 16, paddingTop: 16, paddingBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text variant="title">Minha estante</Text>
              <Pressable
                onPress={() => router.push("/anotacoes")}
                accessibilityRole="button"
                accessibilityLabel="Anotações"
                hitSlop={8}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.sunken }}
              >
                <NotebookPen size={16} color={c.ameixa} />
                <Text variant="small" weight="medium">
                  Anotações
                </Text>
              </Pressable>
            </View>
            <Goal read={readThisYear} goal={goal} year={year} />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  label={`${f.label} ${count(shelf, f.key)}`}
                  active={filter === f.key}
                  color={f.key === "curtidos" ? c.ameixa : statusColor(c, f.key)}
                  onPress={() => setFilter(f.key)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <Empty title="Nada aqui ainda" action={<Button variant="secondary" onPress={() => router.push("/buscar")}>Buscar livros</Button>}>
            Abra um livro e marque como {FILTERS.find((f) => f.key === filter)?.label.toLowerCase()}.
          </Empty>
        }
        renderItem={({ item }) => (
          <View style={{ width: coverWidth, gap: 6 }}>
            <BookLink book={item.book} width={coverWidth} />
            {item.status === "lendo" && percent(progress[item.book.id]) !== null ? (
              <View accessibilityLabel={`${percent(progress[item.book.id])}% lido`} style={{ height: 4, borderRadius: 2, backgroundColor: c.sunken, overflow: "hidden" }}>
                <View style={{ width: `${percent(progress[item.book.id]) ?? 0}%`, height: 4, backgroundColor: c.ameixa }} />
              </View>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 14 }}>
              {item.rating !== null ? <Stars rating={item.rating} size={11} /> : null}
              {item.liked ? <LikedHeart size={11} /> : null}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function count(shelf: ShelfEntry[], f: Filter) {
  return shelf.filter((e) => (f === "curtidos" ? e.liked : e.status === f)).length;
}

function Goal({ read, goal, year }: { read: number; goal: number; year: string }) {
  const c = useColors();
  const pct = Math.min(1, read / Math.max(1, goal));
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 16, gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text variant="small" tone="ink3" weight="medium">
          Meta de {year}
        </Text>
        <Text variant="label">
          {read} de {goal} livros
        </Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: c.sunken, overflow: "hidden" }}>
        <View style={{ width: `${pct * 100}%`, height: 8, borderRadius: 4, backgroundColor: c.musgo }} />
      </View>
    </View>
  );
}
