import { DockerService } from "./services/DockerService";
import { UIManager } from "./UIManager";

function main() {
  const dockerService = new DockerService();
  const uiManager = new UIManager(dockerService);
  uiManager.startAutoRefresh();
}

main();
