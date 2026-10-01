import { router } from "expo-router";
import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Chip, Loading, Text } from "@/components/ui";
import { SITE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { STATUS_LABELS, supportError, ticketLabel, useCreateTicket, useFaq, useMyTickets, type FaqItem, type SupportTopic } from "@/lib/support";
import { font, useColors } from "@/lib/theme";

/** Caminhos do site que têm tela no app; os outros abrem no navegador. */
const APP_ROUTES: Record<string, "/planos" | "/clubes"> = { "/planos": "/planos", "/clubes": "/clubes" };

function openLink(href: string) {
  const route = APP_ROUTES[href];
  if (route) router.push(route);
  else void Linking.openURL(`${SITE_URL}${href}`);
}

/** Ajuda: perguntas frequentes, pedidos da pessoa e formulário de contato. */
export default function Help() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { status } = useAuth();
  const loggedIn = status === "user";
  const faq = useFaq();
  const tickets = useMyTickets(loggedIn);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <Text variant="title">Como podemos ajudar?</Text>
          <Text tone="ink3">Veja as dúvidas mais comuns ou fale com a gente no fim da página.</Text>
        </View>

        {loggedIn && tickets.data?.tickets.length ? (
          <View style={{ gap: 8 }}>
            <Text variant="section">Seus pedidos</Text>
            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16 }}>
              {tickets.data.tickets.map((t, i) => (
                <Pressable
                  key={t.number}
                  onPress={() => router.push(`/ajuda/${t.number}`)}
                  accessibilityRole="link"
                  accessibilityLabel={`Pedido ${ticketLabel(t.number)}: ${t.subject}, ${STATUS_LABELS[t.status]}`}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderColor: c.line, opacity: pressed ? 0.7 : 1 })}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text weight="medium" numberOfLines={1}>
                      {t.subject}
                    </Text>
                    <Text variant="caption" tone={t.status === "respondido" ? "anil" : "ink3"}>
                      {ticketLabel(t.number)} · {STATUS_LABELS[t.status]}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={c.ink4} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {faq.isPending ? (
          <Loading />
        ) : faq.data ? (
          faq.data.faq.map((group) => (
            <View key={group.title} style={{ gap: 8 }}>
              <Text variant="section">{group.title}</Text>
              <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16 }}>
                {group.items.map((item, i) => (
                  <Question key={item.q} item={item} first={i === 0} />
                ))}
              </View>
            </View>
          ))
        ) : null}

        <ContactForm loggedIn={loggedIn} topics={faq.data?.topics ?? []} email={faq.data?.email} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Question({ item, first }: { item: FaqItem; first: boolean }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderColor: c.line }}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 }}
      >
        <Text weight="medium" style={{ flex: 1 }}>
          {item.q}
        </Text>
        <ChevronDown size={18} color={c.ink3} style={{ marginTop: 2, transform: [{ rotate: open ? "180deg" : "0deg" }] }} />
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 8 }}>
          <Text tone="ink2">{item.a}</Text>
          {item.link ? (
            <Text tone="anil" weight="medium" onPress={() => openLink(item.link!.href)}>
              {item.link.label} →
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ContactForm({ loggedIn, topics, email: supportEmail }: { loggedIn: boolean; topics: { id: SupportTopic; label: string }[]; email?: string }) {
  const c = useColors();
  const create = useCreateTicket();
  const [topic, setTopic] = useState<SupportTopic | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guestDone, setGuestDone] = useState<{ number: number; token: string } | null>(null);

  function submit() {
    if (!topic) return setError("Escolha o assunto.");
    if (!loggedIn && !email.includes("@")) return setError("Informe um e-mail para receber a resposta.");
    setError(null);
    create.mutate(
      { topic, subject: subject.trim(), body: body.trim(), email: email.trim() || undefined },
      {
        onSuccess: (r) => {
          if (loggedIn) router.push(`/ajuda/${r.number}`);
          else setGuestDone(r);
        },
        onError: (err) => setError(supportError(err)),
      },
    );
  }

  const box = { borderRadius: 14, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, paddingHorizontal: 14, color: c.ink, fontFamily: font.regular, fontSize: 16 };

  if (guestDone) {
    return (
      <View style={{ backgroundColor: c.musgoSoft, borderRadius: 20, padding: 18, gap: 8 }}>
        <CheckCircle2 size={24} color={c.musgo} />
        <Text variant="section">Pedido {ticketLabel(guestDone.number)} enviado</Text>
        <Text tone="ink2">Respondemos no e-mail que você informou. Você também acompanha o pedido por um link privado no navegador.</Text>
        <Button variant="secondary" onPress={() => void Linking.openURL(`${SITE_URL}/ajuda/pedido/${guestDone.token}`)}>
          Abrir o pedido no navegador
        </Button>
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Text variant="section">Fale com a gente</Text>
        <Text variant="small" tone="ink3">
          {loggedIn ? "A resposta chega nas suas notificações." : "Sem conta, tudo bem: deixe um e-mail para a resposta."} Respondemos em até 2 dias úteis.
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Assunto">
        {topics.map((t) => (
          <Chip key={t.id} label={t.label} active={topic === t.id} onPress={() => setTopic(t.id)} />
        ))}
      </View>
      <TextInput value={subject} onChangeText={setSubject} maxLength={120} placeholder="Resumo (ex.: não consigo entrar)" placeholderTextColor={c.ink4} accessibilityLabel="Resumo" style={[box, { height: 50 }]} />
      <TextInput
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={5000}
        placeholder="Conte o que aconteceu"
        placeholderTextColor={c.ink4}
        accessibilityLabel="Mensagem"
        style={[box, { minHeight: 130, paddingTop: 14, textAlignVertical: "top" }]}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        maxLength={254}
        placeholder={loggedIn ? "E-mail para resposta (opcional)" : "Seu e-mail"}
        placeholderTextColor={c.ink4}
        accessibilityLabel={loggedIn ? "E-mail para resposta (opcional)" : "Seu e-mail"}
        style={[box, { height: 50 }]}
      />
      {error ? (
        <Text variant="small" tone="danger">
          {error}
        </Text>
      ) : null}
      <Button onPress={submit} loading={create.isPending}>
        Enviar pedido
      </Button>
      {supportEmail ? (
        <Text variant="small" tone="ink3" style={{ textAlign: "center" }}>
          Prefere e-mail?{" "}
          <Text variant="small" tone="anil" onPress={() => void Linking.openURL(`mailto:${supportEmail}`)}>
            {supportEmail}
          </Text>
        </Text>
      ) : null}
    </View>
  );
}
