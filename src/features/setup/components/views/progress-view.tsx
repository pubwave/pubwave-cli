import React from "react";
import { Box, Text } from "ink";
import type { WizardLocale } from "../../../../shared/i18n/wizard/index.js";
import type { StatusCard } from "../../progress-types.js";
import type { DeviceInstallState, ProgressLine } from "../../types.js";
import {
  setupOutputProgressKey,
  stripTrailingDots,
  withAnimatedDots,
} from "../../progress/output.js";
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
  const isError = props.statusColor === "red";
  const nonPullOutputLines = props.outputLines.filter((line) =>
    !setupOutputProgressKey(line.text)?.startsWith("pulling:"),
  );

  // Height budget so the device being installed (its name/header) is never
  // pushed off-screen on short terminals. Reserve device headers + the active
  // step first, then fill remaining rows with verbose output (device output
  // first), trimming completed steps and `│` output lines before anything that
  // identifies the current action. Chrome is overestimated on purpose so we
  // under-fill rather than overflow (Ink clips the bottom, i.e. the devices).
  const allSteps = props.progressLines.slice(-6);
  const allDeviceStates = isError ? [] : props.deviceInstallStates.slice(-2);
  const chromeRows = props.compactMode ? 9 : 13;
  const contentRows = Math.max(2, props.height - chromeRows);

  const deviceReservedRows = allDeviceStates.reduce((rows, state) => rows + 1 + (state.detail ? 1 : 0), 0);
  const activeStepRows = allSteps.length > 0 ? 1 : 0;
  let outputBudget = Math.max(0, contentRows - deviceReservedRows - activeStepRows);

  const completedStepCount = Math.max(0, allSteps.length - 1);
  const shownCompletedSteps = Math.min(completedStepCount, outputBudget);
  outputBudget -= shownCompletedSteps;
  const visibleProgressLines = allSteps.slice(allSteps.length - (shownCompletedSteps + activeStepRows));

  const deviceOutputCounts = allDeviceStates.map((state) => {
    const count = Math.min(3, state.outputLines.length, outputBudget);
    outputBudget -= count;
    return count;
  });

  const topOutputCount = isError ? 0 : Math.min(3, nonPullOutputLines.length, outputBudget);
  const visibleOutputLines = topOutputCount > 0
    ? nonPullOutputLines.slice(nonPullOutputLines.length - topOutputCount)
    : [];
  const visibleDeviceStates = allDeviceStates;

  const blocks: React.ReactNode[] = [];

  if (visibleProgressLines.length > 0) {
    blocks.push(
      <Box key="progress" flexDirection="column">
        {visibleProgressLines.map((line, index) => (
          <Text
            key={`${line.text}-${index}`}
            color={
              index === visibleProgressLines.length - 1
                ? (line.color ?? "cyan")
                : "green"
            }
          >
            {index === visibleProgressLines.length - 1 ? "› " : "· "}
            {index === visibleProgressLines.length - 1
              ? withAnimatedDots(line.text, props.savingDots)
              : `${stripTrailingDots(line.completedText ?? line.text)} ✅`}
          </Text>
        ))}
      </Box>,
    );
  }

  if (visibleOutputLines.length > 0) {
    blocks.push(
      <Box key="output" flexDirection="column">
        {visibleOutputLines.map((line, index) => (
          <Text key={`output-${index}`} color={line.color ?? "cyan"}>
            │ {line.text}
          </Text>
        ))}
      </Box>,
    );
  }

  visibleDeviceStates.forEach((state, deviceIndex) => {
    const deviceOutputCount = deviceOutputCounts[deviceIndex] ?? 0;
    blocks.push(
      <Box key={`device-${state.deviceId}`} flexDirection="column">
        <Text
          color={
            state.status === "failed"
              ? "red"
              : state.status === "completed"
                ? "green"
                : "yellow"
          }
        >
          {state.status === "failed"
            ? "! "
            : state.status === "completed"
              ? "· "
              : "› "}
          {state.label}
        </Text>
        {state.outputLines.slice(state.outputLines.length - deviceOutputCount).map((line, index) => (
          <Text key={`${state.deviceId}-${index}`} color={line.color ?? "cyan"}>
            │ {line.text}
          </Text>
        ))}
        {state.detail ? <Text color="red">│ {state.detail}</Text> : null}
      </Box>,
    );
  });

  if (props.installMessage && !isError) {
    blocks.push(
      <Box key="install-message">
        <Text color="red">{props.installMessage}</Text>
      </Box>,
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
              <Text key={`${card.id}-row-${index}`} color="gray">
                │ {row.label}
                {row.value ? `: ${row.value}` : ""}
              </Text>
            ))}
            {card.hint ? <Text color="yellow">│ {card.hint}</Text> : null}
            <Text color={card.color ?? "cyanBright"}>└─</Text>
          </Box>
        ))}
      </Box>,
    );
  }

  return (
    <SetupStepShell
      appName={props.appName}
      compactMode={props.compactMode}
      kind="choice"
      locale={props.locale}
      title={withAnimatedDots(props.status, props.savingDots)}
      titleColor={isError ? "red" : props.statusColor}
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
          <Box
            key={index}
            flexDirection="column"
            {...(index > 0 ? { marginTop: 1 } : {})}
          >
            {block}
          </Box>
        ))}
      </Box>
    </SetupStepShell>
  );
}
