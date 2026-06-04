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

// Mask an API key for display: only the last 3 characters are shown, e.g.
// "******sdf". Never print the full secret in a summary/config view.
export function maskApiKey(key: string): string {
  const tail = key.slice(-3);
  return `${"*".repeat(6)}${tail}`;
}

export function setupConfigItems(
  config: PubwaveCliConfig,
  locale: WizardLocale,
  includeMobile: boolean,
  additionalRows?: SavedViewRow[]
): KeyValueItem[] {
  // AI is "configured" only once a provider and model are chosen. When it is not
  // (e.g. an English reader that needs no translation), keep the rows for a
  // consistent layout but show them as "not configured" instead of a stale
  // default or a blank value.
  const aiConfigured = Boolean(config.ai?.provider && config.ai?.model);
  const notConfigured = wizardMessage(locale, "notConfigured");
  const apiKey = config.ai?.apiKey;
  const items: KeyValueItem[] = [
    { label: wizardMessage(locale, "defaultLanguage"), value: config.language },
    { label: wizardMessage(locale, "modelSource"), value: aiConfigured ? config.ai?.modelSource : notConfigured },
    { label: wizardMessage(locale, "aiProvider"), value: aiConfigured ? config.ai?.provider : notConfigured },
    { label: wizardMessage(locale, "aiModel"), value: aiConfigured ? config.ai?.model : notConfigured },
    { label: wizardMessage(locale, "aiApiKey"), value: aiConfigured && apiKey ? maskApiKey(apiKey) : notConfigured }
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
