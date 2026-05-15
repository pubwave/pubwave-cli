import React from "react";
import { MessageView, Panel, StatusLine } from "../../ui/index.js";
import { inspectFlutterReadiness } from "../../features/mobile/flutter/readiness.js";
import { runFlutterMobile } from "../../features/mobile/flutter/runner.js";
import { mobileWorkspaceContextFromCli } from "../../features/mobile/workspace.js";
import type { CliCommand, CliCommandContext } from "../types.js";
import { stringOption } from "./command-options.js";
import { MobileDeviceSelectView } from "./mobile-device-select-view.js";

export function mobileCommands(): CliCommand[] {
  return [
    {
      name: "mobile devices",
      description: "List Flutter mobile devices.",
      run: async (context) => {
        const flutter = context.features.mobile && context.features.mobile.flutter;
        if (!flutter || flutter === true) {
          return <MessageView title="Mobile Devices" color="yellow" message="Flutter mobile support is not configured for this CLI." />;
        }
        const readiness = await inspectFlutterReadiness(flutter);
        return (
          <Panel title="Mobile Devices">
            {readiness.steps.map((step) => <StatusLine key={step.label} ok={step.ok} label={step.label} detail={step.detail} />)}
            {readiness.devices.map((device) => <StatusLine key={device.id} ok label={device.id} detail={device.label} />)}
          </Panel>
        );
      }
    },
    {
      name: "mobile install",
      description: "Check Flutter and install the mobile app on a connected phone.",
      options: ["project-dir", "api-base-url", "device", "no-resident"],
      run: async (context, options) => {
        const flutter = context.features.mobile && context.features.mobile.flutter;
        if (!flutter || flutter === true) {
          return "Flutter mobile support is not configured for this CLI.";
        }
        if (!stringOption(options.device)) {
          const readiness = await inspectFlutterReadiness(flutter);
          if (readiness.ok && readiness.devices.length > 1) {
            return <MobileDeviceSelectView context={context} flutter={flutter} devices={readiness.devices} options={options} />;
          }
          if (!readiness.ok && readiness.devices.length === 0) {
            return (
              <Panel title="Mobile Install" color="red">
                {readiness.steps.map((step) => <StatusLine key={step.label} ok={step.ok} label={step.label} detail={step.detail} />)}
              </Panel>
            );
          }
        }
        return runMobile(context, undefined, options);
      }
    },
    {
      name: "mobile run android",
      description: "Run the Flutter mobile app on Android.",
      options: ["project-dir", "api-base-url", "device", "no-resident"],
      run: async (context, options) => runMobile(context, "android", options)
    },
    {
      name: "mobile run ios",
      description: "Run the Flutter mobile app on iOS.",
      options: ["project-dir", "api-base-url", "device", "no-resident"],
      run: async (context, options) => runMobile(context, "ios", options)
    }
  ];
}

async function runMobile(
  context: CliCommandContext,
  platform: "android" | "ios" | undefined,
  options: Record<string, string | boolean>
): Promise<React.ReactElement | string> {
  const flutter = context.features.mobile && context.features.mobile.flutter;
  if (!flutter || flutter === true) {
    return "Flutter mobile support is not configured for this CLI.";
  }

  const result = await runFlutterMobile(flutter, {
    ...(platform ? { platform } : {}),
    projectDir: stringOption(options["project-dir"]),
    apiBaseUrl: stringOption(options["api-base-url"]),
    deviceId: stringOption(options.device),
    noResident: options["no-resident"] === true,
    workspaceContext: mobileWorkspaceContextFromCli(context)
  });

  return (
    <Panel title={platform ? `Mobile Run ${platform}` : "Mobile Install"}>
      {result.steps.map((step) => (
        <StatusLine key={step.label} ok={step.ok} label={step.label} detail={step.detail} />
      ))}
    </Panel>
  );
}
