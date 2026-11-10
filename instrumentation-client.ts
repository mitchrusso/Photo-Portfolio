import { analytics } from "@heycatch/sdk"

analytics.init({
  projectKey: "hck_pk_7nWhwXJIidoRuE136LFSUsNH4fwQZvCc",
  install: {
    agent: "codex",
    framework: "nextjs",
    frameworkVersion: "16",
  },
  optOutCapturingByDefault: true,
})
