import { router } from "expo-router";
import { Search, Share2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, Share, TextInput, View } from "react-native";

import { BookCover } from "@/components/book";
import { AnnotationRow, AnnotationSheet } from "@/components/reading";
import { Chip, Empty, Loading, Text } from "@/components/ui";
import { ApiError, siteText } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { percent, useAllAnnotations, useDeleteAnnotation } from "@/lib/reading";
import { font, useColors } from "@/lib/theme";
import type { Annotation } from "@/lib/types";

type Filter = "todas" | "quote" | "note";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Marcadores dos livros em andamento e todas as citações e notas. */
export default function Annotations() {
  const c = useColors();
  const { account } = useAuth();
  const q = useAllAnnotations();
  const remove = useDeleteAnnotation();
  const [filter, setFilter] = useState<Filter>("todas");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Annotation | null>(null);

  if (q.isPending) return <Loading />;
  if (!q.data) return <Empty title="Não deu para carregar">Tente de novo em instantes.</Empty>;
  const { annotations, usage, progress } = q.data;
  const reading = account?.shelf.filter((e) => e.status === "lendo") ?? [];
  const needle = fold(query.trim());
  const shown = annotations.filter(
    (a) => (filter === "todas" || a.kind === filter) && (!needle || fold(`${a.text} ${a.comment} ${a.book.title} ${a.book.author}`).includes(needle)),
  );
  const quotes = annotations.filter((a) => a.kind === "quote").length;

  return (
    <>
      <FlatList
        data={shown}
        keyExtractor={(a) => a.id}
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.anil} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text tone="ink3" style={{ flex: 1 }}>
                Seus marcadores, citações e notas. Só você vê.
              </Text>
              {annotations.length ? <ExportButton /> : null}
            </View>
            {reading.length ? (
              <View style={{ gap: 8 }}>
                <Text variant="caption" tone="ink3">
                  LENDO AGORA
                </Text>
                {reading.map((e) => {
                  const p = progress[e.book.id];
                  const pct = percent(p);
                  return (
                    <Pressable
                      key={e.book.id}
                      onPress={() => router.push(`/livro/${e.book.id}`)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}
                    >
                      <BookCover book={e.book} width={36} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text variant="small" weight="medium" numberOfLines={1}>
                          {e.book.title}
                        </Text>
                        <Text variant="caption" tone="ink3">
                          {p ? (p.totalPages ? `Página ${p.page} de ${p.totalPages}` : `Página ${p.page}`) : "Sem marcador ainda"}
                        </Text>
                        {pct !== null ? (
                          <View style={{ height: 5, borderRadius: 3, backgroundColor: c.sunken, overflow: "hidden" }}>
                            <View style={{ width: `${pct}%`, height: 5, backgroundColor: c.ameixa }} />
                          </View>
                        ) : null}
                      </View>
                      {pct !== null ? <Text variant="small" weight="semibold" style={{ color: c.ameixa }}>{pct}%</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Chip label={`Todas ${annotations.length}`} active={filter === "todas"} onPress={() => setFilter("todas")} />
              <Chip label={`Citações ${quotes}`} active={filter === "quote"} onPress={() => setFilter("quote")} />
              <Chip label={`Notas ${annotations.length - quotes}`} active={filter === "note"} onPress={() => setFilter("note")} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.sunken, borderRadius: 12, paddingHorizontal: 12, height: 42, gap: 8 }}>
              <Search size={16} color={c.ink4} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar nas anotações"
                placeholderTextColor={c.ink4}
                accessibilityLabel="Buscar nas anotações"
                style={{ flex: 1, color: c.ink, fontFamily: font.regular, fontSize: 15 }}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Empty title={annotations.length ? "Nada encontrado" : "Nenhuma anotação ainda"}>
            {annotations.length ? "Tente outra palavra." : "Abra um livro e guarde uma citação ou uma nota em Sua leitura."}
          </Empty>
        }
        renderItem={({ item }) => (
          <AnnotationRow
            annotation={item}
            showBook
            onEdit={() => setEditing(item)}
            onDelete={() => confirmAction(item.kind === "quote" ? "Excluir citação?" : "Excluir nota?", "Excluir", () => remove.mutate(item))}
          />
        )}
        ListFooterComponent={
          usage.quotesLimit !== null ? (
            <Text variant="caption" tone="ink4" style={{ marginTop: 16 }}>
              {usage.quotes} de {usage.quotesLimit} citações no plano {usage.planName} · até {usage.notesPerBookLimit} notas por livro
            </Text>
          ) : null
        }
      />
      {editing ? <AnnotationSheet book={editing.book} kind={editing.kind} annotation={editing} defaultPage={null} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

/** Exporta citações e notas em Markdown pela folha de compartilhar do celular (Notion, e-mail, arquivos). Capa Dura. */
function ExportButton() {
  const c = useColors();
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const markdown = await siteText("/api/conta/anotacoes");
      await Share.share({ message: markdown, title: "Minhas anotações da Estante" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        confirmAction(
          "Exportar faz parte do Capa Dura",
          "Ver planos",
          () => router.push("/planos"),
          "Suas citações e notas saem em Markdown, prontas para o Notion ou o Obsidian. Seus dados completos continuam grátis para baixar no site (LGPD).",
        );
      } else Alert.alert("Não foi possível exportar agora");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Pressable
      onPress={run}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel="Exportar anotações"
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.sunken, opacity: pressed || busy ? 0.6 : 1 })}
    >
      <Share2 size={15} color={c.ink2} />
      <Text variant="small" weight="medium">
        {busy ? "Exportando..." : "Exportar"}
      </Text>
    </Pressable>
  );
}
