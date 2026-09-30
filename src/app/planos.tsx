import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Check, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Text } from "@/components/ui";
import { SITE_URL, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useColors } from "@/lib/theme";

const PRICE = { month: { value: "R$ 6,90", per: "/mês" }, year: { value: "R$ 59", per: "/ano" } };

const BROCHURA = [
  "Reviews, notas e estante sem limite",
  "Seguir leitores, feed e notificações",
  "Marcador de página em todos os livros",
  "20 citações e 3 notas por livro",
  "3 discussões novas por mês (responder é livre)",
  "Importar a estante do Goodreads",
];
const CAPA_DURA = ["Tudo do Brochura", "Citações ilimitadas", "Notas ilimitadas em cada livro", "Discussões novas sem limite", "Importar destaques do Kindle", "Exportar citações e notas (Markdown)"];
const CAPA_DURA_SOON = ["Retrospectiva do ano"];
const EX_LIBRIS = ["Tudo do Capa Dura", "Clubes de leitura privados", "Citação por foto da página, sem limite", "Temas e selo Ex Libris"];

/**
 * Planos no app. A assinatura em si acontece no site (checkout do Stripe no navegador):
 * o APK é distribuído fora da Play Store, então não precisa do sistema de cobrança do Google.
 */
export default function Plans() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { status, account } = useAuth();
  const [period, setPeriod] = useState<"month" | "year">("year");
  const info = useQuery({ queryKey: ["plans"], queryFn: () => api<{ enabled: boolean }>("/plans", { auth: false }) });
  const plan = account?.plan;
  const paid = Boolean(plan && plan.plan !== "brochura");
  const end = plan?.periodEnd ? new Date(plan.periodEnd).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : null;
  const openSite = () => void Linking.openURL(`${SITE_URL}/planos`);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}>
      <View style={{ gap: 6 }}>
        <Text variant="hero">Leia mais, guarde tudo.</Text>
        <Text tone="ink2">A Estante é grátis para registrar, avaliar e seguir leitores. O Capa Dura tira os limites das suas anotações e discussões.</Text>
      </View>

      {paid && plan ? (
        <View style={{ backgroundColor: c.musgoSoft, borderRadius: 16, padding: 16, gap: 4 }}>
          <Text weight="semibold" style={{ color: c.musgo }}>
            Você assina o Capa Dura {plan.interval === "year" ? "anual" : "mensal"}
          </Text>
          <Text variant="small" tone="ink2">
            {plan.canceling ? `Cancelado: vale até ${end} e não renova.` : plan.status === "past_due" ? "A última cobrança falhou. Atualize o cartão no site." : end ? `Renova em ${end}.` : "Assinatura ativa."}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", alignSelf: "flex-start", backgroundColor: c.sunken, borderRadius: 999, padding: 4 }}>
        {(["month", "year"] as const).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            accessibilityRole="tab"
            accessibilityState={{ selected: period === p }}
            style={{ height: 36, paddingHorizontal: 18, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: period === p ? c.surface : "transparent" }}
          >
            <Text variant="small" weight="medium" tone={period === p ? "ink" : "ink3"}>
              {p === "month" ? "Mensal" : "Anual"}
            </Text>
            {p === "year" ? (
              <Text variant="caption" style={{ color: c.musgo }}>
                -28%
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>

      {/* Capa Dura primeiro no celular: é a escolha que a tela quer mostrar */}
      <View style={{ backgroundColor: c.surface, borderRadius: 24, borderWidth: 2, borderColor: c.anil, padding: 20, gap: 4 }}>
        <View style={{ position: "absolute", top: -12, left: 20, backgroundColor: c.anil, borderRadius: 999, paddingHorizontal: 10, height: 24, justifyContent: "center" }}>
          <Text variant="caption" weight="semibold" style={{ color: c.onBrand }}>
            Recomendado
          </Text>
        </View>
        <Text variant="section">Capa Dura</Text>
        <Text variant="small" tone="ink3">
          Para quem anota tudo e puxa conversa.
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 12 }}>
          <Text variant="hero">{PRICE[period].value}</Text>
          <Text tone="ink3">{PRICE[period].per}</Text>
        </View>
        <Text variant="caption" tone="ink4">
          {period === "year" ? "Equivale a R$ 4,92 por mês." : "Ou R$ 59 no plano anual."}
        </Text>
        <Features items={CAPA_DURA} />
        <Text variant="caption" tone="ink4" style={{ marginTop: 12 }}>
          EM BREVE NO CAPA DURA
        </Text>
        <Features items={CAPA_DURA_SOON} soft />
        <View style={{ marginTop: 16 }}>
          {paid ? (
            <Button onPress={openSite}>Gerenciar no site</Button>
          ) : status !== "user" ? (
            <Button onPress={() => router.push("/entrar")}>Entrar para assinar</Button>
          ) : info.data?.enabled ? (
            <Button onPress={openSite}>{`Assinar por ${PRICE[period].value}${PRICE[period].per}`}</Button>
          ) : (
            <Button disabled>Em breve</Button>
          )}
          {!paid && status === "user" && info.data?.enabled ? (
            <Text variant="caption" tone="ink4" style={{ textAlign: "center", marginTop: 8 }}>
              O pagamento abre no navegador, pelo Stripe.
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ backgroundColor: c.surface, borderRadius: 24, borderWidth: 1, borderColor: c.line, padding: 20, gap: 4 }}>
        <Text variant="section">Brochura</Text>
        <Text variant="small" tone="ink3">
          Para todo leitor, para sempre.
        </Text>
        <Text variant="hero" style={{ marginTop: 12 }}>
          Grátis
        </Text>
        <Features items={BROCHURA} />
        {status === "user" ? (
          <Text variant="small" tone="ink3" style={{ marginTop: 12 }}>
            {paid ? "Incluído no seu plano." : "Seu plano atual."}
          </Text>
        ) : null}
      </View>

      <View style={{ borderRadius: 24, borderWidth: 1, borderStyle: "dashed", borderColor: c.lineStrong, padding: 20, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text variant="section">Ex Libris</Text>
          <Sparkles size={16} color={c.ambar} />
        </View>
        <Text variant="small" tone="ink3">
          Para clubes e leitores de carteirinha.
        </Text>
        <Text variant="hero" tone="ink3" style={{ marginTop: 12 }}>
          Em breve
        </Text>
        <Features items={EX_LIBRIS} soft />
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="small" tone="ink3">
          A assinatura renova sozinha no fim de cada período. Você cancela quando quiser, e o plano continua valendo até o fim do período já pago.
        </Text>
        <Text variant="small" tone="ink3">
          Mudou de ideia? Em até 7 dias da contratação você pode desistir e recebe o valor de volta (Código de Defesa do Consumidor, art. 49).{" "}
          <Text variant="small" tone="anil" onPress={() => void Linking.openURL(`${SITE_URL}/termos`)}>
            Termos de uso
          </Text>
        </Text>
        <Text variant="small" tone="ink3">
          O pagamento é processado pelo Stripe. A Estante não vê nem guarda os dados do seu cartão.
        </Text>
      </View>
    </ScrollView>
  );
}

function Features({ items, soft = false }: { items: string[]; soft?: boolean }) {
  const c = useColors();
  return (
    <View style={{ gap: 8, marginTop: 12 }}>
      {items.map((f) => (
        <View key={f} style={{ flexDirection: "row", gap: 8 }}>
          <Check size={16} color={soft ? c.ink4 : c.musgo} style={{ marginTop: 2 }} />
          <Text variant="small" tone={soft ? "ink3" : "ink2"} style={{ flex: 1 }}>
            {f}
          </Text>
        </View>
      ))}
    </View>
  );
}
