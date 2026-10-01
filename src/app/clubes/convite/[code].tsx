import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookCover } from "@/components/book";
import { Button, Empty, Loading, Text } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { clubError, previewInvite, useJoinClub } from "@/lib/clubs";
import { useColors } from "@/lib/theme";

/** Convite: mostra o clube e o que os membros vão ver antes de entrar. */
export default function InviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { status } = useAuth();
  const q = useQuery({ queryKey: ["invite", code], queryFn: () => previewInvite(code), enabled: status === "user", retry: false });
  const join = useJoinClub();
  const [error, setError] = useState<string | null>(null);

  if (status !== "user") {
    return (
      <Empty title="Convite para um clube" action={<Button onPress={() => router.push("/entrar")}>Entrar</Button>}>
        Entre na sua conta para ver o convite.
      </Empty>
    );
  }
  if (q.isPending) return <Loading />;
  if (!q.data) return <Empty title="Convite inválido">Peça um link novo para quem criou o clube.</Empty>;
  const invite = q.data;

  function enter() {
    if (invite.alreadyMember) return router.replace(`/clubes/${invite.id}`);
    setError(null);
    join.mutate(code, { onSuccess: (r) => router.replace(`/clubes/${r.id}`), onError: (err) => setError(clubError(err)) });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: insets.bottom + 32 }}>
      <View style={{ flexDirection: "row", gap: 16 }}>
        {invite.book ? <BookCover book={invite.book} width={84} /> : null}
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="caption" tone="ink4">
            {invite.ownerName.toUpperCase()} CONVIDOU VOCÊ
          </Text>
          <Text variant="title">{invite.name}</Text>
          <Text variant="small" tone="ink2">
            {invite.book ? `Lendo ${invite.book.title}` : "Ainda sem livro"} · {invite.members} {invite.members === 1 ? "pessoa" : "pessoas"}
          </Text>
          {invite.description ? (
            <Text variant="small" tone="ink3" style={{ marginTop: 4 }}>
              {invite.description}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ backgroundColor: c.sunken, borderRadius: 14, padding: 14 }}>
        <Text variant="small" tone="ink2">
          Os membros do clube veem seu nome, sua foto e até que página você leu do livro do clube. O resto da sua estante continua como está. Você pode sair quando quiser.
        </Text>
      </View>
      {error ? (
        <Text variant="small" tone="danger">
          {error}
        </Text>
      ) : null}
      <Button onPress={enter} loading={join.isPending}>
        {invite.alreadyMember ? "Abrir o clube" : "Entrar no clube"}
      </Button>
    </ScrollView>
  );
}
