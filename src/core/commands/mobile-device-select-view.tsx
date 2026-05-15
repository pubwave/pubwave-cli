import React, { useEffect, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { Panel, StatusLine } from "../../ui/index.js";
import { runFlutterMobile } from "../../features/mobile/flutter/runner.js";
import { mobileWorkspaceContextFromCli } from "../../features/mobile/workspace.js";
import type { FlutterMobileFeatureConfig, MobileInstallableDevice, MobileRunResult } from "../../features/mobile/types.js";
import type { CliCommandContext } from "../types.js";
import { stringOption } from "./command-options.js";

interface MobileDeviceSelectViewProps {
  context: CliCommandContext;
  flutter: FlutterMobileFeatureConfig;
  devices: MobileInstallableDevice[];
  options: Record<string, string | boolean>;
}

export function MobileDeviceSelectView(props: MobileDeviceSelectViewProps): React.ReactElement {
  const { exit } = useApp();
  const [cursor, setCursor] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => props.devices.map((device) => device.id));
  const [phase, setPhase] = useState<"select" | "installing" | "done">("select");
  const [result, setResult] = useState<MobileRunResult | null>(null);

  useInput((input, key) => {
    if (phase !== "select") {
      return;
    }
    if (key.escape) {
      exit();
      return;
    }
    if (key.upArrow) {
      setCursor((previous) => previous <= 0 ? props.devices.length - 1 : previous - 1);
      return;
    }
    if (key.downArrow) {
      setCursor((previous) => previous >= props.devices.length - 1 ? 0 : previous + 1);
      return;
    }
    if (input === " ") {
      const device = props.devices[cursor];
      if (!device) {
        return;
      }
      setSelectedIds((previous) =>
        previous.includes(device.id)
          ? previous.filter((id) => id !== device.id)
          : [...previous, device.id]
      );
      return;
    }
    if (key.return && selectedIds.length > 0) {
      setPhase("installing");
    }
  });

  useEffect(() => {
    if (phase !== "installing" || result) {
      return;
    }
    let mounted = true;
    void runFlutterMobile(props.flutter, {
      projectDir: stringOption(props.options["project-dir"]),
      apiBaseUrl: stringOption(props.options["api-base-url"]),
      noResident: props.options["no-resident"] === true,
      selectedDeviceIds: selectedIds,
      interactive: false,
      workspaceContext: mobileWorkspaceContextFromCli(props.context)
    }).then((nextResult) => {
      if (!mounted) {
        return;
      }
      setResult(nextResult);
      setPhase("done");
      setTimeout(() => exit(), 120);
    });
    return () => {
      mounted = false;
    };
  }, [exit, phase, props.flutter, props.options, result, selectedIds]);

  if (phase === "installing") {
    return (
      <Panel title="Mobile Install">
        <Text color="cyan">Installing on {selectedIds.length} device{selectedIds.length === 1 ? "" : "s"}...</Text>
      </Panel>
    );
  }

  if (phase === "done" && result) {
    return (
      <Panel title="Mobile Install" color={result.ok ? "green" : "red"}>
        {result.steps.map((step) => <StatusLine key={step.label} ok={step.ok} label={step.label} detail={step.detail} />)}
      </Panel>
    );
  }

  return (
    <Panel title="Choose Mobile Devices">
      <Box flexDirection="column">
        {props.devices.map((device, index) => {
          const checked = selectedIds.includes(device.id);
          const active = index === cursor;
          return (
            <Text key={device.id} color={active ? "green" : undefined}>
              {active ? "›" : " "} [{checked ? "x" : " "}] {device.label}
            </Text>
          );
        })}
        <Box marginTop={1}>
          <Text color="yellow">Use ↑/↓ to choose, Space to toggle, Enter to install.</Text>
        </Box>
      </Box>
    </Panel>
  );
}
