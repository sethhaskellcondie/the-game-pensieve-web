import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SnackbarState {
  show: boolean;
  messages: string[];
  type: 'error' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class ErrorSnackbarService {
  private snackbarState = new BehaviorSubject<SnackbarState>({
    show: false,
    messages: [],
    type: 'error'
  });

  public snackbarState$ = this.snackbarState.asObservable();

  /**
   * Show errors in the snackbar
   */
  showErrors(errors: string[] | string): void {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    this.snackbarState.next({
      show: true,
      messages: errorArray,
      type: 'error'
    });
  }

  /**
   * Show success messages in the snackbar
   */
  showSuccess(messages: string[] | string): void {
    const messageArray = Array.isArray(messages) ? messages : [messages];
    this.snackbarState.next({
      show: true,
      messages: messageArray,
      type: 'success'
    });

    // Auto-dismiss success messages after 3 seconds
    setTimeout(() => {
      this.dismissErrors();
    }, 3000);
  }

  /**
   * Dismiss the snackbar
   */
  dismissErrors(): void {
    this.snackbarState.next({
      show: false,
      messages: [],
      type: 'error'
    });
  }

  /**
   * Process API response and extract errors
   */
  processApiErrors(response: any): void {
    let errors: string[] = [];

    // First check if this is an HTTP error response
    if (response?.error?.errors && Array.isArray(response.error.errors)) {
      errors = response.error.errors;
    } else if (response?.errors && Array.isArray(response.errors)) {
      errors = response.errors;
    } else if (response?.error && typeof response.error === 'string') {
      errors = [response.error];
    } else if (response?.message) {
      errors = [response.message];
    } else if (typeof response === 'string') {
      errors = [response];
    } else {
      errors = ['An unexpected error occurred'];
    }

    // Filter out empty errors and ensure all errors are strings
    errors = errors.filter(error => error && error.toString().trim())
                   .map(error => error.toString());

    if (errors.length > 0) {
      this.showErrors(errors);
    }
  }
}