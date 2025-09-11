import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { DefaultSortService } from './default-sort.service';

export interface FilterRequestDto {
  key: string;
  field: string;
  operator: string;
  operand: string;
}

export interface FilterSpecification {
  type: string;
  fields: { [key: string]: string };
  filters: { [key: string]: string[] };
}

export interface EntityFilter {
  entityType: string;
  filters: FilterRequestDto[];
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private baseUrl = 'http://localhost:8080/v1';
  private activeFiltersSubject = new BehaviorSubject<{ [entity: string]: FilterRequestDto[] }>({});
  
  public activeFilters$ = this.activeFiltersSubject.asObservable();

  constructor(
    private http: HttpClient,
    private defaultSortService: DefaultSortService
  ) {
    this.loadAllFiltersFromStorage();
  }

  /**
   * Get filter specifications for an entity type
   */
  getFiltersForEntity(entityType: string): Observable<FilterSpecification> {
    return this.http.get<{data: FilterSpecification, errors: any}>(`${this.baseUrl}/filters/${entityType}`)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Save filters for an entity type
   */
  saveFiltersForEntity(entityType: string, filters: FilterRequestDto[]): void {
    const currentFilters = this.activeFiltersSubject.value;
    currentFilters[entityType] = filters;
    this.activeFiltersSubject.next(currentFilters);
    
    // Persist to localStorage
    this.saveFiltersToStorage(entityType, filters);
  }

  /**
   * Get active filters for an entity type
   */
  getActiveFilters(entityType: string): FilterRequestDto[] {
    return this.activeFiltersSubject.value[entityType] || [];
  }

  /**
   * Clear filters for an entity type
   */
  clearFiltersForEntity(entityType: string): void {
    const currentFilters = this.activeFiltersSubject.value;
    delete currentFilters[entityType];
    this.activeFiltersSubject.next(currentFilters);
    
    // Clear from localStorage
    this.clearFiltersFromStorage(entityType);
  }

  /**
   * Check if entity has active filters
   */
  hasActiveFilters(entityType: string): boolean {
    const filters = this.getActiveFilters(entityType);
    return filters.length > 0;
  }

  /**
   * Get filter display text for UI
   */
  getFilterDisplayText(entityType: string): string {
    const filters = this.getActiveFilters(entityType);
    if (filters.length === 0) return '';
    
    if (filters.length === 1) {
      const filter = filters[0];
      return `${filter.field} ${filter.operator} "${filter.operand}"`;
    }
    
    return `${filters.length} filters active`;
  }

  /**
   * Get available operators for a field type
   */
  getOperatorsForFieldType(fieldType: string): Array<{value: string, label: string}> {
    const baseOperators = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' }
    ];

    const sortOperator = { value: 'sort', label: 'Sort' };

    switch (fieldType) {
      case 'text':
        return [
          ...baseOperators,
          { value: 'contains', label: 'Contains' },
          { value: 'starts_with', label: 'Starts With' },
          { value: 'ends_with', label: 'Ends With' },
          sortOperator
        ];
      
      case 'number':
        return [
          ...baseOperators,
          { value: 'greater_than', label: 'Greater Than' },
          { value: 'less_than', label: 'Less Than' },
          { value: 'greater_than_equal_to', label: 'Greater Than or Equal' },
          { value: 'less_than_equal_to', label: 'Less Than or Equal' },
          sortOperator
        ];
      
      case 'boolean':
        return [
          { value: 'equals', label: 'Equals' },
          sortOperator
        ];
      
      case 'timestamp':
        return [
          ...baseOperators,
          { value: 'greater_than', label: 'After' },
          { value: 'less_than', label: 'Before' },
          sortOperator
        ];
      
      default:
        return [...baseOperators, sortOperator];
    }
  }

  /**
   * Convert filters with sort operators to proper API format
   */
  convertFiltersForAPI(filters: FilterRequestDto[]): FilterRequestDto[] {
    return filters.map(filter => {
      if (filter.operator === 'sort') {
        // Convert sort to order_by or order_by_desc based on operand
        const operator = filter.operand.toLowerCase() === 'ascending' ? 'order_by' : 'order_by_desc';
        return {
          ...filter,
          operator: operator,
          operand: filter.field // For order_by, the operand should be the field name
        };
      }
      return filter;
    });
  }

  /**
   * Get sort options for dropdown
   */
  getSortOptions(): Array<{value: string, label: string}> {
    return [
      { value: 'Ascending', label: 'Ascending' },
      { value: 'Descending', label: 'Descending' }
    ];
  }

  /**
   * Get filters with defaults applied
   * Priority: explicit sort > default sort > no sort
   */
  getFiltersWithDefaults(entityType: string, providedFilters: FilterRequestDto[]): FilterRequestDto[] {
    // Check if there's already a sort filter in the provided filters
    const hasSortFilter = providedFilters.some(filter => 
      filter.operator === 'sort' || filter.operator === 'order_by' || filter.operator === 'order_by_desc'
    );
    
    if (hasSortFilter) {
      // Convert sort filters to API format and return
      return this.convertFiltersForAPI(providedFilters);
    }
    
    // Check for default sort filter
    const defaultSort = this.defaultSortService.getDefaultSort(entityType);
    if (defaultSort) {
      // Add default sort to the provided filters
      const defaultSortFilter: FilterRequestDto = {
        key: entityType,
        field: defaultSort.field,
        operator: defaultSort.operand.toLowerCase() === 'ascending' ? 'order_by' : 'order_by_desc',
        operand: defaultSort.field
      };
      return [...providedFilters, defaultSortFilter];
    }
    
    // No sort filter - return provided filters as-is
    return providedFilters;
  }

  private saveFiltersToStorage(entityType: string, filters: FilterRequestDto[]): void {
    const key = `entity-filters-${entityType}`;
    if (filters.length > 0) {
      localStorage.setItem(key, JSON.stringify(filters));
      console.log(`Filters saved for ${entityType}:`, filters);
    } else {
      localStorage.removeItem(key);
      console.log(`Filters cleared for ${entityType}`);
    }
  }

  private clearFiltersFromStorage(entityType: string): void {
    const key = `entity-filters-${entityType}`;
    localStorage.removeItem(key);
    console.log(`Filters cleared from storage for ${entityType}`);
  }

  private loadAllFiltersFromStorage(): void {
    const entityTypes = ['toy', 'system', 'videoGame', 'videoGameBox', 'boardGame', 'boardGameBox'];
    const allFilters: { [entity: string]: FilterRequestDto[] } = {};
    
    entityTypes.forEach(entityType => {
      const key = `entity-filters-${entityType}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          allFilters[entityType] = JSON.parse(saved);
          console.log(`Loaded saved filters for ${entityType}:`, allFilters[entityType]);
        } catch (error) {
          console.error(`Error loading filters for ${entityType}:`, error);
          localStorage.removeItem(key);
        }
      }
    });
    
    this.activeFiltersSubject.next(allFilters);
  }
}