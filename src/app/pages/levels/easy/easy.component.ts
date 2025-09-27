import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnInit } from '@angular/core';
import { SnakeService } from '../../../services/snake.service';
import { GameService } from '../../../services/game.service';
import { GameConfig, LevelConfigService } from '../../../services/level-config.service';


interface CellType {
  type: 'empty' | 'snake' | 'food' | 'obstacle';
  isHead?: boolean;
}

@Component({
  selector: 'app-easy',
  imports: [],
  //template: `<p>easy works!</p>`,
  templateUrl: './easy.component.html',
  styleUrl: './easy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown)': 'handleKeyDown($event)',
    'tabindex': '0'
  }
})
export class EasyComponent implements OnInit { 

  

  protected readonly gameService = inject(GameService);
  protected readonly snakeService = inject(SnakeService);
  private readonly levelConfigService = inject(LevelConfigService);
  private readonly elementRef = inject(ElementRef);
  levelConfig: GameConfig;

  constructor() {
    this.levelConfig = this.levelConfigService.getLevelConfig('easy');
  }

  ngOnInit(): void {
    this.focusComponent();
  }

  protected startGame(): void {
    this.gameService.startGame('easy');
    this.focusComponent();
  }

  protected readonly gameBoard = computed(() => {
    const snake = this.snakeService.currentSnake();
    const food = this.snakeService.currentFood();
    const obstacles = this.snakeService.currentObstacles();

    // Initialize empty board
    const board: CellType[][] = Array.from(
      { length: this.levelConfig.boardSize.height },
      () => Array.from(
        { length: this.levelConfig.boardSize.width },
        () => ({ type: 'empty' })
      )
    );

    // Place snake body
    snake.body.forEach((segment, index) => {
      if (this.isValidPosition(segment)) {
        board[segment.y][segment.x] = {
          type: 'snake',
          isHead: index === 0
        };
      }
    });

    // Place food
    if (this.isValidPosition(food)) {
      board[food.y][food.x] = { type: 'food' };
    }

    // Place obstacles (for future hard level compatibility)
    obstacles.forEach(obstacle => {
      if (this.isValidPosition(obstacle)) {
        board[obstacle.y][obstacle.x] = { type: 'obstacle' };
      }
    });

    return board;
  });

  private isValidPosition(position: { x: number; y: number }): boolean {
    return position.x >= 0 && 
           position.x < this.levelConfig.boardSize.width &&
           position.y >= 0 && 
           position.y < this.levelConfig.boardSize.height;
  }




  protected handleKeyDown(event: KeyboardEvent): void {
    this.gameService.handleKeyDown(event);
  }

   protected togglePause(): void {
    this.gameService.pauseGame();
  }

  private focusComponent(): void {
    requestAnimationFrame(() => {
      this.elementRef.nativeElement.focus();
    });
  }

}
