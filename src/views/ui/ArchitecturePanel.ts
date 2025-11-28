import { WallType, ZoneType } from '../../model/enums';
import { GameState } from '../../model/GameState';

export type ArchitectureToolType = 'wall' | 'zone';

export interface ArchitectureTool {
  type: ArchitectureToolType;
  value: WallType | ZoneType;
  label: string;
  cost: number;
  color?: string; // For zones
}

export class ArchitecturePanel {
  private activeTab: 'construction' | 'zones' = 'construction';
  public activeTool: ArchitectureTool | null = null;

  private readonly TAB_HEIGHT = 40;
  private readonly ITEM_HEIGHT = 50;

  // Tools Definitions
  private readonly WALL_TOOLS: ArchitectureTool[] = [
    { type: 'wall', value: WallType.None, label: 'Usuń Ścianę', cost: 10 },
    { type: 'wall', value: WallType.Brick, label: 'Ceglana Ściana', cost: 50 },
    { type: 'wall', value: WallType.Drywall, label: 'Ściana G-K', cost: 30 },
  ];

  private readonly ZONE_TOOLS: ArchitectureTool[] = [
    { type: 'zone', value: ZoneType.Kitchen, label: 'Kuchnia', cost: 0, color: 'rgba(255, 0, 0, 0.3)' },
    { type: 'zone', value: ZoneType.Dining, label: 'Sala Jadalna', cost: 0, color: 'rgba(0, 255, 0, 0.3)' },
    { type: 'zone', value: ZoneType.Storage, label: 'Magazyn', cost: 0, color: 'rgba(0, 0, 255, 0.3)' },
    { type: 'zone', value: ZoneType.Staff, label: 'Pokój Socjalny', cost: 0, color: 'rgba(255, 255, 0, 0.3)' },
  ];

  constructor() {}

  public render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    // Background
    ctx.fillStyle = 'rgba(40, 30, 20, 0.95)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // --- TABS ---
    const tabWidth = width / 2;
    const tabs = [
      { key: 'construction', label: 'KONSTRUKCJA' },
      { key: 'zones', label: 'STREFY' }
    ];

    tabs.forEach((tab, index) => {
      const tX = x + index * tabWidth;
      const isActive = this.activeTab === tab.key;

      ctx.fillStyle = isActive ? '#A0522D' : '#553322';
      ctx.fillRect(tX, y, tabWidth, this.TAB_HEIGHT);
      ctx.strokeRect(tX, y, tabWidth, this.TAB_HEIGHT);

      ctx.fillStyle = isActive ? '#FFFFFF' : '#AAAAAA';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tab.label, tX + tabWidth / 2, y + this.TAB_HEIGHT / 2);
    });

    // --- TOOL LIST ---
    const contentY = y + this.TAB_HEIGHT;
    const tools = this.activeTab === 'construction' ? this.WALL_TOOLS : this.ZONE_TOOLS;

    tools.forEach((tool, index) => {
      const itemY = contentY + index * this.ITEM_HEIGHT;
      const isSelected = this.activeTool === tool;

      // Item Background
      ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(x + 5, itemY + 5, width - 10, this.ITEM_HEIGHT - 10);

      if (isSelected) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeRect(x + 5, itemY + 5, width - 10, this.ITEM_HEIGHT - 10);
      }

      // Icon / Color Preview
      if (tool.type === 'zone' && tool.color) {
        ctx.fillStyle = tool.color.replace('0.3', '1.0'); // Full opacity for icon
        ctx.fillRect(x + 15, itemY + 15, 20, 20);
        ctx.strokeStyle = '#FFF';
        ctx.strokeRect(x + 15, itemY + 15, 20, 20);
      } else {
        // Wall Icon Placeholder
        ctx.fillStyle = '#888';
        ctx.fillRect(x + 15, itemY + 15, 20, 20);
        if (tool.value === WallType.None) {
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 15, itemY + 15);
          ctx.lineTo(x + 35, itemY + 35);
          ctx.moveTo(x + 35, itemY + 15);
          ctx.lineTo(x + 15, itemY + 35);
          ctx.stroke();
        }
      }

      // Label
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(tool.label, x + 50, itemY + this.ITEM_HEIGHT / 2);

      // Cost
      if (tool.cost > 0) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.fillText(`$${tool.cost}`, x + width - 15, itemY + this.ITEM_HEIGHT / 2);
      }
    });
  }

  public handleClick(localX: number, localY: number, width: number): ArchitectureTool | null {
    // 1. Tabs
    if (localY < this.TAB_HEIGHT) {
      const tabWidth = width / 2;
      const index = Math.floor(localX / tabWidth);
      if (index === 0) this.activeTab = 'construction';
      if (index === 1) this.activeTab = 'zones';
      this.activeTool = null; // Deselect when switching tabs
      return null;
    }

    // 2. Tools
    const contentY = this.TAB_HEIGHT;
    const tools = this.activeTab === 'construction' ? this.WALL_TOOLS : this.ZONE_TOOLS;

    const itemIndex = Math.floor((localY - contentY) / this.ITEM_HEIGHT);

    if (itemIndex >= 0 && itemIndex < tools.length) {
      this.activeTool = tools[itemIndex];
      return this.activeTool;
    }

    return null;
  }
}
