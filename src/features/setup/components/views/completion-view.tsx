import React from "react";
import { Text } from "ink";
import type { CliCommandContext, PubwaveCliConfig, SavedViewContext } from "../../../../core/types.js";
import type { MobileRunResult } from "../../../mobile/types.js";
import { StatusLine } from "../../../../ui/index.js";
import { wizardMessage, type WizardLocale } from "../../../../shared/i18n/wizard/index.js";
import { simplifyMobileFailures, type MobileRetryGuideKind } from "../../mobile/error-analysis.js";
import { resolveSavedViewRows, setupConfigItems } from "../../presentation/config-items.js";
import { SetupConfigSummary } from "./config-summary-view.js";
import { SetupMobileNoticeView } from "./mobile/notice-view.js";

export function SetupCompletionView(props: {
  context: CliCommandContext;
  config: PubwaveCliConfig;
  initialConfig: PubwaveCliConfig;
  projectConfig: unknown;
  compactMode: boolean;
  locale: WizardLocale;
  mobileNotice: MobileRetryGuideKind | null;
  mobileResult: MobileRunResult | null;
  width: number;
  height: number;
  stepIndex: number;
  stepsLength: number;
}): React.ReactElement {
  // Resolve the same host-provided config rows the saved view uses, so the
  // completion screen shows the app's full config instead of only the generic
  // language/model rows.
  const savedViewCtx: SavedViewContext = {
    context: props.context,
    initialConfig: props.initialConfig,
    projectConfig: props.projectConfig as PubwaveCliConfig
  };
  const items = setupConfigItems(
    props.config,
    props.locale,
    Boolean(props.context.features.mobile),
    resolveSavedViewRows(props.context.features.setup.configRows, savedViewCtx)
  );

  if (props.mobileNotice) {
    return (
      <SetupMobileNoticeView
        appName={props.context.app.name}
        compactMode={props.compactMode}
        locale={props.locale}
        notice={props.mobileNotice}
        width={props.width}
        height={props.height}
        stepIndex={props.stepIndex}
        stepsLength={props.stepsLength}
        configItems={items}
      />
    );
  }

  if (props.mobileResult) {
    const failedDetails = simplifyMobileFailures(props.mobileResult, props.locale);

    return (
      <SetupConfigSummary
        title={wizardMessage(props.locale, "setupComplete")}
        color={props.mobileResult.ok ? "green" : "red"}
        items={items}
        footer={<Text color="yellow">{wizardMessage(props.locale, "completionExitHint")}</Text>}
      >
        {props.mobileResult.ok
          ? props.mobileResult.steps.map((step) => <StatusLine key={step.label} ok={step.ok} label={step.label} detail={step.detail} />)
          : failedDetails.map((detail, index) => (
              <StatusLine key={`mobile-failure-${index}`} ok={false} label={wizardMessage(props.locale, "mobileInstallStatus")} detail={detail} />
            ))}
      </SetupConfigSummary>
    );
  }

  return (
    <SetupConfigSummary
      title={wizardMessage(props.locale, "setupComplete")}
      items={items}
      footer={<Text color="yellow">{wizardMessage(props.locale, "completionExitHint")}</Text>}
    />
  );
}
