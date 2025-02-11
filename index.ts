import blessed, { Widgets } from "blessed";
import contrib from "blessed-contrib";
import { exec, ChildProcess } from "child_process";

/**
 * Service to fetch Docker container and stats data.
 */
class DockerService {
  getContainers(): Promise<string[][]> {
    return new Promise((resolve) => {
      exec(
        'docker ps --format "{{.ID}}|{{.Image}}|{{.Status}}"',
        (err, stdout) => {
          if (err) return resolve([["Error", "N/A", "N/A"]]);
          const data = stdout
            .trim()
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => line.split("|").map((field) => field.trim()));
          resolve(data.length > 0 ? data : [["No Containers", "N/A", "N/A"]]);
        },
      );
    });
  }

  getStats(): Promise<Array<{ name: string; cpu: number; mem: number }>> {
    return new Promise((resolve) => {
      exec(
        'docker stats --no-stream --format "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}"',
        (err, stdout) => {
          if (err || !stdout) return resolve([]);
          const lines = stdout
            .trim()
            .split("\n")
            .filter((line) => line.trim() !== "");
          const stats = lines.map((line) => {
            // Trim each field to ensure proper keys for color mapping.
            let [name, cpu, mem] = line.split("|");
            name = name.trim();
            cpu = cpu.trim();
            mem = mem.trim();
            const cpuVal = parseFloat(cpu.replace("%", "")) || 0;
            const memVal =
              parseFloat(mem.split("/")[0].replace("MiB", "").trim()) || 0;
            return { name, cpu: cpuVal, mem: memVal };
          });
          resolve(stats);
        },
      );
    });
  }
}

/**
 * Manages the container table UI.
 */
class ContainerListView {
  public table: Widgets.TableElement;
  private rawData: string[][] = [];
  private selectedIndex: number = 0;

  constructor(private gridArea: any) {
    this.table = gridArea.set(0, 0, 6, 4, contrib.table, {
      keys: true,
      fg: "cyan",
      label: "Containers",
      columnSpacing: 2,
      columnWidth: [12, 20, 15],
      interactive: true,
      tags: true,
      style: {
        header: { fg: "cyan", bold: true },
        cell: { fg: "white", selected: { bg: "blue" } },
      },
    });

    // Listen for arrow key presses on the table to update our own selected index.
    this.table.rows.on("keypress", (_ch, key) => {
      if (key.name === "up") {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      } else if (key.name === "down") {
        this.selectedIndex = Math.min(
          this.rawData.length - 1,
          this.selectedIndex + 1,
        );
      }
      this.table.rows.select(this.selectedIndex);
    });

    this.table.focus();
  }

  updateData(data: string[][]) {
    // Preserve current selection if still in bounds.
    const currentSelected = this.selectedIndex;
    this.rawData = data;
    this.table.setData({
      headers: ["ID", "Image", "Status"],
      data: data,
    });
    if (currentSelected >= data.length) {
      this.selectedIndex = 0;
    }
    this.table.rows.select(this.selectedIndex);
    this.table.focus();
  }

  getSelectedContainer(): string | null {
    return this.rawData[this.selectedIndex]
      ? this.rawData[this.selectedIndex][0]
      : null;
  }
}

/**
 * Manages the CPU and Memory charts.
 */
class StatsChartView {
  private cpuChart: Widgets.LineElement;
  private memChart: Widgets.LineElement;
  private cpuHistory: Record<string, number[]> = {};
  private memHistory: Record<string, number[]> = {};
  // Start with an empty array and add timestamps as updates occur.
  private timestamps: string[] = [];
  // Map container names to unique colors.
  private colorMap: Record<string, string> = {};
  private colorPalette: string[] = [
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
    "grey",
  ];

  constructor(private gridArea: any) {
    this.cpuChart = gridArea.set(0, 4, 6, 4, contrib.line, {
      label: "CPU Usage (%)",
      showLegend: true,
      minY: 0,
      maxY: 100,
    });
    // Initially set a default maxY for memory usage.
    this.memChart = gridArea.set(0, 8, 6, 4, contrib.line, {
      label: "Memory Usage (MB)",
      showLegend: true,
      minY: 0,
      maxY: 4096,
    });
  }

