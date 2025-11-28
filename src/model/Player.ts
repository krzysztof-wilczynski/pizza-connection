export class Player {
  private _money: number;
  private _reputation: number;

  constructor(startingMoney: number) {
    this._money = startingMoney;
    this._reputation = 1; // Default starting reputation (1 star)
  }

  public get money(): number {
    return this._money;
  }

  public get reputation(): number {
    return this._reputation;
  }

  public addMoney(amount: number): void {
    if (amount > 0) {
      this._money += amount;
    }
  }

  public setMoney(amount: number) {
    this._money = amount;
  }

  public spendMoney(amount: number): boolean {
    if (amount > 0 && this._money >= amount) {
      this._money -= amount;
      return true;
    }
    return false;
  }
}
