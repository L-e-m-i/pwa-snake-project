import { Component, Input } from '@angular/core';
import { GameService } from '../../services/game.service';
import { GameLevel } from '../../services/snake.service';

@Component({
  selector: 'app-gameover',
  imports: [],
  templateUrl: './gameover.html',
  styleUrl: './gameover.scss'
})
export class Gameover {
  @Input() level!: GameLevel;
  constructor(
    protected readonly gameService: GameService
  ){}
}
