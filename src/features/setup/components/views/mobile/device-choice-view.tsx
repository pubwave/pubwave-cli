import React from "react";
import { Box, Text } from "ink";
import type { MobileInstallableDevice } from "../../../../mobile/types.js";
import { wizardMessage, type WizardLocale } from "../../../../../shared/i18n/wizard/index.js";
import { SetupStepShell } from "../../primitives/step-shell.js";

export function SetupMobileDeviceChoiceView(props: {
  appName: string;
  compactMode: boolean;
  cursorIndex: number;
  devices: MobileInstallableDevice[];
  locale: WizardLocale;
  selectedDeviceIds: string[];
  width: number;
  height: number;
  stepIndex: number;
  stepsLength: number;
}): React.ReactElement {
  return (
    <SetupStepShell
      appName={props.appName}
      compactMode={props.compactMode}
      kind="choice"
      locale={props.locale}
      title={wizardMessage(props.locale, "mobileDeviceChoiceTitle")}
      hint={wizardMessage(props.locale, "mobileDeviceChoiceHint")}
      isFirstStep={false}
      isLastStep
      stepIndex={props.stepIndex}
      stepsLength={props.stepsLength}
      width={props.width}
      height={props.height}
      showNavigation={false}
    >
      <Box flexDirection="column">
        {props.devices.map((device, index) => {
          const selected = props.selectedDeviceIds.includes(device.id);
          const active = index === props.cursorIndex;
          return (
            <Text key={device.id} color={active ? "green" : undefined}>
              {active ? "›" : " "} [{selected ? "✓" : "×"}] {device.label}
            </Text>
          );
        })}
        <Box marginTop={1} flexDirection="column">
          <Text color="yellow">{wizardMessage(props.locale, "mobileDeviceChoiceNav")}</Text>
        </Box>
      </Box>
    </SetupStepShell>
  );
}
