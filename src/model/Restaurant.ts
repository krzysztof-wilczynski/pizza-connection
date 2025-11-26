// src/model/Restaurant.ts
import { PizzaRecipe } from './PizzaRecipe';
import { Employee } from './Employee';
import { Furniture } from './Furniture';

export interface Restaurant {
    id: string; // UUID
    location: { row: number; col: number };
    furniture: Furniture[];
    menu: PizzaRecipe[];
    employees: Employee[];
    stats: {
        reputation: number;
        dailyIncome: number;
    };
}
