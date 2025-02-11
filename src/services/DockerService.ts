import { exec } from "child_process";

export interface ContainerStats {
  name: string;
  cpu: number;
  mem: number;
}

export class DockerService {
  // Now include all containers (-a) and extra info (Ports).
  getContainers(): Promise<string[][]> {
    return new Promise((resolve) => {
      exec(
        'docker ps -a --format "{{.ID}}|{{.Image}}|{{.Status}}|{{.Ports}}"',
        (err, stdout) => {
          if (err) return resolve([["Error", "N/A", "N/A", "N/A"]]);
          const data = stdout
            .trim()
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => line.split("|").map((field) => field.trim()));
          resolve(
            data.length > 0 ? data : [["No Containers", "N/A", "N/A", "N/A"]],
          );
        },
      );
    });
  }

  getStats(): Promise<ContainerStats[]> {
    return new Promise((resolve) => {
      exec(
        'docker stats --no-stream --format "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}"',
        (err, stdout) => {
          if (err || !stdout) return resolve([]);
          const lines = stdout
            .trim()
            .split("\n")
            .filter((line) => line.trim() !== "");
          const stats: ContainerStats[] = lines.map((line) => {
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
