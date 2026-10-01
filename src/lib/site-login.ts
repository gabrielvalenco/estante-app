import * as Linking from "expo-linking";

import { ApiError, SITE_URL } from "@/lib/api";

/** Caminho para onde o site devolve o código (estante://conectado no app instalado). */
export const CONNECT_PATH = "conectado";

/**
 * Entrar pelo site (Google, GitHub ou senha), com PKCE:
 * o app gera um segredo (verifier) que nunca sai do aparelho e manda só o hash (challenge).
 * O site devolve um código de 2 minutos que só vale junto com o verifier.
 * Devolve null se a pessoa fechou ou cancelou.
 *
 * Os módulos nativos (navegador seguro e criptografia) são carregados só aqui: APKs anteriores a eles
 * recebem as atualizações OTA do mesmo canal e não podem quebrar ao abrir; neles, o botão avisa
 * para atualizar o app.
 */
export async function connectWithSite(): Promise<{ code: string; verifier: string } | null> {
  let Crypto: typeof import("expo-crypto");
  let WebBrowser: typeof import("expo-web-browser");
  try {
    [Crypto, WebBrowser] = await Promise.all([import("expo-crypto"), import("expo-web-browser")]);
  } catch {
    throw new ApiError("outdated_app", 0);
  }
  const verifier = Array.from(Crypto.getRandomBytes(32), (b) => b.toString(16).padStart(2, "0")).join("");
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 });
  const challenge = digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const redirect = Linking.createURL(CONNECT_PATH);

  const url = `${SITE_URL}/app/conectar?${new URLSearchParams({ challenge, redirect })}`;
  // No Android, abre a aba do navegador na mesma tarefa do app (sem a atividade intermediária, que em
  // vários aparelhos tirava o app da frente). Na volta pelo estante://, o app vem para a frente e a aba fecha.
  const result = await WebBrowser.openAuthSessionAsync(url, redirect, { createTask: false, showInRecents: false });
  if (result.type !== "success") return null;

  const { queryParams } = Linking.parse(result.url);
  const code = queryParams?.code;
  return typeof code === "string" && code ? { code, verifier } : null;
}
