import { WIZARD_LOCALE_CATALOGS } from "./locales/index.js";
import type { MobileErrorText, MobileRetryText, WizardLocale } from "./types.js";

export type { MobileRetryGuideKind } from "./types.js";

export function errorTextCatalog(locale: WizardLocale): MobileErrorText {
  return WIZARD_LOCALE_CATALOGS[locale]?.mobileErrors ?? WIZARD_LOCALE_CATALOGS.en.mobileErrors;
}

export function mobileRetryTextCatalog(locale: WizardLocale): MobileRetryText {
  return WIZARD_LOCALE_CATALOGS[locale]?.mobileErrors ?? WIZARD_LOCALE_CATALOGS.en.mobileErrors;
}
