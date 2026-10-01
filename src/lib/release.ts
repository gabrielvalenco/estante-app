import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";

/**
 * Versão do app e download do APK. O APK de produção fica nos Releases do GitHub; este endereço
 * sempre aponta para o mais novo, então serve no site, no README e aqui.
 */
export const DOWNLOAD_URL = "https://github.com/gabrielvalenco/estante-app/releases/latest/download/estante.apk";
const LATEST_API = "https://api.github.com/repos/gabrielvalenco/estante-app/releases/latest";

export const appVersion = Constants.expoConfig?.version ?? "0.0.0";

/** 1 se a for mais novo que b, -1 se mais velho, 0 se igual ("1.10.0" > "1.9.2"). */
export function compareVersions(a: string, b: string) {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

/** Versão mais nova publicada (consulta leve, guardada por algumas horas). Null se não der para saber. */
export function useLatestRelease() {
  return useQuery({
    queryKey: ["latest-release"],
    staleTime: 6 * 60 * 60_000,
    retry: false,
    queryFn: async () => {
      const r = await fetch(LATEST_API, { headers: { Accept: "application/vnd.github+json" } });
      if (!r.ok) return null;
      const data = (await r.json()) as { tag_name?: string };
      return data.tag_name ? data.tag_name.replace(/^v/, "") : null;
    },
  });
}
