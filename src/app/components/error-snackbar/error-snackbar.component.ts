import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ErrorSnackbarService, SnackbarState } from '../../services/error-snackbar.service';

@Component({
  selector: 'app-error-snackbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-snackbar.component.html',
  styleUrl: './error-snackbar.component.scss'
})
export class ErrorSnackbarComponent implements OnInit, OnDestroy {
  snackbarState: SnackbarState = { show: false, messages: [], type: 'error' };
  private subscription: Subscription = new Subscription();

  constructor(private errorSnackbarService: ErrorSnackbarService) {}

  ngOnInit(): void {
    this.subscription = this.errorSnackbarService.snackbarState$.subscribe(
      state => this.snackbarState = state
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  dismiss(): void {
    this.errorSnackbarService.dismissErrors();
  }
}