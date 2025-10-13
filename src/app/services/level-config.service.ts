import { Injectable } from '@angular/core';
import { GameLevel } from './snake.service';

export interface GameConfig {
  gameLevel: GameLevel;
  boardSize: { width: number; height: number };
  speed: number;
  hasBorders: boolean;
  hasObstacles: boolean;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LevelConfigService {

  getLevelConfig(level: 'easy' | 'medium' | 'hard'): GameConfig{
    const configs: Record<string, GameConfig> = {
      easy: {
        gameLevel: 'easy',
        boardSize: { width: 10, height: 20 },
        speed: 200,
        hasBorders: false,
        hasObstacles: false,
      },
      medium: {
        gameLevel: 'medium',
        boardSize: { width: 10, height: 20 },
        speed: 200,
        hasBorders: true,
        hasObstacles: false,
      },
      hard: {
        gameLevel: 'hard',
        boardSize: { width: 10, height: 20 },
        speed: 200,
        hasBorders: true,
        hasObstacles: true,
      }
    }
    return configs[level];
  }

}
