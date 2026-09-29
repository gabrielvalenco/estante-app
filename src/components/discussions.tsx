import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { EyeOff, MessagesSquare, Plus, X } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Loading, Text } from "@/components/ui";
import { Avatar } from "@/components/user";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ago, discussionError, pageLabel, useCreateThread, useThreads } from "@/lib/discussions";
import { font, useColors } from "@/lib/theme";
import type { Viewer } from "@/lib/types";

/** Explica o que está escondido e oferece mostrar os spoilers. */
export function ViewerNote({ viewer, reveal, setReveal }: { viewer: Viewer; reveal: boolean; setReveal: (v: boolean) => void }) {
  if (viewer.finished) {
    return (
      <Text variant="small" tone="ink3">
        Você já leu este livro: nada fica escondido.
      </Text>
    );
  }
  const text = reveal
    ? "Mostrando spoilers."
    : viewer.loggedIn
      ? viewer.page
        ? `Você está na página ${viewer.page}: o que vem depois fica escondido.`
        : "Marque sua página em Sua leitura para ver o que já leu."
      : "Sem conta, você vê só o que é sem spoiler.";
  return (
    <Text variant="small" tone="ink3">
      {text}{" "}
      <Text variant="small" tone="anil" weight="medium" onPress={() => setReveal(!reveal)}>
        {reveal ? "Esconder de novo" : "Mostrar spoilers"}
      </Text>
    </Text>
  );
}

export function PageBadge({ page }: { page: number }) {
  const c = useColors();
  return (
    <View style={{ alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, height: 20, justifyContent: "center", backgroundColor: page ? c.ambarSoft : c.musgoSoft }}>
      <Text variant="caption" style={{ color: page ? c.ambarInk : c.musgo }}>
        {pageLabel(page)}
      </Text>
    </View>
  );
}

/** Discussões na tela do livro. */
export function DiscussionsSection({ book }: { book: { id: string; title: string } }) {
  const c = useColors();
  const { status } = useAuth();
  const [reveal, setReveal] = useState(false);
  const [creating, setCreating] = useState(false);
  const q = useThreads(book.id, reveal);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View>
          <Text variant="caption" tone="ink4">
            SEM SPOILER: CADA UM VÊ ATÉ ONDE LEU
          </Text>
          <Text variant="section">Discussões</Text>
        </View>
        {status === "user" ? (
          <Pressable
            onPress={() => setCreating(true)}
            accessibilityRole="button"
            accessibilityLabel="Nova discussão"
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.anil, alignItems: "center", justifyContent: "center" }}
          >
            <Plus size={18} color={c.onBrand} />
          </Pressable>
        ) : null}
      </View>

      {q.isPending ? (
        <Loading />
      ) : q.data ? (
        <>
          <ViewerNote viewer={q.data.viewer} reveal={reveal} setReveal={setReveal} />
          {q.data.threads.length ? (
            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16 }}>
              {q.data.threads.map((t, i) => (
                <Pressable
                  key={t.id}
                  onPress={() => router.push(`/discussao/${t.id}`)}
                  accessibilityRole="link"
                  accessibilityLabel={t.spoiler ? `Spoiler: discussão sobre a página ${t.page}` : (t.title ?? "Discussão")}
                  style={({ pressed }) => ({ flexDirection: "row", gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderColor: c.line, opacity: pressed ? 0.7 : 1 })}
                >
                  <Avatar user={t.author} size={30} />
                  <View style={{ flex: 1, gap: 4 }}>
                    {t.spoiler ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <EyeOff size={14} color={c.ink3} />
                        <Text weight="medium" tone="ink3">
                          Spoiler: fala da página {t.page}
                        </Text>
                      </View>
                    ) : (
                      <Text weight="medium" numberOfLines={2}>
                        {t.title}
                      </Text>
                    )}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Text variant="caption" tone="ink2">
                        {t.author.name}
                      </Text>
                      <PageBadge page={t.page} />
                      <Text variant="caption" tone="ink4">
                        {t.replyCount} {t.replyCount === 1 ? "resposta" : "respostas"} · {ago(t.lastActivityAt)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", gap: 8, padding: 24, borderRadius: 16, backgroundColor: c.sunken }}>
              <MessagesSquare size={20} color={c.ink4} />
              <Text variant="small" tone="ink3" style={{ textAlign: "center" }}>
                Nenhuma discussão ainda. Cada mensagem diz até que página fala, e ninguém leva spoiler.
              </Text>
              {status !== "user" ? (
                <Button variant="secondary" onPress={() => router.push("/entrar")} style={{ height: 40, marginTop: 4 }}>
                  Entrar para discutir
                </Button>
              ) : null}
            </View>
          )}
        </>
      ) : null}

      {creating && q.data ? (
        <NewThreadSheet book={book} defaultPage={q.data.viewer.bookmark} usage={q.data.usage} onClose={() => setCreating(false)} />
      ) : null}
    </View>
  );
}

