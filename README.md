# Pubwave CLI

Composable Ink-based CLI toolkit for projects that need language setup, cloud model selection, local model management, and Flutter mobile app installation.

The package is designed for open-source projects that want a useful CLI without hard-coding their own product concepts into the toolkit.

## Install

```bash
npm install @pubwave/cli
```

## Minimal Usage

```ts
import { createPubwaveCli, jsonConfig } from "@pubwave/cli";

createPubwaveCli({
  app: {
    name: "My App",
    command: "myapp"
  },
  config: jsonConfig({ scope: "user" })
}).run();
```

With `scope: "user"`, setup saves to `~/.myapp/config.json` no matter which directory the installed CLI is run from. Use `scope: "project"` for local project entrypoints and examples that should save to the project root found from the current working directory.

This enables:

```bash
myapp setup
myapp config get
myapp config set --language=ja --provider=openai --model=gpt-5.2
myapp model local list
myapp model local install --model=qwen2.5:7b
myapp model local use --model=qwen2.5:7b
myapp mobile devices
myapp mobile install
myapp help
myapp version
```

## Features

Features are optional. Commands only appear when the relevant feature is enabled.

```ts
createPubwaveCli({
  app,
  config,
  features: {
    setup: true,
    cloudModel: true,
    localModel: {
      autoInstallRuntime: true,
      autoStartRuntime: true
    },
    mobile: {
      flutter: {
        projectDir: "apps/mobile",
        releaseMode: true,
        autoInstallSdk: true,
        managedSdkDir: ".myapp/flutter-sdk",
        dartDefines: ({ runtime }) => ({
          MYAPP_API_BASE_URL: runtime?.apiBaseUrl ?? "http://127.0.0.1:4310"
        })
      }
    },
    runtime: {
      async launch(ctx, options) {
        return "Launch your runtime here.";
      }
    }
  }
}).run();
```

## Project Commands

Product-specific commands are registered by the host project. They are not fixed by Pubwave CLI.

```ts
createPubwaveCli({
  app,
  config,
  commands: [
    {
      name: "sync",
      description: "Run the project sync flow.",
      async run(ctx, options) {
        return "Synced.";
      }
    },
    {
      name: "source list",
      description: "List project sources.",
      async run() {
        return "No sources.";
      }
    }
  ]
}).run();
```

## Config Adapters

Pubwave CLI uses a small standard config shape:

```ts
interface PubwaveCliConfig {
  language?: string;
  ai?: {
    modelSource?: "cloud" | "local";
    provider?: string;
    model?: string;
    apiKey?: string;
  };
  mobile?: {
    enabled?: boolean;
    platform?: "ios" | "android";
  };
}
```

The built-in JSON adapter writes this shape to one config file:

```ts
import { jsonConfig } from "@pubwave/cli";

config: jsonConfig({ scope: "user" })
```

`scope: "user"` stores config in `~/<homeDirName>/config.json`. This is the recommended mode for CLIs installed from npm. The published `pubwave-cli` command stores its setup at:

```text
~/.pubwave-cli/config.json
```

`scope: "project"` stores config in `<cwdProjectRoot>/<homeDirName>/config.json`, where `cwdProjectRoot` is found by walking up from the current working directory using `app.workspaceMarkers`. It does not use `mobile.flutter.projectDir`, because the mobile app can live in a separate project.

The `examples/techbrief-like.ts` entrypoint uses project scope, so:

```bash
npm run example:techbrief-like -- setup
```

saves to:

```text
<current project root>/.techbrief/config.json
```

`homeDirName` defaults to `.<command>`. Set `<ENV_PREFIX>_HOME` to override the config directory explicitly. For example, `PUBWAVE_CLI_HOME=/tmp/pubwave pubwave-cli setup` writes `/tmp/pubwave/config.json`.

The same app home is used for managed runtime files such as the Flutter SDK cache:

```text
<appHome>/runtime/flutter-sdk
<appHome>/runtime/downloads
```

`mobile.flutter.projectDir` is only used as the Flutter app working directory. It does not decide where CLI config or managed runtime files are stored.

If your project has a different config shape, map it with `toCliConfig` and `fromCliConfig`.

```ts
createPubwaveCli({
  app,
  config: {
    load: loadProjectConfig,
    save: saveProjectConfig,
    toCliConfig(projectConfig) {
      return {
        language: projectConfig.app.defaultLanguage,
        ai: projectConfig.ai
      };
    },
    fromCliConfig(cliConfig, current) {
      return {
        ...current,
        app: {
          ...current.app,
          defaultLanguage: cliConfig.language ?? current.app.defaultLanguage
        },
        ai: {
          ...current.ai,
          ...cliConfig.ai
        }
      };
    }
  }
}).run();
```

## Design Boundary

Pubwave CLI provides reusable CLI capabilities. Your project owns runtime startup, sync logic, data source management, scheduling, and other product-specific commands.

## UI

Built-in commands render with Ink. The default `setup` command is an interactive keyboard wizard:

- Up/down changes the selected choice.
- Enter moves to the next step or saves.
- Left arrow goes back.
- Delete removes an installed local model from Ollama.
- `c` on a cloud model step lets the user type a custom model name.
- Escape exits.

### Multilingual wizard

The setup wizard UI is fully localized into nine languages. The active language is detected automatically from the system time zone, or the user can choose it as the first setup step.

| Locale | Language |
| ------ | -------- |
| `en` | English |
| `zh-CN` | Simplified Chinese |
| `zh-TW` | Traditional Chinese |
| `ja` | Japanese |
| `ko` | Korean |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `pt` | Portuguese |

All wizard copy lives in `src/shared/i18n/wizard/locales/`. **Every text change must be applied to all nine locale files.** Locale files that do not override a key fall back to their base catalog (`enCatalog` or `zhCnCatalog`), but the base catalog must also be updated when new keys are added.

When a local model is selected, setup checks Ollama, installs it automatically by default when it is missing, starts the local runtime, pulls the selected model, verifies it, and streams progress/output in the setup view. Set `localModel.autoInstallRuntime: false` to require users to install Ollama themselves.

Commands also accept flags for non-interactive use:

```bash
myapp setup --language=ja --model-source=cloud --provider=openai --model=gpt-5.2
```

Flutter mobile projects also get:

```bash
myapp mobile devices
myapp mobile install
myapp mobile run android
myapp mobile run ios
```

`mobile install` checks Flutter, can use the managed Flutter SDK when `autoInstallSdk` is enabled, detects connected Android/iOS devices automatically, runs `flutter pub get`, and installs/runs the app on the connected phone. If multiple supported phones are connected, it installs to all of them unless `--device=<id>` is provided.
