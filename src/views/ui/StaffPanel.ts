import { EmployeeRole } from '../../model/enums';
import { GameState } from '../../model/GameState';
import { Restaurant } from '../../model/Restaurant';
import { Employee } from '../../model/Employee';

export class StaffPanel {
  private container: HTMLElement | null;

  constructor() {
    this.container = document.getElementById('staff-content');
  }

  public updateHTML(restaurant: Restaurant): void {
    if (!this.container) return;
    this.container.innerHTML = '';

    const candidates = [
      { role: 'Kucharz', cost: 500, type: EmployeeRole.Chef, desc: 'Cooks pizzas.' },
      { role: 'Kelner', cost: 300, type: EmployeeRole.Waiter, desc: 'Serves customers.' }
    ];

    const playerMoney = GameState.getInstance().player.money;

    candidates.forEach((cand) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'list-item';

        // Icon Placeholder
        const icon = document.createElement('div');
        icon.className = 'list-item-icon';
        icon.style.backgroundColor = cand.type === EmployeeRole.Chef ? '#fff' : '#000';
        icon.innerText = cand.type === EmployeeRole.Chef ? '👨‍🍳' : '🤵';
        icon.style.display = 'flex';
        icon.style.justifyContent = 'center';
        icon.style.alignItems = 'center';
        icon.style.fontSize = '24px';
        itemDiv.appendChild(icon);

        // Details
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'list-item-details';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.innerText = cand.role;

        const costSpan = document.createElement('span');
        costSpan.className = 'item-meta';
        costSpan.innerText = `$${cand.cost} - ${cand.desc}`;

        detailsDiv.appendChild(nameSpan);
        detailsDiv.appendChild(costSpan);
        itemDiv.appendChild(detailsDiv);

        // Action Button
        const actionBtn = document.createElement('button');
        actionBtn.className = 'btn btn-success';
        actionBtn.style.padding = '5px 10px';
        actionBtn.innerText = 'Hire';

        const canAfford = playerMoney >= cand.cost;
        if (!canAfford) {
            actionBtn.disabled = true;
            actionBtn.className = 'btn btn-secondary';
            actionBtn.innerText = 'No Funds';
        }

        actionBtn.onclick = () => {
            this.hireEmployee(cand.type, cand.cost, restaurant);
            this.updateHTML(restaurant); // Refresh UI (e.g. money update)
        };

        itemDiv.appendChild(actionBtn);
        this.container?.appendChild(itemDiv);
    });

    // List Existing Staff (Optional, but good for management)
    if (restaurant.employees.length > 0) {
        const header = document.createElement('h3');
        header.innerText = 'Current Staff';
        header.style.marginTop = '20px';
        this.container.appendChild(header);

        restaurant.employees.forEach(emp => {
            const empDiv = document.createElement('div');
            empDiv.className = 'list-item';
            empDiv.innerHTML = `
                <div class="list-item-details">
                    <span class="item-name">${emp.name}</span>
                    <span class="item-meta">${emp.role} (Lvl ${emp.level})</span>
                </div>
            `;
            this.container?.appendChild(empDiv);
        });
    }
  }

  private hireEmployee(role: EmployeeRole, cost: number, restaurant: Restaurant): void {
    const player = GameState.getInstance().player;
    if (player.money < cost) {
      console.log("Not enough money to hire!");
      return;
    }

    const spot = this.findFreeSpot(restaurant);
    if (!spot) {
      alert("No free space for new employee!");
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
