import { persistence } from './libs/persistence';

export interface GameSettings {
  lives: number;
  bombsEnabled: boolean;
  gameSpeed: number;
}

export const defaultSettings: GameSettings = {
  lives: 3,
  bombsEnabled: true,
  gameSpeed: 1.0,
};

export async function loadSettings(): Promise<GameSettings> {
  const data = await persistence.getItem('game_settings');
  if (data) {
    try {
      return { ...defaultSettings, ...JSON.parse(data) };
    } catch (e) {
      return defaultSettings;
    }
  }
  return defaultSettings;
}

export async function saveSettings(settings: GameSettings) {
  await persistence.setItem('game_settings', JSON.stringify(settings));
}