/** "Até que página isto fala?", com o atalho Sem spoiler. */
export function PageField({ page, setPage }: { page: string; setPage: (v: string) => void }) {
  const c = useColors();
  const none = page === "" || page === "0";
  return (
    <View style={{ gap: 6 }}>
      <Text variant="small" tone="ink3" weight="medium">
        Até que página isto fala?
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          onPress={() => setPage("0")}
          accessibilityRole="button"
          accessibilityState={{ selected: none }}
          style={{ height: 36, paddingHorizontal: 14, borderRadius: 999, justifyContent: "center", backgroundColor: none ? c.musgo : c.sunken }}
        >
          <Text variant="small" weight="medium" style={{ color: none ? c.onBrand : c.ink2 }}>
            Sem spoiler
          </Text>
        </Pressable>
        <Text variant="small" tone="ink3">
          ou até a p.
        </Text>
        <TextInput
          value={none ? "" : page}
          onChangeText={(t) => setPage(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          placeholder="120"
          placeholderTextColor={c.ink4}
          accessibilityLabel="Página"
          style={{ height: 36, width: 80, borderRadius: 999, paddingHorizontal: 12, backgroundColor: c.sunken, color: c.ink, fontFamily: font.medium, fontSize: 14, textAlign: "center" }}
        />
      </View>
      <Text variant="caption" tone="ink4">
        Quem ainda não chegou nessa página vê só um aviso de spoiler.
      </Text>
    </View>
  );
}

function NewThreadSheet({
  book,
  defaultPage,
  usage,
  onClose,
}: {
  book: { id: string; title: string };
  defaultPage: number;
  usage: { planName: string; threadsThisMonth: number; threadsPerMonthLimit: number | null } | null;
  onClose: () => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const create = useCreateThread(book.id);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [page, setPage] = useState(String(defaultPage));
  const [error, setError] = useState<string | null>(null);
  const [upsell, setUpsell] = useState(false);

  function submit() {
    if (title.trim().length < 3) return setError("Dê um título com pelo menos 3 letras.");
    if (!body.trim()) return setError("Escreva o que você quer discutir.");
    setError(null);
    create.mutate(
      { bookTitle: book.title, title: title.trim(), body: body.trim(), page: Number(page) || 0 },
      {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onClose();
        },
        onError: (err) => {
          setUpsell(err instanceof ApiError && err.status === 402);
          setError(discussionError(err));
        },
      },
    );
  }

  const box = { borderRadius: 14, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, paddingHorizontal: 14, color: c.ink, fontFamily: font.regular, fontSize: 16 };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.canvas }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, paddingTop: Platform.OS === "android" ? insets.top + 12 : 16 }}>
          <View style={{ flex: 1 }}>
            <Text variant="section">Nova discussão</Text>
            <Text variant="small" tone="ink3" numberOfLines={1}>
              {book.title}
            </Text>
          </View>
          <Pressable onPress={onClose} accessibilityLabel="Fechar" hitSlop={10} style={{ padding: 6, borderRadius: 999, backgroundColor: c.sunken }}>
            <X size={18} color={c.ink2} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
          <TextInput value={title} onChangeText={(t) => setTitle(t.slice(0, 120))} maxLength={120} autoFocus placeholder="Sobre o que vamos conversar?" placeholderTextColor={c.ink4} accessibilityLabel="Título" style={[box, { height: 50 }]} />
          <TextInput
            value={body}
            onChangeText={(t) => setBody(t.slice(0, 4000))}
            multiline
            maxLength={4000}
            placeholder="Escreva sua mensagem"
            placeholderTextColor={c.ink4}
            accessibilityLabel="Mensagem"
            style={[box, { minHeight: 140, paddingTop: 14, textAlignVertical: "top" }]}
          />
          <PageField page={page} setPage={setPage} />
          {error ? (
            <Text variant="small" tone="danger">
              {error}
            </Text>
          ) : null}
          <Text variant="caption" tone="ink4">
            Discussões são públicas, mesmo com o perfil privado.
            {usage?.threadsPerMonthLimit != null ? ` ${usage.threadsThisMonth} de ${usage.threadsPerMonthLimit} discussões novas neste mês no plano ${usage.planName}.` : ""}
          </Text>
          {upsell ? (
            <Button
              variant="secondary"
              onPress={() => {
                onClose();
                router.push("/planos");
              }}
            >
              Ver planos
            </Button>
          ) : null}
          <Button onPress={submit} loading={create.isPending}>
            Publicar
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
