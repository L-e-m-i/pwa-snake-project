import { Injectable, signal, computed, inject } from '@angular/core';
import { GameService } from './game.service';


export interface Position {
  x: number;
  y: number;
}

export interface Snake {
  body: Position[];
  direction: 'up' | 'down' | 'left' | 'right';
}

export type GameLevel = 'easy' | 'medium' | 'hard';

export interface GameEvent {
  type: 'food-eaten' | 'collision' | 'move';
}

@Injectable({
  providedIn: 'root'
})
export class SnakeService {


  private snake = signal<Snake>({
    body: [{ x: 5, y: 10 }, { x: 5, y: 11 }, { x: 5, y: 12 }],
    direction: 'right'
  })

  private food = signal<Position>({ x: 5, y: 5 });
  private obstacles = signal<Position[]>([]);


  readonly currentSnake = this.snake.asReadonly();
  readonly currentFood = this.food.asReadonly();
  readonly currentObstacles = this.obstacles.asReadonly();
  readonly snakeHead = computed(() => this.snake().body[0]);


  moveSnake(boardSize: {width: number, height: number}, level: GameLevel): GameEvent {
    const currentSnake = this.snake();
    const head = { ...currentSnake.body[0] };

    switch (currentSnake.direction) {
      case 'up':
        head.y--; break;
      case 'down':
        head.y++; break;
      case 'left':
        head.x--; break;
      case 'right':
        head.x++; break;
    }

    if(level !== 'easy'){
      if(head.x < 0 || head.x >= boardSize.width || head.y < 0 || head.y >= boardSize.height){
        return {type: 'collision'}; 
      }
    }else{
      head.x = (head.x + boardSize.width) % boardSize.width;
      head.y = (head.y + boardSize.height) % boardSize.height;
    }

    if (currentSnake.body.some(segment => segment.x === head.x && segment.y === head.y)) {
      return {type: 'collision'};
    }

    const newBody = [head, ...currentSnake.body];
    let gameEvent: GameEvent = { type: 'move' };
    const currentFood = this.food();
    if (head.x === currentFood.x && head.y === currentFood.y) {
      this.generateFood(boardSize, newBody);
      gameEvent = { type: 'food-eaten' };
    } else {
      newBody.pop();
    }

    this.snake.set({ ...currentSnake, body: newBody, direction: currentSnake.direction });
    return gameEvent;
  }

  changeDirection(direction: Snake['direction']): void {
    
    const currentDirection = this.snake().direction;
    if(currentDirection === 'up' && direction === 'down') return;
    if(currentDirection === 'down' && direction === 'up') return;
    if(currentDirection === 'left' && direction === 'right') return;
    if(currentDirection === 'right' && direction === 'left') return;
    console.log('Changing direction to:', direction);
    this.snake.update(snake => ({ ...snake, direction }));
  }

  reset(): void {
    this.snake.set({
      body: [{ x: 5, y: 10 }, { x: 5, y: 11 }, { x: 5, y: 12 }],
      direction: 'up'
    });
    this.food.set({ x: 5, y: 5 });
  }

  private generateFood(boardSize: { width: number; height: number }, snakeBody: Position[]): void {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * boardSize.width),
        y: Math.floor(Math.random() * boardSize.height)
      };
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    this.food.set(newFood);
  }

}
