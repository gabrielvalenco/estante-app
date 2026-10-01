import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Empty, Loading, Text } from "@/components/ui";
import { STATUS_LABELS, supportError, ticketLabel, useTicket, useTicketActions } from "@/lib/support";
import { font, useColors } from "@/lib/theme";

const when = (ts: number) => new Date(ts).toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Um pedido de suporte: a conversa, responder e marcar como resolvido. */
export default function TicketScreen() {
  const number = Number(useLocalSearchParams<{ number: string }>().number);
  const c = useColors();
  const insets = useSafeAreaInsets();
  const q = useTicket(number);
  const { reply, resolve } = useTicketActions(number);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (q.isPending) return <Loading />;
  if (!q.data) return <Empty title="Pedido não encontrado">Ele pode ser de outra conta.</Empty>;
  const t = q.data;
  const statusColor = t.status === "aberto" ? c.ambarInk : t.status === "respondido" ? c.anil : c.musgo;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: ticketLabel(t.number) }} />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.anil} />}
      >
        <View style={{ gap: 4, marginBottom: 4 }}>
          <Text variant="title">{t.subject}</Text>
          <Text variant="small" weight="medium" style={{ color: statusColor }}>
            {STATUS_LABELS[t.status]}
          </Text>
        </View>

        {t.messages.map((m, i) => (
          <View
            key={i}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              padding: 14,
              gap: 6,
              borderColor: m.author === "suporte" ? c.anil : c.line,
              backgroundColor: m.author === "suporte" ? c.anilSoft : c.surface,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <Text variant="caption" weight="semibold" style={{ color: m.author === "suporte" ? c.anil : c.ink2 }}>
                {m.author === "suporte" ? "Suporte da Estante" : "Você"}
              </Text>
              <Text variant="caption" tone="ink4">
                {when(m.createdAt)}
              </Text>
            </View>
            <Text>{m.body}</Text>
          </View>
        ))}

        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14, gap: 12, marginTop: 4 }}>
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={5000}
            placeholder={t.status === "resolvido" ? "Precisa de mais alguma coisa? Escreva para reabrir" : "Sua resposta"}
            placeholderTextColor={c.ink4}
            accessibilityLabel="Sua resposta"
            style={{ minHeight: 90, borderRadius: 12, backgroundColor: c.canvas, padding: 12, color: c.ink, fontFamily: font.regular, fontSize: 16, textAlignVertical: "top" }}
          />
          {error ? (
            <Text variant="small" tone="danger">
              {error}
            </Text>
          ) : null}
          <Button
            onPress={() => reply.mutate(body.trim(), { onSuccess: () => (setBody(""), setError(null)), onError: (err) => setError(supportError(err)) })}
            loading={reply.isPending}
            disabled={!body.trim()}
          >
            Enviar
          </Button>
          {t.status !== "resolvido" ? (
            <Button variant="secondary" onPress={() => resolve.mutate()} loading={resolve.isPending}>
              Marcar como resolvido
            </Button>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
