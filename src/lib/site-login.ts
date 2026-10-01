import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { SITE_URL } from "@/lib/api";

/** Caminho para onde o site devolve o código (estante://conectado no app instalado). */
export const CONNECT_PATH = "conectado";

/**
 * Entrar pelo site (Google, GitHub ou senha), com PKCE:
 * o app gera um segredo (verifier) que nunca sai do aparelho e manda só o hash (challenge).
 * O site devolve um código de 2 minutos que só vale junto com o verifier.
 * Devolve null se a pessoa fechou ou cancelou.
 */
export async function connectWithSite(): Promise<{ code: string; verifier: string } | null> {
  const verifier = Array.from(Crypto.getRandomBytes(32), (b) => b.toString(16).padStart(2, "0")).join("");
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 });
  const challenge = digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const redirect = Linking.createURL(CONNECT_PATH);

  const url = `${SITE_URL}/app/conectar?${new URLSearchParams({ challenge, redirect })}`;
  const result = await WebBrowser.openAuthSessionAsync(url, redirect);
  if (result.type !== "success") return null;

  const { queryParams } = Linking.parse(result.url);
  const code = queryParams?.code;
  return typeof code === "string" && code ? { code, verifier } : null;
}
