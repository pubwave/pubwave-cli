export type WizardLocale = "en" | "zh-CN" | "zh-TW" | "ja" | "ko" | "es" | "fr" | "de" | "pt";

export type MobileRetryGuideKind =
  | "ios-trust"
  | "ios-signing"
  | "ios-xcode-missing"
  | "ios-cocoapods-missing"
  | "android-tools-missing"
  | "android-user-rejected"
  | "android-unauthorized"
  | "android-install-conflict"
  | "android-storage"
  | "android-incompatible"
  | "android-offline";

export interface MobileErrorText {
  flutterLock: string;
  iosTrust: string;
  iosSigning: string;
  macosDevice: string;
  iosDeveloperMode: string;
  noDevice: string;
  noFlutter: string;
  noXcode: string;
  noCocoapods: string;
  androidTools: string;
  androidUserRejected: string;
  androidUnauthorized: string;
  androidOffline: string;
  androidInstallConflict: string;
  androidStorage: string;
  androidIncompatible: string;
  unknown: string;
}

export interface MobileRetryText extends MobileErrorText {
  title: string;
  hint: string;
  retry: string;
  skip: string;
  openXcode: string;
  continueAfterXcode: string;
  openAppStore: string;
  continueAfterInstall: string;
  guides: Record<MobileRetryGuideKind, string[]>;
}

export interface WizardProgressText {
  checkOllama: string;
  installOllama: string;
  startRuntime: string;
  checkLocalModel: string;
  installLocalModel: string;
  verifyLocalModel: string;
  mobileProject: string;
  flutter: string;
  flutterDownload: string;
  flutterExtract: string;
  dependencies: string;
  devices: string;
  androidTools: string;
  iosTools: string;
  deviceSelection: string;
  installDevice: string;
}

export type MessageKey =
  | "firstRunTitle"
  | "setupLocalModelInstalling"
  | "setupSaving"
  | "setupMobileInstalling"
  | "setupComplete"
  | "setupFailed"
  | "launchReadyHint"
  | "launchReadyNav"
  | "launchSetupHint"
  | "stepLabel"
  | "languageTitle"
  | "languageHint"
  | "modelSourceTitle"
  | "modelSourceHint"
  | "providerTitle"
  | "providerHint"
  | "apiKeyTitle"
  | "apiKeyHint"
  | "apiKeyDescription"
  | "apiKeyRequired"
  | "inputNav"
  | "inputContinueNav"
  | "inputBackNav"
  | "cloudModelTitle"
  | "cloudModelHint"
  | "customCloudModelDescription"
  | "mobileInstallTitle"
  | "mobileInstallHint"
  | "mobilePlatformTitle"
  | "mobilePlatformHint"
  | "mobileDeviceChoiceTitle"
  | "mobileDeviceChoiceHint"
  | "mobileDeviceChoiceNav"
  | "mobileInstallSkip"
  | "mobileInstallNow"
  | "mobilePlatformAndroid"
  | "mobilePlatformIos"
  | "localModelTitle"
  | "localModelHint"
  | "installedModelsGroup"
  | "recommendedModelsGroup"
  | "remoteModelsGroup"
  | "chooseNav"
  | "deleteNav"
  | "continueNav"
  | "backNav"
  | "defaultLanguage"
  | "modelSource"
  | "aiProvider"
  | "aiModel"
  | "mobileInstallStatus"
  | "mobilePlatformStatus"
  | "mobileInstallEnabledStatus"
  | "mobileInstallSkippedStatus";

export interface WizardLocaleCatalog {
  messages: Record<MessageKey, string>;
  descriptions: Record<string, string>;
  progress: WizardProgressText;
  mobileErrors: MobileRetryText;
  labels: {
    modelSource: {
      cloud: string;
      local: string;
    };
  };
}
