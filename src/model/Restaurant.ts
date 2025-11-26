import { v4 as uuidv4 } from 'uuid';
import { Ingredient } from './Ingredient';
import { Pizza } from './Pizza';
import { Employee } from './Employee';

export class Restaurant {
  public id: string;
  public inventory: Map<Ingredient, number> = new Map();
  public menu: Pizza[] = [];
  public employees: Employee[] = [];
  public furniture: any[] = []; // Placeholder for furniture system

  constructor() {
    this.id = uuidv4();
  }
}
