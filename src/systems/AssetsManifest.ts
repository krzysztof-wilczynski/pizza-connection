export const ASSETS_MANIFEST = {
  // --- CITY: RESIDENTIAL ---
  'city_residential_house_01': '/assets/city/residential/house_01.svg',
  'city_residential_tenement_corner': '/assets/city/residential/tenement_corner.svg',
  'city_residential_tenement_tall': '/assets/city/residential/tenement_tall.svg',

  // --- CITY: COMMERCIAL ---
  'city_commercial_office': '/assets/city/commercial/office.svg',
  'city_commercial_restaurant': '/assets/city/commercial/restaurant.svg',
  'city_commercial_shop_awning': '/assets/city/commercial/shop_awning.svg',

  // --- CITY: INDUSTRIAL ---
  'city_industrial_warehouse': '/assets/city/industrial/hurtownia.svg',

  // --- CITY: ROADS & ENVIRONMENT ---
  'city_empty': '/assets/city/empty.svg',
  'city_roads_road_straight': '/assets/city/roads/road_straight.svg',
  'city_roads_road_corner': '/assets/city/roads/road_corner.svg',
  'city_roads_road_cross': '/assets/city/roads/road_cross.svg',

  // --- CITY: NATURE ---
  'city_nature_tree_oak': '/assets/city/nature/tree_oak.svg',
  'city_nature_tree_pine': '/assets/city/nature/tree_pine.svg',

  // --- CITY: LANDMARKS ---
  'city_landmarks_construction': '/assets/city/landmarks/construction.svg',
  'city_landmarks_fountain': '/assets/city/landmarks/fountain.svg',

  // --- INTERIOR (Construction) ---
  'interior_floor_wood': '/assets/interior/floor_wood.svg',
  'interior_floor_checkered': '/assets/interior/floor_checkered.svg',
  'interior_wall_left': '/assets/interior/wall_left.svg',
  'interior_wall_right': '/assets/interior/wall_right.svg',
  'interior_wall_corner': '/assets/interior/wall_corner.svg',

  // --- FURNITURE: KITCHEN ---
  'furniture_kitchen_oven': '/assets/furniture/kitchen/oven.svg',
  'furniture_kitchen_prep_counter': '/assets/furniture/kitchen/prep_counter.svg',
  'furniture_kitchen_sink': '/assets/furniture/kitchen/sink.svg',
  'furniture_kitchen_fridge': '/assets/furniture/kitchen/fridge.svg',

  // --- FURNITURE: TABLES ---
  'furniture_tables_table_round_wood': '/assets/furniture/tables/table_round_wood.svg',
  'furniture_tables_table_plastic': '/assets/furniture/tables/table_plastic.svg',
  'furniture_tables_table_diner': '/assets/furniture/tables/table_diner.svg',
  'furniture_tables_table_glass': '/assets/furniture/tables/table_glass.svg',
  'furniture_tables_table_rustic': '/assets/furniture/tables/table_rustic.svg',

  // --- FURNITURE: SEATING ---
  'furniture_seating_chair_simple': '/assets/furniture/seating/chair_simple.svg',
  'furniture_seating_chair_plastic': '/assets/furniture/seating/chair_plastic.svg',
  'furniture_seating_chair_leather': '/assets/furniture/seating/chair_leather.svg',
  'furniture_seating_booth_corner': '/assets/furniture/seating/booth_corner.svg',
  'furniture_seating_booth_straight': '/assets/furniture/seating/booth_straight.svg',
  'furniture_seating_bench_wood': '/assets/furniture/seating/bench_wood.svg',

  // --- FURNITURE: DECOR ---
  'furniture_decor_plant_small': '/assets/furniture/decor/plant_small.svg',
  'furniture_decor_plant_palm': '/assets/furniture/decor/plant_palm.svg',
  'furniture_decor_trash_can': '/assets/furniture/decor/trash_can.svg',
  'furniture_decor_vending_machine': '/assets/furniture/decor/vending_machine.svg',
  'furniture_decor_jukebox': '/assets/furniture/decor/jukebox.svg',
  'furniture_decor_lamp_floor': '/assets/furniture/decor/lamp_floor.svg',
  'furniture_decor_rug_round': '/assets/furniture/decor/rug_round.svg',
  'furniture_decor_painting_wall': '/assets/furniture/decor/painting_wall.svg',
  'furniture_decor_window_wall': '/assets/furniture/decor/window_wall.svg',

  // --- FURNITURE: MISC ---
  'furniture_misc_reception_desk': '/assets/furniture/misc/reception_desk.svg',
  'furniture_misc_pinball': '/assets/furniture/misc/pinball.svg',
  'furniture_misc_cardboard_box': '/assets/furniture/misc/cardboard_box.svg',
  'furniture_misc_cash_register': '/assets/furniture/misc/cash_register.svg',

  // --- PEOPLE ---
  'people_chef': '/assets/people/chef.svg',
  'people_waiter': '/assets/people/waiter.svg',
  'people_customer': '/assets/people/customer.svg',

  // --- INGREDIENTS ---
  'ingredients_dough': '/assets/ingredients/dough.svg',
  'ingredients_sauce': '/assets/ingredients/sauce.svg',
  'ingredients_cheese': '/assets/ingredients/cheese.svg',
  'ingredients_salami': '/assets/ingredients/salami.svg',
  'ingredients_ham': '/assets/ingredients/ham.svg',
  'ingredients_mushroom': '/assets/ingredients/mushroom.svg',
  'ingredients_pepper': '/assets/ingredients/pepper.svg',
  'ingredients_onion': '/assets/ingredients/onion.svg',
  'ingredients_olive': '/assets/ingredients/olive.svg',
  'ingredients_basil': '/assets/ingredients/basil.svg',
};

export type AssetKey = keyof typeof ASSETS_MANIFEST;
