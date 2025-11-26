export class Player {
  private _money: number;

  constructor(startingMoney: number) {
    this._money = startingMoney;
  }

  public get money(): number {
    return this._money;
  }

  public addMoney(amount: number): void {
    if (amount > 0) {
      this._money += amount;
    }
  }

  public spendMoney(amount: number): boolean {
    if (amount > 0 && this._money >= amount) {
      this._money -= amount;
      return true;
    }
    return false;
  }
}
