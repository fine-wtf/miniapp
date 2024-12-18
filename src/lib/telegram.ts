import { api } from "./api-client";
import type { TelegramUser } from "./validations";
import { TelegramUserSchema } from "./validations";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

declare global {
  interface Window {
    Telegram: {
      WebApp: WebApp;
    };
  }
}

// telegram user data
export function getTelegramUser(): TelegramUser {
  if (!isOnTelegram()) {
    return {
      id: 111111,
      first_name: "Test",
    };
  }

  const telegramData = window.Telegram.WebApp.initDataUnsafe.user;
  if (!telegramData) {
    throw new Error("Telegram user data not found");
  }
  const validatedTelegramData = TelegramUserSchema.parse(telegramData);
  return validatedTelegramData;
}

export function notificationOccurred(type: "error" | "success" | "warning") {
  if (isOnTelegram()) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
  }
}

export async function setupTelegramInterface(router: AppRouterInstance) {
  const startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
  if (startParam) {
    if (startParam.length !== 64) {
      router.push("/");
    } else {
      const urlId = startParam;
      const { url } = await api.url.get(urlId);
      router.push(url.path);
    }
  }
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.BackButton.show();
  window.Telegram.WebApp.SettingsButton.hide();
  window.Telegram.WebApp.BackButton.onClick(() => {
    router.back();
  });
  notificationOccurred("success");

  return null;
}

export function isOnTelegram() {
  return typeof window !== 'undefined' && window.Telegram.WebApp.initDataUnsafe.user != null;
}

// Example function to generate a Telegram Mini App link
export async function generateTelegramAppLink(botUsername: string, path: string, urlType: string): Promise<string> {
  const urlId = await api.url.create(path, urlType);
  return `https://t.me/${botUsername}?startapp=${urlId}`;
}
