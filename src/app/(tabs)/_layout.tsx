import { Tabs } from "expo-router/js-tabs";
import { House, Library, Search, UserRound } from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import { font, useColors } from "@/lib/theme";

/** Abas do app: as mesmas da barra do site no celular. */
export default function TabLayout() {
  const c = useColors();
  const { account } = useAuth();
  const count = account?.shelf.filter((e) => e.status).length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.anil,
        tabBarInactiveTintColor: c.ink3,
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: c.canvas, borderTopColor: c.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início", tabBarIcon: ({ color }) => <House size={22} color={color} /> }} />
      <Tabs.Screen name="buscar" options={{ title: "Buscar", tabBarIcon: ({ color }) => <Search size={22} color={color} /> }} />
      <Tabs.Screen
        name="estante"
        options={{
          title: "Estante",
          tabBarIcon: ({ color }) => <Library size={22} color={color} />,
          tabBarBadge: count ? (count > 99 ? "99+" : count) : undefined,
          tabBarBadgeStyle: { backgroundColor: c.anil, color: c.onBrand, fontFamily: font.semibold, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: ({ color }) => <UserRound size={22} color={color} /> }} />
    </Tabs>
  );
}
