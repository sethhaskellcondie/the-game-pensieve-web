import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, Metadata } from './api.service';
import { ErrorSnackbarService } from './error-snackbar.service';
import { of } from 'rxjs';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let errorSnackbarService: jasmine.SpyObj<ErrorSnackbarService>;

  beforeEach(() => {
    const errorSnackbarSpy = jasmine.createSpyObj('ErrorSnackbarService', ['processApiErrors']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        { provide: ErrorSnackbarService, useValue: errorSnackbarSpy }
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    errorSnackbarService = TestBed.inject(ErrorSnackbarService) as jasmine.SpyObj<ErrorSnackbarService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getMetadata', () => {
    const testKey = 'test-key';
    const expectedUrl = `http://localhost:8080/v1/metadata/${testKey}`;
    const mockMetadata: Metadata = { 
      id: 1,
      key: testKey, 
      value: '{"test": "data"}',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    };

    it('should return metadata when API call succeeds', () => {
      const mockResponse = { data: mockMetadata, errors: null };

      service.getMetadata(testKey).subscribe(result => {
        expect(result).toEqual(mockMetadata);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should not show snackbar on 404 error and still throw the error', (done) => {
      const mockError = { status: 404, statusText: 'Not Found' };

      service.getMetadata(testKey).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          // Verify snackbar service was NOT called for 404
          expect(errorSnackbarService.processApiErrors).not.toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush({}, mockError);
    });

    it('should show snackbar on non-404 errors', (done) => {
      const mockError = { status: 500, statusText: 'Internal Server Error' };

      service.getMetadata(testKey).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          // Verify snackbar service WAS called for non-404 errors
          expect(errorSnackbarService.processApiErrors).toHaveBeenCalledWith(error);
          done();
        }
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush({}, mockError);
    });

    it('should show snackbar on network errors', (done) => {
      const mockError = { status: 0, statusText: 'Network Error' };

      service.getMetadata(testKey).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(0);
          // Verify snackbar service WAS called for network errors
          expect(errorSnackbarService.processApiErrors).toHaveBeenCalledWith(error);
          done();
        }
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush({}, mockError);
    });
  });
});