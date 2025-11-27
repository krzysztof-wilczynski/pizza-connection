import { Pizza } from './Pizza';
import { OrderState } from './enums';

export interface Order {
    id: string;
    pizza: Pizza;
    customerId: string;
    state: OrderState;
    progress: number; // 0-100
    maxProgress: number; // np. 100 jednostek czasu
}
