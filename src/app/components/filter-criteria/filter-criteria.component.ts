import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FilterService, FilterSpecification, FilterRequestDto } from '../../services/filter.service';
import { FilterableDropdownComponent, DropdownOption } from '../filterable-dropdown/filterable-dropdown.component';
import { SettingsService } from '../../services/settings.service';

export interface FilterCriteria {
  field: string;
  operator: string;
  operand: string;
}

@Component({
  selector: 'app-filter-criteria',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterableDropdownComponent],
  templateUrl: './filter-criteria.component.html',
  styleUrl: './filter-criteria.component.scss'
})
export class FilterCriteriaComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @Input() entityType: string = '';
  @Input() initialFilters: FilterRequestDto[] = [];
  @Input() isDarkMode: boolean = false;
  @Output() filtersChanged = new EventEmitter<FilterRequestDto[]>();
  
  filterSpec: FilterSpecification | null = null;
  isLoading = false;
  errorMessage = '';
  
  filterCriteria: FilterCriteria[] = [{ field: '', operator: '', operand: '' }];
  fieldOptions: DropdownOption[] = [];

  constructor(
    public filterService: FilterService, 
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    if (this.entityType) {
      this.loadFilterSpecification();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFilterSpecification(): void {
    if (!this.entityType) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    this.filterService.getFiltersForEntity(this.entityType).subscribe({
      next: (spec) => {
        this.filterSpec = spec;
        this.buildFieldOptions();
        this.loadExistingFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading filter specification:', error);
        this.errorMessage = `Failed to load filter options: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  buildFieldOptions(): void {
    if (!this.filterSpec) return;
    
    this.fieldOptions = Object.keys(this.filterSpec.fields)
      .filter(fieldName => !['all_fields', 'pagination_fields', 'created_at', 'updated_at'].includes(fieldName))
      .map(fieldName => ({
        value: fieldName,
        label: this.formatFieldName(fieldName)
      }));
  }

  formatFieldName(fieldName: string): string {
    switch (fieldName) {
      case 'is_expansion':
        return 'Expansion';
      case 'is_stand_alone':
        return 'Standalone';
      case 'is_physical':
        return 'Physical';
      case 'is_collection':
        return 'Collection';
      default:
        return fieldName
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
    }
  }

  loadExistingFilters(): void {
    const filtersToLoad = this.initialFilters.length > 0 
      ? this.initialFilters 
      : this.filterService.getActiveFilters(this.entityType);
      
    if (filtersToLoad.length > 0) {
      this.filterCriteria = filtersToLoad.map(filter => ({
        field: filter.field,
        operator: filter.operator,
        operand: filter.operand
      }));
    }
  }

  getOperatorOptions(fieldName: string): DropdownOption[] {
    if (!this.filterSpec || !fieldName) return [];
    
    const fieldType = this.filterSpec.fields[fieldName];
    const allOperators = this.filterService.getOperatorsForFieldType(fieldType);
    
    const hasSortSelected = this.filterCriteria.some((criteria, index) => 
      criteria.operator === 'sort' && criteria.field !== fieldName
    );
    
    if (hasSortSelected) {
      return allOperators
        .filter(op => op.value !== 'sort')
        .map(op => ({
          value: op.value,
          label: op.label
        }));
    }
    
    return allOperators.map(op => ({
      value: op.value,
      label: op.label
    }));
  }

  getFieldType(fieldName: string): string {
    if (!this.filterSpec || !fieldName) return 'text';
    return this.filterSpec.fields[fieldName] || 'text';
  }

  addFilterCriteria(): void {
    this.filterCriteria.push({ field: '', operator: '', operand: '' });
    this.emitFiltersChanged();
  }

  removeFilterCriteria(index: number): void {
    if (this.filterCriteria.length > 1) {
      this.filterCriteria.splice(index, 1);
      this.emitFiltersChanged();
    }
  }

  canRemoveCriteria(): boolean {
    return this.filterCriteria.length > 1;
  }

  onFieldChange(index: number): void {
    this.filterCriteria[index].operator = '';
    this.filterCriteria[index].operand = '';
    this.emitFiltersChanged();
  }

  onOperatorChange(index: number): void {
    this.filterCriteria[index].operand = '';
    
    if (this.filterCriteria[index].operator === 'sort') {
      this.filterCriteria.forEach((criteria, i) => {
        if (i !== index && criteria.operator === 'sort') {
          criteria.operator = '';
          criteria.operand = '';
        }
      });
    }
    this.emitFiltersChanged();
  }

  onOperandChange(): void {
    this.emitFiltersChanged();
  }

  isSortField(operator: string): boolean {
    return operator === 'sort';
  }

  isBooleanField(fieldName: string): boolean {
    return this.getFieldType(fieldName) === 'boolean';
  }

  getInputType(fieldName: string): string {
    const fieldType = this.getFieldType(fieldName);
    switch (fieldType) {
      case 'number':
        return 'number';
      case 'boolean':
        return 'text';
      case 'timestamp':
        return 'date';
      default:
        return 'text';
    }
  }

  getSortOptions(): DropdownOption[] {
    return this.filterService.getSortOptions();
  }

  getBooleanOptions(): DropdownOption[] {
    return [
      { value: 'true', label: 'True' },
      { value: 'false', label: 'False' }
    ];
  }

  getValidFilters(): FilterCriteria[] {
    return this.filterCriteria.filter(filter => 
      !!(filter.field && filter.operator && filter.operand.trim())
    );
  }

  private emitFiltersChanged(): void {
    const validFilters = this.getValidFilters();
    const filterRequests: FilterRequestDto[] = validFilters.map(filter => ({
      key: this.entityType,
      field: filter.field,
      operator: filter.operator,
      operand: filter.operand
    }));
    
    this.filtersChanged.emit(filterRequests);
  }
}
