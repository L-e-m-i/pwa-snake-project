import { Injectable, signal, computed, inject } from '@angular/core';
import { SnakeService, GameLevel } from './snake.service';
import { LevelConfigService } from './level-config.service';
import { SwipeDirection } from './gesture.service';
import { Position } from '../models/position';
import { PrngService } from './prng.service';
import { ScoreService } from './score.service';

export interface GameState {
	score: number;
	level: GameLevel;
	isRunning: boolean;
	isGameOver: boolean;
	isPaused: boolean;
	startTime: number; 
    foodEatenCount: number;
    movesCount: number; 
    maxSnakeLength: number; 
}

@Injectable({
	providedIn: 'root',
})
export class GameService {
	constructor(
		private snakeService: SnakeService,
		private levelConfigService: LevelConfigService,
		private prngService: PrngService,
		private scoreService: ScoreService
	) {}

	private food = signal<Position>({ x: 5, y: 5 });
	private obstacles = signal<Position[]>([]);
	private seed = signal<number>(Date.now());
	initializeObstacles(boardSize: { width: number; height: number }, level: GameLevel): void {
		console.log('Initializing obstacles for level:', level);
		if (level !== 'hard') {
			this.obstacles.set([]);
			this.snakeService.setObstacles([]);
			return;
		}
		const newObstacles: Position[] = [];
		const obstacleCount = 12;
		let idx = 0;
		let x: number = 1;
		let y: number = 2;
		while (idx < obstacleCount) {
			idx++;
			const obstacle = {
				x: x,
				y: y,
			};
			
			x == 1 ? x = 8 : x = 1;
			x % 2 === 1 ? y+=3 : y;

			if (
				!newObstacles.some((o) => o.x === obstacle.x && o.y === obstacle.y) &&
				!this.snakeService
					.snake()
					.body.some((segment) => segment.x === obstacle.x && segment.y === obstacle.y) &&
				!(this.food().x === obstacle.x && this.food().y === obstacle.y)
			) {
				newObstacles.push(obstacle);
			}
		}
		console.log('Generated obstacles:', newObstacles);
		this.snakeService.setObstacles(newObstacles);
		this.obstacles.set(newObstacles);
	}

	generateFood(boardSize: { width: number; height: number }, snakeBody: Position[]): void {
		let newFood: Position;
		const random = this.prngService.mulberry32(this.seed());
		do {
			newFood = {
				x: Math.floor(random() * boardSize.width),
				y: Math.floor(random() * boardSize.height),
			};
			
		} while (
            snakeBody.some((segment) => segment.x === newFood.x && segment.y === newFood.y) ||
            this.obstacles().some((o) => o.x === newFood.x && o.y === newFood.y)
        );

		this.seed.update((s) => s + 1);
		
		console.log('Generated food position:', newFood);
		this.food.set(newFood);
		this.snakeService.setFood(newFood);
	}

	readonly currentFood = this.food.asReadonly();
	readonly currentObstacles = this.obstacles.asReadonly();

	private gameState = signal<GameState>({
		score: 0,
		level: 'easy',
		isRunning: false,
		isGameOver: false,
		isPaused: false,
		startTime: 0,
		foodEatenCount: 0,
		movesCount: 0,
		maxSnakeLength: 0,
	});

	private directionChanged = signal(false);
	private gameLoopId: number | null = null;

	readonly state = this.gameState.asReadonly();
	readonly isActive = computed(
		() => this.state().isRunning && !this.state().isPaused && !this.state().isGameOver
	);

	readonly levelConfig = computed(() => this.levelConfigService.getLevelConfig(this.state().level));

	initializeGame(level: GameLevel): void {
		console.log('Initializing game at level:', level);
		this.gameState.set({
			score: 0,
			level,
			isRunning: false,
			isGameOver: false,
			isPaused: false,
			startTime: 0,
			foodEatenCount: 0,
			movesCount: 0,
			maxSnakeLength: 0,
		});
		this.directionChanged.set(false);
		this.snakeService.reset();
		const initialFood: Position = { x: 5, y: 5 };
		this.food.set(initialFood);
		this.snakeService.setFood(initialFood);
	}

	startGame(level: GameLevel): void {
		this.stopGameLoop();
		if (this.obstacles().length === 0) {
			this.initializeObstacles(this.levelConfig().boardSize, level);
		}
		this.snakeService.reset();
		const initialFood: Position = { x: 5, y: 5 };
        this.food.set(initialFood);
        this.snakeService.setFood(initialFood);

		console.log('Starting game at level:', level);
		this.gameState.set({
			score: 0,
			level,
			isRunning: true,
			isGameOver: false,
			isPaused: false,
			startTime: Date.now(),
			foodEatenCount: 0,
			movesCount: 0,
			maxSnakeLength: this.snakeService.snake().body.length,
		});
		this.directionChanged.set(false);

		this.snakeService.setFood({ x: 5, y: 5 });
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

		const finalState = this.state();
		const gameDurationMs = Date.now() - finalState.startTime;
		this.scoreService.saveScore(
			finalState.score,
			finalState.level,
			gameDurationMs,
			finalState.maxSnakeLength,
			finalState.foodEatenCount,
			finalState.movesCount
		);
		this.obstacles.set([]);
		this.snakeService.setObstacles([]);
		this.gameState.update((state) => ({
			...state,
			isRunning: false,
			isGameOver: true,
			isPaused: false,
		}));
	}

	resetGame(): void {
		this.stopGameLoop();
		this.snakeService.reset();
        const initialFood: Position = { x: 5, y: 5 };
        this.food.set(initialFood);
        this.snakeService.setFood(initialFood);

        this.obstacles.set([]);
        this.snakeService.setObstacles([]);

        this.gameState.update((state) => ({ 
			...state,
			score: 0,
			startTime: 0, 
            foodEatenCount: 0, 
            movesCount: 0, 
            maxSnakeLength: 0, 
		}));
	}

	private addScore(points: number): void {
		this.gameState.update((state) => ({ 
			...state, 
			score: state.score + points,
			foodEatenCount: state.foodEatenCount + 1,
			maxSnakeLength: Math.max(state.maxSnakeLength, this.snakeService.snake().body.length),
		}));

	}

	private startGameLoop(): void {
		const config = this.levelConfig();
		this.seed.set(Date.now());
		const gameLoop = () => {
			if (!this.isActive()) {
				return;
			}

			this.directionChanged.set(false);

			this.gameState.update(state => ({
                ...state,
                maxSnakeLength: Math.max(state.maxSnakeLength, this.snakeService.snake().body.length),
                movesCount: state.movesCount + 1,
            }));

			const gameEvent = this.snakeService.moveSnake(config.boardSize, this.state().level);

			switch (gameEvent.type) {
				case 'collision':
					this.gameOver();
					return;
				case 'food-eaten':
					this.addScore(1);
					this.generateFood(config.boardSize, this.snakeService.snake().body);
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
			arrowup: 'up',
			arrowdown: 'down',
			arrowleft: 'left',
			arrowright: 'right',
			w: 'up',
			s: 'down',
			a: 'left',
			d: 'right',
		};

		const direction = keyMap[event.key.toLowerCase()];
		
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
