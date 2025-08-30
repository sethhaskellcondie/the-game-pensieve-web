import { TestBed } from '@angular/core/testing';

import { ErrorSnackbarService } from './error-snackbar.service';

describe('ErrorSnackbarService', () => {
  let service: ErrorSnackbarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorSnackbarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
