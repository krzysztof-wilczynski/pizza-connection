import { Game } from './Game';

(async () => {
    const game = new Game();
    await game.preloadAssets();
    game.start();
})();
