import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MetadataService } from './metadata.service';

export interface DefaultSortFilter {
  field: string;
  operand: string;
}

export interface DefaultSortFilters {
  [entityType: string]: DefaultSortFilter;
}

@Injectable({
  providedIn: 'root'
})
export class DefaultSortService {
  private readonly METADATA_KEY = 'default-sort-filters';
  private defaultSortsSubject = new BehaviorSubject<DefaultSortFilters>({});
  
  public defaultSorts$ = this.defaultSortsSubject.asObservable();

  constructor(private metadataService: MetadataService) {
    this.loadDefaultSorts();
  }

  private loadDefaultSorts(): void {
    this.metadataService.getMetadata<DefaultSortFilters>(this.METADATA_KEY).subscribe({
      next: (sorts) => {
        this.defaultSortsSubject.next(sorts || {});
      },
      error: (error) => {
        console.error('Error loading default sorts:', error);
        this.defaultSortsSubject.next({});
      }
    });
  }

  getDefaultSort(entityType: string): DefaultSortFilter | null {
    const sorts = this.defaultSortsSubject.value;
    return sorts[entityType] || null;
  }

  setDefaultSort(entityType: string, field: string, operand: string): Observable<boolean> {
    const currentSorts = this.defaultSortsSubject.value;
    const updatedSorts = {
      ...currentSorts,
      [entityType]: { field, operand }
    };

    return this.metadataService.setMetadata(this.METADATA_KEY, updatedSorts).pipe(
      tap(success => {
        if (success) {
          this.defaultSortsSubject.next(updatedSorts);
        }
      })
    );
  }

  removeDefaultSort(entityType: string): Observable<boolean> {
    const currentSorts = this.defaultSortsSubject.value;
    const updatedSorts = { ...currentSorts };
    delete updatedSorts[entityType];

    return this.metadataService.setMetadata(this.METADATA_KEY, updatedSorts).pipe(
      tap(success => {
        if (success) {
          this.defaultSortsSubject.next(updatedSorts);
        }
      })
    );
  }

  getAllDefaultSorts(): DefaultSortFilters {
    return this.defaultSortsSubject.value;
  }
}