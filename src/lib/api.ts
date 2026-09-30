/**
 * Cliente da API do site. Em desenvolvimento dá para apontar para o Next local com
 * EXPO_PUBLIC_API_URL=http://<ip-do-computador>:3100 (o celular não enxerga "localhost").
 */
export const SITE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "https://estante-pink.vercel.app").replace(/\/$/, "");
const BASE = `${SITE_URL}/api/v1`;

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Chamado pelo AuthProvider: token atual e o que fazer quando ele deixa de valer. */
export function configureApi(next: { token: string | null; onUnauthorized: () => void }) {
  token = next.token;
  onUnauthorized = next.onUnauthorized;
}

type Options = { method?: string; body?: unknown; form?: FormData; auth?: boolean };

export async function api<T>(path: string, { method = "GET", body, form, auth = true }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(BASE + path, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError("offline", 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const code = (data as { error?: string } | null)?.error ?? "unavailable";
    // Token expirado ou conta apagada: volta para o modo visitante.
    if (res.status === 401 && auth && token && path !== "/auth/login") onUnauthorized?.();
    throw new ApiError(code, res.status);
  }
  return data as T;
}

/** Mensagem em português para cada código de erro da API. */
export function errorMessage(err: unknown): string {
  const code = err instanceof ApiError ? err.code : "unavailable";
  const messages: Record<string, string> = {
    offline: "Sem conexão. Confira a internet e tente de novo.",
    invalid_credentials: "E-mail ou senha incorretos.",
    invalid_input: "Confira os campos: a senha precisa de pelo menos 8 caracteres.",
    email_taken: "Já existe uma conta com esse e-mail.",
    locked: "Muitas tentativas. Espere 15 minutos e tente de novo.",
    handle_taken: "Esse @ já é de outra pessoa.",
    handle_unavailable: "Esse @ não está disponível. Use de 3 a 20 letras, números ou _.",
    name_taken: "Já existe alguém com esse nome. Que tal um sobrenome ou apelido?",
    too_big: "Imagem grande demais.",
    blocked: "Não é possível interagir com esse perfil.",
    unauthenticated: "Entre na sua conta para continuar.",
  };
  return messages[code] ?? "Algo deu errado. Tente de novo em instantes.";
}

/** Texto puro de uma rota do site (fora de /api/v1), com o token. Usado pela exportação em Markdown. */
export async function siteText(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(SITE_URL + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new ApiError("offline", 0);
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(data?.error ?? "unavailable", res.status);
  }
  return res.text();
}
