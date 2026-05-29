import { describe, expect, it } from "vitest";
import {
  defaultWizardLanguage,
  detectWizardLocale,
  isWizardLocale,
  localizedLanguageChoices,
  localizedModelSourceChoices,
  wizardMessage
} from "../../src/shared/i18n/wizard/index.js";
import { defaultLanguages } from "../../src/features/models/defaults/index.js";

const ALL_LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko", "es", "fr", "de", "pt"] as const;

describe("isWizardLocale", () => {
  it("accepts every supported locale", () => {
    for (const locale of ALL_LOCALES) {
      expect(isWizardLocale(locale)).toBe(true);
    }
  });

  it("is case-sensitive and rejects unknown values", () => {
    expect(isWizardLocale("EN")).toBe(false);
    expect(isWizardLocale("zh-cn")).toBe(false);
    expect(isWizardLocale("xx")).toBe(false);
  });
});

describe("wizardMessage", () => {
  it("returns a non-empty string for a known key", () => {
    expect(wizardMessage("en", "setupComplete")).toBeTruthy();
  });

  it("falls back to English for an unknown locale", () => {
    expect(wizardMessage("xx" as never, "setupComplete")).toBe(wizardMessage("en", "setupComplete"));
  });

  it("provides every locale a value for the same key", () => {
    for (const locale of ALL_LOCALES) {
      expect(typeof wizardMessage(locale, "setupComplete")).toBe("string");
    }
  });
});

describe("defaultWizardLanguage / detectWizardLocale", () => {
  it("maps en to itself", () => {
    expect(defaultWizardLanguage("en")).toBe("en");
  });

  it("returns a configured language value or falls back to en", () => {
    const known = new Set(defaultLanguages.map((l) => l.value));
    for (const locale of ALL_LOCALES) {
      const result = defaultWizardLanguage(locale);
      expect(known.has(result) || result === "en").toBe(true);
    }
  });

  it("detects a valid wizard locale from the environment", () => {
    expect(isWizardLocale(detectWizardLocale())).toBe(true);
  });
});

describe("localized choice builders", () => {
  it("builds cloud/local model-source choices", () => {
    const choices = localizedModelSourceChoices("en");
    expect(choices.map((c) => c.value)).toEqual(["cloud", "local"]);
    expect(choices.every((c) => typeof c.label === "string" && c.label.length > 0)).toBe(true);
  });

  it("maps every default language to a choice", () => {
    expect(localizedLanguageChoices("en")).toHaveLength(defaultLanguages.length);
  });
});
