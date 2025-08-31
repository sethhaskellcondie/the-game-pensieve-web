import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ApiService, Metadata } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {

  constructor(private apiService: ApiService) { }

  getMetadata<T>(key: string): Observable<T | null> {
    return this.apiService.getMetadata(key)
      .pipe(
        map(metadata => {
          try {
            return JSON.parse(metadata.value) as T;
          } catch {
            return null;
          }
        }),
        catchError(() => of(null))
      );
  }

  setMetadata<T>(key: string, value: T): Observable<boolean> {
    const jsonValue = JSON.stringify(value);
    
    return this.apiService.getMetadata(key)
      .pipe(
        switchMap(() => this.apiService.updateMetadata(key, jsonValue)),
        map(() => true),
        catchError(() => {
          return this.apiService.createMetadata({ key, value: jsonValue })
            .pipe(
              map(() => true),
              catchError(() => of(false))
            );
        })
      );
  }

  deleteMetadata(key: string): Observable<boolean> {
    return this.apiService.deleteMetadata(key)
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }
}