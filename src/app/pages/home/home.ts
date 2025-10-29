import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatAnchor, MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'app-home',
	imports: [MatListModule, MatAnchor, RouterLink, MatButtonModule],
	styleUrl: './home.scss',
	templateUrl: './home.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);
	protected readonly isloggedin = computed(() => !!this.authService.user());
	constructor() {}
	async logout(): Promise<void> {
		try {
			await this.authService.logout();
			this.router.navigateByUrl('/login');
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}
}
