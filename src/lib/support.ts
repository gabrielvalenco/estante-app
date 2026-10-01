import Constants from "expo-constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";

/** Suporte: perguntas frequentes e pedidos. Mesma fonte do site (/api/v1/support). */

export type SupportTopic = "conta" | "cobranca" | "reembolso" | "erro" | "denuncia" | "privacidade" | "sugestao";
export type SupportStatus = "aberto" | "respondido" | "resolvido";
export type FaqItem = { q: string; a: string; link?: { label: string; href: string } };
export type Faq = { email: string; topics: { id: SupportTopic; label: string }[]; faq: { title: string; items: FaqItem[] }[] };
export type TicketSummary = { number: number; subject: string; topic: SupportTopic; status: SupportStatus; updatedAt: number; lastFrom: "pessoa" | "suporte" };
export type Ticket = TicketSummary & { createdAt: number; messages: { author: "pessoa" | "suporte"; body: string; createdAt: number }[] };

export const STATUS_LABELS: Record<SupportStatus, string> = { aberto: "Aguardando resposta", respondido: "Respondido", resolvido: "Resolvido" };
export const ticketLabel = (n: number) => `#${String(n).padStart(4, "0")}`;

export function useFaq() {
  return useQuery({ queryKey: ["support-faq"], queryFn: () => api<Faq>("/support/faq", { auth: false }), staleTime: 60 * 60_000 });
}

export function useMyTickets(enabled: boolean) {
  return useQuery({ queryKey: ["support-tickets"], enabled, queryFn: () => api<{ tickets: TicketSummary[] }>("/support/tickets") });
}

export function useTicket(number: number) {
  return useQuery({ queryKey: ["support-ticket", number], queryFn: () => api<Ticket>(`/support/tickets/${number}`) });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { topic: SupportTopic; subject: string; body: string; email?: string; name?: string }) =>
      api<{ number: number; token: string }>("/support/tickets", { method: "POST", body: { ...v, appVersion: Constants.expoConfig?.version ?? null } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support-tickets"] }),
  });
}

export function useTicketActions(number: number) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["support-ticket", number] });
    void qc.invalidateQueries({ queryKey: ["support-tickets"] });
  };
  return {
    reply: useMutation({ mutationFn: (body: string) => api(`/support/tickets/${number}/messages`, { method: "POST", body: { body } }), onSuccess: refresh }),
    resolve: useMutation({ mutationFn: () => api(`/support/tickets/${number}/resolve`, { method: "POST" }), onSuccess: refresh }),
  };
}

export function supportError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return "Muitos pedidos seguidos. Espere um pouco e tente de novo.";
    if (err.status === 400) return "Confira os campos: resumo com pelo menos 3 letras e mensagem com pelo menos 10.";
  }
  return "Não foi possível enviar. Tente de novo.";
}
