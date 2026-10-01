import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";
import type { Club, ClubInvite, ClubSummary } from "@/lib/types";

/** Clubes de leitura. Criar e administrar fica no site; no app a pessoa entra, acompanha e conversa. */

export function useClubs(enabled = true) {
  return useQuery({
    queryKey: ["clubs"],
    enabled,
    queryFn: () => api<{ clubs: ClubSummary[]; canCreate: boolean; owned: number; ownedLimit: number; planName: string }>("/clubs"),
  });
}

export function useClub(id: string) {
  return useQuery({ queryKey: ["club", id], queryFn: () => api<Club>(`/clubs/${id}`) });
}

/** Aceita o código ou o link inteiro do convite (…/clubes/convite/CODIGO). */
export function inviteCodeFrom(text: string): string | null {
  const code = text.trim().split(/[/?#]/).filter(Boolean).pop() ?? "";
  return /^[A-Za-z0-9]{10,32}$/.test(code) ? code : null;
}

export function previewInvite(code: string) {
  return api<ClubInvite>(`/clubs/invite/${code}`);
}

export function useJoinClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api<{ id: string }>("/clubs/join", { method: "POST", body: { code } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clubs"] }),
  });
}

export function useLeaveClub(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/clubs/${id}/leave`, { method: "POST" }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["club", id] });
      void qc.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
}

export function clubError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return "Convite inválido. Peça um link novo para quem criou o clube.";
    if (err.code === "full") return "Esse clube está cheio.";
    if (err.code === "blocked") return "Você não pode entrar neste clube.";
  }
  return "Não foi possível entrar. Tente de novo.";
}
