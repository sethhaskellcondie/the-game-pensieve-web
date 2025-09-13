import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorSnackbarComponent } from './error-snackbar.component';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';
import { mockErrorSnackbarService } from '../../testing/test-utils';

describe('ErrorSnackbarComponent', () => {
  let component: ErrorSnackbarComponent;
  let fixture: ComponentFixture<ErrorSnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorSnackbarComponent],
      providers: [
        { provide: ErrorSnackbarService, useValue: mockErrorSnackbarService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ErrorSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
