import { Stack, router, useLocalSearchParams } from "expo-router";
import { Check, Search, Share2, UserPlus, X } from "lucide-react-native";
import { useState } from "react";
import { FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, Share, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookLink } from "@/components/book";
import { DiscussionsSection } from "@/components/discussions";
import { Button, Empty, Loading, Text } from "@/components/ui";
import { Avatar } from "@/components/user";
import { SITE_URL } from "@/lib/api";
import { inviteError, useClub, useInvitable, useInvitation, useInviteActions, useLeaveClub, useRespondInvitation } from "@/lib/clubs";
import { confirmAction } from "@/lib/confirm";
import { font, useColors } from "@/lib/theme";
import type { ClubInvitation, ClubMember } from "@/lib/types";

/** Um clube: o livro, o progresso de cada membro nele e as discussões privadas. */
export default function ClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const q = useClub(id);
  const leave = useLeaveClub(id);
  // Sem acesso ao clube: pode ser alguém com um convite direto ainda sem resposta.
  const invitation = useInvitation(id, q.isFetched && !q.data);
  const { cancel } = useInviteActions(id);
  const [inviting, setInviting] = useState(false);

  if (q.isPending || (!q.data && invitation.isPending && invitation.fetchStatus !== "idle")) return <Loading />;
  if (!q.data && invitation.data) return <InvitationView invitation={invitation.data} onDone={() => q.refetch()} />;
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

      {club.role === "owner" ? (
        <View style={{ gap: 10 }}>
          <Button variant="secondary" onPress={() => setInviting(true)}>
            Convidar seguidores
          </Button>
          {club.pendingInvites?.length ? (
            <View style={{ gap: 6 }}>
              <Text variant="caption" tone="ink4">
                CONVITES SEM RESPOSTA
              </Text>
              {club.pendingInvites.map((p) => (
                <View key={p.handle} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Avatar user={p} size={26} />
                  <Text variant="small" tone="ink2" style={{ flex: 1 }} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Pressable onPress={() => cancel.mutate(p.handle)} accessibilityRole="button" accessibilityLabel={`Cancelar convite de ${p.name}`} hitSlop={8} style={{ padding: 4 }}>
                    <X size={16} color={c.ink4} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
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

      {inviting ? <InviteSheet clubId={club.id} onClose={() => setInviting(false)} /> : null}

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

/** Seguidores de quem criou; a lista filtra conforme digita (nome ou @). */
function InviteSheet({ clubId, onClose }: { clubId: string; onClose: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const people = useInvitable(clubId, query.trim(), true);
  const { invite } = useInviteActions(clubId);
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.canvas }}>
        <View style={{ padding: 16, paddingTop: Platform.OS === "android" ? insets.top + 12 : 16, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text variant="section">Convidar seguidores</Text>
              <Text variant="small" tone="ink3">
                Quem você convidar recebe uma notificação e decide se entra.
              </Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Fechar" hitSlop={10} style={{ padding: 6, borderRadius: 999, backgroundColor: c.sunken }}>
              <X size={18} color={c.ink2} />
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 46, borderRadius: 14, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, paddingHorizontal: 12 }}>
            <Search size={16} color={c.ink4} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Buscar por nome ou @"
              placeholderTextColor={c.ink4}
              accessibilityLabel="Buscar seguidores"
              style={{ flex: 1, color: c.ink, fontFamily: font.regular, fontSize: 16 }}
            />
          </View>
          {error ? (
            <Text variant="small" tone="danger">
              {error}
            </Text>
          ) : null}
        </View>
        {people.isPending ? (
          <Loading />
        ) : (
          <FlatList
            data={people.data?.people ?? []}
            keyExtractor={(p) => p.handle}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
            ListEmptyComponent={
              <Text tone="ink3" style={{ textAlign: "center", paddingVertical: 32 }}>
                {query.trim() ? `Nenhum seguidor com "${query.trim()}".` : "Ninguém para convidar: só aparecem seguidores que ainda não estão no clube."}
              </Text>
            }
            renderItem={({ item: p }) => (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: c.line }}>
                <Avatar user={p} size={38} />
                <View style={{ flex: 1 }}>
                  <Text weight="medium" numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text variant="caption" tone="ink3" numberOfLines={1}>
                    @{p.handle}
                  </Text>
                </View>
                {p.invited ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Check size={14} color={c.musgo} />
                    <Text variant="caption" weight="medium" style={{ color: c.musgo }}>
                      Convidado
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      setError(null);
                      invite.mutate(p.handle, { onError: (err) => setError(inviteError(err)) });
                    }}
                    disabled={invite.isPending && invite.variables === p.handle}
                    accessibilityRole="button"
                    accessibilityLabel={`Convidar ${p.name}`}
                    style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.anil, opacity: pressed ? 0.8 : 1 })}
                  >
                    <UserPlus size={14} color={c.onBrand} />
                    <Text variant="small" weight="semibold" style={{ color: c.onBrand }}>
                      Convidar
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Convite direto recebido: o clube, o que os membros veem, entrar ou recusar. */
function InvitationView({ invitation, onDone }: { invitation: ClubInvitation; onDone: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const respond = useRespondInvitation(invitation.id);
  const [error, setError] = useState<string | null>(null);

  function answer(accept: boolean) {
    setError(null);
    respond.mutate(accept, {
      onSuccess: () => (accept ? onDone() : router.canGoBack() ? router.back() : router.replace("/clubes")),
      onError: (err) => setError(inviteError(err)),
    });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: insets.bottom + 32 }}>
      <Stack.Screen options={{ title: "Convite" }} />
      <View style={{ flexDirection: "row", gap: 16 }}>
        {invitation.book ? <BookLink book={invitation.book} width={84} /> : null}
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="caption" tone="anil">
            {invitation.invitedBy.toUpperCase()} CONVIDOU VOCÊ
          </Text>
          <Text variant="title">{invitation.name}</Text>
          <Text variant="small" tone="ink2">
            {invitation.book ? `Lendo ${invitation.book.title}` : "Ainda sem livro"} · {invitation.members} {invitation.members === 1 ? "pessoa" : "pessoas"}
          </Text>
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
      <Button onPress={() => answer(true)} loading={respond.isPending && respond.variables === true}>
        Entrar no clube
      </Button>
      <Button variant="ghost" onPress={() => answer(false)} disabled={respond.isPending}>
        Recusar
      </Button>
    </ScrollView>
  );
}
