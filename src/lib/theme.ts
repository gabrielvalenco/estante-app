import { useColorScheme } from "react-native";

/**
 * Mesmas cores do site (app/globals.css no repositório estante): neutros da Apple
 * com as quatro cores da marca. anil = quero ler / ação, ameixa = lendo, musgo = lido, âmbar = notas.
 */
const light = {
  canvas: "#fbfbfd",
  surface: "#ffffff",
  sunken: "#f5f5f7",
  ink: "#1d1d1f",
  ink2: "#424245",
  ink3: "#6e6e73",
  ink4: "#86868b",
  line: "#e5e5ea",
  lineStrong: "#d2d2d7",
  anil: "#3a2fd6",
  anilSoft: "#eeedfc",
  ameixa: "#8e2c80",
  ameixaSoft: "#f6ebf4",
  musgo: "#2b784c",
  musgoSoft: "#e8f3ec",
  ambar: "#f5a524",
  ambarInk: "#9a5b00",
  ambarSoft: "#fef3df",
  onBrand: "#ffffff",
  danger: "#d70015",
};

const dark: typeof light = {
  canvas: "#0b0b0d",
  surface: "#18181b",
  sunken: "#232326",
  ink: "#f5f5f7",
  ink2: "#d2d2d7",
  ink3: "#9d9da4",
  ink4: "#86868d",
  line: "#2c2c30",
  lineStrong: "#3d3d42",
  anil: "#8f89ff",
  anilSoft: "#1f1d45",
  ameixa: "#e27ed4",
  ameixaSoft: "#35172f",
  musgo: "#5cc88a",
  musgoSoft: "#13301f",
  ambar: "#f5a524",
  ambarInk: "#f7b955",
  ambarSoft: "#33250b",
  onBrand: "#0b0b0d",
  danger: "#ff6961",
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}

export const STATUS_LABEL = { "quero-ler": "Quero ler", lendo: "Lendo", lido: "Lido" } as const;

/** Cor de cada estado de leitura (e do tom do avatar). */
export function statusColor(c: Colors, status: "quero-ler" | "lendo" | "lido") {
  return status === "quero-ler" ? c.anil : status === "lendo" ? c.ameixa : c.musgo;
}

export function toneColors(c: Colors, tone: string) {
  switch (tone) {
    case "ameixa":
      return { bg: c.ameixaSoft, fg: c.ameixa };
    case "musgo":
      return { bg: c.musgoSoft, fg: c.musgo };
    case "ambar":
      return { bg: c.ambarSoft, fg: c.ambarInk };
    default:
      return { bg: c.anilSoft, fg: c.anil };
  }
}

export const font = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export function coverUrl(coverId: number | null, size: "S" | "M" | "L" = "M") {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null;
}
