import { Stack, router, useLocalSearchParams } from "expo-router";
import { EyeOff, Flag, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageBadge, PageField, ViewerNote } from "@/components/discussions";
import { Button, Empty, Loading, Text } from "@/components/ui";
import { Avatar } from "@/components/user";
import { confirmAction } from "@/lib/confirm";
import { ago, discussionError, report, useDeleteDiscussionItem, useReply, useThread } from "@/lib/discussions";
import { font, useColors } from "@/lib/theme";
import type { Author } from "@/lib/types";

/** Uma discussão: o tópico, as respostas (com spoilers escondidos) e o campo de resposta. */
export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [reveal, setReveal] = useState(false);
  const q = useThread(id, reveal);
  const bookId = q.data?.book.id;
  const reply = useReply(id, bookId);
  const remove = useDeleteDiscussionItem(id, bookId);
  const [body, setBody] = useState("");
  const [page, setPage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (q.isPending) return <Loading />;
  if (!q.data) return <Empty title="Discussão não encontrada">Ela pode ter sido apagada ou escondida por denúncias.</Empty>;
  const { thread, posts, viewer, book } = q.data;
  const replyPage = page ?? String(viewer.bookmark);

  function send() {
    if (!body.trim()) return;
    setError(null);
    reply.mutate(
      { body: body.trim(), page: Number(replyPage) || 0 },
      { onSuccess: () => setBody(""), onError: (err) => setError(discussionError(err)) },
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: book.title }} />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.anil} />}
      >
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 16, gap: 10 }}>
          <Header
            author={thread.author}
            createdAt={thread.createdAt}
            page={thread.page}
            mine={thread.mine}
            loggedIn={viewer.loggedIn}
            onDelete={() =>
              confirmAction("Apagar esta discussão?", "Apagar", () => remove.mutate({ kind: "thread", id: thread.id }, { onSuccess: () => router.back() }), "As respostas também serão apagadas.")
            }
            onReport={() => report("thread", thread.id)}
          />
          {thread.spoiler ? (
            <Spoiler page={thread.page} onReveal={() => setReveal(true)} />
          ) : (
            <>
              <Text variant="title">{thread.title}</Text>
              <Text tone="ink2">{thread.body}</Text>
            </>
          )}
          {thread.hidden ? (
            <Text variant="small" tone="danger">
              Escondida por denúncias: só você vê.
            </Text>
          ) : null}
        </View>

        <View style={{ gap: 4 }}>
          <Text variant="label">
            {posts.length} {posts.length === 1 ? "resposta" : "respostas"}
          </Text>
          <ViewerNote viewer={viewer} reveal={reveal} setReveal={setReveal} />
        </View>

        {posts.map((p) => (
          <View key={p.id} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14, gap: 8 }}>
            <Header
              author={p.author}
              createdAt={p.createdAt}
              page={p.page}
              mine={p.mine}
              loggedIn={viewer.loggedIn}
              onDelete={() => confirmAction("Apagar sua resposta?", "Apagar", () => remove.mutate({ kind: "post", id: p.id }))}
              onReport={() => report("post", p.id)}
            />
            {p.spoiler ? <Spoiler page={p.page} onReveal={() => setReveal(true)} /> : <Text tone="ink2">{p.body}</Text>}
            {p.hidden ? (
              <Text variant="small" tone="danger">
                Escondida por denúncias: só você vê.
              </Text>
            ) : null}
          </View>
        ))}

        {viewer.loggedIn ? (
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14, gap: 12 }}>
            <TextInput
              value={body}
              onChangeText={(t) => setBody(t.slice(0, 4000))}
              multiline
              maxLength={4000}
              placeholder="Sua resposta"
              placeholderTextColor={c.ink4}
              accessibilityLabel="Sua resposta"
              style={{ minHeight: 80, borderRadius: 12, backgroundColor: c.canvas, padding: 12, color: c.ink, fontFamily: font.regular, fontSize: 16, textAlignVertical: "top" }}
            />
            <PageField page={replyPage} setPage={setPage} />
            {error ? (
              <Text variant="small" tone="danger">
                {error}
              </Text>
            ) : null}
            <Button onPress={send} loading={reply.isPending} disabled={!body.trim()}>
              Responder
            </Button>
          </View>
        ) : (
          <Button variant="secondary" onPress={() => router.push("/entrar")}>
            Entrar para responder
          </Button>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Header({
  author,
  createdAt,
  page,
  mine,
  loggedIn,
  onDelete,
  onReport,
}: {
  author: Author;
  createdAt: number;
  page: number;
  mine: boolean;
  loggedIn: boolean;
  onDelete: () => void;
  onReport: () => Promise<unknown>;
}) {
  const c = useColors();
  const [reported, setReported] = useState(false);
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <Avatar user={author} size={32} link />
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="small">
          <Text variant="small" weight="semibold">
            {author.name}
          </Text>
          <Text variant="small" tone="ink4">
            {" "}
            · {ago(createdAt)}
          </Text>
        </Text>
        <PageBadge page={page} />
      </View>
      {mine ? (
        <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Apagar" hitSlop={8} style={{ padding: 6 }}>
          <Trash2 size={16} color={c.ink4} />
        </Pressable>
      ) : loggedIn ? (
        <Pressable
          disabled={reported}
          onPress={() =>
            confirmAction("Denunciar?", "Denunciar", () => void onReport().then(() => setReported(true)), "Spoiler sem aviso, ofensa ou spam. Com 3 denúncias, a mensagem some da discussão.")
          }
          accessibilityRole="button"
          accessibilityLabel="Denunciar"
          hitSlop={8}
          style={{ padding: 6, opacity: reported ? 0.4 : 1 }}
        >
          <Flag size={16} color={c.ink4} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Spoiler({ page, onReveal }: { page: number; onReveal: () => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.sunken, borderRadius: 12, padding: 12 }}>
      <EyeOff size={16} color={c.ink3} />
      <Text variant="small" tone="ink3" style={{ flex: 1 }}>
        Fala da página {page}, que você ainda não leu.
      </Text>
      <Text variant="small" tone="anil" weight="medium" onPress={onReveal}>
        Mostrar
      </Text>
    </View>
  );
}