  update(stats: Array<{ name: string; cpu: number; mem: number }>) {
    // Add new timestamp on each update.
    const now = new Date().toLocaleTimeString();
    this.timestamps.push(now);
    if (this.timestamps.length > 20) this.timestamps.shift();

    const cpuData: {
      title: string;
      x: string[];
      y: number[];
      style?: { line: string };
    }[] = [];
    const memData: {
      title: string;
      x: string[];
      y: number[];
      style?: { line: string };
    }[] = [];

    stats.forEach((stat) => {
      // Maintain a fixed-length history.
      if (!this.cpuHistory[stat.name])
        this.cpuHistory[stat.name] = Array(20).fill(0);
      this.cpuHistory[stat.name].push(stat.cpu);
      if (this.cpuHistory[stat.name].length > 20)
        this.cpuHistory[stat.name].shift();

      if (!this.memHistory[stat.name])
        this.memHistory[stat.name] = Array(20).fill(0);
      this.memHistory[stat.name].push(stat.mem);
      if (this.memHistory[stat.name].length > 20)
        this.memHistory[stat.name].shift();

      // Assign a unique color based on the trimmed container name.
      if (!this.colorMap[stat.name]) {
        this.colorMap[stat.name] =
          this.colorPalette[
            Object.keys(this.colorMap).length % this.colorPalette.length
          ];
      }
      const color = this.colorMap[stat.name];

      cpuData.push({
        title: stat.name,
        x: [...this.timestamps],
        y: [...this.cpuHistory[stat.name]],
        style: { line: color },
      });
      memData.push({
        title: stat.name,
        x: [...this.timestamps],
        y: [...this.memHistory[stat.name]],
        style: { line: color },
      });
    });

    if (cpuData.length === 0) {
      cpuData.push({
        title: "No Data",
        x: [...this.timestamps],
        y: Array(this.timestamps.length).fill(0),
      });
    }
    if (memData.length === 0) {
      memData.push({
        title: "No Data",
        x: [...this.timestamps],
        y: Array(this.timestamps.length).fill(0),
      });
    }

    // *** Dynamic Memory Range Calculation ***
    // Gather all memory usage values from history.
    const allMemValues = Object.values(this.memHistory).flat();
    // Compute the highest memory usage value.
    const computedMax = allMemValues.length > 0 ? Math.max(...allMemValues) : 0;
    // Set a dynamic max: use computedMax*1.1 (for a 10% headroom) or a default minimum (e.g. 100 MB)
    const dynamicMax = computedMax > 0 ? computedMax * 1.1 : 100;
    // Update the chart's maxY option dynamically.
    this.memChart.options.maxY = dynamicMax;
    // ******************************************

    this.cpuChart.setData(cpuData);
    this.memChart.setData(memData);
  }
}

/**
 * Manages the container logs panel.
 */
class LogView {
  private logBox: Widgets.Log;
  private currentLogProcess: ChildProcess | null = null;

  constructor(private gridArea: any) {
    this.logBox = gridArea.set(6, 0, 6, 12, blessed.log, {
      label: "Container Logs",
      border: "line",
      scrollable: true,
      scrollbar: { ch: "|" },
      alwaysScroll: true,
    });
  }

  showLogs(containerID: string) {
    // Terminate any existing log process.
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
    // Listen once for the 'q' key to stop the log stream.
    this.logBox.screen?.once("keypress", (_ch, key) => {
      if (key.name === "q") {
        logProcess.kill();
        this.currentLogProcess = null;
      }
    });
  }
}

/**
 * Manages overall UI rendering and key bindings.
 */
class UIManager {
  private screen: Widgets.Screen;
  private grid: any;
  private containerListView: ContainerListView;
  private statsChartView: StatsChartView;
  private logView: LogView;

  constructor(private dockerService: DockerService) {
    this.screen = blessed.screen({
      smartCSR: true,
      title: "Docker Monitor TUI",
    });
    this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

    this.containerListView = new ContainerListView(this.grid);
    this.statsChartView = new StatsChartView(this.grid);
    this.logView = new LogView(this.grid);

    this.setupKeyBindings();
  }

  private setupKeyBindings() {
    // On ENTER, show logs for the selected container.
    this.screen.key(["enter"], () => {
      const selected = this.containerListView.getSelectedContainer();
      if (selected) this.logView.showLogs(selected);
    });
    this.screen.key(["q", "C-c"], () => process.exit(0));
  }

  async refreshContainers() {
    const data = await this.dockerService.getContainers();
    this.containerListView.updateData(data);
    this.screen.render();
  }

  async refreshStats() {
    const stats = await this.dockerService.getStats();
    this.statsChartView.update(stats);
    this.screen.render();
  }

  startAutoRefresh(interval: number = 5000) {
    this.refreshContainers();
    this.refreshStats();
    setInterval(() => {
      this.refreshContainers();
      this.refreshStats();
    }, interval);
  }
}

/**
 * Main entry point.
 */
function main() {
  const dockerService = new DockerService();
  const uiManager = new UIManager(dockerService);
  uiManager.startAutoRefresh();
}

main();
