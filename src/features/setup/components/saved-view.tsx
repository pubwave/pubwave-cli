import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type {
  CliCommandContext,
  PubwaveCliConfig,
  SavedViewContext,
  SavedViewOverrides
} from "../../../core/types.js";
import { KeyValueList, Panel } from "../../../ui/index.js";
import {
  detectWizardLocale,
  isWizardLocale,
  wizardMessage,
  type WizardLocale
} from "../../../shared/i18n/wizard/index.js";
import { setupConfigItems } from "../presentation/config-items.js";
import { SetupWizard } from "../wizard.js";

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

  const savedViewCtx: SavedViewContext = {
    context: props.context,
    initialConfig: props.initialConfig,
    projectConfig: props.projectConfig as PubwaveCliConfig
  };

  const additionalRows = useMemo(() => {
    const raw = props.overrides?.additionalRows;
    if (!raw) return [];
    return typeof raw === "function" ? raw(savedViewCtx) : raw;
  }, [props.overrides, props.context, props.initialConfig, props.projectConfig]);

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
    <Panel title={wizardMessage(locale, "setupComplete")} color="green">
      <Text color="yellow">{wizardMessage(locale, "launchReadyHint")}</Text>
      <Box marginTop={1} flexDirection="column">
        <KeyValueList items={items} />
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color="yellow">{wizardMessage(locale, "launchReadyNav")}</Text>
        <Text color="gray">{wizardMessage(locale, "launchSetupHint")}</Text>
      </Box>
    </Panel>
  );
}
