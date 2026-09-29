import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { BookMarked, Minus, NotebookPen, Pencil, Plus, Quote, Share2, Trash2, X } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Chip, Loading, Text } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { limitMessage, percent, useDeleteAnnotation, useReading, useSaveAnnotation, useSaveProgress } from "@/lib/reading";
import { EMPTY_ENTRY, todayISO, useMyEntry, useSaveEntry } from "@/lib/shelf";
import { font, useColors } from "@/lib/theme";
import type { Annotation, AnnotationKind, BookSummary, Progress, Usage } from "@/lib/types";

/** "Sua leitura" na tela do livro: marcador, citações e notas. Só você vê. */
export function ReadingSection({ book }: { book: BookSummary }) {
  const c = useColors();
  const q = useReading(book.id, true);
  const [tab, setTab] = useState<AnnotationKind>("quote");
  const [editing, setEditing] = useState<{ kind: AnnotationKind; annotation?: Annotation } | null>(null);
  const remove = useDeleteAnnotation();

  if (q.isPending) return <Loading />;
  if (!q.data) return null;
  const { progress, annotations, usage } = q.data;
  const list = annotations.filter((a) => a.kind === tab);
  const quotes = annotations.filter((a) => a.kind === "quote").length;

  return (
    <View style={{ gap: 14 }}>
      <View>
        <Text variant="caption" tone="ink4">
          SÓ VOCÊ VÊ
        </Text>
        <Text variant="section">Sua leitura</Text>
      </View>

      <Bookmark key={progress?.updatedAt ?? 0} book={book} progress={progress} />

      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Chip label={`Citações ${quotes}`} active={tab === "quote"} onPress={() => setTab("quote")} />
          <Chip label={`Notas ${annotations.length - quotes}`} active={tab === "note"} onPress={() => setTab("note")} />
          <Pressable
            onPress={() => setEditing({ kind: tab })}
            accessibilityRole="button"
            accessibilityLabel={tab === "quote" ? "Nova citação" : "Nova nota"}
            hitSlop={8}
            style={{ marginLeft: "auto", width: 36, height: 36, borderRadius: 18, backgroundColor: c.anil, alignItems: "center", justifyContent: "center" }}
          >
            <Plus size={18} color={c.onBrand} />
          </Pressable>
        </View>

        {list.length ? (
          list.map((a) => (
            <AnnotationRow
              key={a.id}
              annotation={a}
              onEdit={() => setEditing({ kind: a.kind, annotation: a })}
              onDelete={() => confirmAction(a.kind === "quote" ? "Excluir citação?" : "Excluir nota?", "Excluir", () => remove.mutate(a))}
            />
          ))
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 24, gap: 8, backgroundColor: c.sunken, borderRadius: 12 }}>
            {tab === "quote" ? <Quote size={20} color={c.ink4} /> : <NotebookPen size={20} color={c.ink4} />}
            <Text variant="small" tone="ink3" style={{ textAlign: "center", paddingHorizontal: 16 }}>
              {tab === "quote" ? "Guarde aqui os trechos que você quer lembrar." : "Anote ideias, perguntas e o que achou de cada parte."}
            </Text>
          </View>
        )}

        <Text variant="caption" tone="ink4">
          {usageLine(usage, tab)}
          {"  ·  "}
          <Text variant="caption" tone="anil" onPress={() => router.push("/anotacoes")}>
            Ver todas
          </Text>
        </Text>
      </View>

      {editing ? (
        <AnnotationSheet
          book={book}
          kind={editing.kind}
          annotation={editing.annotation}
          defaultPage={progress?.page || null}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </View>
  );
}

function usageLine(u: Usage, tab: AnnotationKind) {
  if (tab === "quote") return u.quotesLimit === null ? `${u.quotes} citações` : `${u.quotes} de ${u.quotesLimit} citações no plano ${u.planName}`;
  return u.notesPerBookLimit === null ? `${u.notesInBook} notas neste livro` : `${u.notesInBook} de ${u.notesPerBookLimit} notas neste livro`;
}

