import blessed, { Widgets } from "blessed";
import { exec, ChildProcess } from "child_process";

export class LogView {
  private logBox: Widgets.Log;
  private currentLogProcess: ChildProcess | null = null;

  // Accept grid coordinates for flexible placement.
  constructor(
    private gridArea: any,
    top: number,
    left: number,
    height: number,
    width: number,
  ) {
    this.logBox = gridArea.set(top, left, height, width, blessed.log, {
      label: "Container Logs",
      border: "line",
      scrollable: true,
      scrollbar: { ch: "|" },
      alwaysScroll: true,
    });
  }

  showLogs(containerID: string) {
    if (this.currentLogProcess) {
      this.currentLogProcess.kill();
      this.currentLogProcess = null;
    }
    this.logBox.setContent(`Fetching logs for ${containerID}...\n`);
    const logProcess: ChildProcess = exec(`docker logs -f ${containerID}`);
    this.currentLogProcess = logProcess;
    logProcess.stdout?.on("data", (data) => {
      this.logBox.log(data.trim());
      this.logBox.setScrollPerc(100);
    });
    logProcess.stderr?.on("data", (data) => {
      this.logBox.log(`Error: ${data}`);
    });
    this.logBox.screen?.once("keypress", (_ch, key) => {
      if (key.name === "q") {
        logProcess.kill();
        this.currentLogProcess = null;
      }
    });
  }
}
