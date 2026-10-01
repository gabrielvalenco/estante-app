import { Stack, router, useLocalSearchParams } from "expo-router";
import { Share2 } from "lucide-react-native";
import { Linking, Pressable, RefreshControl, ScrollView, Share, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookLink } from "@/components/book";
import { DiscussionsSection } from "@/components/discussions";
import { Button, Empty, Loading, Text } from "@/components/ui";
import { Avatar } from "@/components/user";
import { SITE_URL } from "@/lib/api";
import { useClub, useLeaveClub } from "@/lib/clubs";
import { confirmAction } from "@/lib/confirm";
import { useColors } from "@/lib/theme";
import type { ClubMember } from "@/lib/types";

/** Um clube: o livro, o progresso de cada membro nele e as discussões privadas. */
export default function ClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const q = useClub(id);
  const leave = useLeaveClub(id);

  if (q.isPending) return <Loading />;
  if (!q.data) return <Empty title="Clube não encontrado">Ele pode ter sido apagado, ou você não faz mais parte dele.</Empty>;
  const club = q.data;
  const inviteUrl = club.inviteCode ? `${SITE_URL}/clubes/convite/${club.inviteCode}` : null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: insets.bottom + 32 }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.anil} />}
    >
      <Stack.Screen options={{ title: club.name }} />
      <View style={{ flexDirection: "row", gap: 16 }}>
        {club.book ? <BookLink book={club.book} width={84} /> : null}
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="caption" tone="ink4">
            CLUBE PRIVADO · {club.members} DE {club.maxMembers} PESSOAS
          </Text>
          <Text variant="title">{club.name}</Text>
          {club.book ? (
            <Text variant="small" tone="ink2">
              Lendo {club.book.title}
              {club.book.author ? `, de ${club.book.author}` : ""}
            </Text>
          ) : (
            <Text variant="small" tone="ink3">
              Ainda sem livro. Quem criou escolhe no site.
            </Text>
          )}
          {club.description ? (
            <Text variant="small" tone="ink3" style={{ marginTop: 4 }}>
              {club.description}
            </Text>
          ) : null}
        </View>
      </View>

      {inviteUrl ? (
        <Pressable
          onPress={() => void Share.share({ message: `Entre no clube ${club.name} na Estante: ${inviteUrl}` }).catch(() => {})}
          accessibilityRole="button"
          accessibilityLabel="Compartilhar convite"
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: c.anilSoft, opacity: pressed ? 0.8 : 1 })}
        >
          <Share2 size={18} color={c.anil} />
          <View style={{ flex: 1 }}>
            <Text variant="label" style={{ color: c.anil }}>
              Compartilhar convite
            </Text>
            <Text variant="caption" tone="ink3">
              Quem tiver o link entra de graça. Para trocar o link, use o site.
            </Text>
          </View>
        </Pressable>
      ) : null}

      <View style={{ gap: 10 }}>
        <Text variant="section">Progresso do grupo</Text>
        {club.book ? (
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14, gap: 14 }}>
            {club.memberList.map((m) => (
              <MemberProgress key={m.handle} member={m} />
            ))}
          </View>
        ) : (
          <Text variant="small" tone="ink3">
            O progresso aparece quando o clube tiver um livro.
          </Text>
        )}
        <Text variant="caption" tone="ink4">
          Os membros veem só o progresso neste livro, pelo marcador de página de cada um.
        </Text>
      </View>

      {club.book ? <DiscussionsSection book={club.book} clubId={club.id} /> : null}

      {club.role === "owner" ? (
        <Button variant="secondary" onPress={() => void Linking.openURL(`${SITE_URL}/clubes/${club.id}`)}>
          Gerenciar no site
        </Button>
      ) : (
        <Button
          variant="ghost"
          loading={leave.isPending}
          onPress={() => confirmAction("Sair do clube?", "Sair", () => leave.mutate(undefined, { onSuccess: () => router.back() }), "Para voltar, você vai precisar de um convite.")}
        >
          <Text tone="danger" weight="medium">
            Sair do clube
          </Text>
        </Button>
      )}
    </ScrollView>
  );
}

function MemberProgress({ member }: { member: ClubMember }) {
  const c = useColors();
  const pct = member.finished ? 100 : member.page && member.totalPages ? Math.min(100, Math.round((member.page / member.totalPages) * 100)) : 0;
  const label = member.finished ? "Terminou" : member.page ? (member.totalPages ? `p. ${member.page} de ${member.totalPages}` : `p. ${member.page}`) : "Não começou";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Avatar user={member} size={30} link />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
          <Text variant="small" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
            {member.name}
            {member.role === "owner" ? (
              <Text variant="caption" tone="ink4">
                {"  "}criou
              </Text>
            ) : null}
          </Text>
          <Text variant="caption" tone={member.finished ? "ink2" : "ink3"}>
            {label}
          </Text>
        </View>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Progresso de ${member.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          style={{ height: 6, borderRadius: 3, backgroundColor: c.sunken, overflow: "hidden" }}
        >
          <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: member.finished ? c.musgo : c.anil }} />
        </View>
      </View>
    </View>
  );
}
