import { v4 as uuidv4 } from 'uuid';
import { Ingredient } from './Ingredient';
import { Pizza } from './Pizza';
import { Employee } from './Employee';
import { Furniture, PlacedFurniture } from './Furniture';

export class Restaurant {
  public id: string;
  public inventory: Map<string, number> = new Map(); // Key is ingredient ID
  public menu: Pizza[] = [];
  public employees: Employee[] = [];
  public furniture: PlacedFurniture[] = [];

  constructor() {
    this.id = uuidv4();
  }

  public addFurniture(item: Furniture, x: number, y: number): boolean {
    // Boundary check (assuming 10x10 grid based on InteriorView logic)
    if (x < 0 || y < 0 || x + item.width > 10 || y + item.height > 10) {
      return false;
    }

    // Collision check
    for (const placed of this.furniture) {
      // AABB Collision detection
      if (
        x < placed.gridX + placed.width &&
        x + item.width > placed.gridX &&
        y < placed.gridY + placed.height &&
        y + item.height > placed.gridY
      ) {
        return false;
      }
    }

    // Add furniture
    const newFurniture: PlacedFurniture = {
      ...item,
      gridX: x,
      gridY: y
    };
    this.furniture.push(newFurniture);
    return true;
  }
}
