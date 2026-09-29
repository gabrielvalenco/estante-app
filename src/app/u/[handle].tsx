import { Stack, useLocalSearchParams } from "expo-router";

import { ProfileScreen } from "@/components/profile";
import { useAuth } from "@/lib/auth";

export default function UserPage() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { account } = useAuth();
  return (
    <>
      <Stack.Screen options={{ title: `@${handle}` }} />
      <ProfileScreen handle={handle} own={account?.profile.handle === handle} />
    </>
  );
}
