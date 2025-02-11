import blessed, { Widgets } from "blessed";
import contrib from "blessed-contrib";
import { exec } from "child_process";
import { DockerService } from "./services/DockerService";
import { ContainerListView } from "./views/ContainerListView";
import { StatsChartView } from "./views/StatsChartView";
import { LogView } from "./views/LogView";
import { ControlPanelView, ControlAction } from "./views/ControlPanelView";

export class UIManager {
  private screen: Widgets.Screen;
  private grid: any;
  private containerListView: ContainerListView;
  private statsChartView: StatsChartView;
  private controlPanelView: ControlPanelView;
  private logView: LogView;

  constructor(private dockerService: DockerService) {
    this.screen = blessed.screen({
      smartCSR: true,
      title: "Docker Monitor TUI",
    });
    this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

    this.containerListView = new ContainerListView(this.grid);
    this.statsChartView = new StatsChartView(this.grid);
    // Place control panel in row 6 (2 rows high)
    this.controlPanelView = new ControlPanelView(this.grid);
    // Place log view in row 8 (4 rows high)
    this.logView = new LogView(this.grid, 8, 0, 4, 12);

    this.setupKeyBindings();

    // Wire control panel actions.
    this.controlPanelView.onAction((action: ControlAction) => {
      const containerID = this.containerListView.getSelectedContainer();
      if (containerID) {
        switch (action) {
          case "start":
            exec(`docker start ${containerID}`, () => {
              this.refreshContainers();
              this.logView.showLogs(containerID);
            });
            break;
          case "stop":
            exec(`docker stop ${containerID}`, () => {
              this.refreshContainers();
              this.logView.showLogs(containerID);
            });
            break;
          case "restart":
            exec(`docker restart ${containerID}`, () => {
              this.refreshContainers();
              this.logView.showLogs(containerID);
            });
            break;
          case "delete":
            exec(`docker rm ${containerID}`, () => {
              this.refreshContainers();
              this.logView.showLogs("");
            });
            break;
        }
      }
    });
  }

  private setupKeyBindings() {
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
