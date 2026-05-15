import React from "react";
import { Box, Text } from "ink";
import type { MobileRunResult } from "../../../../mobile/types.js";
import type { WizardLocale } from "../../../../../shared/i18n/wizard/index.js";
import {
  classifyMobileRetryGuide,
  simplifyMobileFailures
} from "../../../mobile/error-analysis.js";
import { mobileRetryTextCatalog } from "../../../../../shared/i18n/wizard/mobile-errors.js";
import { SetupStepShell } from "../../primitives/step-shell.js";

export function SetupMobileRetryView(props: {
  appName: string;
  compactMode: boolean;
  locale: WizardLocale;
  mobileResult: MobileRunResult | null;
  opened: boolean;
  width: number;
  height: number;
  stepIndex: number;
  stepsLength: number;
}): React.ReactElement {
  const guide = classifyMobileRetryGuide(props.mobileResult, props.locale);
  const text = mobileRetryTextCatalog(props.locale);
  const failedDetails = simplifyMobileFailures(props.mobileResult, props.locale);
  const guideLines = guide ? text.guides[guide] : [];
  const primaryAction = guide === "ios-signing"
    ? (props.opened ? text.continueAfterXcode : text.openXcode)
    : guide === "ios-xcode-missing"
      ? (props.opened ? text.continueAfterInstall : text.openAppStore)
      : text.retry;

  return (
    <SetupStepShell
      appName={props.appName}
      compactMode={props.compactMode}
      kind="choice"
      locale={props.locale}
      title={text.title}
      hint={text.hint}
      isFirstStep={false}
      isLastStep
      stepIndex={props.stepIndex}
      stepsLength={props.stepsLength}
      width={props.width}
      height={props.height}
      showNavigation={false}
    >
      <Box flexDirection="column">
        {failedDetails.slice(0, 3).map((detail, index) => (
          <Text key={`mobile-error-${index}`} color="red">  {detail}</Text>
        ))}
        {guideLines.length > 0 ? (
          <Box flexDirection="column" marginTop={1}>
            {guideLines.map((line, index) => (
              <Text key={`mobile-guide-${index}`} color="yellow">· {line}</Text>
            ))}
          </Box>
        ) : null}
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow">· {primaryAction}</Text>
          <Text color="yellow">· {text.skip}</Text>
        </Box>
      </Box>
    </SetupStepShell>
  );
}
