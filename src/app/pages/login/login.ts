import { Component, inject, signal } from '@angular/core';
import {
	FormBuilder,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatCard } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
	selector: 'app-login',
	imports: [
		FormsModule,
		ReactiveFormsModule,
		MatFormField,
		MatLabel,
		MatInput,
		MatButtonModule,
		RouterLink,
	],

	templateUrl: './login.html',
	styleUrl: './login.scss',
})
export class Login {
	private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly error = signal(false);
	loginForm!: FormGroup;
	constructor(
		
	) {
		this.loginForm = this.fb.group({
			email: ['', [Validators.required, Validators.email]],
			password: ['', Validators.required],
		});
	}

	async onSubmit(): Promise<void> {
		if (this.loginForm.invalid) {
            return;
        }
        this.error.set(false);
        const { email, password } = this.loginForm.getRawValue();

        try {
            await this.authService.login(email!, password!);
            console.log('Login successful');
            this.router.navigateByUrl('/');
        } catch (error) {
            this.error.set(true);
            console.error('Login error:', error);
        }
	}

	async loginWithGoogle(): Promise<void> {
		try {
			await this.authService.googleLogin();
			this.router.navigateByUrl('/');
		} catch (error) {
			console.error('Google Sign-In error:', error);
		}
	}
}
