import blessed, { Widgets } from "blessed";

export type ControlAction = "start" | "stop" | "restart" | "delete";

export class ControlPanelView {
  public box: Widgets.BoxElement;
  private buttons: Record<ControlAction, Widgets.ButtonElement> = {} as any;
  private actionCallback: ((action: ControlAction) => void) | null = null;

  constructor(private gridArea: any) {
    this.box = gridArea.set(6, 0, 2, 12, blessed.box, {
      label: "Control Panel (Click a button)",
      border: "line",
      style: { border: { fg: "yellow" } },
    });

    const actions: ControlAction[] = ["start", "stop", "restart", "delete"];
    const buttonWidth = Math.floor(100 / actions.length) + "%";
    actions.forEach((action, index) => {
      const button = blessed.button({
        parent: this.box,
        mouse: true,
        keys: true,
        shrink: true,
        padding: { left: 1, right: 1 },
        left: index * (100 / actions.length) + "%",
        top: "center",
        width: buttonWidth,
        content: action.toUpperCase(),
        style: {
          bg: "blue",
          focus: { bg: "green" },
          hover: { bg: "green" },
        },
      });

      button.on("press", () => {
        if (this.actionCallback) {
          this.actionCallback(action);
        }
      });

      this.buttons[action] = button;
    });
  }

  onAction(callback: (action: ControlAction) => void) {
    this.actionCallback = callback;
  }
}
