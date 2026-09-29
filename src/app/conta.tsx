import { SaveFormat, ImageManipulator } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Camera, Check } from "lucide-react-native";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Switch, TextInput, View } from "react-native";

import { Button, Text } from "@/components/ui";
import { Avatar } from "@/components/user";
import { SITE_URL, api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { font, toneColors, useColors } from "@/lib/theme";
import type { Account, Profile } from "@/lib/types";

const TONES = ["anil", "ameixa", "musgo", "ambar"] as const;

export default function Settings() {
  const { account } = useAuth();
  if (!account) return null;
  return <Form key={account.profile.id} profile={account.profile} />;
}

function Form({ profile }: { profile: Profile }) {
  const c = useColors();
  const { setAccount, signOut } = useAuth();
  const [draft, setDraft] = useState({ name: profile.name, handle: profile.handle, bio: profile.bio, goal: String(profile.goal), tone: profile.tone });
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  async function save() {
    setError(null);
    const goal = Number(draft.goal);
    if (!draft.name.trim()) return setError("O nome não pode ficar vazio.");
    if (!/^[a-z0-9_]{3,20}$/.test(draft.handle)) return setError("O @ precisa ter de 3 a 20 letras minúsculas, números ou _.");
    if (!Number.isInteger(goal) || goal < 1 || goal > 365) return setError("A meta vai de 1 a 365 livros.");
    setSaving(true);
    try {
      const account = await api<Account>("/me", {
        method: "PATCH",
        body: { name: draft.name.trim(), handle: draft.handle, bio: draft.bio.trim(), goal, tone: draft.tone, favorites: profile.favorites },
      });
      setAccount(account);
      router.back();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function setPrivate(isPrivate: boolean) {
    setAccount((prev) => ({ ...prev, profile: { ...prev.profile, isPrivate } }));
    try {
      setAccount(await api<Account>("/me", { method: "PATCH", body: { isPrivate } }));
    } catch (err) {
      setAccount((prev) => ({ ...prev, profile: { ...prev.profile, isPrivate: !isPrivate } }));
      Alert.alert("Não foi possível mudar", errorMessage(err));
    }
  }

  /** Recorte quadrado no seletor do sistema; aqui só reduz para 256px antes de enviar (uns 20 KB). */
  async function pickPhoto() {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (picked.canceled || !picked.assets[0]) return;
    setPhotoBusy(true);
    try {
      const ctx = ImageManipulator.manipulate(picked.assets[0].uri);
      ctx.resize({ width: 256, height: 256 });
      const image = await ctx.renderAsync();
      const saved = await image.saveAsync({ format: SaveFormat.WEBP, compress: 0.85 });
      const form = new FormData();
      if (Platform.OS === "web") form.append("file", await (await fetch(saved.uri)).blob(), "avatar.webp");
      else form.append("file", { uri: saved.uri, name: "avatar.webp", type: "image/webp" } as unknown as Blob);
      const { profile: next } = await api<{ profile: Profile }>("/me/avatar", { method: "POST", form });
      setAccount((prev) => ({ ...prev, profile: next }));
    } catch (err) {
      Alert.alert("Não foi possível trocar a foto", errorMessage(err));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    try {
      const { profile: next } = await api<{ profile: Profile }>("/me/avatar", { method: "DELETE" });
      setAccount((prev) => ({ ...prev, profile: next }));
    } catch (err) {
      Alert.alert("Não foi possível remover a foto", errorMessage(err));
    } finally {
      setPhotoBusy(false);
    }
  }

  const input = {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    paddingHorizontal: 16,
    color: c.ink,
    fontFamily: font.regular,
    fontSize: 16,
  } as const;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", gap: 10 }}>
          <Pressable onPress={pickPhoto} disabled={photoBusy} accessibilityRole="button" accessibilityLabel={profile.avatarUrl ? "Trocar foto" : "Adicionar foto"}>
            <Avatar user={{ ...profile, name: draft.name || profile.name, tone: draft.tone }} size={96} />
            <View style={{ position: "absolute", right: 0, bottom: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: c.ink, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: c.canvas }}>
              <Camera size={14} color={c.canvas} />
            </View>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Text variant="small" tone="anil" weight="medium" onPress={pickPhoto}>
              {photoBusy ? "Enviando..." : profile.avatarUrl ? "Trocar foto" : "Adicionar foto"}
            </Text>
            {profile.avatarUrl && !photoBusy ? (
              <Text variant="small" tone="ink3" onPress={removePhoto}>
                Remover
              </Text>
            ) : null}
          </View>
        </View>

        <Field label="Nome">
          <TextInput value={draft.name} onChangeText={(v) => set("name", v)} maxLength={60} style={input} />
        </Field>
        <Field label="@ do perfil">
          <TextInput
            value={draft.handle}
            onChangeText={(v) => set("handle", v.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
            style={input}
          />
        </Field>
        <Field label={`Bio (${draft.bio.length}/200)`}>
          <TextInput
            value={draft.bio}
            onChangeText={(v) => set("bio", v.slice(0, 200))}
            multiline
            maxLength={200}
            placeholder="O que você gosta de ler?"
            placeholderTextColor={c.ink4}
            style={[input, { height: 96, paddingTop: 14, textAlignVertical: "top" }]}
          />
        </Field>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Field label={`Meta de ${new Date().getFullYear()}`} style={{ width: 120 }}>
            <TextInput value={draft.goal} onChangeText={(v) => set("goal", v.replace(/\D/g, "").slice(0, 3))} keyboardType="number-pad" style={input} />
          </Field>
          <Field label="Cor do avatar" style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", gap: 10, height: 50, alignItems: "center" }}>
              {TONES.map((t) => {
                const tone = toneColors(c, t);
                return (
                  <Pressable
                    key={t}
                    onPress={() => set("tone", t)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: draft.tone === t }}
                    accessibilityLabel={t}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tone.fg, alignItems: "center", justifyContent: "center", borderWidth: draft.tone === t ? 3 : 0, borderColor: c.ink }}
                  >
                    {draft.tone === t ? <Check size={16} color={c.onBrand} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Field>
        </View>

        {error ? (
          <Text tone="danger" variant="small">
            {error}
          </Text>
        ) : null}
        <Button onPress={save} loading={saving}>
          Salvar alterações
        </Button>

        <PlanRow />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label">Perfil privado</Text>
            <Text variant="small" tone="ink3">
              Só seguidores aprovados veem sua estante e suas reviews.
            </Text>
          </View>
          <Switch value={profile.isPrivate} onValueChange={setPrivate} trackColor={{ true: c.anil, false: c.lineStrong }} />
        </View>

        <View style={{ gap: 4 }}>
          <Button variant="secondary" onPress={() => void Linking.openURL(`${SITE_URL}/conta`)}>
            Mais opções no site
          </Button>
          <Text variant="caption" tone="ink4" style={{ textAlign: "center" }}>
            Senha, redes sociais, bloqueios, exportar e excluir conta.
          </Text>
        </View>
        <Button
          variant="ghost"
          onPress={() =>
            confirmAction(
              "Sair da conta?",
              "Sair",
              () => {
                void signOut();
                router.replace("/");
              },
              "Sua estante continua salva na conta.",
            )
          }
        >
          <Text tone="danger" weight="medium">
            Sair da conta
          </Text>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text variant="small" tone="ink3" weight="medium">
        {label}
      </Text>
      {children}
    </View>
  );
}

/** Plano atual; toque para ver os planos. */
function PlanRow() {
  const c = useColors();
  const { account } = useAuth();
  const plan = account?.plan;
  const paid = plan && plan.plan !== "brochura";
  const end = plan?.periodEnd ? new Date(plan.periodEnd).toLocaleDateString("pt-BR", { day: "numeric", month: "long" }) : null;
  return (
    <Pressable
      onPress={() => router.push("/planos")}
      accessibilityRole="button"
      accessibilityHint="Abre os planos"
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, backgroundColor: paid ? c.musgoSoft : c.anilSoft, opacity: pressed ? 0.8 : 1 })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label">{paid ? "Capa Dura" : "Plano Brochura (grátis)"}</Text>
        <Text variant="small" tone="ink3">
          {paid ? (plan.canceling ? `Cancelado: vale até ${end}.` : end ? `Renova em ${end}.` : "Assinatura ativa.") : "Citações, notas e discussões sem limite no Capa Dura."}
        </Text>
      </View>
      <Text variant="small" weight="semibold" style={{ color: paid ? c.musgo : c.anil }}>
        {paid ? "Gerenciar" : "Ver planos"}
      </Text>
    </Pressable>
  );
}
