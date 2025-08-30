import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ErrorSnackbarService, ErrorSnackbarState } from '../../services/error-snackbar.service';

@Component({
  selector: 'app-error-snackbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-snackbar.component.html',
  styleUrl: './error-snackbar.component.scss'
})
export class ErrorSnackbarComponent implements OnInit, OnDestroy {
  errorState: ErrorSnackbarState = { show: false, errors: [] };
  private subscription: Subscription = new Subscription();

  constructor(private errorSnackbarService: ErrorSnackbarService) {}

  ngOnInit(): void {
    this.subscription = this.errorSnackbarService.errorState$.subscribe(
      state => this.errorState = state
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  dismiss(): void {
    this.errorSnackbarService.dismissErrors();
  }
}