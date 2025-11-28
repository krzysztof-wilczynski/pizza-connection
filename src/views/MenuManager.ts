import { Restaurant } from '../model/Restaurant';

export class MenuManager {
  public active: boolean = false;
  private restaurant: Restaurant;

  private modal: HTMLElement | null;
  private listContainer: HTMLElement | null;
  private closeBtn: HTMLElement | null;

  constructor(restaurant: Restaurant) {
    this.restaurant = restaurant;

    this.modal = document.getElementById('menu-modal');
    this.listContainer = document.getElementById('menu-list');
    this.closeBtn = document.getElementById('btn-close-menu');

    if (this.closeBtn) {
        this.closeBtn.onclick = () => this.close();
    }
  }

  public open(): void {
    this.active = true;
    if (this.modal) {
        this.modal.style.display = 'flex'; // Use flex to center
    }
    this.updateHTML();
  }

  public close(): void {
    this.active = false;
    if (this.modal) {
        this.modal.style.display = 'none';
    }
  }

  private updateHTML(): void {
      if (!this.listContainer) return;
      this.listContainer.innerHTML = '';

      const menu = this.restaurant.menu;

      if (menu.length === 0) {
          const emptyMsg = document.createElement('div');
          emptyMsg.style.textAlign = 'center';
          emptyMsg.style.color = '#777';
          emptyMsg.style.marginTop = '50px';
          emptyMsg.innerText = "Menu jest puste. Stwórz pizzę w kreatorze!";
          this.listContainer.appendChild(emptyMsg);
          return;
      }

      menu.forEach((pizza) => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'list-item';

          // Info
          const detailsDiv = document.createElement('div');
          detailsDiv.className = 'list-item-details';

          const nameSpan = document.createElement('span');
          nameSpan.className = 'item-name';
          nameSpan.innerText = pizza.name;

          const ingSpan = document.createElement('span');
          ingSpan.className = 'item-meta';
          ingSpan.innerText = pizza.ingredients.map(i => i.name).join(', ');

          detailsDiv.appendChild(nameSpan);
          detailsDiv.appendChild(ingSpan);
          itemDiv.appendChild(detailsDiv);

          // Actions (Price control + Delete)
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'list-item-actions';

          // Minus
          const btnMinus = document.createElement('button');
          btnMinus.className = 'btn btn-secondary';
          btnMinus.innerText = '-';
          btnMinus.style.padding = '5px 10px';
          btnMinus.onclick = () => {
              const newPrice = Math.max(0, pizza.salePrice - 1.0);
              this.restaurant.updatePizzaPrice(pizza.id, parseFloat(newPrice.toFixed(2)));
              this.updateHTML();
          };

          // Price Display
          const priceSpan = document.createElement('span');
          priceSpan.style.fontWeight = 'bold';
          priceSpan.style.minWidth = '60px';
          priceSpan.style.textAlign = 'center';
          priceSpan.innerText = `${pizza.salePrice.toFixed(2)} zł`;

          // Plus
          const btnPlus = document.createElement('button');
          btnPlus.className = 'btn btn-secondary';
          btnPlus.innerText = '+';
          btnPlus.style.padding = '5px 10px';
          btnPlus.onclick = () => {
              const newPrice = pizza.salePrice + 1.0;
              this.restaurant.updatePizzaPrice(pizza.id, parseFloat(newPrice.toFixed(2)));
              this.updateHTML();
          };

          // Delete
          const btnDelete = document.createElement('button');
          btnDelete.className = 'btn btn-danger';
          btnDelete.innerText = 'X';
          btnDelete.style.marginLeft = '10px';
          btnDelete.onclick = () => {
              this.restaurant.removePizza(pizza.id);
              this.updateHTML();
          };

          actionsDiv.appendChild(btnMinus);
          actionsDiv.appendChild(priceSpan);
          actionsDiv.appendChild(btnPlus);
          actionsDiv.appendChild(btnDelete);

          itemDiv.appendChild(actionsDiv);
          this.listContainer?.appendChild(itemDiv);
      });
  }

  // Deprecated methods removed
  public render(ctx: CanvasRenderingContext2D): void {}
}
