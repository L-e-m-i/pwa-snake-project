import { Injectable, signal, computed, inject } from '@angular/core';
import { SnakeService, GameLevel } from './snake.service';
import { LevelConfigService } from './level-config.service';
import { SwipeDirection } from './gesture.service';

export interface GameState {
	score: number;
	level: GameLevel;
	isRunning: boolean;
	isGameOver: boolean;
	isPaused: boolean;
}

@Injectable({
	providedIn: 'root',
})
export class GameService {
	private snakeService = inject(SnakeService);
	private levelConfigService = inject(LevelConfigService);

	private gameState = signal<GameState>({
		score: 0,
		level: 'easy',
		isRunning: false,
		isGameOver: false,
		isPaused: false,
	});

	private directionChanged = signal(false);
	private gameLoopId: number | null = null;

	readonly state = this.gameState.asReadonly();
	readonly isActive = computed(
		() => this.state().isRunning && !this.state().isPaused && !this.state().isGameOver
	);

	readonly levelConfig = computed(() => this.levelConfigService.getLevelConfig(this.state().level));

	startGame(level: GameLevel): void {
		this.stopGameLoop();
		this.snakeService.reset();

		this.gameState.set({
			score: 0,
			level,
			isRunning: true,
			isGameOver: false,
			isPaused: false,
		});

		this.directionChanged.set(false);
		this.startGameLoop();
	}

	pauseGame(): void {
		this.gameState.update((state) => ({ ...state, isPaused: !state.isPaused }));

		if (this.state().isPaused) {
			this.stopGameLoop();
		} else {
			this.startGameLoop();
		}
	}

	gameOver(): void {
		this.stopGameLoop();
		this.gameState.update((state) => ({
			...state,
			isRunning: false,
			isGameOver: true,
			isPaused: false,
		}));
	}

	private addScore(points: number): void {
		this.gameState.update((state) => ({ ...state, score: state.score + points }));
	}

	private startGameLoop(): void {
		const config = this.levelConfig();

		const gameLoop = () => {
			if (!this.isActive()) {
				return;
			}

			// Reset direction change flag at start of each tick
			this.directionChanged.set(false);

			const gameEvent = this.snakeService.moveSnake(config.boardSize, this.state().level);

			switch (gameEvent.type) {
				case 'collision':
					this.gameOver();
					return;
				case 'food-eaten':
					this.addScore(1);
					break;
				case 'move':
					break;
			}

			if (this.isActive()) {
				this.gameLoopId = setTimeout(gameLoop, config.speed);
			}
		};

		this.gameLoopId = setTimeout(gameLoop, config.speed);
	}

	handleKeyDown(event: KeyboardEvent): void {
		if (event.key === ' ' && this.state().isRunning) {
			event.preventDefault();
			this.pauseGame();
			return;
		} else {
			if (event.key === ' ' && !this.state().isRunning) {
				event.preventDefault();
				this.startGame(this.state().level);
				return;
			}
		}

		if (!this.isActive()) return;

		if (this.directionChanged()) return;

		const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
			ArrowUp: 'up',
			ArrowDown: 'down',
			ArrowLeft: 'left',
			ArrowRight: 'right',
			w: 'up',
			s: 'down',
			a: 'left',
			d: 'right',
			W: 'up',
			S: 'down',
			A: 'left',
			D: 'right',
		};

		const direction = keyMap[event.key];
		if (direction) {
			event.preventDefault();
			this.handleDirectionChange(direction);
			this.directionChanged.set(true);
		}
	}

	handleSwipe(direction: SwipeDirection): void {
		if (!this.isActive() || this.directionChanged()) return;
		this.handleDirectionChange(direction);
	}

	private handleDirectionChange(direction: 'up' | 'down' | 'left' | 'right'): void {
		this.snakeService.changeDirection(direction);
		this.directionChanged.set(true);
	}

	private stopGameLoop(): void {
		if (this.gameLoopId) {
			clearTimeout(this.gameLoopId);
			this.gameLoopId = null;
		}
	}
}
