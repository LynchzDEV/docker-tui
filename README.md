# Docker Monitor TUI

A terminal-based user interface (TUI) for monitoring and managing your Docker containers. This project displays container information, CPU and memory usage charts, and provides a control panel with buttons to start, stop, restart, and delete containers—all from the terminal!

## Preview
![Docker TUI Preview](./previews/showcase.png)

## Features

- **Container List:**  
  - Displays container ID, image, status, and ports.
  - Navigate using arrow keys.
- **Stats Charts:**  
  - Real-time CPU usage (%) and dynamic Memory usage (MB) charts.
  - Charts dynamically adjust their scale based on current usage.
- **Logs View:**  
  - Shows live logs for the selected container.
  - Press `enter` to view logs.
- **Control Panel:**  
  - Vertical button layout with actions: Start, Stop, Restart, and Delete.
  - Click (or press enter when focused) to execute commands on the selected container.

## Prerequisites

- **Docker:** Ensure Docker is installed and running on your system.
- **Bun:** This project uses [Bun](https://bun.sh) as the runtime. Install Bun from the [official website](https://bun.sh/).

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/docker-monitor-tui.git
   cd docker-monitor-tui
   ```

2. **Install dependencies using Bun:**

   Bun supports TypeScript out-of-the-box, so you can install dependencies with:

   ```bash
   bun install
   ```

   *(Make sure you have a `package.json` if you plan to manage dependencies.)*

## Project Structure

```
/src
  /services
    DockerService.ts       # Fetches Docker container and stats data.
  /views
    ContainerListView.ts   # UI component for listing containers.
    StatsChartView.ts      # UI component for CPU and Memory charts.
    LogView.ts             # UI component for container logs.
    ControlPanelView.ts    # UI component with action buttons.
  UIManager.ts             # Wires all views and services; handles key bindings.
  index.ts                 # Entry point of the application.
```

## Usage

### Running the Project with Bun

Bun can run TypeScript directly. From the project root, simply run:

```bash
bun run src/index.ts
```

The TUI will open in your terminal, displaying the container list, charts, logs, and control panel.

### Keyboard & Mouse Controls

- **Navigation:** Use arrow keys to select a container.
- **Logs:** Press `enter` to view container logs.
- **Control Panel:** Click (or focus and press `enter`) on any of the vertical buttons (Start, Stop, Restart, Delete) to execute Docker commands on the selected container.
- **Exit:** Press `q` or `Ctrl + C` to exit the TUI.

## Extending the Project

- **Adding New Views:** Create additional views (e.g., for network stats) under `/src/views` and integrate them into `UIManager.ts`.
- **Improving Commands:** Extend the Docker commands in `DockerService.ts` and in the control panel actions.
- **Testing:** Consider writing tests by mocking Docker responses and UI events.

## Contributing

Contributions are welcome! Feel free to fork this repository and submit pull requests for any improvements or bug fixes.

## License

This project is licensed under the [MIT License](LICENSE).

---

Enjoy monitoring and managing your Docker containers from the terminal!
