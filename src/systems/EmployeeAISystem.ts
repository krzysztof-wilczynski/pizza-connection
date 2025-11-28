import { Employee } from '../model/Employee';
import { Restaurant } from '../model/Restaurant';

export class EmployeeAISystem {
  public static update(employee: Employee, dt: number, restaurant: Restaurant): void {
    employee.update(dt, restaurant);
  }
}
