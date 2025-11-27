import { Pizza } from './Pizza';

export type OrderState = 'Pending' | 'Cooking' | 'Ready' | 'Delivering' | 'Served';

export class Order {
  constructor(
    public id: string,
    public pizza: Pizza,
    public customerId: string,
    public state: OrderState = 'Pending',
    public progress: number = 0
  ) {}
import { OrderState } from './enums';

export interface Order {
    id: string;
    pizza: Pizza;
    customerId: string;
    state: OrderState;
    progress: number; // 0-100
    maxProgress: number; // np. 100 jednostek czasu
}
