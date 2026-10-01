import { router } from "expo-router";

import { Button, Empty } from "@/components/ui";

/**
 * Destino da volta do site. Normalmente nem aparece: na web, a janela do login fecha sozinha;
 * no celular, quem abriu o navegador recebe o código. Só sobra se o app foi fechado no meio.
 */
export default function Connected() {
  return (
    <Empty title="Quase lá" action={<Button onPress={() => router.replace("/entrar")}>Entrar de novo</Button>}>
      O app foi fechado enquanto você entrava pelo site. Toque abaixo para tentar outra vez.
    </Empty>
  );
}
