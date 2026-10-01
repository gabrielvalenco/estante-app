import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";
import type { Club, ClubInvitation, ClubInvite, ClubSummary, InvitableFollower } from "@/lib/types";

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

/** Seguidores que quem criou pode convidar; filtra por nome ou @ (consulta a cada letra, com cache curto). */
export function useInvitable(clubId: string, query: string, enabled: boolean) {
  return useQuery({
    queryKey: ["club-invitable", clubId, query],
    enabled,
    queryFn: () => api<{ people: InvitableFollower[] }>(`/clubs/${clubId}/invitable?q=${encodeURIComponent(query)}`),
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  });
}

export function useInviteActions(clubId: string) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["club", clubId] });
    void qc.invalidateQueries({ queryKey: ["club-invitable", clubId] });
  };
  return {
    invite: useMutation({ mutationFn: (handle: string) => api(`/clubs/${clubId}/invitations`, { method: "POST", body: { handle } }), onSuccess: refresh }),
    cancel: useMutation({ mutationFn: (handle: string) => api(`/clubs/${clubId}/invitations/${handle}`, { method: "DELETE" }), onSuccess: refresh }),
  };
}

/** Convite direto recebido para o clube (para quem ainda não é membro). */
export function useInvitation(clubId: string, enabled: boolean) {
  return useQuery({ queryKey: ["club-invitation", clubId], enabled, retry: false, queryFn: () => api<ClubInvitation>(`/clubs/${clubId}/invitation`) });
}

export function useRespondInvitation(clubId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accept: boolean) => api(`/clubs/${clubId}/invitation`, { method: "POST", body: { accept } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["club", clubId] });
      void qc.invalidateQueries({ queryKey: ["club-invitation", clubId] });
      void qc.invalidateQueries({ queryKey: ["clubs"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function inviteError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "not_follower") return "Só dá para convidar quem segue você.";
    if (err.code === "already_member") return "Essa pessoa já está no clube.";
    if (err.code === "full") return "O clube está cheio.";
    if (err.code === "limit_invites") return "Muitos convites sem resposta. Espere algumas pessoas responderem.";
    if (err.code === "blocked") return "Não é possível convidar essa pessoa.";
  }
  return "Não foi possível convidar. Tente de novo.";
}

export function clubError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return "Convite inválido. Peça um link novo para quem criou o clube.";
    if (err.code === "full") return "Esse clube está cheio.";
    if (err.code === "blocked") return "Você não pode entrar neste clube.";
  }
  return "Não foi possível entrar. Tente de novo.";
}
