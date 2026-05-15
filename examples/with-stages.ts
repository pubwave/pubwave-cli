import {
  createPubwaveCli,
  jsonConfig,
  type PubwaveCliConfig,
  type SetupStage,
  type StageResult
} from "../src/index.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const launchStage: SetupStage<PubwaveCliConfig> = {
  id: "demo-launch",
  insertAfter: "save-config",
  title: "Launching demo runtime",
  async run(ctx): Promise<StageResult> {
    const handle = ctx.progress.beginIndeterminate("Booting demo runtime", "yellow");
    await sleep(800);
    handle.complete("Demo runtime ready", "green");
    return { status: "ok" };
  }
};

const syncStage: SetupStage<PubwaveCliConfig> = {
  id: "demo-sync",
  insertAfter: "save-config",
  title: "Demo initial sync",
  async run(ctx): Promise<StageResult> {
    const total = 8;
    const counter = ctx.progress.beginCounted("Syncing demo items", total, "cyanBright");
    for (let i = 1; i <= total; i++) {
      await sleep(150);
      counter.advance(1, `item ${i}`);
    }
    counter.complete("Demo sync complete");
    return { status: "ok" };
  }
};

const summaryStage: SetupStage<PubwaveCliConfig> = {
  id: "demo-summary",
  insertAfter: "save-config",
  title: "Demo status summary",
  async run(ctx): Promise<StageResult> {
    ctx.progress.appendStatusCard({
      id: "demo-status",
      title: "Demo ready",
      color: "green",
      rows: [
        { label: "API", value: "http://127.0.0.1:9999" },
        { label: "Web", value: "http://127.0.0.1:9998" }
      ],
      hint: "Open the URLs above to use the demo."
    });
    return { status: "ok" };
  }
};

const cli = createPubwaveCli({
  app: {
    name: "WithStages",
    command: "with-stages",
    version: "0.0.0"
  },
  config: jsonConfig({ scope: "user" }),
  features: {
    setup: {
      stages: [launchStage, syncStage, summaryStage]
    },
    cloudModel: true,
    localModel: true
  }
});

await cli.run(process.argv.slice(2));
