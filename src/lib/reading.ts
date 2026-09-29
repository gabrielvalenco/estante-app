import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";
import type { Annotation, AnnotationKind, BookSummary, Progress, ReadingData, Usage } from "@/lib/types";

/**
 * Marcador, citações e notas (privados). Mesmas regras e limites do site: quem decide é a API
 * (402 quando passa do limite do plano).
 */

export function useReading(bookId: string, enabled: boolean) {
  return useQuery({ queryKey: ["reading", bookId], queryFn: () => api<ReadingData>(`/reading/${bookId}`), enabled });
}

export function useAllAnnotations(enabled = true) {
  return useQuery({
    queryKey: ["annotations"],
    queryFn: () => api<{ annotations: Annotation[]; usage: Usage; progress: Record<string, Progress> }>("/annotations"),
    enabled,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return (bookId: string) => {
    void queryClient.invalidateQueries({ queryKey: ["reading", bookId] });
    void queryClient.invalidateQueries({ queryKey: ["annotations"] });
  };
}

export function useSaveProgress(bookId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (p: { page: number; totalPages: number | null }) => api<{ progress: Progress | null }>(`/reading/${bookId}`, { method: "PUT", body: p }),
    onSuccess: () => invalidate(bookId),
  });
}

export type LimitError = { error: "limit_quotes" | "limit_notes"; usage: Usage };

/** Cria (sem id) ou edita (com id) uma anotação. */
export function useSaveAnnotation() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id?: string; book: Pick<BookSummary, "id" | "title" | "author" | "coverId" | "color">; kind: AnnotationKind; text: string; comment: string; page: number | null }) => {
      if (v.id) return api<{ annotation: Annotation }>(`/annotations/${v.id}`, { method: "PATCH", body: { text: v.text, comment: v.comment, page: v.page } });
      const { id, title, author, coverId, color } = v.book;
      return api<{ annotation: Annotation }>("/annotations", {
        method: "POST",
        body: { book: { id, title, author, coverId, color }, kind: v.kind, text: v.text, comment: v.comment, page: v.page },
      });
    },
    onSuccess: (_d, v) => invalidate(v.book.id),
  });
}

export function useDeleteAnnotation() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (a: Annotation) => api(`/annotations/${a.id}`, { method: "DELETE" }),
    onSuccess: (_d, a) => invalidate(a.book.id),
  });
}

/** Mensagem do limite do plano (a API responde 402 com o uso). */
export function limitMessage(err: unknown): string | null {
  if (!(err instanceof ApiError) || err.status !== 402) return null;
  return err.code === "limit_notes"
    ? "Você chegou ao limite de notas deste livro no plano Brochura. No Capa Dura as notas são ilimitadas."
    : "Você chegou ao limite de 20 citações do plano Brochura. No Capa Dura as citações são ilimitadas.";
}

export function percent(p: Progress | null | undefined) {
  return p?.totalPages ? Math.min(100, Math.round((p.page / p.totalPages) * 100)) : null;
}
