import { Furniture } from '../model/Furniture';

export const FURNITURE_CATALOG: Furniture[] = [
    // --- KITCHEN ---
    {
        id: 100,
        name: 'Blat Roboczy',
        price: 500,
        type: 'kitchen',
        stats: { cookingSpeed: 2 },
        width: 1,
        height: 1,
        assetKey: 'furniture_kitchen_prep_counter',
        color: '#D3D3D3'
    },
    {
        id: 101,
        name: 'Zlew Kuchenny',
        price: 400,
        type: 'kitchen',
        stats: { cookingSpeed: 1 },
        width: 1,
        height: 1,
        assetKey: 'furniture_kitchen_sink',
        color: '#708090'
    },
    {
        id: 102,
        name: 'Lodówka',
        price: 800,
        type: 'kitchen',
        stats: { cookingSpeed: 3 },
        width: 1,
        height: 1,
        assetKey: 'furniture_kitchen_fridge',
        color: '#FFFFFF'
    },
    {
        id: 103, // Was id 3
        name: 'Piec do Pizzy',
        price: 2000,
        type: 'kitchen',
        stats: { cookingSpeed: 10 },
        width: 2,
        height: 2,
        assetKey: 'furniture_kitchen_oven',
        color: '#2F4F4F'
    },

    // --- DINING: TABLES ---
    {
        id: 200,
        name: 'Plastikowy Stół',
        price: 80,
        type: 'dining',
        stats: { capacity: 2, appeal: -1 },
        width: 1,
        height: 1,
        assetKey: 'furniture_tables_table_plastic',
        color: '#F0F8FF'
    },
    {
        id: 201, // Was id 1
        name: 'Drewniany Stolik',
        price: 150,
        type: 'dining',
        stats: { capacity: 2, appeal: 1 },
        width: 1,
        height: 1,
        assetKey: 'furniture_tables_table_round_wood',
        color: '#8B4513'
    },
    {
        id: 202,
        name: 'Stół Diner',
        price: 250,
        type: 'dining',
        stats: { capacity: 2, appeal: 3 },
        width: 1,
        height: 1,
        assetKey: 'furniture_tables_table_diner',
        color: '#DC143C'
    },
    {
        id: 203,
        name: 'Stół Rustykalny',
        price: 350,
        type: 'dining',
        stats: { capacity: 2, appeal: 5 },
        width: 1,
        height: 1,
        assetKey: 'furniture_tables_table_rustic',
        color: '#556B2F'
    },
    {
        id: 204,
        name: 'Szklany Stół',
        price: 600,
        type: 'dining',
        stats: { capacity: 2, appeal: 8 },
        width: 1,
        height: 1,
        assetKey: 'furniture_tables_table_glass',
        color: '#E0FFFF'
    },

    // --- DINING: SEATING ---
    {
        id: 300,
        name: 'Plastikowe Krzesło',
        price: 25,
        type: 'dining',
        stats: { capacity: 1, appeal: -1 },
        width: 1,
        height: 1,
        assetKey: 'furniture_seating_chair_plastic',
        color: '#F0F8FF'
    },
    {
        id: 301, // Was id 2
        name: 'Krzesło',
        price: 50,
        type: 'dining',
        stats: { capacity: 1, appeal: 1 },
        width: 1,
        height: 1,
        assetKey: 'furniture_seating_chair_simple',
        color: '#A0522D'
    },
    {
        id: 302,
        name: 'Drewniana Ławka',
        price: 80,
        type: 'dining',
        stats: { capacity: 1, appeal: 2 },
        width: 1,
        height: 1,
        assetKey: 'furniture_seating_bench_wood',
        color: '#DEB887'
    },
    {
        id: 303,
        name: 'Skórzany Fotel',
        price: 200,
        type: 'dining',
        stats: { capacity: 1, appeal: 5 },
        width: 1,
        height: 1,
        assetKey: 'furniture_seating_chair_leather',
        color: '#800000'
    },
    {
        id: 304,
        name: 'Kanapa Diner',
        price: 250,
        type: 'dining',
        stats: { capacity: 1, appeal: 4 },
        width: 1,
        height: 1,
        assetKey: 'furniture_seating_booth_straight',
        color: '#B22222'
    },
    {
        id: 305,
        name: 'Kanapa Narożna',
        price: 300,
        type: 'dining',
        stats: { capacity: 1, appeal: 4 },
        width: 1,
        height: 1,
        assetKey: 'furniture_seating_booth_corner',
        color: '#B22222'
    },

    // --- DECORATION ---
    {
        id: 400,
        name: 'Karton',
        price: 10,
        type: 'decoration',
        stats: { appeal: -5 },
        width: 1,
        height: 1,
        assetKey: 'furniture_misc_cardboard_box',
        color: '#D2B48C'
    },
    {
        id: 401,
        name: 'Kosz na śmieci',
        price: 40,
        type: 'decoration',
        stats: { appeal: -1 },
        width: 1,
        height: 1,
        assetKey: 'furniture_decor_trash_can',
        color: '#696969'
    },
    {
        id: 402,
        name: 'Okrągły Dywan',
        price: 90,
        type: 'decoration',
        stats: { appeal: 3 },
        width: 1,
        height: 1,
        assetKey: 'furniture_decor_rug_round',
        color: '#FF69B4'
    },
    {
        id: 403, // Was id 4
        name: 'Doniczka',
        price: 100,
        type: 'decoration',
        stats: { appeal: 5 },
        width: 1,
        height: 1,
        assetKey: 'furniture_decor_plant_small',
        color: '#228B22'
    },
    {
        id: 404,
        name: 'Lampa Stojąca',
        price: 120,
        type: 'decoration',
        stats: { appeal: 6 },
        width: 1,
        height: 1,
        assetKey: 'furniture_decor_lamp_floor',
        color: '#FFFFE0'
    },
    {
        id: 405,
        name: 'Obraz',
        price: 150,
        type: 'decoration',
        stats: { appeal: 8 },
        width: 1,
        height: 1,
        assetKey: 'furniture_decor_painting_wall',
        color: '#FFD700'
    },
    {
        id: 406,
        name: 'Okno',
        price: 200,
        type: 'decoration',
        stats: { appeal: 5 },
        width: 1,
        height: 1,
        assetKey: 'furniture_decor_window_wall',
        color: '#87CEEB'
    },
    {
        id: 407,
        name: 'Palma',
        price: 250,
        type: 'decoration',
        stats: { appeal: 12 },
        width: 1,
        height: 1,
        assetKey: 'furniture_decor_plant_palm',
        color: '#006400'
    },
    {
        id: 408,
        name: 'Kasa Fiskalna',
        price: 300,
        type: 'decoration',
        stats: { appeal: 2 },
        width: 1,
        height: 1,
        assetKey: 'furniture_misc_cash_register',
        color: '#C0C0C0'
    },
    {
        id: 409,
        name: 'Recepcja',
        price: 450,
        type: 'decoration',
        stats: { appeal: 10 },
        width: 1,
        height: 1,
        assetKey: 'furniture_misc_reception_desk',
        color: '#8B4513'
    },
    {
        id: 410,
        name: 'Automat z napojami',
        price: 800,
        type: 'decoration',
        stats: { appeal: 5 },
        width: 1,
        height: 1,
        assetKey: 'furniture_decor_vending_machine',
        color: '#FF4500'
    },
    {
        id: 411,
        name: 'Szafa grająca',
        price: 1200,
        type: 'decoration',
        stats: { appeal: 25 },
        width: 1,
        height: 1,
        assetKey: 'furniture_decor_jukebox',
        color: '#FF00FF'
    },
    {
        id: 412,
        name: 'Pinball',
        price: 1500,
        type: 'decoration',
        stats: { appeal: 30 },
        width: 1,
        height: 1,
        assetKey: 'furniture_misc_pinball',
        color: '#4B0082'
    }
];
