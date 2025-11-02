import { GameLevel } from "../services/snake.service";

export interface ScoreData {
    userId?: number;
	username?: string;
	score: number;
	level: GameLevel;
	date: number; 
	gameDurationMs: number; 
	maxSnakeLength: number; 
	foodEatenCount: number; 
	movesCount: number; 
	hash: string; 
	isSynced: boolean; 
	id: number;
}
