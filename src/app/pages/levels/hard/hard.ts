import { ChangeDetectionStrategy, Component, computed, ElementRef } from '@angular/core';
import { CellType } from '../../../models/celltype';
import { GameService } from '../../../services/game.service';
import { GestureService } from '../../../services/gesture.service';
import { GameConfig, LevelConfigService } from '../../../services/level-config.service';
import { GameLevel, SnakeService } from '../../../services/snake.service';
import { GameInfo } from '../../../shared/game-info/game-info';
import { GameOver } from '../../../shared/gameover/gameover';
import { Level } from '../../../shared/level/level';
import { Leaderboard } from "../../../shared/leaderboard/leaderboard";

@Component({
	selector: 'app-hard',
	imports: [GameInfo, GameOver, Level, Leaderboard],
	templateUrl: './hard.html',
	styleUrl: './hard.scss',
})
export class Hard {
	protected readonly level: GameLevel = 'hard';

	constructor(
		protected readonly gameService: GameService,
		private readonly elementRef: ElementRef
	) {}

	protected startGame(): void {
		this.gameService.startGame(this.level);
		this.focusLevel();
	}

	private focusLevel(): void {
		requestAnimationFrame(() => {
			const host = this.elementRef.nativeElement as HTMLElement;
			const levelEl = host.querySelector('app-level') as HTMLElement | null;

			const focusTarget = levelEl ?? host;

			try {
				focusTarget.focus?.({ preventScroll: true } as FocusOptions);
			} catch {
				const prevX = window.scrollX;
				const prevY = window.scrollY;
				focusTarget.focus?.();
				window.scrollTo(prevX, prevY);
			}
		});
	}
}
