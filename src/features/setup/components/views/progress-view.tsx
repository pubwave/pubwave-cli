import React from "react";
import { Box, Text } from "ink";
import type { WizardLocale } from "../../../../shared/i18n/wizard/index.js";
import type { StatusCard } from "../../progress-types.js";
import type { DeviceInstallState, ProgressLine } from "../../types.js";
import { setupOutputProgressKey, stripTrailingDots, withAnimatedDots } from "../../progress/output.js";
import { SetupStepShell } from "../primitives/step-shell.js";

export function SetupProgressView(props: {
  appName: string;
  compactMode: boolean;
  locale: WizardLocale;
  title: string;
  status: string;
  statusColor: ProgressLine["color"];
  savingDots: string;
  progressLines: ProgressLine[];
  outputLines: ProgressLine[];
  deviceInstallStates: DeviceInstallState[];
  installMessage: string | null;
  statusCards?: StatusCard[];
  width: number;
  height: number;
  stepIndex: number;
  stepsLength: number;
}): React.ReactElement {
  const visibleProgressLines = props.progressLines.slice(-6);
  const isError = props.statusColor === "red";
  const hasLocalModelPullProgress = props.outputLines.some((line) => setupOutputProgressKey(line.text)?.startsWith("pulling:"));
  const outputLineLimit = hasLocalModelPullProgress ? 8 : 3;
  const visibleOutputLines = isError ? [] : props.outputLines.slice(-outputLineLimit);
  const visibleDeviceStates = isError ? [] : props.deviceInstallStates.slice(-2);

  const blocks: React.ReactNode[] = [];

  if (visibleProgressLines.length > 0) {
    blocks.push(
      <Box key="progress" flexDirection="column">
        {visibleProgressLines.map((line, index) => (
          <Text key={`${line.text}-${index}`} color={index === visibleProgressLines.length - 1 ? line.color ?? "cyan" : "green"}>
            {index === visibleProgressLines.length - 1 ? "› " : "· "}
            {index === visibleProgressLines.length - 1 ? withAnimatedDots(line.text, props.savingDots) : `${stripTrailingDots(line.completedText ?? line.text)} ✅`}
          </Text>
        ))}
      </Box>
    );
  }

  if (visibleOutputLines.length > 0) {
    blocks.push(
      <Box key="output" flexDirection="column">
        {visibleOutputLines.map((line, index) => (
          <Text key={`output-${index}`} color={line.color ?? "cyan"}>│ {line.text}</Text>
        ))}
      </Box>
    );
  }

  for (const state of visibleDeviceStates) {
    blocks.push(
      <Box key={`device-${state.deviceId}`} flexDirection="column">
        <Text color={state.status === "failed" ? "red" : state.status === "completed" ? "green" : "yellow"}>
          {state.status === "failed" ? "! " : state.status === "completed" ? "· " : "› "}
          {state.label}
        </Text>
        {state.outputLines.slice(-3).map((line, index) => (
          <Text key={`${state.deviceId}-${index}`} color={line.color ?? "cyan"}>│ {line.text}</Text>
        ))}
        {state.detail ? <Text color="red">│ {state.detail}</Text> : null}
      </Box>
    );
  }

  if (props.installMessage && !isError) {
    blocks.push(
      <Box key="install-message">
        <Text color="red">{props.installMessage}</Text>
      </Box>
    );
  }

  const visibleStatusCards = props.statusCards ?? [];
  if (visibleStatusCards.length > 0) {
    blocks.push(
      <Box key="status-cards" flexDirection="column">
        {visibleStatusCards.map((card) => (
          <Box key={card.id} flexDirection="column" marginTop={1}>
            <Text color={card.color ?? "cyanBright"}>┌─ {card.title}</Text>
            {(card.rows ?? []).map((row, index) => (
              <Text key={`${card.id}-row-${index}`} color="gray">│ {row.label}{row.value ? `: ${row.value}` : ""}</Text>
            ))}
            {card.hint ? <Text color="yellow">│ {card.hint}</Text> : null}
            <Text color={card.color ?? "cyanBright"}>└─</Text>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <SetupStepShell
      appName={props.appName}
      compactMode={props.compactMode}
      kind="choice"
      locale={props.locale}
      title={props.status}
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
        {blocks.map((block, index) => (
          <Box key={index} flexDirection="column" {...(index > 0 ? { marginTop: 1 } : {})}>
            {block}
          </Box>
        ))}
      </Box>
    </SetupStepShell>
  );
}
