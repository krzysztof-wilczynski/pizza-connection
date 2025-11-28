import { Furniture } from '../../model/Furniture';
import { AssetManager } from '../../systems/AssetManager';
import { GameState } from '../../model/GameState';
import { FURNITURE_CATALOG } from '../../data/FurnitureCatalog';

export class FurniturePanel {
  private container: HTMLElement | null;
  private assetManager: AssetManager;
  private onSelect: (furniture: Furniture) => void;

  constructor(assetManager: AssetManager, onSelect: (furniture: Furniture) => void) {
    this.assetManager = assetManager;
    this.onSelect = onSelect;
    this.container = document.getElementById('furniture-content');
  }

  public updateHTML(): void {
    if (!this.container) return;
    this.container.innerHTML = ''; // Clear current content

    const playerMoney = GameState.getInstance().player.money;

    FURNITURE_CATALOG.forEach((item) => {
      // Container
      const itemDiv = document.createElement('div');
      itemDiv.className = 'list-item';

      // Icon
      const img = this.assetManager.getAsset(item.assetKey);
      if (img && img.naturalWidth > 0) {
          const icon = document.createElement('img');
          icon.src = img.src; // Use source from loaded asset
          icon.className = 'list-item-icon';
          itemDiv.appendChild(icon);
      } else {
          // Fallback placeholder
          const placeholder = document.createElement('div');
          placeholder.className = 'list-item-icon';
          placeholder.style.backgroundColor = item.color || '#555';
          itemDiv.appendChild(placeholder);
      }

      // Details
      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'list-item-details';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name';
      nameSpan.innerText = item.name;

      const priceSpan = document.createElement('span');
      priceSpan.className = 'item-meta';
      priceSpan.innerText = `$${item.price}`;

      detailsDiv.appendChild(nameSpan);
      detailsDiv.appendChild(priceSpan);
      itemDiv.appendChild(detailsDiv);

      // Interaction
      const canAfford = playerMoney >= item.price;
      if (canAfford) {
          itemDiv.style.cursor = 'pointer';
          itemDiv.onclick = () => {
              this.onSelect({ ...item });
          };
      } else {
          itemDiv.style.opacity = '0.5';
          itemDiv.style.cursor = 'not-allowed';
      }

      this.container?.appendChild(itemDiv);
    });
  }

  // Deprecated methods removed
}
