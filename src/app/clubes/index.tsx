import { router } from "expo-router";
import { ChevronRight, Sparkles, Users } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookCover } from "@/components/book";
import { Button, Empty, Loading, Text } from "@/components/ui";
import { SITE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { inviteCodeFrom, useClubs } from "@/lib/clubs";
import { font, useColors } from "@/lib/theme";

/** Clubes de que a pessoa participa e o campo para entrar com um convite. */
export default function Clubs() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { status } = useAuth();
  const q = useClubs(status === "user");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (status !== "user") {
    return (
      <Empty title="Clubes de leitura" action={<Button onPress={() => router.push("/entrar")}>Entrar</Button>}>
        Entre na sua conta para ver seus clubes ou aceitar um convite.
      </Empty>
    );
  }
  if (q.isPending) return <Loading />;
  if (!q.data) return <Empty title="Não deu para carregar os clubes">Tente de novo em instantes.</Empty>;
  const { clubs, canCreate, owned, ownedLimit } = q.data;

  function openInvite() {
    const code = inviteCodeFrom(invite);
    if (!code) return setError("Cole o link do convite ou o código.");
    setError(null);
    setInvite("");
    router.push(`/clubes/convite/${code}`);
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.anil} />}
    >
      <View style={{ gap: 4 }}>
        <Text variant="title">Seus clubes</Text>
        <Text tone="ink2">Um livro, um grupo pequeno, cada um no seu ritmo e sem spoiler.</Text>
      </View>

      {clubs.length ? (
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16 }}>
          {clubs.map((club, i) => (
            <Pressable
              key={club.id}
              onPress={() => router.push(`/clubes/${club.id}`)}
              accessibilityRole="link"
              accessibilityLabel={club.name}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderColor: c.line, opacity: pressed ? 0.7 : 1 })}
            >
              {club.book ? (
                <BookCover book={club.book} width={40} />
              ) : (
                <View style={{ width: 40, height: 60, borderRadius: 6, backgroundColor: c.sunken, alignItems: "center", justifyContent: "center" }}>
                  <Users size={18} color={c.ink4} />
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="semibold" numberOfLines={1}>
                  {club.name}
                </Text>
                <Text variant="small" tone="ink3" numberOfLines={1}>
                  {club.book ? club.book.title : "Sem livro escolhido"}
                </Text>
                <Text variant="caption" tone="ink4">
                  {club.members} {club.members === 1 ? "pessoa" : "pessoas"}
                  {club.role === "owner" ? " · você criou" : ""}
                </Text>
              </View>
              <ChevronRight size={18} color={c.ink4} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ alignItems: "center", gap: 8, padding: 24, borderRadius: 16, backgroundColor: c.sunken }}>
          <Users size={20} color={c.ink4} />
          <Text variant="small" tone="ink3" style={{ textAlign: "center" }}>
            Você ainda não está em nenhum clube. Recebeu um convite? Cole abaixo.
          </Text>
        </View>
      )}

      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 16, gap: 10 }}>
        <Text variant="label">Entrar com um convite</Text>
        <TextInput
          value={invite}
          onChangeText={setInvite}
          onSubmitEditing={openInvite}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Link ou código do convite"
          placeholderTextColor={c.ink4}
          accessibilityLabel="Link ou código do convite"
          style={{ height: 46, borderRadius: 12, backgroundColor: c.canvas, paddingHorizontal: 12, color: c.ink, fontFamily: font.regular, fontSize: 16 }}
        />
        {error ? (
          <Text variant="small" tone="danger">
            {error}
          </Text>
        ) : null}
        <Button variant="secondary" onPress={openInvite} disabled={!invite.trim()}>
          Ver convite
        </Button>
      </View>

      {canCreate ? (
        <View style={{ gap: 6 }}>
          <Button onPress={() => void Linking.openURL(`${SITE_URL}/clubes`)}>Criar clube no site</Button>
          <Text variant="caption" tone="ink4" style={{ textAlign: "center" }}>
            Você criou {owned} de {ownedLimit} clubes. Criar e convidar fica no site.
          </Text>
        </View>
      ) : ownedLimit === 0 ? (
        <Pressable
          onPress={() => router.push("/planos")}
          accessibilityRole="button"
          accessibilityHint="Abre os planos"
          style={({ pressed }) => ({ flexDirection: "row", gap: 12, padding: 16, borderRadius: 16, backgroundColor: c.ambarSoft, opacity: pressed ? 0.8 : 1 })}
        >
          <Sparkles size={18} color={c.ambarInk} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" style={{ color: c.ambarInk }}>
              Criar clubes é do plano Ex Libris
            </Text>
            <Text variant="small" tone="ink2">
              Até 5 clubes com 30 pessoas cada. Quem você convida participa de graça.
            </Text>
          </View>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
