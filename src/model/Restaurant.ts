import { v4 as uuidv4 } from 'uuid';
import { Ingredient } from './Ingredient';
import { Pizza } from './Pizza';
import { Employee } from './Employee';

export class Restaurant {
  public id: string;
  public inventory: Map<string, number> = new Map(); // Key is ingredient ID
  public menu: Pizza[] = [];
  public employees: Employee[] = [];
  public furniture: any[] = []; // Placeholder for furniture system

  constructor() {
    this.id = uuidv4();
  }
}
