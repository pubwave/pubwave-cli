#!/usr/bin/env node
import { createPubwaveCli, jsonConfig } from "./index.js";

const cli = createPubwaveCli({
  app: {
    name: "Pubwave CLI",
    command: "pubwave-cli"
  },
  config: jsonConfig({ scope: "user" }),
  features: {
    setup: true,
    cloudModel: true,
    localModel: true
  }
});

await cli.run(process.argv.slice(2));
