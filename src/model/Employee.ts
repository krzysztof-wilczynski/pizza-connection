import { EmployeeRole, EmployeeState } from './enums';

export class Employee {
  public gridX: number;
  public gridY: number;
  public state: EmployeeState;
  public assetKey: string;

  constructor(
    public name: string,
    public role: EmployeeRole,
    public skillLevel: number,
    public salary: number
  ) {
    this.gridX = -1;
    this.gridY = -1;
    this.state = EmployeeState.Idle;

    // Default asset key based on role
    this.assetKey = role === EmployeeRole.Chef ? 'chef' : 'waiter';
  }
}
