import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import { AuthProvider, useAuth } from "@/lib/auth";
import { font, useColors } from "@/lib/theme";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  );
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navigation ready={fontsLoaded} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Navigation({ ready }: { ready: boolean }) {
  const c = useColors();
  const scheme = useColorScheme();
  const auth = useAuth();
  const loaded = ready && auth.status !== "loading";

  // Splash até as fontes e a sessão estarem prontas: nada de piscar "Entrar" para quem já tem conta.
  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);
  if (!loaded) return null;

  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, primary: c.anil, background: c.canvas, card: c.canvas, text: c.ink, border: c.line },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: font.semibold, fontSize: 17 },
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: c.anil,
          contentStyle: { backgroundColor: c.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="livro/[id]" options={{ title: "", headerTransparent: true }} />
        <Stack.Screen name="u/[handle]" options={{ title: "" }} />
        <Stack.Screen name="entrar" options={{ presentation: "modal", title: "Entrar" }} />
        <Stack.Screen name="conta" options={{ title: "Configurações" }} />
        <Stack.Screen name="notificacoes" options={{ title: "Notificações" }} />
        <Stack.Screen name="anotacoes" options={{ title: "Anotações" }} />
        <Stack.Screen name="discussao/[id]" options={{ title: "Discussão" }} />
      </Stack>
    </ThemeProvider>
  );
}
