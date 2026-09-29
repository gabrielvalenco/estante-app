import { Alert, Platform } from "react-native";

/**
 * Confirmação com um botão destrutivo. No celular é o Alert nativo; na versão web
 * (desenvolvimento), o react-native-web não implementa Alert com botões, então usa o confirm do navegador.
 */
export function confirmAction(title: string, action: string, onConfirm: () => void, message?: string) {
  if (Platform.OS === "web") {
    if (globalThis.confirm?.(message ? `${title}\n\n${message}` : title)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancelar", style: "cancel" },
    { text: action, style: "destructive", onPress: onConfirm },
  ]);
}
