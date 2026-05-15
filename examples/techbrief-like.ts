import { fileURLToPath } from "node:url";
import { createPubwaveCli, jsonConfig } from "../src/index.js";

const techbriefMobileDir = fileURLToPath(new URL("../../techbrief/apps/mobile/", import.meta.url));

const cli = createPubwaveCli({
  app: {
    name: "TechBrief",
    command: "techbrief",
    version: "0.1.0"
  },
  config: jsonConfig({ scope: "project" }),
  features: {
    setup: true,
    cloudModel: true,
    localModel: true,
    mobile: {
      flutter: {
        projectDir: techbriefMobileDir,
        dartDefines: ({ runtime }) => ({
          TECHBRIEF_API_BASE_URL: runtime?.apiBaseUrl ?? "http://127.0.0.1:4310"
        })
      }
    },
    runtime: {
      async launch() {
        return "TechBrief runtime launch adapter would run here.";
      }
    }
  },
  commands: [
    {
      name: "sync",
      description: "Run the project-specific sync flow.",
      async run() {
        return "TechBrief sync adapter would run here.";
      }
    }
  ]
});

await cli.run(process.argv.slice(2));
