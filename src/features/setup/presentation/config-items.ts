import type { PubwaveCliConfig, SavedViewContext, SavedViewRow } from "../../../core/types.js";
import type { KeyValueItem } from "../../../ui/index.js";
import { wizardMessage, type WizardLocale } from "../../../shared/i18n/wizard/index.js";

/**
 * Resolve a `SavedViewRow[]` source (array or builder fn) against a context.
 * Shared by the saved view and the completion screen so both render the same
 * host-provided config rows.
 */
export function resolveSavedViewRows<TProjectConfig>(
  rows: SavedViewRow[] | ((ctx: SavedViewContext<TProjectConfig>) => SavedViewRow[]) | undefined,
  ctx: SavedViewContext<TProjectConfig>
): SavedViewRow[] {
  if (!rows) {
    return [];
  }
  return typeof rows === "function" ? rows(ctx) : rows;
}

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
