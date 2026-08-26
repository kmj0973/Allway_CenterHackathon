import {
  LOCALE_STORAGE_KEY,
  TIME_ZONE_STORAGE_KEY,
} from "@/constants/storageKey";
import i18n from "@/i18n";
import { getInitialLocale, resolveSupportedLocale } from "@/i18n/language";
import type { SupportedLocale } from "@/types/preferences.type";
import {
  detectTimeZone,
  getInitialTimeZone,
  isValidTimeZone,
} from "@/utils/dateTime";
import { create } from "zustand";

type PreferencesState = {
  locale: SupportedLocale;
  timeZone: string;

  setLocale: (locale: SupportedLocale) => Promise<void>;
  setTimeZone: (timeZone: string) => void;
  resetToSystemPreferences: () => Promise<void>;
};

export const usePreferencesStore = create<PreferencesState>()((set) => ({
  locale: getInitialLocale(),
  timeZone: getInitialTimeZone(),

  setLocale: async (locale) => {
    await i18n.changeLanguage(locale);
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    set({ locale });
  },

  setTimeZone: (timeZone) => {
    if (!isValidTimeZone(timeZone)) {
      throw new Error(`Invalid time zone: ${timeZone}`);
    }

    localStorage.setItem(TIME_ZONE_STORAGE_KEY, timeZone);
    set({ timeZone });
  },

  resetToSystemPreferences: async () => {
    const locale = resolveSupportedLocale();
    const timeZone = detectTimeZone();

    await i18n.changeLanguage(locale);

    localStorage.removeItem(LOCALE_STORAGE_KEY);
    localStorage.removeItem(TIME_ZONE_STORAGE_KEY);

    set({ locale, timeZone });
  },
}));
