import type { WizardLocaleCatalog } from "../types.js";

export const zhCnCatalog: WizardLocaleCatalog = {
  messages: {
    firstRunTitle: "设置",
    setupOllamaInstalling: "正在准备 Ollama...",
    setupLocalModelInstalling: "正在准备本地模型...",
    setupSaving: "正在保存你的设置...",
    setupMobileInstalling: "正在安装移动端...",
    setupComplete: "配置完成",
    setupFailed: "配置失败",
    launchReadyHint: "正在使用你已保存的设置。请先查看下面的配置，然后按 Enter 打开设置。",
    launchReadyNav: "按 Enter 打开设置",
    launchSetupHint: "查看或更新本机配置。",
    completionExitHint: "按 Ctrl+C 退出。",
    stepLabel: "步骤",
    languageTitle: "选择语言",
    languageHint: "CLI 和生成输出默认会使用这种语言。",
    modelSourceTitle: "选择模型来源",
    modelSourceHint: "云端模式使用在线服务，本地模式使用这台设备上的模型。",
    providerTitle: "选择服务商",
    providerHint: "之后也可以再修改。",
    apiKeyTitle: "输入 API Key",
    apiKeyHint: "只会保存在这台设备上。",
    apiKeyDescription: "粘贴所选服务商的 API Key，然后按 Enter 继续。",
    apiKeyRequired: "使用云端模型必须填写 API Key。",
    inputNav: "直接输入或粘贴内容",
    inputContinueNav: "按 Enter 继续",
    inputBackNav: "按 ← 返回上一步",
    cloudModelTitle: "选择 AI 模型",
    cloudModelHint: "这个模型会作为项目中的默认 AI 配置。",
    customCloudModelDescription: "输入其他模型，然后按 Enter 使用它。",
    mobileInstallTitle: "移动端",
    mobileInstallHint: "选择是否启用移动端设置。",
    mobileDeviceChoiceTitle: "选择移动设备",
    mobileDeviceChoiceHint: "选择要安装并运行移动端应用的手机。",
    mobileDeviceChoiceNav: "使用 ↑/↓ 选择，空格切换，按 Enter 安装。",
    mobileInstallSkip: "暂时不启用",
    mobileInstallNow: "启用移动端设置",
    localModelTitle: "选择本地模型",
    localModelHint: "按本地已安装、推荐和更多可选内容分组展示可直接使用的模型。",
    installedModelsGroup: "本机已安装模型",
    recommendedModelsGroup: "推荐模型",
    remoteModelsGroup: "更多可选模型",
    chooseNav: "使用 ↑/↓ 选择",
    deleteNav: "按 Del 删除",
    continueNav: "按 Enter 继续",
    backNav: "按 ← 返回上一步",
    defaultLanguage: "默认语言",
    modelSource: "模型来源",
    aiProvider: "已选服务商",
    aiModel: "已选模型",
    aiApiKey: "API 密钥",
    notConfigured: "未配置",
    mobileInstallStatus: "移动端",
    mobileInstallEnabledStatus: "已启用",
    mobileInstallSkippedStatus: "未启用"
  },
  descriptions: {
    en: "默认使用英文。",
    "zh-CN": "默认使用简体中文。",
    "zh-TW": "默认使用繁体中文。",
    ja: "默认使用日语。",
    ko: "默认使用韩语。",
    es: "默认使用西班牙语。",
    fr: "默认使用法语。",
    de: "默认使用德语。",
    pt: "默认使用葡萄牙语。",
    cloud: "使用在线服务，更快开始。",
    local: "使用这台设备上的本地模型。",
    skip: "先完成设置，之后需要时再启用移动端。",
    install: "为提供移动端应用的项目启用移动端设置。",
    android: "默认使用 Android 作为移动端平台。",
    ios: "默认使用 iPhone 作为移动端平台。",
    openai: "默认推荐，整体比较均衡。",
    anthropic: "适合更注重文字质量的场景。",
    google: "适合想直接使用 Google Gemini 系列的场景。",
    deepseek: "适合想直接使用 DeepSeek 对话或推理模型的场景。",
    openrouter: "适合想在一个入口下切换不同服务的场景。",
    "local-provider": "完全在本机处理，不依赖联网服务。",
    "qwen2.5:7b": "适合本地部署的强多语言开源默认模型。",
    "qwen2.5:14b": "内存更充足时更强的本地通用 Qwen 模型。",
    "qwen3:8b": "更新的均衡型 Qwen，本地推理能力更强。",
    "llama3.1:8b": "生态较广、能力均衡的本地通用模型。",
    "phi4:14b": "更紧凑但能力较强的微软本地模型，适合推理和写作。",
    "mistral-nemo:12b": "中等规模、速度和质量平衡不错的本地模型。",
    "gemma3:12b": "较新的 Gemma 模型，整体质量优于 Gemma 2。",
    "installed-local-model": "这个模型已经可以直接使用。按 Del 可删除它。"
  },
  progress: {
    checkOllama: "检查 Ollama",
    installOllama: "安装 Ollama",
    startRuntime: "启动本地运行环境",
    waitOllama: "等待 Ollama 就绪",
    checkLocalModel: "检查本地模型",
    installLocalModel: "安装本地模型",
    verifyLocalModel: "验证本地模型",
    mobileProject: "检查移动端项目",
    flutter: "检查 Flutter",
    flutterDownload: "下载 Flutter",
    flutterExtract: "解压 Flutter",
    dependencies: "安装移动端依赖",
    devices: "检查已连接设备",
    androidTools: "检查 Android 工具",
    iosTools: "检查 iOS 工具",
    deviceSelection: "准备安装到设备",
    installDevice: "安装移动端应用"
  },
  mobileErrors: {
    flutterLock: "还有其他 Flutter 命令正在运行。等它结束后，再重新安装移动端。",
    iosTrust: "App 已经安装到手机上了，但 iOS 阻止启动，因为这台 iPhone 还没有信任你的开发者证书。",
    iosSigning: "iOS 真机安装失败，通常是 Xcode 签名还没配置好。请打开 ios/Runner.xcworkspace，在 Xcode 里选择开发团队，并执行一次 Product > Run，然后回来重试。",
    macosDevice: "Flutter 选到了 macOS 桌面目标，而不是手机。请连接或选择 iPhone/Android 手机后重试。",
    iosDeveloperMode: "iPhone 没有开启开发者模式。请在手机上开启 Developer Mode，重新连接后重试。",
    noDevice: "没有找到可安装的手机。请连接已解锁的 iPhone 或 Android 手机，信任这台电脑后重试。",
    noFlutter: "没有找到 Flutter。请安装 Flutter，或启用托管 Flutter SDK 后重试。",
    noXcode: "Xcode 还没有准备好。请先从 App Store 安装 Xcode，首次打开完成额外组件安装后重试。",
    noCocoapods: "没有检测到 CocoaPods。请先安装 CocoaPods，并确认 `pod --version` 可用后重试。",
    androidTools: "Android 调试环境还没有准备好。请安装 Android Studio、Android SDK 和 Platform Tools，并确认 `adb` 可用后重试。",
    androidUserRejected: "Android 安装被手机拒绝。请解锁手机，允许通过 USB 安装应用，并在系统弹窗里点击允许/安装，然后重试。",
    androidUnauthorized: "Android 调试尚未授权。请解锁手机，接受 USB 调试授权弹窗，然后重试。",
    androidOffline: "Android 设备处于离线状态。请重新连接并解锁手机，确认 `adb devices` 中显示为 online 后重试。",
    androidInstallConflict: "Android 拒绝安装，因为手机上已有应用与当前构建冲突。请先从手机卸载旧版本，然后重试。",
    androidStorage: "Android 手机存储空间不足，无法安装应用。请清理手机空间后重试。",
    androidIncompatible: "这台 Android 设备与生成的 APK 不兼容。请检查设备 ABI 和 Android SDK 版本后重试。",
    unknown: "配置失败。请检查上一步后重试。",
    title: "继续安装手机端",
    hint: "请先处理下面的问题。",
    retry: "按 Enter 重新检查。",
    skip: "按 → 暂时跳过手机端安装。",
    openXcode: "按 Enter 打开 Xcode 工程。",
    continueAfterXcode: "在 Xcode 完成设置后，按 Enter 重新检查。",
    openAppStore: "按 Enter 打开 Xcode 安装页。",
    continueAfterInstall: "安装完成后，按 Enter 重新检查。",
    guides: {
      "ios-signing": [
        "打开 apps/mobile/ios/Runner.xcworkspace。",
        "左侧选择 Runner，然后打开 Signing & Capabilities。",
        "勾选 Automatically manage signing。",
        "在 Team 里选择你的 Apple 开发团队。",
        "完成后回到这里，按 Enter 重新检查。"
      ],
      "ios-trust": [
        "打开 iPhone 的“设置”。",
        "进入“通用” > “VPN 与设备管理”。",
        "点开你的开发者 App 证书。",
        "点击“信任”，然后回到这里按 Enter 重新检查。"
      ],
      "ios-xcode-missing": [
        "先安装 Xcode。",
        "打开后至少运行一次，让它完成附加组件安装。",
        "然后回到这里，按 Enter 重新检查。"
      ],
      "ios-cocoapods-missing": [
        "先安装 CocoaPods。",
        "安装完成后，在终端运行 `pod --version` 确认可用。",
        "然后回到这里，按 Enter 重新检查。"
      ],
      "android-tools-missing": [
        "先安装 Android Studio。",
        "在 Android Studio 里安装 Android SDK 和 Platform Tools。",
        "然后确认 `adb` 可用，再回到这里按 Enter 重新检查。"
      ],
      "android-user-rejected": [
        "解锁 Android 手机。",
        "如果手机询问是否允许通过 USB 安装应用，请允许。",
        "在手机系统弹窗中点击允许/安装。",
        "然后回到这里按 Enter 重试。"
      ],
      "android-unauthorized": [
        "解锁 Android 手机。",
        "接受 USB 调试授权弹窗。",
        "如果没有弹窗，请在开发者选项里撤销 USB 调试授权后重新连接。",
        "然后回到这里按 Enter 重试。"
      ],
      "android-offline": [
        "重新连接 Android 手机。",
        "保持手机解锁。",
        "确认 `adb devices` 中显示为 online。",
        "然后回到这里按 Enter 重试。"
      ],
      "android-install-conflict": [
        "先从 Android 手机上卸载已有应用。",
        "如果应用安装在其他用户/工作资料里，也需要一并移除。",
        "然后回到这里按 Enter 重试。"
      ],
      "android-storage": [
        "清理 Android 手机存储空间。",
        "然后回到这里按 Enter 重试。"
      ],
      "android-incompatible": [
        "检查这台 Android 手机是否支持当前应用的 minSdk 和 CPU ABI。",
        "换用兼容的 Android 手机，或调整移动端构建配置。",
        "然后回到这里按 Enter 重试。"
      ]
    }
  },
  labels: {
    modelSource: {
      cloud: "云端模型",
      local: "本地模型"
    }
  }
};
