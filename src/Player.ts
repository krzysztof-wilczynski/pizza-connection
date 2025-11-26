// src/Player.ts

export class Player {
    private money: number;

    constructor(startingMoney: number) {
        this.money = startingMoney;
    }

    public getMoney(): number {
        return this.money;
    }

    public canAfford(amount: number): boolean {
        return this.money >= amount;
    }

    public spendMoney(amount: number): void {
        if (this.canAfford(amount)) {
            this.money -= amount;
        } else {
            console.error("Not enough money!");
        }
    }
}
