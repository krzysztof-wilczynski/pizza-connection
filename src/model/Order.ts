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
}
