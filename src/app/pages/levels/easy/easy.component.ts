import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnInit } from '@angular/core';
import { SnakeService } from '../../../services/snake.service';
import { GameService } from '../../../services/game.service';
import { GameConfig, LevelConfigService } from '../../../services/level-config.service';
import { GestureService } from '../../../services/gesture.service';

interface CellType {
  type: 'empty' | 'snake' | 'food' | 'obstacle';
  isHead?: boolean;
}

@Component({
  selector: 'app-easy',
  templateUrl: './easy.component.html',
  styleUrl: './easy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown)': 'handleKeyDown($event)',
    '(touchstart)': 'handleTouchStart($event)',
    '(touchend)': 'handleTouchEnd($event)', 
    '(touchmove)': 'handleTouchMove($event)',
    'tabindex': '0'
  }
})
export class EasyComponent implements OnInit {
  protected readonly gameService = inject(GameService);
  protected readonly snakeService = inject(SnakeService);
  private readonly levelConfigService = inject(LevelConfigService);
  private readonly gestureService = inject(GestureService);
  private readonly elementRef = inject(ElementRef);

  protected readonly levelConfig: GameConfig = this.levelConfigService.getLevelConfig('easy');

  protected readonly gameBoard = computed(() => {
    const snake = this.snakeService.currentSnake();
    const food = this.snakeService.currentFood();
    const obstacles = this.snakeService.currentObstacles();

    const board: CellType[][] = Array.from(
      { length: this.levelConfig.boardSize.height },
      () => Array.from(
        { length: this.levelConfig.boardSize.width },
        () => ({ type: 'empty' })
      )
    );

    snake.body.forEach((segment, index) => {
      if (this.isValidPosition(segment)) {
        board[segment.y][segment.x] = {
          type: 'snake',
          isHead: index === 0
        };
      }
    });

    if (this.isValidPosition(food)) {
      board[food.y][food.x] = { type: 'food' };
    }

    obstacles.forEach(obstacle => {
      if (this.isValidPosition(obstacle)) {
        board[obstacle.y][obstacle.x] = { type: 'obstacle' };
      }
    });

    return board;
  });

  ngOnInit(): void {
    this.focusComponent();
  }

  protected startGame(): void {
    this.gameService.startGame('easy');
    this.focusComponent();
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    this.gameService.handleKeyDown(event);
  }

  protected handleTouchStart(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    
    // Don't prevent default for buttons and controls
    if (target.tagName === 'BUTTON' || target.closest('.controls')) {
      return;
    }
    
    event.preventDefault();
    this.gestureService.handleTouchStart(event);
  }

  protected handleTouchEnd(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    
    // Don't prevent default for buttons and controls
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
    
    // Don't prevent default for buttons and controls
    if (target.tagName === 'BUTTON' || target.closest('.controls')) {
      return;
    }
    
    this.gestureService.handleTouchMove(event);
  }

  protected togglePause(): void {
    this.gameService.pauseGame();
  }

  private isValidPosition(position: { x: number; y: number }): boolean {
    return position.x >= 0 && 
           position.x < this.levelConfig.boardSize.width &&
           position.y >= 0 && 
           position.y < this.levelConfig.boardSize.height;
  }

  private focusComponent(): void {
    requestAnimationFrame(() => {
      this.elementRef.nativeElement.focus();
    });
  }
}