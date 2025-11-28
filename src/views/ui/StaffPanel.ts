import { EmployeeRole } from '../../model/enums';
import { GameState } from '../../model/GameState';
import { Restaurant } from '../../model/Restaurant';
import { Employee } from '../../model/Employee';

const RECRUIT_PANEL_WIDTH = 250; // Matching logic in InteriorView
const RECRUIT_BTN_HEIGHT = 50;
const RECRUIT_BTN_MARGIN = 10;

export class StaffPanel {
  private panelX: number;
  private panelY: number;
  private height: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.panelX = canvasWidth - RECRUIT_PANEL_WIDTH;
    this.panelY = 40;
    this.height = canvasHeight - this.panelY;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.panelX, this.panelY, RECRUIT_PANEL_WIDTH, this.height);

    const candidates = [
      { role: 'Kucharz', cost: 500, type: EmployeeRole.Chef },
      { role: 'Kelner', cost: 300, type: EmployeeRole.Waiter }
    ];

    const playerMoney = GameState.getInstance().player.money;

    candidates.forEach((cand, index) => {
      const itemY = this.panelY + (RECRUIT_BTN_HEIGHT + RECRUIT_BTN_MARGIN) * index + RECRUIT_BTN_MARGIN;

      ctx.fillStyle = '#555';
      ctx.fillRect(this.panelX + RECRUIT_BTN_MARGIN, itemY, RECRUIT_PANEL_WIDTH - 2 * RECRUIT_BTN_MARGIN, RECRUIT_BTN_HEIGHT);

      const canAfford = playerMoney >= cand.cost;
      ctx.fillStyle = canAfford ? 'white' : '#ff4444';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(cand.role, this.panelX + 20, itemY + RECRUIT_BTN_HEIGHT / 2);

      ctx.textAlign = 'right';
      ctx.fillText(`$${cand.cost}`, this.panelX + RECRUIT_PANEL_WIDTH - 20, itemY + RECRUIT_BTN_HEIGHT / 2);
    });
  }

  public handleClick(x: number, y: number, restaurant: Restaurant): void {
    if (x < this.panelX) return;

    const candidates = [
      { role: 'Kucharz', cost: 500, type: EmployeeRole.Chef },
      { role: 'Kelner', cost: 300, type: EmployeeRole.Waiter }
    ];

    candidates.forEach((cand, i) => {
      const itemY = this.panelY + (RECRUIT_BTN_HEIGHT + RECRUIT_BTN_MARGIN) * i + RECRUIT_BTN_MARGIN;
      if (y >= itemY && y <= itemY + RECRUIT_BTN_HEIGHT) {
        this.hireEmployee(cand.type, cand.cost, restaurant);
      }
    });
  }

  private hireEmployee(role: EmployeeRole, cost: number, restaurant: Restaurant): void {
    const player = GameState.getInstance().player;
    if (player.money < cost) {
      console.log("Not enough money to hire!");
      return;
    }

    const spot = this.findFreeSpot(restaurant);
    if (!spot) {
      console.log("No free space for new employee!");
      return;
    }

    player.spendMoney(cost);
    const name = role === EmployeeRole.Chef ? "Chef Luigi" : "Waiter Mario";
    const employee = new Employee(name, role, 1, 100);
    employee.gridX = spot.x;
    employee.gridY = spot.y;

    restaurant.employees.push(employee);
    console.log(`Hired ${name} at ${spot.x}, ${spot.y}`);
  }

  private findFreeSpot(restaurant: Restaurant): { x: number, y: number } | null {
    for (let y = 1; y < restaurant.height - 1; y++) {
      for (let x = 1; x < restaurant.width - 1; x++) {
        if (this.isSpotFree(x, y, restaurant)) {
          return { x, y };
        }
      }
    }
    return null;
  }

  private isSpotFree(x: number, y: number, restaurant: Restaurant): boolean {
    const tile = restaurant.getTile(x, y);
    if (!tile || tile.type === 'wall') return false;

    // Check furniture
    for (const item of restaurant.furniture) {
      if (x >= item.gridX && x < item.gridX + item.width &&
        y >= item.gridY && y < item.gridY + item.height) {
        return false;
      }
    }

    // Check other employees
    for (const emp of restaurant.employees) {
      if (emp.gridX === x && emp.gridY === y) return false;
    }

    return true;
  }
}
