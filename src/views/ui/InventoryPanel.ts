import { INGREDIENT_DEFINITIONS } from '../../data/ingredientDefinitions';
import { GameState } from '../../model/GameState';
import { Restaurant } from '../../model/Restaurant';

export class InventoryPanel {
  private container: HTMLElement | null;

  constructor() {
    this.container = document.getElementById('inventory-content');
  }

  public updateHTML(restaurant: Restaurant): void {
    if (!this.container) return;
    this.container.innerHTML = '';

    const playerMoney = GameState.getInstance().player.money;

    INGREDIENT_DEFINITIONS.forEach((ing) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'list-item';

      // Icon (Color Circle)
      const colors: Record<string, string> = {
        'tomato_sauce': '#e74c3c',
        'cheese': '#f1c40f',
        'pepperoni': '#c0392b',
        'dough': '#f5deb3'
      };

      const icon = document.createElement('div');
      icon.className = 'list-item-icon';
      icon.style.backgroundColor = colors[ing.id] || '#fff';
      icon.style.borderRadius = '50%';
      itemDiv.appendChild(icon);

      // Details
      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'list-item-details';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name';
      nameSpan.innerText = ing.name;

      const stockSpan = document.createElement('span');
      stockSpan.className = 'item-meta';
      const currentStock = restaurant.inventory.get(ing.id) || 0;
      stockSpan.innerText = `Stock: ${currentStock}`;

      detailsDiv.appendChild(nameSpan);
      detailsDiv.appendChild(stockSpan);
      itemDiv.appendChild(detailsDiv);

      // Buy Button
      const buyAmount = 5;
      const buyCost = ing.baseCost * buyAmount;
      const canAfford = playerMoney >= buyCost;

      const buyBtn = document.createElement('button');
      buyBtn.className = canAfford ? 'btn btn-primary' : 'btn btn-secondary';
      buyBtn.style.fontSize = '0.8rem';
      buyBtn.style.padding = '5px';
      buyBtn.innerText = `Buy ${buyAmount} ($${buyCost.toFixed(2)})`;

      if (!canAfford) buyBtn.disabled = true;

      buyBtn.onclick = () => {
          if (restaurant.buyIngredient(ing.id, buyAmount, buyCost)) {
             this.updateHTML(restaurant); // Refresh UI
          }
      };

      itemDiv.appendChild(buyBtn);
      this.container?.appendChild(itemDiv);
    });
  }
}
