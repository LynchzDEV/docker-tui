import blessed, { Widgets } from 'blessed';
import contrib from 'blessed-contrib';
import { ContainerStats } from '../services/DockerService';

export class StatsChartView {
  private cpuChart: Widgets.LineElement;
  private memChart: Widgets.LineElement;
  private cpuHistory: Record<string, number[]> = {};
  private memHistory: Record<string, number[]> = {};
  private timestamps: string[] = [];
  private colorMap: Record<string, string> = {};
  private colorPalette: string[] = [
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white',
    'grey',
  ];

  constructor(private gridArea: any) {
    this.cpuChart = gridArea.set(0, 4, 6, 4, contrib.line, {
      label: 'CPU Usage (%)',
      showLegend: true,
      minY: 0,
      maxY: 100,
    });
    this.memChart = gridArea.set(0, 8, 6, 4, contrib.line, {
      label: 'Memory Usage (MB)',
      showLegend: true,
      minY: 0,
      maxY: 4096,
    });
  }

  update(stats: ContainerStats[]) {
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
        title: 'No Data',
        x: [...this.timestamps],
        y: Array(this.timestamps.length).fill(0),
      });
    }
    if (memData.length === 0) {
      memData.push({
        title: 'No Data',
        x: [...this.timestamps],
        y: Array(this.timestamps.length).fill(0),
      });
    }

    const allMemValues = Object.values(this.memHistory).flat();
    const computedMax = allMemValues.length > 0 ? Math.max(...allMemValues) : 0;
    const dynamicMax = computedMax > 0 ? computedMax * 1.1 : 100;
    this.memChart.options.maxY = dynamicMax;

    this.cpuChart.setData(cpuData);
    this.memChart.setData(memData);
  }
}
