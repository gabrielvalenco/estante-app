import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, TextInput, View } from "react-native";

import { Mark } from "@/components/brand";
import { Button, Chip, Text } from "@/components/ui";
import { SITE_URL, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { font, useColors } from "@/lib/theme";

/** Entrar pelo site (Google, GitHub ou senha) ou com e-mail e senha aqui mesmo. A mesma conta vale no site. */
export default function SignIn() {
  const c = useColors();
  const { signIn, signUp, signInWithSite } = useAuth();
  const [viaSite, setViaSite] = useState(false);
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (mode === "criar" && !name.trim()) return setError("Conte como quer ser chamado.");
    if (!email.includes("@")) return setError("Digite um e-mail válido.");
    if (password.length < (mode === "criar" ? 8 : 1)) return setError("A senha precisa de pelo menos 8 caracteres.");
    setBusy(true);
    try {
      if (mode === "entrar") await signIn(email.trim(), password);
      else await signUp(name.trim(), email.trim(), password);
      leave();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // Volta para onde a pessoa estava; aberta direto (link ou web), vai para o início.
  const leave = () => (router.canGoBack() ? router.back() : router.replace("/"));

  async function enterWithSite() {
    setError(null);
    setViaSite(true);
    try {
      if (await signInWithSite()) leave();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setViaSite(false);
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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", gap: 10, marginVertical: 12 }}>
          <Mark size={48} />
          <Text variant="title">{mode === "entrar" ? "Bem-vindo de volta" : "Crie sua conta"}</Text>
          <Text tone="ink3" style={{ textAlign: "center" }}>
            A mesma conta do site: sua estante aparece nos dois.
          </Text>
        </View>

        <Button onPress={enterWithSite} loading={viaSite} disabled={busy}>
          Continuar com Google, GitHub ou o site
        </Button>
        <Text variant="caption" tone="ink4" style={{ textAlign: "center", marginTop: -6 }}>
          Abre o site da Estante para você entrar e volta para o app.
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
          <Text variant="caption" tone="ink4">
            OU COM E-MAIL E SENHA
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
        </View>

        <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
          <Chip label="Entrar" active={mode === "entrar"} onPress={() => setMode("entrar")} />
          <Chip label="Criar conta" active={mode === "criar"} onPress={() => setMode("criar")} />
        </View>

        {mode === "criar" ? (
          <TextInput value={name} onChangeText={setName} placeholder="Nome" placeholderTextColor={c.ink4} autoComplete="name" maxLength={60} style={input} accessibilityLabel="Nome" />
        ) : null}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          placeholderTextColor={c.ink4}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          style={input}
          accessibilityLabel="E-mail"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={mode === "criar" ? "Senha (mínimo 8 caracteres)" : "Senha"}
          placeholderTextColor={c.ink4}
          secureTextEntry
          autoComplete={mode === "criar" ? "new-password" : "current-password"}
          maxLength={72}
          onSubmitEditing={submit}
          style={input}
          accessibilityLabel="Senha"
        />

        {error ? (
          <Text tone="danger" variant="small">
            {error}
          </Text>
        ) : null}

        <Button variant="secondary" onPress={submit} loading={busy} disabled={viaSite}>
          {mode === "entrar" ? "Entrar" : "Criar conta"}
        </Button>

        <Text variant="small" tone="ink4" style={{ textAlign: "center", marginTop: 8 }}>
          <Text variant="small" tone="anil" onPress={() => void Linking.openURL(`${SITE_URL}/privacidade`)}>
            Privacidade
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
