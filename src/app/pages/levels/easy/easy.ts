import {
	ChangeDetectionStrategy,
	Component,
	computed,
	ElementRef,
	inject,
	OnInit,
} from '@angular/core';
import { GameLevel, SnakeService } from '../../../services/snake.service';
import { GameService } from '../../../services/game.service';
import { GameInfo } from '../../../shared/game-info/game-info';
import { Gameover } from '../../../shared/gameover/gameover';
import { Level } from '../../../shared/level/level';

@Component({
	selector: 'app-easy',
	templateUrl: './easy.html',
	styleUrl: './easy.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,

	imports: [GameInfo, Gameover, Level],
})
export class Easy {
	protected readonly level: GameLevel = 'easy';

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
