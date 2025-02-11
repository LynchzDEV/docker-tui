import blessed, { Widgets } from "blessed";
import contrib from "blessed-contrib";

export class ContainerListView {
  public table: Widgets.TableElement;
  private rawData: string[][] = [];
  private selectedIndex: number = 0;

  constructor(private gridArea: any) {
    this.table = gridArea.set(0, 0, 6, 4, contrib.table, {
      keys: true,
      fg: "cyan",
      label: "Containers",
      columnSpacing: 2,
      columnWidth: [12, 20, 15, 20], // Added extra column for Ports.
      interactive: true,
      tags: true,
      style: {
        header: { fg: "cyan", bold: true },
        cell: { fg: "white", selected: { bg: "blue" } },
      },
    });

    // Update selected index on arrow key presses.
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
    const currentSelected = this.selectedIndex;
    this.rawData = data;
    this.table.setData({
      headers: ["ID", "Image", "Status", "Ports"],
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