/** Marcador de página com botões de +1/-1 e o total da edição que a pessoa lê. */
function Bookmark({ book, progress }: { book: BookSummary; progress: Progress | null }) {
  const c = useColors();
  const entry = useMyEntry(book.id);
  const saveEntry = useSaveEntry();
  const save = useSaveProgress(book.id);
  const [page, setPage] = useState(progress?.page ? String(progress.page) : "");
  const [total, setTotal] = useState(String(progress?.totalPages ?? book.pages ?? ""));
  const [error, setError] = useState<string | null>(null);

  const pageN = Number(page) || 0;
  const totalN = Number(total) || null;
  const pct = percent({ page: pageN, totalPages: totalN, updatedAt: 0 });
  const changed = pageN !== (progress?.page ?? 0) || totalN !== (progress ? progress.totalPages : (book.pages ?? null));
  const finished = totalN !== null && pageN >= totalN;

  function submit() {
    setError(null);
    if (totalN !== null && pageN > totalN) return setError("A página passou do total do livro.");
    save.mutate(
      { page: pageN, totalPages: totalN },
      {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          // Marcar a página é sinal de leitura em andamento.
          if (pageN > 0 && !finished && entry?.status !== "lendo" && entry?.status !== "lido") {
            saveEntry.mutate({ book, entry: { ...(entry ?? EMPTY_ENTRY), status: "lendo", updatedAt: Date.now() } });
          }
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  }

  const step = (d: number) => {
    void Haptics.selectionAsync().catch(() => {});
    setPage(String(Math.max(0, Math.min(totalN ?? 100000, pageN + d))));
  };
  const input = { height: 44, minWidth: 64, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.canvas, color: c.ink, fontFamily: font.semibold, fontSize: 17, textAlign: "center" as const, paddingHorizontal: 8 };

  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <BookMarked size={16} color={c.ameixa} />
        <Text variant="label">Marcador</Text>
        {pct !== null ? (
          <Text variant="label" style={{ marginLeft: "auto", color: c.ameixa }}>
            {pct}%
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <StepButton onPress={() => step(-1)} label="Voltar uma página">
          <Minus size={16} color={c.ink2} />
        </StepButton>
        <TextInput value={page} onChangeText={(t) => setPage(t.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" placeholder="0" placeholderTextColor={c.ink4} accessibilityLabel="Página atual" style={input} />
        <StepButton onPress={() => step(1)} label="Avançar uma página">
          <Plus size={16} color={c.ink2} />
        </StepButton>
        <Text tone="ink3">de</Text>
        <TextInput value={total} onChangeText={(t) => setTotal(t.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" placeholder="?" placeholderTextColor={c.ink4} accessibilityLabel="Total de páginas" style={input} />
      </View>
      {pct !== null ? (
        <View style={{ height: 8, borderRadius: 4, backgroundColor: c.sunken, overflow: "hidden" }}>
          <View style={{ width: `${pct}%`, height: 8, borderRadius: 4, backgroundColor: c.ameixa }} />
        </View>
      ) : null}
      {error ? (
        <Text variant="small" tone="danger">
          {error}
        </Text>
      ) : null}
      <Button variant={changed ? "primary" : "secondary"} disabled={!changed} loading={save.isPending} onPress={submit} style={{ height: 42 }}>
        Salvar marcador
      </Button>
      {finished && !changed && entry?.status !== "lido" ? (
        <Button
          variant="ghost"
          onPress={() => saveEntry.mutate({ book, entry: { ...(entry ?? EMPTY_ENTRY), status: "lido", finishedOn: entry?.finishedOn ?? todayISO(), updatedAt: Date.now() } })}
          style={{ height: 40, backgroundColor: c.musgoSoft }}
        >
          <Text weight="semibold" style={{ color: c.musgo }}>
            Chegou ao fim? Marcar como lido
          </Text>
        </Button>
      ) : null}
    </View>
  );
}

function StepButton({ onPress, label, children }: { onPress: () => void; label: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: c.sunken, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
      {children}
    </Pressable>
  );
}

/** Uma citação ou nota, com compartilhar, editar e excluir. */
export function AnnotationRow({ annotation: a, onEdit, onDelete, showBook = false }: { annotation: Annotation; onEdit: () => void; onDelete: () => void; showBook?: boolean }) {
  const c = useColors();
  return (
    <View style={{ gap: 6, paddingVertical: 10, borderTopWidth: 1, borderColor: c.line }}>
      {showBook ? (
        <Text variant="caption" tone="ink3" numberOfLines={1} onPress={() => router.push(`/livro/${a.book.id}`)}>
          {a.book.title}
        </Text>
      ) : null}
      {a.kind === "quote" ? (
        <View style={{ borderLeftWidth: 2, borderColor: c.ambar, paddingLeft: 10 }}>
          <Text style={{ fontSize: 16, lineHeight: 24 }}>“{a.text}”</Text>
        </View>
      ) : (
        <Text tone="ink2">{a.text}</Text>
      )}
      {a.comment ? (
        <Text variant="small" tone="ink3">
          {a.comment}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {a.page ? (
          <View style={{ backgroundColor: c.sunken, borderRadius: 999, paddingHorizontal: 8, height: 20, justifyContent: "center" }}>
            <Text variant="caption" tone="ink3">
              p. {a.page}
            </Text>
          </View>
        ) : null}
        <Text variant="caption" tone="ink4">
          {new Date(a.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
        </Text>
        <View style={{ flexDirection: "row", marginLeft: "auto", gap: 4 }}>
          {a.kind === "quote" ? (
            <RowButton
              label="Compartilhar citação"
              onPress={() => void Share.share({ message: `“${a.text}”\n${a.book.title}${a.book.author ? `, ${a.book.author}` : ""}${a.page ? `, p. ${a.page}` : ""}` })}
            >
              <Share2 size={15} color={c.ink3} />
            </RowButton>
          ) : null}
          <RowButton label="Editar" onPress={onEdit}>
            <Pencil size={15} color={c.ink3} />
          </RowButton>
          <RowButton label="Excluir" onPress={onDelete}>
            <Trash2 size={15} color={c.ink3} />
          </RowButton>
        </View>
      </View>
    </View>
  );
}

function RowButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => ({ padding: 6, borderRadius: 999, opacity: pressed ? 0.6 : 1 })}>
      {children}
    </Pressable>
  );
}

/** Folha para criar ou editar uma citação ou nota. */
export function AnnotationSheet({
  book,
  kind,
  annotation,
  defaultPage,
  onClose,
}: {
  book: Pick<BookSummary, "id" | "title" | "author" | "coverId" | "color">;
  kind: AnnotationKind;
  annotation?: Annotation;
  defaultPage: number | null;
  onClose: () => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const save = useSaveAnnotation();
  const [text, setText] = useState(annotation?.text ?? "");
  const [comment, setComment] = useState(annotation?.comment ?? "");
  const [page, setPage] = useState(String(annotation?.page ?? defaultPage ?? ""));
  const [error, setError] = useState<string | null>(null);
  const max = kind === "quote" ? 1000 : 4000;

  function submit() {
    if (!text.trim()) return setError(kind === "quote" ? "Escreva o trecho." : "Escreva a nota.");
    setError(null);
    save.mutate(
      { id: annotation?.id, book, kind, text: text.trim(), comment: comment.trim(), page: Number(page) || null },
      {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onClose();
        },
        onError: (err) => setError(limitMessage(err) ?? errorMessage(err)),
      },
    );
  }

  const box = { borderRadius: 14, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, padding: 14, color: c.ink, fontFamily: font.regular, fontSize: 16, textAlignVertical: "top" as const };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.canvas }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: Platform.OS === "android" ? insets.top + 12 : 16 }}>
          <View style={{ flex: 1 }}>
            <Text variant="section">
              {annotation ? "Editar" : "Nova"} {kind === "quote" ? "citação" : "nota"}
            </Text>
            <Text variant="small" tone="ink3" numberOfLines={1}>
              {book.title}
            </Text>
          </View>
          <Pressable onPress={onClose} accessibilityLabel="Fechar" hitSlop={10} style={{ padding: 6, borderRadius: 999, backgroundColor: c.sunken }}>
            <X size={18} color={c.ink2} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text variant="small" tone="ink3" weight="medium">
                {kind === "quote" ? "Trecho do livro" : "Nota"}
              </Text>
              <Text variant="small" tone="ink4">
                {text.length}/{max}
              </Text>
            </View>
            <TextInput
              value={text}
              onChangeText={(t) => setText(t.slice(0, max))}
              multiline
              autoFocus
              maxLength={max}
              placeholder={kind === "quote" ? "Copie aqui a frase que você quer guardar" : "O que você pensou nesta parte?"}
              placeholderTextColor={c.ink4}
              style={[box, { minHeight: kind === "quote" ? 120 : 180 }]}
            />
          </View>
          {kind === "quote" ? (
            <View style={{ gap: 6 }}>
              <Text variant="small" tone="ink3" weight="medium">
                Seu comentário (opcional)
              </Text>
              <TextInput value={comment} onChangeText={(t) => setComment(t.slice(0, 1000))} multiline maxLength={1000} placeholder="Por que esse trecho?" placeholderTextColor={c.ink4} style={[box, { minHeight: 80 }]} />
            </View>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text tone="ink2">Página</Text>
            <TextInput
              value={page}
              onChangeText={(t) => setPage(t.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              placeholder="opcional"
              placeholderTextColor={c.ink4}
              style={{ height: 44, width: 110, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, paddingHorizontal: 12, color: c.ink, fontFamily: font.regular, fontSize: 16 }}
            />
          </View>
          {error ? (
            <Text variant="small" tone="danger">
              {error}
            </Text>
          ) : null}
          <Text variant="caption" tone="ink4">
            Só você vê suas anotações.
          </Text>
          <Button onPress={submit} loading={save.isPending}>
            Salvar
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
