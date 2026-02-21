import { UI } from './ui';
import { Game } from './game';
import { loadSettings, saveSettings } from './settings';

async function main() {
  const settings = await loadSettings();

  const ui = new UI(
    (currentSettings) => {
      ui.hideMenu();
      game.start(currentSettings);
    },
    settings,
    (updatedSettings) => {
      saveSettings(updatedSettings);
    }
  );

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
