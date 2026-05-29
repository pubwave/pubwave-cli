import React, { useMemo, useState } from "react";
import { Text, useInput } from "ink";
import type {
  CliCommandContext,
  PubwaveCliConfig,
  SavedViewContext,
  SavedViewOverrides
} from "../../../core/types.js";
import {
  detectWizardLocale,
  isWizardLocale,
  wizardMessage,
  type WizardLocale
} from "../../../shared/i18n/wizard/index.js";
import { resolveSavedViewRows, setupConfigItems } from "../presentation/config-items.js";
import { SetupWizard } from "../wizard.js";
import { SetupConfigSummary } from "./views/config-summary-view.js";

export function SavedSetupView(props: {
  context: CliCommandContext;
  initialConfig: PubwaveCliConfig;
  projectConfig: unknown;
  overrides?: SavedViewOverrides;
}): React.ReactElement {
  const detectedLocale = detectWizardLocale();
  const configLanguage = props.initialConfig.language;
  const locale: WizardLocale = configLanguage && isWizardLocale(configLanguage)
    ? configLanguage
    : detectedLocale;
  const [enterSetup, setEnterSetup] = useState(false);
  const [overrideElement, setOverrideElement] = useState<React.ReactElement | null>(null);

  const savedViewCtx = useMemo<SavedViewContext>(
    () => ({
      context: props.context,
      initialConfig: props.initialConfig,
      projectConfig: props.projectConfig as PubwaveCliConfig
    }),
    [props.context, props.initialConfig, props.projectConfig]
  );

  const additionalRows = useMemo(
    () => resolveSavedViewRows(
      props.overrides?.additionalRows ?? savedViewCtx.context.features.setup.configRows,
      savedViewCtx
    ),
    [props.overrides, savedViewCtx]
  );

  const items = useMemo(
    () => setupConfigItems(props.initialConfig, locale, Boolean(props.context.features.mobile), additionalRows),
    [additionalRows, locale, props.context.features.mobile, props.initialConfig]
  );

  useInput((_, key) => {
    if (!key.return) return;
    if (props.overrides?.onContinue) {
      const result = props.overrides.onContinue(savedViewCtx);
      Promise.resolve(result).then((element) => {
        if (element) setOverrideElement(element);
      }).catch(() => {});
      return;
    }
    setEnterSetup(true);
  });

  if (overrideElement) {
    return overrideElement;
  }

  if (enterSetup) {
    return <SetupWizard context={props.context} initialConfig={props.initialConfig} projectConfig={props.projectConfig} />;
  }

  return (
    <SetupConfigSummary
      title={wizardMessage(locale, "setupComplete")}
      hint={wizardMessage(locale, "launchReadyHint")}
      items={items}
      footer={
        <>
          <Text color="yellow">{wizardMessage(locale, "launchReadyNav")}</Text>
          <Text color="gray">{wizardMessage(locale, "launchSetupHint")}</Text>
        </>
      }
    />
  );
}
