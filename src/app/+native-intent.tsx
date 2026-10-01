import { CONNECT_PATH } from "@/lib/site-login";

/**
 * Links que chegam ao app. A volta do "entrar pelo site" (estante://conectado?code=...) é tratada
 * por quem abriu o navegador (connectWithSite): com o app aberto, a navegação fica onde está,
 * em vez de empilhar outra tela.
 */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    if (path.includes(CONNECT_PATH) && !initial) return null;
    return path;
  } catch {
    return "/";
  }
}
