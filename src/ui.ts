
export class UI {
  scoreEl: HTMLElement;
  livesEls: HTMLElement[];
  menuLayer: HTMLElement;
  flashOverlay: HTMLElement;
  finalScoreEl: HTMLElement;
  startButton: HTMLElement;

  constructor(onStart: () => void) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="game-container">
        <canvas id="webgl-canvas"></canvas>
        <canvas id="trail-canvas"></canvas>
        
        <div id="ui-layer">
          <div class="top-bar">
            <div class="score-container">
              <span class="score-label">SCORE</span>
              <span class="score-value" id="score">0</span>
            </div>
            <div class="lives-container" id="lives">
              <span class="life active">✖</span>
              <span class="life active">✖</span>
              <span class="life active">✖</span>
            </div>
          </div>
        </div>

        <div id="flash-overlay"></div>

        <div id="menu-layer">
          <h1>FRUIT SLICER</h1>
          <p>Score: <span id="final-score">0</span></p>
          <button id="start-btn">PLAY</button>
        </div>
      </div>
    `);

    this.scoreEl = document.getElementById('score')!;
    this.menuLayer = document.getElementById('menu-layer')!;
    this.flashOverlay = document.getElementById('flash-overlay')!;
    this.finalScoreEl = document.getElementById('final-score')!;
    this.startButton = document.getElementById('start-btn')!;
    
    this.livesEls = Array.from(document.querySelectorAll('.life'));

    this.startButton.addEventListener('click', () => {
      onStart();
    });
  }

  updateScore(score: number) {
    this.scoreEl.innerText = score.toString();
  }

  updateLives(lives: number) {
    this.livesEls.forEach((el, index) => {
      if (index < lives) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  showMenu(score: number) {
    this.finalScoreEl.innerText = score.toString();
    this.menuLayer.classList.remove('hidden');
  }

  hideMenu() {
    this.menuLayer.classList.add('hidden');
  }

  flash() {
    this.flashOverlay.style.opacity = '1';
    setTimeout(() => {
      this.flashOverlay.style.opacity = '0';
    }, 100);
  }
}
