import { ChangeDetectionStrategy, Component, computed, ElementRef } from '@angular/core';
import { GameConfig, LevelConfigService } from '../../../services/level-config.service';
import { GameService } from '../../../services/game.service';
import { SnakeService } from '../../../services/snake.service';
import { GestureService } from '../../../services/gesture.service';
import { CellType } from '../../../models/celltype';
import { GameLevel } from '../../../services/snake.service';
import { GameInfo } from '../../../shared/game-info/game-info';
import { Leaderboard } from '../../../shared/leaderboard/leaderboard';
import { GameOver } from '../../../shared/gameover/gameover';
import { Level } from '../../../shared/level/level';

@Component({
	selector: 'app-medium',
	imports: [GameInfo, GameOver, Level, Leaderboard],
	templateUrl: './medium.html',
	styleUrl: './medium.scss',
})
export class Medium {
	protected readonly level: GameLevel = 'medium';

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
