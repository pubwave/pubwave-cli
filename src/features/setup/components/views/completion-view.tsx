import React from "react";
import { Text } from "ink";
import type { CliCommandContext, PubwaveCliConfig } from "../../../../core/types.js";
import type { MobileRunResult } from "../../../mobile/types.js";
import { ConfigView, KeyValueList, Panel, StatusLine } from "../../../../ui/index.js";
import { wizardMessage, type WizardLocale } from "../../../../shared/i18n/wizard/index.js";
import type { MobileRetryGuideKind } from "../../mobile/error-analysis.js";
import { setupConfigItems } from "../../presentation/config-items.js";
import { SetupMobileNoticeView } from "./mobile/notice-view.js";

export function SetupCompletionView(props: {
  context: CliCommandContext;
  config: PubwaveCliConfig;
  compactMode: boolean;
  locale: WizardLocale;
  mobileNotice: MobileRetryGuideKind | null;
  mobileResult: MobileRunResult | null;
  width: number;
  height: number;
  stepIndex: number;
  stepsLength: number;
}): React.ReactElement {
  const items = setupConfigItems(props.config, props.locale, Boolean(props.context.features.mobile));

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
    return (
      <Panel title={wizardMessage(props.locale, "setupComplete")} color={props.mobileResult.ok ? "green" : "red"}>
        <KeyValueList items={items} />
        <Text> </Text>
        {props.mobileResult.steps.map((step) => <StatusLine key={step.label} ok={step.ok} label={step.label} detail={step.detail} />)}
      </Panel>
    );
  }

  return <ConfigView title={wizardMessage(props.locale, "setupComplete")} items={items} />;
}
