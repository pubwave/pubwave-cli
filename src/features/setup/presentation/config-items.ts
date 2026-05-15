import type { PubwaveCliConfig, SavedViewRow } from "../../../core/types.js";
import type { KeyValueItem } from "../../../ui/index.js";
import { wizardMessage, type WizardLocale } from "../../../shared/i18n/wizard/index.js";

export function setupConfigItems(
  config: PubwaveCliConfig,
  locale: WizardLocale,
  includeMobile: boolean,
  additionalRows?: SavedViewRow[]
): KeyValueItem[] {
  const items: KeyValueItem[] = [
    { label: wizardMessage(locale, "defaultLanguage"), value: config.language },
    { label: wizardMessage(locale, "modelSource"), value: config.ai?.modelSource },
    { label: wizardMessage(locale, "aiProvider"), value: config.ai?.provider },
    { label: wizardMessage(locale, "aiModel"), value: config.ai?.model }
  ];

  if (includeMobile) {
    items.push({
      label: wizardMessage(locale, "mobileInstallStatus"),
      value: config.mobile?.enabled
        ? wizardMessage(locale, "mobileInstallEnabledStatus")
        : wizardMessage(locale, "mobileInstallSkippedStatus")
    });
  }

  if (additionalRows) {
    for (const row of additionalRows) {
      items.push({ label: row.label, value: row.value });
    }
  }

  return items;
}
