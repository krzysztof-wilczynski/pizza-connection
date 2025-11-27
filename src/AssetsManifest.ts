export const ASSET_MANIFEST = {
  // --- CITY: RESIDENTIAL (Kamienice i Wille) ---
  'house_01': '/assets/city/residential/house_01.svg',
  'tenement_corner': '/assets/city/residential/tenement_corner.svg',
  'tenement_tall': '/assets/city/residential/tenement_tall.svg',

  // --- CITY: COMMERCIAL (Biura i Sklepy) ---
  'office': '/assets/city/commercial/office.svg',
  'restaurant': '/assets/city/commercial/restaurant.svg',
  'shop_awning': '/assets/city/commercial/shop_awning.svg',

  // --- CITY: INDUSTRIAL (Przemysł) ---
  'warehouse': '/assets/city/industrial/hurtownia.svg',

  // --- CITY: ROADS & ENVIRONMENT (Infrastruktura) ---
  'empty': '/assets/city/empty.svg',
  'road_straight': '/assets/city/roads/road_straight.svg',
  'road_corner': '/assets/city/roads/road_corner.svg',
  'road_cross': '/assets/city/roads/road_cross.svg',

  // --- CITY: NATURE (Zieleń Miejska) ---
  'tree_oak': '/assets/city/nature/tree_oak.svg',
  'tree_pine': '/assets/city/nature/tree_pine.svg',

  // --- CITY: LANDMARKS (Atrakcje) ---
  'construction': '/assets/city/landmarks/construction.svg',
  'fountain': '/assets/city/landmarks/fountain.svg',

  // --- INTERIOR (Construction) ---
  'floor_wood': '/assets/interior/floor_wood.svg',
  'floor_checkered': '/assets/interior/floor_checkered.svg',
  'wall_left': '/assets/interior/wall_left.svg',
  'wall_right': '/assets/interior/wall_right.svg',
  'wall_corner': '/assets/interior/wall_corner.svg',

  // --- FURNITURE ---
  // Kitchen
  'oven': '/assets/furniture/kitchen/oven.svg',
  'prep_counter': '/assets/furniture/kitchen/prep_counter.svg',
  'sink': '/assets/furniture/kitchen/sink.svg',
  'fridge': '/assets/furniture/kitchen/fridge.svg',

  // Tables
  'table_round': '/assets/furniture/tables/table_round_wood.svg',
  'table_plastic': '/assets/furniture/tables/table_plastic.svg',
  'table_diner': '/assets/furniture/tables/table_diner.svg',
  'table_glass': '/assets/furniture/tables/table_glass.svg',
  'table_rustic': '/assets/furniture/tables/table_rustic.svg',

  // Seating
  'chair_simple': '/assets/furniture/seating/chair_simple.svg',
  'chair_plastic': '/assets/furniture/seating/chair_plastic.svg',
  'booth_corner': '/assets/furniture/seating/booth_corner.svg',
  'booth_straight': '/assets/furniture/seating/booth_straight.svg',
  'chair_leather': '/assets/furniture/seating/chair_leather.svg',
  'bench': '/assets/furniture/seating/bench_wood.svg',

  // Decor & Misc
  'plant_small': '/assets/furniture/decor/plant_small.svg',
  'plant_palm': '/assets/furniture/decor/plant_palm.svg',
  'trash_can': '/assets/furniture/decor/trash_can.svg',
  'vending_machine': '/assets/furniture/decor/vending_machine.svg',
  'jukebox': '/assets/furniture/decor/jukebox.svg',
  'lamp_floor': '/assets/furniture/decor/lamp_floor.svg',
  'rug_round': '/assets/furniture/decor/rug_round.svg',
  'painting': '/assets/furniture/decor/painting_wall.svg',
  'window': '/assets/furniture/decor/window_wall.svg',
  'reception_desk': '/assets/furniture/misc/reception_desk.svg',
  'pinball': '/assets/furniture/misc/pinball.svg',
  'cardboard_box': '/assets/furniture/misc/cardboard_box.svg',
  'cash_register': '/assets/furniture/misc/cash_register.svg',

  // --- PEOPLE ---
  'chef': '/assets/people/chef.svg',
  'waiter': '/assets/people/waiter.svg',
  'customer': '/assets/people/customer.svg',

  // --- INGREDIENTS ---
  'ing_dough': '/assets/ingredients/dough.svg',
  'ing_sauce': '/assets/ingredients/sauce.svg',
  'ing_cheese': '/assets/ingredients/cheese.svg',
  'ing_salami': '/assets/ingredients/salami.svg',
  'ing_ham': '/assets/ingredients/ham.svg',
  'ing_mushroom': '/assets/ingredients/mushroom.svg',
  'ing_pepper': '/assets/ingredients/pepper.svg',
  'ing_onion': '/assets/ingredients/onion.svg',
  'ing_olive': '/assets/ingredients/olive.svg',
  'ing_basil': '/assets/ingredients/basil.svg',
};

export type AssetKey = keyof typeof ASSET_MANIFEST;