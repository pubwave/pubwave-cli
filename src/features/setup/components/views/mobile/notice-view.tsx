import React from "react";
import { Box, Text } from "ink";
import { KeyValueList, type KeyValueItem } from "../../../../../ui/index.js";
import { wizardMessage, type WizardLocale } from "../../../../../shared/i18n/wizard/index.js";
import { mobileRetryTextCatalog, type MobileRetryGuideKind } from "../../../../../shared/i18n/wizard/mobile-errors.js";
import { SetupStepShell } from "../../primitives/step-shell.js";

export function SetupMobileNoticeView(props: {
  appName: string;
  compactMode: boolean;
  locale: WizardLocale;
  notice: MobileRetryGuideKind;
  width: number;
  height: number;
  stepIndex: number;
  stepsLength: number;
  configItems: KeyValueItem[];
}): React.ReactElement {
  const text = mobileRetryTextCatalog(props.locale);
  const guideLines = noticeGuideLines(text.guides[props.notice] ?? []);

  return (
    <SetupStepShell
      appName={props.appName}
      compactMode={props.compactMode}
      kind="choice"
      locale={props.locale}
      title={wizardMessage(props.locale, "setupComplete")}
      hint=""
      isFirstStep={false}
      isLastStep
      stepIndex={props.stepIndex}
      stepsLength={props.stepsLength}
      width={props.width}
      height={props.height}
      showNavigation={false}
    >
      <Box flexDirection="column">
        <KeyValueList items={props.configItems} />
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow">{text.iosTrust}</Text>
          {guideLines.map((line, index) => (
            <Text key={`mobile-notice-${index}`} color="yellow">· {line}</Text>
          ))}
        </Box>
      </Box>
    </SetupStepShell>
  );
}

function noticeGuideLines(lines: string[]): string[] {
  return lines.flatMap((line) => {
    if (!line.includes("Enter")) {
      return [line];
    }

    // English-style guides put the actionable instruction before a comma and
    // the "press Enter to recheck" hint after it; on this screen Enter is not
    // an active action so we drop that tail. Locales whose translation has no
    // comma (ja/ko/es/fr/de/pt) keep the whole line rather than lose all the
    // actionable content.
    const separatorIndex = firstSeparatorIndex(line);
    if (separatorIndex < 0) {
      return [line];
    }

    const beforeRetry = line.slice(0, separatorIndex).trim();
    return beforeRetry.length > 0 ? [beforeRetry] : [line];
  });
}

function firstSeparatorIndex(line: string): number {
  return [",", "，"].reduce((first, separator) => {
    const index = line.indexOf(separator);
    if (index < 0) {
      return first;
    }
    return first < 0 ? index : Math.min(first, index);
  }, -1);
}
