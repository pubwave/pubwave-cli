import type { WizardLocaleCatalog } from "../types.js";

export const enCatalog: WizardLocaleCatalog = {
  messages: {
    firstRunTitle: "Setup",
    setupLocalModelInstalling: "Preparing your local model...",
    setupSaving: "Saving your settings...",
    setupMobileInstalling: "Installing the mobile app...",
    setupComplete: "Setup Complete",
    setupFailed: "Setup failed",
    launchReadyHint: "Using your saved settings. Review them below, then press Enter to open setup.",
    launchReadyNav: "Enter to open setup",
    launchSetupHint: "Review or update your local configuration.",
    stepLabel: "Step",
    languageTitle: "Choose your language",
    languageHint: "The CLI and generated output will use this language by default.",
    modelSourceTitle: "Choose your model source",
    modelSourceHint: "Cloud mode uses an online provider. Local mode uses a model on this machine.",
    providerTitle: "Choose a provider",
    providerHint: "You can change this later.",
    apiKeyTitle: "Enter your API key",
    apiKeyHint: "It is stored on this device.",
    apiKeyDescription: "Paste the API key for the selected provider, then press Enter.",
    apiKeyRequired: "API key is required for cloud models.",
    inputNav: "Type or paste your value",
    inputContinueNav: "Enter to continue",
    inputBackNav: "← to go back",
    cloudModelTitle: "Choose your AI model",
    cloudModelHint: "This model will be used by your project wherever AI is configured.",
    customCloudModelDescription: "Enter another model, then press Enter to use it.",
    mobileInstallTitle: "Mobile app",
    mobileInstallHint: "Choose whether to enable mobile app setup.",
    mobilePlatformTitle: "Choose your phone",
    mobilePlatformHint: "Pick the default phone type for mobile commands.",
    mobileDeviceChoiceTitle: "Choose mobile devices",
    mobileDeviceChoiceHint: "Select the phones to install and run the mobile app on.",
    mobileDeviceChoiceNav: "Use ↑/↓ to choose, Space to toggle, Enter to install.",
    mobileInstallSkip: "Not now",
    mobileInstallNow: "Enable mobile setup",
    mobilePlatformAndroid: "Android phone",
    mobilePlatformIos: "iPhone",
    localModelTitle: "Choose your local model",
    localModelHint: "Shows local models you can use, grouped as installed, recommended, and more options.",
    installedModelsGroup: "Installed models",
    recommendedModelsGroup: "Recommended models",
    remoteModelsGroup: "More options",
    chooseNav: "Use ↑/↓ to choose",
    deleteNav: "Delete to remove",
    continueNav: "Enter to continue",
    backNav: "← to go back",
    defaultLanguage: "Default language",
    modelSource: "Model source",
    aiProvider: "Selected provider",
    aiModel: "Selected model",
    mobileInstallStatus: "Mobile app",
    mobilePlatformStatus: "Mobile platform",
    mobileInstallEnabledStatus: "Enabled",
    mobileInstallSkippedStatus: "Not enabled"
  },
  descriptions: {
    en: "Use English as the default language.",
    "zh-CN": "Use Simplified Chinese as the default language.",
    "zh-TW": "Use Traditional Chinese as the default language.",
    ja: "Use Japanese as the default language.",
    ko: "Use Korean as the default language.",
    es: "Use Spanish as the default language.",
    fr: "Use French as the default language.",
    de: "Use German as the default language.",
    pt: "Use Portuguese as the default language.",
    cloud: "Use an online provider so you can get started faster.",
    local: "Use a model running on this machine.",
    skip: "Finish setup now and enable mobile later.",
    install: "Enable mobile setup for projects that provide a mobile app.",
    android: "Use Android as the default mobile platform.",
    ios: "Use iPhone as the default mobile platform.",
    openai: "A balanced default with broad support.",
    anthropic: "A good fit when writing quality matters more.",
    google: "A good fit when you want a broad Gemini lineup from Google.",
    deepseek: "A good fit when you want DeepSeek chat or reasoning models.",
    openrouter: "Useful if you want one place to switch between services.",
    "local-provider": "Runs fully on this device without using an online service.",
    "qwen2.5:7b": "Strong multilingual open-source default for local deployment.",
    "qwen2.5:14b": "Stronger general-purpose local Qwen when you can afford more memory.",
    "qwen3:8b": "Newer balanced Qwen option with stronger reasoning.",
    "llama3.1:8b": "Balanced general local model with broad ecosystem support.",
    "phi4:14b": "Compact but stronger Microsoft local model for reasoning and writing.",
    "mistral-nemo:12b": "Solid midsize local model with a good speed-quality tradeoff.",
    "gemma3:12b": "Modern Gemma option with stronger overall quality than Gemma 2.",
    "installed-local-model": "Already ready to use here. Press Delete to remove it."
  },
  progress: {
    checkOllama: "Checking Ollama",
    installOllama: "Installing Ollama",
    startRuntime: "Starting local runtime",
    checkLocalModel: "Checking local model",
    installLocalModel: "Installing local model",
    verifyLocalModel: "Verifying local model",
    mobileProject: "Checking mobile project",
    flutter: "Checking Flutter",
    flutterDownload: "Downloading Flutter",
    flutterExtract: "Extracting Flutter",
    dependencies: "Installing mobile dependencies",
    devices: "Checking connected devices",
    androidTools: "Checking Android tools",
    iosTools: "Checking iOS tools",
    deviceSelection: "Preparing device installation",
    installDevice: "Installing mobile app"
  },
  mobileErrors: {
    flutterLock: "Another Flutter command is still running. Wait for it to finish, then retry mobile installation.",
    iosTrust: "The app was installed, but iOS blocked it because this iPhone has not trusted your developer certificate yet.",
    iosSigning: "iOS device installation failed because Xcode signing is not ready. Open ios/Runner.xcworkspace in Xcode, choose your development team, run Product > Run once, then retry.",
    macosDevice: "Flutter selected the macOS desktop target instead of a phone. Connect or select an iPhone/Android device, then retry.",
    iosDeveloperMode: "Developer Mode is disabled on the iPhone. Enable Developer Mode on the device, reconnect it, then retry.",
    noDevice: "No installable phone was found. Connect an unlocked iPhone or Android phone, trust this computer, then retry.",
    noFlutter: "Flutter is not available. Install Flutter or enable the managed Flutter SDK, then retry.",
    noXcode: "Xcode is not ready. Install Xcode from the App Store, open it once to finish setup, then retry.",
    noCocoapods: "CocoaPods is not available. Install CocoaPods, confirm `pod --version` works, then retry.",
    androidTools: "Android debugging tools are not ready. Install Android Studio, Android SDK, and Platform Tools, then retry.",
    androidUserRejected: "Android installation was rejected on the phone. Unlock the device, allow USB app installation, approve the install prompt, then retry.",
    androidUnauthorized: "Android debugging is not authorized. Unlock the phone, accept the USB debugging prompt, then retry.",
    androidOffline: "The Android device is offline. Reconnect it, unlock it, and confirm it appears online in `adb devices`.",
    androidInstallConflict: "Android refused the app because an existing install conflicts with this build. Uninstall the old app from the phone, then retry.",
    androidStorage: "Android does not have enough free storage to install the app. Free space on the phone, then retry.",
    androidIncompatible: "This Android device is not compatible with the generated APK. Check the device ABI and Android SDK version, then retry.",
    unknown: "Setup failed. Check the previous step and retry.",
    title: "Continue mobile installation",
    hint: "Fix the issue below first.",
    retry: "Press Enter to check again.",
    skip: "Press ← to skip mobile installation for now.",
    openXcode: "Press Enter to open the Xcode workspace.",
    continueAfterXcode: "After finishing setup in Xcode, press Enter to check again.",
    openAppStore: "Press Enter to open the Xcode install page.",
    continueAfterInstall: "After installation finishes, press Enter to check again.",
    guides: {
      "ios-signing": [
        "Open apps/mobile/ios/Runner.xcworkspace.",
        "Select Runner, then open Signing & Capabilities.",
        "Enable Automatically manage signing.",
        "Choose your Apple development team in Team.",
        "Then return here and press Enter to check again."
      ],
      "ios-trust": [
        "Open Settings on the iPhone.",
        "Go to General > VPN & Device Management.",
        "Select your developer app certificate.",
        "Tap Trust, then return here and press Enter to check again."
      ],
      "ios-xcode-missing": [
        "Install Xcode first.",
        "Open it once and let it finish installing extra components.",
        "Then return here and press Enter to check again."
      ],
      "ios-cocoapods-missing": [
        "Install CocoaPods first.",
        "Run `pod --version` in Terminal to confirm it works.",
        "Then return here and press Enter to check again."
      ],
      "android-tools-missing": [
        "Install Android Studio first.",
        "Install Android SDK and Platform Tools in Android Studio.",
        "Confirm `adb` works, then return here and press Enter."
      ],
      "android-user-rejected": [
        "Unlock the Android phone.",
        "Allow USB app installation if the phone asks.",
        "Approve the install prompt on the phone.",
        "Then return here and press Enter to retry."
      ],
      "android-unauthorized": [
        "Unlock the Android phone.",
        "Accept the USB debugging authorization prompt.",
        "If no prompt appears, revoke USB debugging authorizations in Developer options and reconnect.",
        "Then return here and press Enter to retry."
      ],
      "android-offline": [
        "Reconnect the Android phone.",
        "Keep it unlocked.",
        "Confirm it appears as online in `adb devices`.",
        "Then return here and press Enter to retry."
      ],
      "android-install-conflict": [
        "Uninstall the existing app from the Android phone.",
        "If the app is installed for another user/profile, remove it there too.",
        "Then return here and press Enter to retry."
      ],
      "android-storage": [
        "Free storage on the Android phone.",
        "Then return here and press Enter to retry."
      ],
      "android-incompatible": [
        "Check that the Android phone supports this app's minSdk and CPU ABI.",
        "Use a compatible Android phone or adjust the mobile app build settings.",
        "Then return here and press Enter to retry."
      ]
    }
  },
  labels: {
    modelSource: {
      cloud: "Cloud model",
      local: "Local model"
    }
  }
};
