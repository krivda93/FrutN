
import { UI } from './ui';
import { Game } from './game';

function main() {
  const ui = new UI(() => {
    ui.hideMenu();
    game.start();
  });

  const webglCanvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
  const trailCanvas = document.getElementById('trail-canvas') as HTMLCanvasElement;

  const game = new Game(webglCanvas, trailCanvas, {
    onScoreChange: (score: number) => {
      ui.updateScore(score);
    },
    onLivesChange: (lives: number) => {
      ui.updateLives(lives);
    },
    onGameOver: () => {
      ui.showMenu(game.score);
    },
    onFlash: () => {
      ui.flash();
    }
  });
}

main();
