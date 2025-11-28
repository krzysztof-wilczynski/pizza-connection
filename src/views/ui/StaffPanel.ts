import { EmployeeRole, EmployeeState } from '../../model/enums';
import { GameState } from '../../model/GameState';
import { Restaurant } from '../../model/Restaurant';
import { Employee } from '../../model/Employee';

export class StaffPanel {
  private scrollY: number = 0;
  private readonly ITEM_HEIGHT = 80;

  // Hiring Candidates
  private candidates = [
    { role: 'Kucharz', cost: 500, type: EmployeeRole.Chef, desc: 'Cooks pizzas.' },
    { role: 'Kelner', cost: 300, type: EmployeeRole.Waiter, desc: 'Serves customers.' }
  ];

  constructor() {}

  public render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, restaurant: Restaurant): void {
    // Content Background
    ctx.fillStyle = 'rgba(40, 30, 20, 0.95)';
    ctx.fillRect(x, y, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    const playerMoney = GameState.getInstance().player.money;
    let currentY = y - this.scrollY + 10; // 10px padding top

    // --- SECTION: HIRE NEW ---
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('HIRE STAFF', x + 10, currentY);
    currentY += 25;

    this.candidates.forEach((cand, index) => {
        // Skip if out of view
        if (currentY + this.ITEM_HEIGHT < y || currentY > y + height) {
            currentY += this.ITEM_HEIGHT + 10;
            return;
        }

        // Card Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x + 5, currentY, width - 10, this.ITEM_HEIGHT);

        // Icon / Emoji
        ctx.fillStyle = cand.type === EmployeeRole.Chef ? '#fff' : '#000';
        ctx.fillRect(x + 15, currentY + 15, 40, 40);
        ctx.fillStyle = cand.type === EmployeeRole.Chef ? '#000' : '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(cand.type === EmployeeRole.Chef ? '👨‍🍳' : '🤵', x + 35, currentY + 42);

        // Info
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(cand.role, x + 65, currentY + 20);

        ctx.fillStyle = '#AAA';
        ctx.font = '12px Arial';
        ctx.fillText(cand.desc, x + 65, currentY + 38);

        // Button (Hire)
        const canAfford = playerMoney >= cand.cost;
        const btnColor = canAfford ? '#4CAF50' : '#555';
        ctx.fillStyle = btnColor;
        ctx.fillRect(x + width - 80, currentY + 20, 70, 30);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`$${cand.cost}`, x + width - 45, currentY + 40);

        currentY += this.ITEM_HEIGHT + 5;
    });

    // --- SECTION: CURRENT STAFF ---
    currentY += 20;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('CURRENT STAFF', x + 10, currentY);
    currentY += 25;

    if (restaurant.employees.length === 0) {
        ctx.fillStyle = '#AAA';
        ctx.font = 'italic 14px Arial';
        ctx.fillText("No employees yet.", x + 10, currentY);
    } else {
        restaurant.employees.forEach(emp => {
             // Simple list item for existing staff
             if (currentY + 40 < y || currentY > y + height) {
                 currentY += 45;
                 return;
             }

             ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
             ctx.fillRect(x + 5, currentY, width - 10, 40);

             ctx.fillStyle = '#FFF';
             ctx.font = '14px Arial';
             ctx.textAlign = 'left';
             ctx.fillText(`${emp.name} (${emp.role})`, x + 10, currentY + 25);

             currentY += 45;
        });
    }

    ctx.restore();
  }

  public handleClick(localX: number, localY: number, width: number, restaurant: Restaurant): void {
      let currentY = 10 - this.scrollY; // Match render Start Y

      // Skip Header
      currentY += 25;

      const playerMoney = GameState.getInstance().player.money;

      // Check Hire Buttons
      for (const cand of this.candidates) {
          const btnX = width - 80;
          const btnY = currentY + 20;
          const btnW = 70;
          const btnH = 30;

          // Check if click is on this row's button
          // Actually, let's just make the whole button clickable
          if (localY >= btnY && localY <= btnY + btnH && localX >= btnX && localX <= btnX + btnW) {
              if (playerMoney >= cand.cost) {
                  this.hireEmployee(cand.type, cand.cost, restaurant);
              }
              return;
          }

          currentY += this.ITEM_HEIGHT + 5;
      }

      // Scroll handling could be added here if needed (e.g., drag)
  }

  private hireEmployee(role: EmployeeRole, cost: number, restaurant: Restaurant): void {
    const player = GameState.getInstance().player;

    const spot = this.findFreeSpot(restaurant);
    if (!spot) {
      console.log("No free space!"); // In a real UI we'd show a toast
      return;
    }

    player.spendMoney(cost);
    const name = role === EmployeeRole.Chef ? "Chef Luigi" : "Waiter Mario";
    const employee = new Employee(name, role, 1, 100);
    employee.gridX = spot.x;
    employee.gridY = spot.y;

    restaurant.employees.push(employee);
    // console.log(`Hired ${name}`);
  }

  private findFreeSpot(restaurant: Restaurant): { x: number, y: number } | null {
    // Simple spiral or linear search for a free spot
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

    for (const item of restaurant.furniture) {
      if (x >= item.gridX && x < item.gridX + item.width &&
        y >= item.gridY && y < item.gridY + item.height) {
        return false;
      }
    }

    for (const emp of restaurant.employees) {
      if (emp.gridX === x && emp.gridY === y) return false;
    }

    return true;
  }
}
