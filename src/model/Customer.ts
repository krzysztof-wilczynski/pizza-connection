import { Pizza } from './Pizza';
import { CustomerState } from './enums';

export class Customer {
  id: string;
  state: CustomerState;
  gridX: number;
  gridY: number;
  targetFurnitureId: number | null;
  order: Pizza | null;
  eatingTimer: number;
  assetKey: string;

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.state = CustomerState.Arriving;
    this.gridX = x;
    this.gridY = y;
    this.targetFurnitureId = null;
    this.order = null;
    this.eatingTimer = 0;
    this.assetKey = 'customer';
  }
}
