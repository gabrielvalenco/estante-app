import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { BookPage, BookSummary, Entry, ShelfEntry } from "@/lib/types";

export const EMPTY_ENTRY: Entry = { status: null, rating: null, liked: false, review: "", finishedOn: null, updatedAt: 0 };

/** Registro da pessoa para um livro, a partir da estante em cache. */
export function useMyEntry(bookId: string): Entry | null {
  const { account } = useAuth();
  const found = account?.shelf.find((e) => e.book.id === bookId);
  return found ? { status: found.status, rating: found.rating, liked: found.liked, review: found.review, finishedOn: found.finishedOn, updatedAt: found.updatedAt } : null;
}

const isEmpty = (e: Entry) => !e.status && !e.rating && !e.liked && !e.review.trim();

/**
 * Salva um registro na estante. Atualiza a tela na hora (otimista) e desfaz se a API recusar.
 * O livro vai junto porque a estante guarda uma cópia dele (título, capa, cor).
 */
export function useSaveEntry() {
  const { setAccount, account } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ book, entry }: { book: BookSummary; entry: Entry }) =>
      api(`/shelf/${book.id}`, {
        method: "PUT",
        body: {
          book: { id: book.id, title: book.title, author: book.author, coverId: book.coverId, color: book.color, year: book.year, pages: book.pages },
          ...entry,
          review: entry.review.trim(),
        },
      }),
    onMutate: ({ book, entry }) => {
      const before = account?.shelf;
      const next: ShelfEntry = { ...entry, book };
      setAccount((prev) => {
        const rest = prev.shelf.filter((e) => e.book.id !== book.id);
        return { ...prev, shelf: isEmpty(entry) ? rest : [next, ...rest] };
      });
      return { before };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.before) setAccount((prev) => ({ ...prev, shelf: ctx.before! }));
    },
    onSettled: (_data, _err, { book }) => {
      queryClient.invalidateQueries({ queryKey: ["book", book.id] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type { BookPage };
