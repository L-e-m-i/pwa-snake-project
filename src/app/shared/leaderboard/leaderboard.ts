import { Component, Input, signal } from '@angular/core';
import { ScoreService } from '../../services/score.service';
import { ScoreData } from '../../models/scoreData';
import { CommonModule } from '@angular/common';
import { GameLevel } from '../../services/snake.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-leaderboard',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
  ],
  standalone: true,
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss'
})
export class Leaderboard {
  @Input() level!: GameLevel;
  protected scores = signal<ScoreData[]>([]);
  loading = signal<boolean>(true);
  constructor(protected readonly scoreService: ScoreService) {}
  ngOnInit(): void {
    this.loadScores();
  }

  protected async loadScores(): Promise<void> {

    this.loading.set(true);
    try{
      const scores = await this.scoreService.getScoresByLevel(this.level);
      scores.sort((a, b) => b.score - a.score);
      this.scores.set(scores);
      this.scoreService.attemptSync();
    } catch(e){
      console.error('Failed to load scores: ', e);
      this.scores.set([]);
    }finally{
      this.loading.set(false);
      console.log('finally', this.scores())
    }
  }
}
