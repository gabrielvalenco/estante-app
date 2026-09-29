import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";
import type { Post, Thread, ThreadUsage, Viewer } from "@/lib/types";

/**
 * Discussões por livro. A API já esconde o que passa da página de quem pede (spoiler: true, sem texto);
 * aqui só se decide pedir tudo (reveal) quando a pessoa escolhe ver os spoilers.
 */

export function useThreads(bookId: string, reveal: boolean) {
  return useQuery({
    queryKey: ["threads", bookId, reveal],
    queryFn: () => api<{ threads: Thread[]; viewer: Viewer; usage: ThreadUsage | null }>(`/books/${bookId}/discussions${reveal ? "?spoilers=1" : ""}`),
  });
}

export function useThread(id: string, reveal: boolean) {
  return useQuery({
    queryKey: ["thread", id, reveal],
    queryFn: () => api<{ thread: Thread; posts: Post[]; viewer: Viewer; book: { id: string; title: string } }>(`/discussions/${id}${reveal ? "?spoilers=1" : ""}`),
  });
}

export function useCreateThread(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { bookTitle: string; title: string; body: string; page: number }) =>
      api<{ thread: Thread; usage: ThreadUsage }>(`/books/${bookId}/discussions`, { method: "POST", body: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["threads", bookId] }),
  });
}

export function useReply(threadId: string, bookId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { body: string; page: number }) => api<{ post: Post }>(`/discussions/${threadId}/posts`, { method: "POST", body: v }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["thread", threadId] });
      if (bookId) void qc.invalidateQueries({ queryKey: ["threads", bookId] });
    },
  });
}

export function useDeleteDiscussionItem(threadId: string, bookId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { kind: "thread" | "post"; id: string }) => api(v.kind === "thread" ? `/discussions/${v.id}` : `/posts/${v.id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["thread", threadId] });
      if (bookId) void qc.invalidateQueries({ queryKey: ["threads", bookId] });
    },
  });
}

export function report(kind: "thread" | "post", id: string) {
  return api("/reports", { method: "POST", body: { kind, id } });
}

export function discussionError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 402) return "O plano Brochura abre até 3 discussões por mês. Responder continua livre, e o Capa Dura, que chega em breve, libera discussões ilimitadas.";
    if (err.status === 429) return "Muitas mensagens seguidas. Espere um pouco e tente de novo.";
    if (err.code === "blocked") return "Você não pode participar desta discussão.";
    if (err.code === "invalid") return "Confira os campos: o título precisa de pelo menos 3 letras.";
  }
  return "Não foi possível publicar. Tente de novo.";
}

export const pageLabel = (page: number) => (page === 0 ? "Sem spoiler" : `Até a p. ${page}`);

export function ago(ts: number) {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d < 30 ? `há ${d} d` : new Date(ts).toLocaleDateString("pt-BR");
}
