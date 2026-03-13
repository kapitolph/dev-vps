import * as p from "@clack/prompts";
import type { Machine, VersionInfo } from "../types";
import { cmdSetup } from "../commands/setup";
import { cmdUpdate } from "../commands/update";
import { cmdStart } from "../commands/start";
import { cmdSessions } from "../commands/sessions";

export async function mainMenu(machine: Machine, npdevUser: string, version: VersionInfo, machineOverride?: string): Promise<void> {
  const hasUpdate = version.latest && version.latest !== version.current;

  while (true) {
    const updateHint = hasUpdate
      ? `new version available: v${version.latest}`
      : "fetch latest npdev + machines";

    const action = await p.select({
      message: "What would you like to do?",
      options: [
        { value: "new-session", label: "New session", hint: "create or attach to a named tmux session" },
        { value: "sessions", label: "Sessions", hint: "view, join, or end sessions" },
        { value: "setup", label: "Setup", hint: "configure developer identity" },
        { value: "update", label: hasUpdate ? "Update (new version available!)" : "Update", hint: updateHint },
        { value: "exit", label: "Exit" },
      ],
    });

    if (p.isCancel(action) || action === "exit") {
      p.outro("Bye!");
      process.exit(0);
    }

    switch (action) {
      case "new-session": {
        const name = await p.text({
          message: "Session name",
          validate: (v) => {
            if (!v) return "Required";
            if (!/^[a-zA-Z0-9_-]+$/.test(v)) return "Only letters, numbers, hyphens, underscores";
            return undefined;
          },
        });
        if (p.isCancel(name)) break;

        const desc = await p.text({
          message: "Description (optional)",
          placeholder: "press enter to skip",
        });
        if (p.isCancel(desc)) break;

        await cmdStart(machine, name, npdevUser, (desc as string) || "(no description)");
        break;
      }
      case "sessions":
        await cmdSessions(machine, npdevUser);
        break;
      case "setup":
        await cmdSetup(machineOverride);
        break;
      case "update":
        await cmdUpdate();
        break;
    }
  }
}
