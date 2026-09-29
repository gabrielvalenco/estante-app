import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Bell } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Wordmark } from "@/components/brand";
import { BookLink, LikedHeart, Stars } from "@/components/book";
import { ReviewCard, formatDate } from "@/components/review-card";
import { Button, Chip, Empty, Loading, Text } from "@/components/ui";
import { Avatar } from "@/components/user";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { STATUS_LABEL, useColors } from "@/lib/theme";
import type { BookSummary, FeedItem, Review } from "@/lib/types";

export default function Home() {
  const c = useColors();
  const { status, account } = useAuth();
  const [tab, setTab] = useState<"descobrir" | "seguindo">("descobrir");
  const user = status === "user";

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ unread: number }>("/notifications"),
    enabled: user,
    refetchInterval: 60_000,
  });
  const unread = notifications.data?.unread ?? 0;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.canvas }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 }}>
        <Wordmark />
        {user ? (
          <Pressable
            onPress={() => router.push("/notificacoes")}
            accessibilityLabel={unread ? `Notificações, ${unread} não lidas` : "Notificações"}
            hitSlop={8}
            style={{ padding: 8 }}
          >
            <Bell size={22} color={c.ink2} />
            {unread ? (
              <View style={{ position: "absolute", top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: c.anil, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 2, borderColor: c.canvas }}>
                <Text style={{ color: c.onBrand, fontSize: 9, lineHeight: 11 }} weight="bold">
                  {unread > 9 ? "9+" : unread}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : (
          <Button variant="secondary" onPress={() => router.push("/entrar")} style={{ height: 38, paddingHorizontal: 16 }}>
            Entrar
          </Button>
        )}
      </View>

      {user ? (
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
          <Chip label="Descobrir" active={tab === "descobrir"} onPress={() => setTab("descobrir")} />
          <Chip label="Seguindo" active={tab === "seguindo"} onPress={() => setTab("seguindo")} />
        </View>
      ) : null}

      {tab === "seguindo" && user ? <Following /> : <Discover reading={account?.shelf.filter((e) => e.status === "lendo").map((e) => e.book) ?? []} />}
    </SafeAreaView>
  );
}

function Discover({ reading }: { reading: BookSummary[] }) {
  const c = useColors();
  const home = useQuery({ queryKey: ["home"], queryFn: () => api<{ books: BookSummary[]; reviews: Review[] }>("/home", { auth: false }) });
  if (home.isPending) return <Loading />;
  if (home.isError) return <Empty title="Não deu para carregar" action={<Button onPress={() => home.refetch()}>Tentar de novo</Button>}>Confira sua conexão.</Empty>;

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={() => home.refetch()} tintColor={c.anil} />}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
        <Text variant="hero">Seu diário de leituras.</Text>
        <Text tone="ink3" style={{ marginTop: 6 }}>
          Registre o que leu, dê notas e descubra livros pelo gosto de quem você segue.
        </Text>
      </View>

      {reading.length ? <Row title="Continue lendo" books={reading} /> : null}
      <Row title="Em alta na Estante" books={home.data.books} />

      <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
        <Text variant="section">Reviews recentes</Text>
        {home.data.reviews.length ? (
          home.data.reviews.map((r) => <ReviewCard key={r.id} review={r} showBook />)
        ) : (
          <Text tone="ink3" style={{ marginTop: 8 }}>
            Ainda não há reviews. Que tal escrever a primeira?
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ title, books }: { title: string; books: BookSummary[] }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text variant="section" style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        {title}
      </Text>
      <FlatList
        horizontal
        data={books}
        keyExtractor={(b) => b.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingBottom: 12 }}
        renderItem={({ item }) => <BookLink book={item} width={112} caption />}
      />
    </View>
  );
}

function Following() {
  const c = useColors();
  const feed = useQuery({ queryKey: ["feed"], queryFn: () => api<{ items: FeedItem[] }>("/feed") });
  if (feed.isPending) return <Loading />;
  const items = feed.data?.items ?? [];

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => `${i.user.handle}:${i.book.id}`}
      refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={c.anil} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
      ListEmptyComponent={
        <Empty title="Nada por aqui ainda" action={<Button variant="secondary" onPress={() => router.push("/buscar?leitores=1")}>Encontrar leitores</Button>}>
          Siga outros leitores para ver o que eles estão lendo.
        </Empty>
      }
      renderItem={({ item }) => (
        <View style={{ flexDirection: "row", gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderColor: c.line }}>
          <BookLink book={item.book} width={56} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Avatar user={item.user} size={22} link />
              <Text variant="small" tone="ink3" style={{ flexShrink: 1 }} numberOfLines={1}>
                <Text variant="small" weight="semibold">
                  {item.user.name}
                </Text>
                {` ${verb(item)}`}
              </Text>
            </View>
            <Text variant="label" numberOfLines={2}>
              {item.book.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {item.rating !== null ? <Stars rating={item.rating} size={12} /> : null}
              {item.liked ? <LikedHeart size={12} /> : null}
              <Text variant="caption" tone="ink4">
                {formatDate(item.finishedOn ?? new Date(item.updatedAt).toISOString().slice(0, 10))}
              </Text>
            </View>
            {item.review ? (
              <Text variant="small" tone="ink2" numberOfLines={3}>
                {item.review}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    />
  );
}

function verb(i: FeedItem) {
  if (i.review) return "escreveu sobre";
  if (i.status === "lido") return i.rating !== null ? "avaliou" : "leu";
  if (i.status) return `marcou ${STATUS_LABEL[i.status].toLowerCase()}`;
  return i.liked ? "curtiu" : "atualizou";
}
