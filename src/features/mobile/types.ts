export type MobilePlatform = "android" | "ios";

export interface MobileInstallableDevice {
  id: string;
  name: string;
  platform: MobilePlatform;
  label: string;
}

export interface MobileRuntimeContext {
  apiBaseUrl?: string;
  [key: string]: unknown;
}

export interface FlutterMobileFeatureConfig {
  projectDir?: string;
  flutterCommand?: string;
  dartDefines?: Record<string, string> | ((input: { runtime?: MobileRuntimeContext }) => Record<string, string>);
  releaseMode?: boolean;
  physicalDevicesOnly?: boolean;
  autoInstallSdk?: boolean;
  managedSdkDir?: string;
  runtimeRoot?: string;
  sdkVersion?: string;
  workspaceProvider?: import("./workspace.js").MobileWorkspaceProvider;
}

export interface MobileFeatureConfig {
  flutter?: boolean | FlutterMobileFeatureConfig;
}

export interface MobileRunInput {
  platform?: MobilePlatform;
  projectDir?: string;
  apiBaseUrl?: string;
  flutterCommand?: string;
  interactive?: boolean;
  noResident?: boolean;
  deviceId?: string;
  selectedDeviceIds?: string[];
  selectDevices?: (devices: MobileInstallableDevice[]) => Promise<string[]>;
  callbacks?: MobileProgressCallbacks;
  workspaceContext?: import("./workspace.js").MobileWorkspaceResolveContext;
}

export interface MobileRunResult {
  ok: boolean;
  steps: Array<{ label: string; ok: boolean; detail: string }>;
  deviceResults?: DeviceRunResult[];
}

export interface MobileReadinessResult {
  ok: boolean;
  steps: Array<{ label: string; ok: boolean; detail: string }>;
  devices: MobileInstallableDevice[];
}

export type MobileProgressStage =
  | "mobile-project"
  | "flutter"
  | "dependencies"
  | "devices"
  | "android-tools"
  | "ios-tools"
  | "device-selection"
  | "install-device";

export interface DeviceRunResult {
  device: MobileInstallableDevice;
  ok: boolean;
  detail: string;
  label: string;
}

export interface MobileProgressCallbacks {
  onStep?: (stage: MobileProgressStage, device?: MobileInstallableDevice) => void | Promise<void>;
  onFlutterProgress?: (event: FlutterProgressEvent) => void | Promise<void>;
  onCommandOutput?: (
    chunk: string,
    stream: "stdout" | "stderr",
    device?: MobileInstallableDevice
  ) => void | Promise<void>;
  onDeviceComplete?: (result: DeviceRunResult) => void | Promise<void>;
}

export type FlutterInstallStage = "download" | "extract" | "ready";

export interface FlutterProgressEvent {
  stage: FlutterInstallStage;
  receivedBytes?: number;
  totalBytes?: number;
}
