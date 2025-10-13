import {
	ChangeDetectionStrategy,
	Component,
	computed,
	ElementRef,
	Input,
	OnInit,
} from '@angular/core';
import { CellType } from '../../models/celltype';
import { GameService } from '../../services/game.service';
import { GestureService } from '../../services/gesture.service';
import { GameConfig, LevelConfigService } from '../../services/level-config.service';
import { GameLevel, SnakeService } from '../../services/snake.service';

@Component({
	selector: 'app-level',
	imports: [],
	templateUrl: './level.html',
	styleUrl: './level.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'(keydown)': 'handleKeyDown($event)',
		tabindex: '0',
	},
})
export class Level implements OnInit {
	@Input() level!: GameLevel;
	protected levelConfig!: GameConfig;

	private boundTouchStart = (e: TouchEvent) => this.handleTouchStart(e);
	private boundTouchEnd = (e: TouchEvent) => this.handleTouchEnd(e);
	private boundTouchMove = (e: TouchEvent) => this.handleTouchMove(e);

	constructor(
		protected readonly gameService: GameService,
		protected readonly snakeService: SnakeService,
		private readonly levelConfigService: LevelConfigService,
		private readonly gestureService: GestureService,
		private readonly elementRef: ElementRef
	) {}

	ngOnInit(): void {
		this.levelConfig = this.levelConfigService.getLevelConfig(this.level);
		console.log('Level config:', this.levelConfig);
		this.gameService.initializeObstacles(this.levelConfig.boardSize, this.level);
		this.gameService.initializeGame(this.level);
		const board = this.elementRef.nativeElement.querySelector('#game-board') as HTMLElement | null;
		const opts: AddEventListenerOptions = { passive: false };

		if (board) {
			board.addEventListener('touchstart', this.boundTouchStart, opts);
			board.addEventListener('touchend', this.boundTouchEnd, opts);
			board.addEventListener('touchmove', this.boundTouchMove, opts);
		} else {
			this.elementRef.nativeElement.addEventListener('touchstart', this.boundTouchStart, opts);
			this.elementRef.nativeElement.addEventListener('touchend', this.boundTouchEnd, opts);
			this.elementRef.nativeElement.addEventListener('touchmove', this.boundTouchMove, opts);
		}
	}

	ngOnDestroy(): void {
		const board = this.elementRef.nativeElement.querySelector('#game-board') as HTMLElement | null;
		const opts: AddEventListenerOptions = { passive: false };

		if (board) {
			board.removeEventListener('touchstart', this.boundTouchStart, opts);
			board.removeEventListener('touchend', this.boundTouchEnd, opts);
			board.removeEventListener('touchmove', this.boundTouchMove, opts);
		} else {
			this.elementRef.nativeElement.removeEventListener('touchstart', this.boundTouchStart, opts);
			this.elementRef.nativeElement.removeEventListener('touchend', this.boundTouchEnd, opts);
			this.elementRef.nativeElement.removeEventListener('touchmove', this.boundTouchMove, opts);
		}
	}

	protected readonly gameBoard = computed(() => {
		const snake = this.snakeService.currentSnake();
		const food = this.gameService.currentFood();
		const obstacles = this.gameService.currentObstacles();

		const board: CellType[][] = Array.from({ length: this.levelConfig.boardSize.height }, () =>
			Array.from({ length: this.levelConfig.boardSize.width }, () => ({ type: 'empty' }))
		);

		obstacles.forEach((obstacle) => {
			if (this.isValidPosition(obstacle)) {
				board[obstacle.y][obstacle.x] = { type: 'obstacle' };
			}
		});

		snake.body.forEach((segment, index) => {
			if (this.isValidPosition(segment)) {
				board[segment.y][segment.x] = {
					type: 'snake',
					isHead: index === 0,
				};
			}
		});

		if (this.isValidPosition(food)) {
			board[food.y][food.x] = { type: 'food' };
		}

		obstacles.forEach((obstacle) => {
			if (this.isValidPosition(obstacle)) {
				board[obstacle.y][obstacle.x] = { type: 'obstacle' };
			}
		});

		return board;
	});


	protected handleKeyDown(event: KeyboardEvent): void {
		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
			event.preventDefault();
		}
		this.gameService.handleKeyDown(event);
	}

	protected handleTouchStart(event: TouchEvent): void {
		const target = event.target as HTMLElement;

		if (target.tagName === 'BUTTON' || target.closest('.controls')) {
			return;
		}

		event.preventDefault();
		this.gestureService.handleTouchStart(event);
	}

	protected handleTouchEnd(event: TouchEvent): void {
		const target = event.target as HTMLElement;

		if (target.tagName === 'BUTTON' || target.closest('.controls')) {
			return;
		}

		event.preventDefault();
		const swipeDirection = this.gestureService.handleTouchEnd(event);

		if (swipeDirection) {
			this.gameService.handleSwipe(swipeDirection);
		}
	}

	protected handleTouchMove(event: TouchEvent): void {
		const target = event.target as HTMLElement;

		if (target.tagName === 'BUTTON' || target.closest('.controls')) {
			return;
		}

		this.gestureService.handleTouchMove(event);
	}

	protected togglePause(): void {
		this.gameService.pauseGame();
	}

	private isValidPosition(position: { x: number; y: number }): boolean {
		return (
			position.x >= 0 &&
			position.x < this.levelConfig.boardSize.width &&
			position.y >= 0 &&
			position.y < this.levelConfig.boardSize.height
		);
	}

}
