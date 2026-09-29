import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileScreen } from "@/components/profile";
import { Button, Empty } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useColors } from "@/lib/theme";

/** Aba Perfil: o próprio perfil (com atalho para Configurações) ou o convite para entrar. */
export default function MyProfile() {
  const c = useColors();
  const { status, account } = useAuth();

  if (status !== "user" || !account) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.canvas }}>
        <Empty title="Seu perfil de leitor" action={<Button onPress={() => router.push("/entrar")}>Entrar ou criar conta</Button>}>
          Notas, reviews, favoritos e quem você segue, num lugar só.
        </Empty>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.canvas }}>
      <ProfileScreen handle={account.profile.handle} own />
    </SafeAreaView>
  );
}
