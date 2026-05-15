import React from "react";
import { Box, Text } from "ink";
import { Section } from "../../../../ui/index.js";
import { wizardMessage, type WizardLocale } from "../../../../shared/i18n/wizard/index.js";

interface SetupStepShellProps {
  appName: string;
  compactMode: boolean;
  locale: WizardLocale;
  kind?: "choice" | "input";
  title: string;
  hint?: string;
  isFirstStep: boolean;
  isLastStep: boolean;
  stepIndex: number;
  stepsLength: number;
  width: number;
  height: number;
  children: React.ReactNode;
  description?: string;
  descriptionNode?: React.ReactNode;
  showNavigation?: boolean;
  navigationText?: string;
}

export function SetupStepShell(input: SetupStepShellProps): React.ReactElement {
  const {
    appName,
    compactMode,
    locale,
    kind = "choice",
    title,
    hint,
    isFirstStep,
    stepIndex,
    stepsLength,
    width,
    height,
    children,
    description,
    descriptionNode,
    showNavigation = true,
    navigationText: customNavigationText
  } = input;
  const contentSpacing = compactMode ? 0 : 1;
  const navigationText = customNavigationText ?? [
    wizardMessage(locale, kind === "input" ? "inputNav" : "chooseNav"),
    wizardMessage(locale, kind === "input" ? "inputContinueNav" : "continueNav"),
    ...(isFirstStep ? [] : [wizardMessage(locale, kind === "input" ? "inputBackNav" : "backNav")])
  ].join(", ");

  return (
    <Section title={wizardMessage(locale, "firstRunTitle")} bannerTitle={appName} width={width} height={height} bordered={false} showTitle={false}>
      <Box flexShrink={0}>
        <Text color="cyanBright">{wizardMessage(locale, "stepLabel")} {stepIndex + 1} / {stepsLength}</Text>
      </Box>
      <Box marginTop={contentSpacing} flexDirection="column" flexShrink={0}>
        <Text>{title}</Text>
        {hint ? <Text color="gray">{hint}</Text> : null}
      </Box>
      <Box marginTop={contentSpacing} flexDirection="column" flexGrow={1} flexShrink={1}>
        {children}
      </Box>
      {description || descriptionNode
        ? (
            <Box marginTop={contentSpacing} flexDirection="column" flexShrink={0}>
              {descriptionNode ?? <Text color="gray">{description}</Text>}
            </Box>
          )
        : null}
      {showNavigation ? (
        <Box marginTop={contentSpacing} flexDirection="column" flexShrink={0}>
          <Text color="yellow">{navigationText}.</Text>
        </Box>
      ) : null}
    </Section>
  );
}
