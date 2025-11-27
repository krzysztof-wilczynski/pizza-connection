import { Furniture } from './Furniture';

export const FURNITURE_CATALOG: Furniture[] = [
    {
        id: 1,
        name: 'Drewniany Stolik',
        price: 150,
        type: 'dining',
        stats: { capacity: 2 },
        width: 1,
        height: 1,
        assetKey: 'furniture_tables_table_round_wood',
        color: '#8B4513'
    },
    {
        id: 2,
        name: 'Krzesło',
        price: 50,
        type: 'dining',
        stats: { capacity: 1 },
        width: 1,
        height: 1,
        assetKey: 'furniture_seating_chair_simple',
        color: '#A0522D'
    },
    {
        id: 3,
        name: 'Piec do pizzy',
        price: 2000,
        type: 'kitchen',
        stats: { cookingSpeed: 10 },
        width: 2,
        height: 2,
        assetKey: 'furniture_kitchen_oven',
        color: '#2F4F4F'
    },
    {
        id: 4,
        name: 'Doniczka',
        price: 100,
        type: 'decoration',
        stats: { appeal: 5 },
        width: 1,
        height: 1,
        assetKey: 'furniture_decor_plant_small',
        color: '#228B22'
    }
];
