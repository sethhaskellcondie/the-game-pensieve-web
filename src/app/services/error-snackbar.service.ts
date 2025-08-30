import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ErrorSnackbarState {
  show: boolean;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ErrorSnackbarService {
  private errorState = new BehaviorSubject<ErrorSnackbarState>({
    show: false,
    errors: []
  });

  public errorState$ = this.errorState.asObservable();

  /**
   * Show errors in the snackbar
   */
  showErrors(errors: string[] | string): void {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    this.errorState.next({
      show: true,
      errors: errorArray
    });
  }

  /**
   * Dismiss the error snackbar
   */
  dismissErrors(): void {
    this.errorState.next({
      show: false,
      errors: []
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