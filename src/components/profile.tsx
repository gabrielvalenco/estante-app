import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Lock, Settings } from "lucide-react-native";
import { FlatList, Pressable, RefreshControl, ScrollView, View } from "react-native";

import { BookLink, LikedHeart, Stars } from "@/components/book";
import { ReviewCard, formatDate } from "@/components/review-card";
import { Button, Empty, Loading, Text } from "@/components/ui";
import { Avatar, FounderBadge, PrivateBadge } from "@/components/user";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useColors } from "@/lib/theme";
import type { ProfileAccess, ProfileBook, ProfileView } from "@/lib/types";

type Data = { profile: ProfileView; access: ProfileAccess };

export function ProfileScreen({ handle, own = false }: { handle: string; own?: boolean }) {
  const c = useColors();
  const q = useQuery({ queryKey: ["profile", handle], queryFn: () => api<Data>(`/users/${handle}`) });

  if (q.isPending) return <Loading />;
  if (q.isError || !q.data) return <Empty title="Perfil não encontrado">Confira o @ ou tente de novo.</Empty>;
  const { profile: p, access } = q.data;
  const content = p.content;

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.anil} />}
    >
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Avatar user={p} size={80} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title" numberOfLines={2}>
              {p.name}
            </Text>
            <Text tone="ink3">@{p.handle}</Text>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {p.founder ? <FounderBadge /> : null}
              {p.isPrivate ? <PrivateBadge /> : null}
            </View>
          </View>
          {own ? (
            <Pressable onPress={() => router.push("/conta")} accessibilityLabel="Configurações" hitSlop={8} style={{ padding: 8, borderRadius: 999, backgroundColor: c.sunken }}>
              <Settings size={20} color={c.ink2} />
            </Pressable>
          ) : null}
        </View>

        {p.bio ? <Text tone="ink2">{p.bio}</Text> : null}

        <View style={{ flexDirection: "row", gap: 24 }}>
          <Stat value={content?.shelfCount} label="livros" />
          <Stat value={content?.readThisYear} label={`em ${new Date().getFullYear()}`} />
          {p.followers !== null ? <Stat value={p.followers} label="seguidores" /> : null}
          {p.following !== null ? <Stat value={p.following} label="seguindo" /> : null}
        </View>

        {own ? (
          <Button variant="secondary" onPress={() => router.push("/conta")}>
            Editar perfil
          </Button>
        ) : !p.isDemo ? (
          <FollowButton handle={p.handle} isPrivate={p.isPrivate} />
        ) : null}
      </View>

      {content ? (
        <>
          {content.reading.length ? <Shelf title="Lendo agora" books={content.reading} /> : null}
          {content.favorites.length ? <Shelf title="Favoritos" books={content.favorites} /> : null}
          {content.diary.length ? (
            <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
              <Text variant="section" style={{ marginBottom: 4 }}>
                Diário
              </Text>
              {content.diary.slice(0, 12).map((d) => (
                <Pressable
                  key={`${d.book.id}${d.date}`}
                  onPress={() => router.push(`/livro/${d.book.id}`)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: c.line }}
                >
                  <Text variant="caption" tone="ink4" style={{ width: 52 }}>
                    {formatDate(d.date, true)}
                  </Text>
                  <Text variant="small" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
                    {d.book.title}
                  </Text>
                  {d.rating !== null ? <Stars rating={d.rating} size={11} /> : null}
                  {d.liked ? <LikedHeart size={11} /> : null}
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <Text variant="section">Reviews</Text>
            {content.reviews.length ? (
              content.reviews.map((r) => <ReviewCard key={r.id} review={r} showBook />)
            ) : (
              <Text tone="ink3" style={{ marginTop: 8 }}>
                Nenhuma review ainda.
              </Text>
            )}
          </View>
        </>
      ) : (
        <PrivateGate access={access} />
      )}
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number | null | undefined; label: string }) {
  return (
    <View>
      <Text variant="section">{value ?? "–"}</Text>
      <Text variant="caption" tone="ink3">
        {label}
      </Text>
    </View>
  );
}

function Shelf({ title, books }: { title: string; books: ProfileBook[] }) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text variant="section" style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        {title}
      </Text>
      <FlatList
        horizontal
        data={books}
        keyExtractor={(b) => b.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => <BookLink book={item} width={88} />}
      />
    </View>
  );
}

function PrivateGate({ access }: { access: ProfileAccess }) {
  const c = useColors();
  const text =
    access === "login"
      ? "Entre na sua conta e peça para seguir para ver a estante e as reviews."
      : access === "blocked"
        ? "Você não pode ver este perfil."
        : "Siga este perfil para ver a estante e as reviews. A pessoa precisa aprovar o pedido.";
  return (
    <View style={{ margin: 16, padding: 24, borderRadius: 16, backgroundColor: c.sunken, alignItems: "center", gap: 10 }}>
      <Lock size={22} color={c.ink3} />
      <Text variant="label">Perfil privado</Text>
      <Text tone="ink3" variant="small" style={{ textAlign: "center" }}>
        {text}
      </Text>
      {access === "login" ? <Button onPress={() => router.push("/entrar")}>Entrar</Button> : null}
    </View>
  );
}

/** Seguir / pedido enviado / seguindo. O estado vem da conta em cache e é atualizado na hora. */
function FollowButton({ handle, isPrivate }: { handle: string; isPrivate: boolean }) {
  const { status, account, setAccount } = useAuth();
  const queryClient = useQueryClient();
  const state = account?.following.includes(handle) ? "following" : account?.requested.includes(handle) ? "requested" : "none";

  const follow = useMutation({
    mutationFn: (next: boolean) => api<{ state: "following" | "requested" | "none" }>(`/users/${handle}/follow`, { method: "POST", body: { follow: next } }),
    onSuccess: ({ state: s }) => {
      setAccount((prev) => ({
        ...prev,
        following: s === "following" ? [...new Set([...prev.following, handle])] : prev.following.filter((h) => h !== handle),
        requested: s === "requested" ? [...new Set([...prev.requested, handle])] : prev.requested.filter((h) => h !== handle),
      }));
      queryClient.invalidateQueries({ queryKey: ["profile", handle] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  if (status !== "user") return <Button onPress={() => router.push("/entrar")}>Entrar para seguir</Button>;
  return (
    <View style={{ gap: 6 }}>
      <Button variant={state === "none" ? "primary" : "secondary"} loading={follow.isPending} onPress={() => follow.mutate(state === "none")}>
        {state === "following" ? "Seguindo" : state === "requested" ? "Pedido enviado" : isPrivate ? "Pedir para seguir" : "Seguir"}
      </Button>
      {follow.isError ? (
        <Text variant="small" tone="danger">
          {errorMessage(follow.error)}
        </Text>
      ) : null}
    </View>
  );
}
