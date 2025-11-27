// src/UIManager.ts

export class UIManager {
    private purchasePanel: HTMLElement;
    private priceSpan: HTMLElement;
    private buyButton: HTMLElement;
    private cancelButton: HTMLElement;

    constructor() {
        this.purchasePanel = document.getElementById('purchase-ui')!;
        this.priceSpan = document.getElementById('property-price')!;
        this.buyButton = document.getElementById('buy-button')!;
        this.cancelButton = document.getElementById('cancel-button')!;

        this.cancelButton.addEventListener('click', () => this.hidePurchasePanel());
    }

    public showPurchasePanel(price: number, onBuy: () => void): void {
        this.priceSpan.textContent = `$${price.toLocaleString()}`;
        
        // Clone and replace the button to remove old event listeners
        const newBuyButton = this.buyButton.cloneNode(true);
        this.buyButton.parentNode!.replaceChild(newBuyButton, this.buyButton);
        this.buyButton = newBuyButton as HTMLElement;

        this.buyButton.addEventListener('click', onBuy);
        
        this.purchasePanel.style.display = 'block';
    }

    public hidePurchasePanel(): void {
        this.purchasePanel.style.display = 'none';
    }
}
