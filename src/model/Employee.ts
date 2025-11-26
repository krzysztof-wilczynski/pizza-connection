import { EmployeeRole } from './enums';

export class Employee {
  constructor(
    public name: string,
    public role: EmployeeRole,
    public skillLevel: number,
    public salary: number
  ) {}
}
