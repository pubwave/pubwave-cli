import { defaultLanguages } from "../../../features/models/defaults/index.js";
import type { CloudModelProvider, ModelChoice } from "../../../features/models/types.js";
import { WIZARD_LOCALE_CATALOGS } from "./locales/index.js";
import type { MessageKey, WizardLocale } from "./types.js";

const TIME_ZONE_TO_LOCALE: Array<[prefixes: string[], locale: WizardLocale]> = [
  [["Asia/Tokyo"], "ja"],
  [["Asia/Seoul"], "ko"],
  [["Asia/Shanghai", "Asia/Chongqing", "Asia/Urumqi"], "zh-CN"],
  [["Asia/Taipei", "Asia/Hong_Kong", "Asia/Macau"], "zh-TW"],
  [["Europe/Paris"], "fr"],
  [["Europe/Berlin", "Europe/Vienna", "Europe/Zurich"], "de"],
  [["Europe/Lisbon", "Atlantic/Madeira", "Atlantic/Azores", "America/Sao_Paulo"], "pt"],
  [["Europe/Madrid", "Atlantic/Canary", "America/Mexico_City", "America/Bogota", "America/Lima", "America/Santiago", "America/Argentina"], "es"]
];

export type { WizardLocale };

export function detectWizardLocale(): WizardLocale {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  for (const [prefixes, locale] of TIME_ZONE_TO_LOCALE) {
    if (prefixes.some((prefix) => timeZone.startsWith(prefix))) {
      return locale;
    }
  }

  return "en";
}

export function isWizardLocale(value: string): value is WizardLocale {
  return ["en", "zh-CN", "zh-TW", "ja", "ko", "es", "fr", "de", "pt"].includes(value);
}

export function defaultWizardLanguage(locale: WizardLocale): string {
  return defaultLanguages.some((language) => language.value === locale) ? locale : "en";
}

export function wizardMessage(locale: WizardLocale, key: MessageKey): string {
  return WIZARD_LOCALE_CATALOGS[locale]?.messages[key] ?? WIZARD_LOCALE_CATALOGS.en.messages[key];
}

export function wizardProgressText(locale: string | undefined) {
  return WIZARD_LOCALE_CATALOGS[locale as WizardLocale]?.progress ?? WIZARD_LOCALE_CATALOGS.en.progress;
}

export function wizardDescription(locale: WizardLocale, key: string): string {
  return WIZARD_LOCALE_CATALOGS[locale]?.descriptions[key] ?? WIZARD_LOCALE_CATALOGS.en.descriptions[key] ?? "";
}

export function localizedLanguageChoices(locale: WizardLocale, languages: ModelChoice[] = defaultLanguages): ModelChoice[] {
  return languages.map((language) => ({
    ...language,
    description: wizardDescription(locale, language.value) || language.description
  }));
}

export function localizedModelSourceChoices(locale: WizardLocale): ModelChoice[] {
  const labels = WIZARD_LOCALE_CATALOGS[locale].labels.modelSource;
  return [
    { label: labels.cloud, value: "cloud", description: wizardDescription(locale, "cloud") },
    { label: labels.local, value: "local", description: wizardDescription(locale, "local") }
  ];
}

export function localizedMobileInstallChoices(locale: WizardLocale): ModelChoice[] {
  return [
    { label: wizardMessage(locale, "mobileInstallSkip"), value: "skip", description: wizardDescription(locale, "skip") },
    { label: wizardMessage(locale, "mobileInstallNow"), value: "install", description: wizardDescription(locale, "install") }
  ];
}

export function localizedMobilePlatformChoices(locale: WizardLocale): ModelChoice[] {
  return [
    { label: wizardMessage(locale, "mobilePlatformAndroid"), value: "android", description: wizardDescription(locale, "android") },
    { label: wizardMessage(locale, "mobilePlatformIos"), value: "ios", description: wizardDescription(locale, "ios") }
  ];
}

export function localizedCloudProviderChoices(locale: WizardLocale, providers: CloudModelProvider[]): ModelChoice[] {
  return providers.map(({ models: _models, ...provider }) => ({
    ...provider,
    description: wizardDescription(locale, provider.value) || provider.description
  }));
}

export function localizedCloudModelChoices(locale: WizardLocale, providers: CloudModelProvider[], provider: string): ModelChoice[] {
  return (providers.find((entry) => entry.value === provider)?.models ?? providers[0]?.models ?? []).map((choice) => ({
    ...choice,
    description: wizardDescription(locale, choice.value) || choice.description
  }));
}

export function localizedLocalModelChoices(locale: WizardLocale, choices: ModelChoice[]): ModelChoice[] {
  return choices.map((choice) => ({
    ...choice,
    description: choice.group === "installed"
      ? wizardDescription(locale, "installed-local-model") || choice.description
      : wizardDescription(locale, choice.value) || choice.description
  }));
}
