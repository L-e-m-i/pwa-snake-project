import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-signup',
  imports: [
    FormsModule,
		ReactiveFormsModule,
		MatFormField,
		MatLabel,
		MatInput,
		MatButtonModule,
		RouterLink,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})
export class Signup {
  error: boolean = false;
  signupForm!: FormGroup;
  constructor(
    protected readonly fb: FormBuilder,
    protected readonly authService: AuthService,
    protected readonly router: Router
  ) { 

    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    const rawForm = this.signupForm.getRawValue();
    if (rawForm.password !== rawForm.confirmPassword) {
      this.error = true;
      console.error('Password and Confirm Password do not match');
      return;
    }
    this.authService.signUp(rawForm.email, rawForm.password, { username: rawForm.username })
      .then(() => {
        this.router.navigateByUrl('/');
      })
      .catch((error) => {
        this.error = true;
        console.error('Sign-Up error:', error);
      });
  }
}
