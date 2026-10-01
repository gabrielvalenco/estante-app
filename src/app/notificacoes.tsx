import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

import { Button, Empty, Loading, Text } from "@/components/ui";
import { Mark } from "@/components/brand";
import { Avatar } from "@/components/user";
import { api } from "@/lib/api";
import { useColors } from "@/lib/theme";
import type { NotificationItem } from "@/lib/types";

export default function Notifications() {
  const c = useColors();
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["notifications", "list"], queryFn: () => api<{ items: NotificationItem[]; unread: number }>("/notifications") });

  // Abriu a tela: marca como lidas (o sino zera).
  useFocusEffect(
    useCallback(() => {
      void api("/notifications/read", { method: "POST" })
        .then(() => queryClient.invalidateQueries({ queryKey: ["notifications"], exact: true }))
        .catch(() => {});
    }, [queryClient]),
  );

  if (q.isPending) return <Loading />;
  return (
    <FlatList
      data={q.data?.items ?? []}
      keyExtractor={(n) => n.id}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.anil} />}
      contentContainerStyle={{ paddingHorizontal: 16, flexGrow: 1 }}
      ListEmptyComponent={<Empty title="Nenhuma notificação">Quando alguém seguir você ou curtir uma review, aparece aqui.</Empty>}
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            item.type === "support_reply"
              ? router.push(`/ajuda/${item.bookId?.split(":")[1] ?? ""}`)
              : router.push(item.bookId && item.type !== "follow" ? `/livro/${item.bookId}` : `/u/${item.actor.handle}`)
          }
          style={({ pressed }) => ({ flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: c.line, opacity: pressed ? 0.7 : 1 })}
        >
          {item.type === "support_reply" ? (
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.anilSoft, alignItems: "center", justifyContent: "center" }}>
              <Mark size={22} />
            </View>
          ) : (
            <Avatar user={item.actor} size={40} />
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Text>
              <Text weight="semibold">{item.actor.name}</Text> {message(item)}
            </Text>
            <Text variant="caption" tone="ink4">
              {ago(item.createdAt)}
            </Text>
            {item.type === "follow_request" && item.pending ? <RequestActions handle={item.actor.handle} /> : null}
          </View>
          {!item.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.anil, marginTop: 8 }} /> : null}
        </Pressable>
      )}
    />
  );
}

function message(n: NotificationItem) {
  switch (n.type) {
    case "follow":
      return "começou a seguir você.";
    case "follow_request":
      return "pediu para seguir você.";
    case "follow_accepted":
      return "aceitou seu pedido para seguir.";
    case "review_like":
      return `curtiu sua review de ${n.bookTitle ?? "um livro"}.`;
    case "friend_finished":
      return `terminou de ler ${n.bookTitle ?? "um livro"}.`;
    case "discussion_reply":
      return `respondeu sua discussão sobre ${n.bookTitle ?? "um livro"}.`;
    case "support_reply":
      return `respondeu seu pedido: ${n.bookTitle ?? "suporte"}.`;
  }
}

function ago(ts: number) {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d < 30 ? `há ${d} d` : new Date(ts).toLocaleDateString("pt-BR");
}

/** Aceitar ou recusar um pedido para seguir. */
function RequestActions({ handle }: { handle: string }) {
  const queryClient = useQueryClient();
  const respond = useMutation({
    mutationFn: (accept: boolean) => api(`/requests/${handle}`, { method: "POST", body: { accept } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
      <Button onPress={() => respond.mutate(true)} loading={respond.isPending && respond.variables === true} style={{ height: 36, paddingHorizontal: 16 }}>
        Aceitar
      </Button>
      <Button variant="secondary" onPress={() => respond.mutate(false)} loading={respond.isPending && respond.variables === false} style={{ height: 36, paddingHorizontal: 16 }}>
        Recusar
      </Button>
    </View>
  );
}
