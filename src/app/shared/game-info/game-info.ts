import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameService } from '../../services/game.service';
import { GameLevel } from '../../services/snake.service';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game-info',
  imports: [
    MatIconModule
  ],
  templateUrl: './game-info.html',
  styleUrl: './game-info.scss'
})
export class GameInfo {
  @Input() level!: GameLevel;
  @Output() start = new EventEmitter<GameLevel>();
  
  constructor(
    protected readonly gameService: GameService,
    protected readonly router: Router
  ) {
  }

  protected onStart(): void {
    this.start.emit(this.level);
  }

  protected exitLevel(): void {
    this.gameService.resetGame();
    this.router.navigate(['/']);
  }
}
