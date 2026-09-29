import * as Haptics from "expo-haptics";
import { Heart, Star, X } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookCover, formatRating } from "@/components/book";
import { Button, Chip, Text } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { EMPTY_ENTRY, todayISO, useSaveEntry } from "@/lib/shelf";
import { font, STATUS_LABEL, statusColor, useColors } from "@/lib/theme";
import type { BookSummary, Entry, Status } from "@/lib/types";

/** Folha para registrar a leitura: status, nota, curtida, data em que terminou e review. */
export function EntrySheet({ book, entry, visible, onClose }: { book: BookSummary; entry: Entry | null; visible: boolean; onClose: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const save = useSaveEntry();
  const [draft, setDraft] = useState<Entry>(entry ?? { ...EMPTY_ENTRY, status: "lido", finishedOn: todayISO() });
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Entry>(key: K, value: Entry[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function submit(next: Entry) {
    setError(null);
    save.mutate(
      { book, entry: { ...next, updatedAt: Date.now() } },
      {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onClose();
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.canvas }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: Platform.OS === "android" ? insets.top + 12 : 16 }}>
          <Text variant="section">Registrar leitura</Text>
          <Pressable onPress={onClose} accessibilityLabel="Fechar" hitSlop={10} style={{ padding: 6, borderRadius: 999, backgroundColor: c.sunken }}>
            <X size={18} color={c.ink2} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <BookCover book={book} width={52} />
            <View style={{ flex: 1 }}>
              <Text variant="label" numberOfLines={2}>
                {book.title}
              </Text>
              <Text variant="small" tone="ink3" numberOfLines={1}>
                {book.author}
              </Text>
            </View>
          </View>

          <Section title="Status">
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {(["quero-ler", "lendo", "lido"] as Status[]).map((s) => (
                <Chip
                  key={s}
                  label={STATUS_LABEL[s]}
                  active={draft.status === s}
                  color={statusColor(c, s)}
                  onPress={() =>
                    setDraft((d) => ({
                      ...d,
                      status: d.status === s ? null : s,
                      finishedOn: s === "lido" && d.status !== "lido" ? (d.finishedOn ?? todayISO()) : s === "lido" ? d.finishedOn : null,
                    }))
                  }
                />
              ))}
            </View>
          </Section>

          <Section title={draft.rating ? `Nota: ${formatRating(draft.rating)}` : "Nota"}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <StarInput value={draft.rating} onChange={(r) => set("rating", r)} />
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  set("liked", !draft.liked);
                }}
                accessibilityRole="switch"
                accessibilityState={{ checked: draft.liked }}
                accessibilityLabel="Curtir o livro"
                hitSlop={8}
                style={{ alignItems: "center", gap: 2 }}
              >
                <Heart size={30} color={draft.liked ? c.ameixa : c.ink4} fill={draft.liked ? c.ameixa : "transparent"} />
                <Text variant="caption" tone="ink3">
                  Curtir
                </Text>
              </Pressable>
            </View>
          </Section>

          {draft.status === "lido" ? (
            <Section title="Terminei em">
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Chip label="Hoje" active={draft.finishedOn === todayISO()} onPress={() => set("finishedOn", todayISO())} />
                <Chip label="Ontem" active={draft.finishedOn === yesterdayISO()} onPress={() => set("finishedOn", yesterdayISO())} />
                <Chip label="Sem data" active={!draft.finishedOn} onPress={() => set("finishedOn", null)} />
                <DateField value={draft.finishedOn} onChange={(v) => set("finishedOn", v)} />
              </View>
            </Section>
          ) : null}

          <Section title="Review" hint={`${draft.review.length}/600`}>
            <TextInput
              value={draft.review}
              onChangeText={(t) => set("review", t.slice(0, 600))}
              placeholder="O que ficou na sua cabeça?"
              placeholderTextColor={c.ink4}
              multiline
              maxLength={600}
              style={{
                minHeight: 120,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: c.line,
                backgroundColor: c.surface,
                padding: 14,
                color: c.ink,
                fontFamily: font.regular,
                fontSize: 16,
                textAlignVertical: "top",
              }}
            />
          </Section>

          {error ? (
            <Text tone="danger" variant="small">
              {error}
            </Text>
          ) : null}

          <View style={{ gap: 10 }}>
            <Button onPress={() => submit(draft)} loading={save.isPending}>
              Salvar
            </Button>
            {entry ? (
              <Button variant="ghost" onPress={() => submit(EMPTY_ENTRY)} disabled={save.isPending}>
                <Text tone="danger" weight="medium">
                  Tirar da estante
                </Text>
              </Button>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="small" tone="ink3" weight="medium">
          {title}
        </Text>
        {hint ? (
          <Text variant="small" tone="ink4">
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** Cinco estrelas; cada uma tem duas metades tocáveis (meia estrela). Tocar na nota atual limpa. */
function StarInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const c = useColors();
  const size = 38;
  const pick = (v: number) => {
    void Haptics.selectionAsync().catch(() => {});
    onChange(value === v ? null : v);
  };
  return (
    <View style={{ flexDirection: "row", gap: 4 }} accessibilityRole="adjustable" accessibilityLabel="Nota" accessibilityValue={{ text: value ? `${formatRating(value)} de 5` : "sem nota" }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        const cur = value ?? 0;
        if (e.nativeEvent.actionName === "increment") onChange(Math.min(5, cur + 0.5));
        else onChange(cur - 0.5 <= 0 ? null : cur - 0.5);
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = value === null ? 0 : value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0;
        return (
          <View key={i} style={{ width: size, height: size }}>
            <Star size={size} color={c.lineStrong} fill={c.sunken} strokeWidth={1.2} />
            {fill > 0 ? (
              <View style={{ position: "absolute", width: size * fill, height: size, overflow: "hidden" }}>
                <Star size={size} color={c.ambar} fill={c.ambar} strokeWidth={1.2} />
              </View>
            ) : null}
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row" }}>
              <Pressable style={{ flex: 1 }} onPress={() => pick(i - 0.5)} aria-hidden />
              <Pressable style={{ flex: 1 }} onPress={() => pick(i)} aria-hidden />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Data no formato brasileiro (dd/mm/aaaa), guardada como AAAA-MM-DD. Sem datas no futuro. */
function DateField({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const c = useColors();
  const toBR = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "");
  const [text, setText] = useState(toBR(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(toBR(value));
  }
  return (
    <TextInput
      value={text}
      placeholder="dd/mm/aaaa"
      placeholderTextColor={c.ink4}
      keyboardType="number-pad"
      maxLength={10}
      accessibilityLabel="Data em que terminou"
      onChangeText={(t) => {
        const digits = t.replace(/\D/g, "").slice(0, 8);
        const masked = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join("/");
        setText(masked);
        if (digits.length === 8) {
          const iso = `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
          const d = new Date(`${iso}T12:00:00`);
          if (!Number.isNaN(d.getTime()) && iso <= todayISO() && d.getDate() === Number(digits.slice(0, 2))) onChange(iso);
        }
      }}
      style={{ height: 36, minWidth: 116, borderRadius: 999, paddingHorizontal: 14, backgroundColor: c.sunken, color: c.ink, fontFamily: font.medium, fontSize: 14 }}
    />
  );
}

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
