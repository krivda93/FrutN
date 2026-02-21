import { GameSettings } from './settings';

export class UI {
  scoreEl: HTMLElement;
  livesContainer: HTMLElement;
  livesEls: HTMLElement[] = [];
  menuLayer: HTMLElement;
  flashOverlay: HTMLElement;
  finalScoreEl: HTMLElement;
  startButton: HTMLElement;
  fullscreenButton: HTMLElement;

  settingsBtn: HTMLElement;
  settingsModal: HTMLElement;
  settingsSaveBtn: HTMLElement;
  settingsLivesInput: HTMLInputElement;
  settingsBombsInput: HTMLInputElement;
  settingsSpeedInput: HTMLInputElement;
  speedVal: HTMLElement;

  currentSettings: GameSettings;

  constructor(
    onStart: (settings: GameSettings) => void,
    initialSettings: GameSettings,
    onSettingsSave: (settings: GameSettings) => void
  ) {
    this.currentSettings = initialSettings;

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
            </div>
          </div>
          <button id="fullscreen-btn">⛶</button>
        </div>

        <div id="flash-overlay"></div>

        <div id="menu-layer">
          <button id="start-btn">
            <h1>FRUIT SLICER</h1>
            <p>Score: <span id="final-score">0</span></p>
            <div class="play-text">TAP TO PLAY</div>
          </button>
          <button id="settings-btn" class="icon-btn">⚙️</button>
        </div>

        <div id="settings-modal" class="hidden">
          <div class="settings-content">
            <h2>Settings</h2>
            <div class="settings-row">
              <label>Lives:</label>
              <input type="number" id="settings-lives" min="1" max="10">
            </div>
            <div class="settings-row">
              <label>Bombs:</label>
              <input type="checkbox" id="settings-bombs">
            </div>
            <div class="settings-row">
              <label>Speed: <span id="speed-val"></span>x</label>
              <input type="range" id="settings-speed" min="0.5" max="3.0" step="0.1">
            </div>
            <button id="settings-save">Save & Close</button>
          </div>
        </div>
      </div>
    `);

    this.scoreEl = document.getElementById('score')!;
    this.livesContainer = document.getElementById('lives')!;
    this.menuLayer = document.getElementById('menu-layer')!;
    this.flashOverlay = document.getElementById('flash-overlay')!;
    this.finalScoreEl = document.getElementById('final-score')!;
    this.startButton = document.getElementById('start-btn')!;
    this.fullscreenButton = document.getElementById('fullscreen-btn')!;
    
    this.settingsBtn = document.getElementById('settings-btn')!;
    this.settingsModal = document.getElementById('settings-modal')!;
    this.settingsSaveBtn = document.getElementById('settings-save')!;
    this.settingsLivesInput = document.getElementById('settings-lives') as HTMLInputElement;
    this.settingsBombsInput = document.getElementById('settings-bombs') as HTMLInputElement;
    this.settingsSpeedInput = document.getElementById('settings-speed') as HTMLInputElement;
    this.speedVal = document.getElementById('speed-val')!;

    this.startButton.addEventListener('click', () => {
      onStart(this.currentSettings);
    });

    this.settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openSettings();
    });

    this.settingsSpeedInput.addEventListener('input', () => {
      this.speedVal.innerText = Number(this.settingsSpeedInput.value).toFixed(1);
    });

    this.settingsSaveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.currentSettings = {
        lives: parseInt(this.settingsLivesInput.value) || 3,
        bombsEnabled: this.settingsBombsInput.checked,
        gameSpeed: parseFloat(this.settingsSpeedInput.value) || 1.0,
      };
      onSettingsSave(this.currentSettings);
      this.settingsModal.classList.add('hidden');
      this.setupLives(this.currentSettings.lives);
    });

    this.fullscreenButton.addEventListener('click', () => {
      const doc = document as any;
      const docEl = document.documentElement as any;
      
      const requestFullscreen = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
      const exitFullscreen = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      const fullscreenElement = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

      if (!fullscreenElement) {
        if (requestFullscreen) {
          const promise = requestFullscreen.call(docEl);
          if (promise) {
            promise.catch((err: any) => {
              console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
            });
          }
        } else {
          alert('Полноэкранный режим не поддерживается в этом браузере (например, в iOS Safari на iPhone). Попробуйте добавить сайт на домашний экран.');
        }
      } else {
        if (exitFullscreen) {
          exitFullscreen.call(doc);
        }
      }
    });

    this.setupLives(this.currentSettings.lives);
  }

  openSettings() {
    this.settingsLivesInput.value = this.currentSettings.lives.toString();
    this.settingsBombsInput.checked = this.currentSettings.bombsEnabled;
    this.settingsSpeedInput.value = this.currentSettings.gameSpeed.toString();
    this.speedVal.innerText = this.currentSettings.gameSpeed.toFixed(1);
    this.settingsModal.classList.remove('hidden');
  }

  setupLives(totalLives: number) {
    this.livesContainer.innerHTML = '';
    this.livesEls = [];
    for (let i = 0; i < totalLives; i++) {
      const el = document.createElement('span');
      el.className = 'life active';
      el.innerText = '✖';
      this.livesContainer.appendChild(el);
      this.livesEls.push(el);
    }
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
