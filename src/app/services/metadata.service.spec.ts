import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MetadataService } from './metadata.service';
import { ApiService, Metadata } from './api.service';

describe('MetadataService', () => {
  let service: MetadataService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getMetadata', 'createMetadata']);

    TestBed.configureTestingModule({
      providers: [
        MetadataService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(MetadataService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getMetadata', () => {
    const testKey = 'test-key';

    it('should return parsed data when metadata exists', () => {
      const mockMetadata: Metadata = { 
        id: 1,
        key: testKey, 
        value: '{"name": "test", "count": 5}',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };
      apiService.getMetadata.and.returnValue(of(mockMetadata));

      service.getMetadata<{ name: string; count: number }>(testKey).subscribe(result => {
        expect(result).toEqual({ name: 'test', count: 5 });
      });

      expect(apiService.getMetadata).toHaveBeenCalledWith(testKey);
    });

    it('should return null when JSON parsing fails', () => {
      const mockMetadata: Metadata = { 
        id: 1,
        key: testKey, 
        value: 'invalid-json',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };
      apiService.getMetadata.and.returnValue(of(mockMetadata));

      service.getMetadata(testKey).subscribe(result => {
        expect(result).toBeNull();
      });

      expect(apiService.getMetadata).toHaveBeenCalledWith(testKey);
    });

    it('should create metadata with empty object when 404 occurs', () => {
      const mockError = { status: 404, statusText: 'Not Found' };
      const mockCreatedMetadata: Metadata = { 
        id: 2,
        key: testKey, 
        value: '{}',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      // First call fails with 404
      apiService.getMetadata.and.returnValue(throwError(() => mockError));
      // Creation call succeeds
      apiService.createMetadata.and.returnValue(of(mockCreatedMetadata));

      service.getMetadata<any>(testKey).subscribe(result => {
        expect(result).toEqual({});
      });

      expect(apiService.getMetadata).toHaveBeenCalledWith(testKey);
      expect(apiService.createMetadata).toHaveBeenCalledWith({ key: testKey, value: '{}' });
    });

    it('should return null when both get and create fail', () => {
      const mockError = { status: 404, statusText: 'Not Found' };
      const mockCreateError = { status: 500, statusText: 'Internal Server Error' };

      // First call fails with 404
      apiService.getMetadata.and.returnValue(throwError(() => mockError));
      // Creation also fails
      apiService.createMetadata.and.returnValue(throwError(() => mockCreateError));

      service.getMetadata<any>(testKey).subscribe(result => {
        expect(result).toBeNull();
      });

      expect(apiService.getMetadata).toHaveBeenCalledWith(testKey);
      expect(apiService.createMetadata).toHaveBeenCalledWith({ key: testKey, value: '{}' });
    });

    it('should attempt to create metadata even for non-404 errors and return null when both fail', () => {
      const mockError = { status: 500, statusText: 'Internal Server Error' };
      const mockCreateError = { status: 500, statusText: 'Internal Server Error' };
      
      // First call fails with 500
      apiService.getMetadata.and.returnValue(throwError(() => mockError));
      // Creation also fails
      apiService.createMetadata.and.returnValue(throwError(() => mockCreateError));

      service.getMetadata<any>(testKey).subscribe(result => {
        expect(result).toBeNull();
      });

      expect(apiService.getMetadata).toHaveBeenCalledWith(testKey);
      // MetadataService tries to create metadata for ANY error, not just 404
      expect(apiService.createMetadata).toHaveBeenCalledWith({ key: testKey, value: '{}' });
    });
  });

  describe('setMetadata', () => {
    const testKey = 'test-key';
    const testValue = { name: 'test', count: 5 };

    it('should update existing metadata', () => {
      const mockMetadata: Metadata = { 
        id: 1,
        key: testKey, 
        value: '{"old": "data"}',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };
      const mockUpdatedMetadata: Metadata = { 
        id: 1,
        key: testKey, 
        value: JSON.stringify(testValue),
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      apiService.getMetadata.and.returnValue(of(mockMetadata));
      apiService.updateMetadata.and.returnValue(of(mockUpdatedMetadata));

      service.setMetadata(testKey, testValue).subscribe(result => {
        expect(result).toBe(true);
      });

      expect(apiService.getMetadata).toHaveBeenCalledWith(testKey);
      expect(apiService.updateMetadata).toHaveBeenCalledWith(testKey, JSON.stringify(testValue));
    });

    it('should create metadata when it does not exist', () => {
      const mockError = { status: 404, statusText: 'Not Found' };
      const mockCreatedMetadata: Metadata = { 
        id: 2,
        key: testKey, 
        value: JSON.stringify(testValue),
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      apiService.getMetadata.and.returnValue(throwError(() => mockError));
      apiService.createMetadata.and.returnValue(of(mockCreatedMetadata));

      service.setMetadata(testKey, testValue).subscribe(result => {
        expect(result).toBe(true);
      });

      expect(apiService.getMetadata).toHaveBeenCalledWith(testKey);
      expect(apiService.createMetadata).toHaveBeenCalledWith({ 
        key: testKey, 
        value: JSON.stringify(testValue) 
      });
    });
  });
});