import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterService, FilterSpecification, FilterRequestDto } from '../../services/filter.service';
import { FilterableDropdownComponent, DropdownOption } from '../filterable-dropdown/filterable-dropdown.component';

interface FilterCriteria {
  field: string;
  operator: string;
  operand: string;
}

@Component({
  selector: 'app-entity-filter-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterableDropdownComponent],
  templateUrl: './entity-filter-modal.component.html',
  styleUrl: './entity-filter-modal.component.scss'
})
export class EntityFilterModalComponent implements OnInit {
  @Input() entityType: string = '';
  @Input() show: boolean = false;
  @Output() showChange = new EventEmitter<boolean>();
  @Output() filtersApplied = new EventEmitter<FilterRequestDto[]>();

  filterSpec: FilterSpecification | null = null;
  isLoading = false;
  errorMessage = '';
  
  filterCriteria: FilterCriteria[] = [{ field: '', operator: '', operand: '' }];
  
  fieldOptions: DropdownOption[] = [];

  constructor(public filterService: FilterService) {}

  ngOnInit(): void {
    if (this.show && this.entityType) {
      this.loadFilterSpecification();
    }
  }

  ngOnChanges(): void {
    if (this.show && this.entityType && !this.filterSpec) {
      this.loadFilterSpecification();
    }
  }

  loadFilterSpecification(): void {
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
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  loadExistingFilters(): void {
    const existingFilters = this.filterService.getActiveFilters(this.entityType);
    if (existingFilters.length > 0) {
      this.filterCriteria = existingFilters.map(filter => ({
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
    
    // Check if any other criteria has a sort operator selected
    const hasSortSelected = this.filterCriteria.some((criteria, index) => 
      criteria.operator === 'sort' && criteria.field !== fieldName
    );
    
    // If another field has sort selected, remove sort option from this field
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
  }

  removeFilterCriteria(index: number): void {
    if (this.filterCriteria.length > 1) {
      this.filterCriteria.splice(index, 1);
    }
  }

  canRemoveCriteria(): boolean {
    return this.filterCriteria.length > 1;
  }

  isValidFilter(filter: FilterCriteria): boolean {
    return !!(filter.field && filter.operator && filter.operand.trim());
  }

  getValidFilters(): FilterCriteria[] {
    return this.filterCriteria.filter(filter => this.isValidFilter(filter));
  }

  canApplyFilters(): boolean {
    return this.getValidFilters().length > 0;
  }

  applyFilters(): void {
    const validFilters = this.getValidFilters();
    if (validFilters.length === 0) return;

    let filterRequests: FilterRequestDto[] = validFilters.map(filter => ({
      key: this.entityType,
      field: filter.field,
      operator: filter.operator,
      operand: filter.operand
    }));

    // Convert sort filters to proper API format
    filterRequests = this.filterService.convertFiltersForAPI(filterRequests);

    this.filtersApplied.emit(filterRequests);
    this.closeModal();
  }

  clearFilters(): void {
    this.filterCriteria = [{ field: '', operator: '', operand: '' }];
    this.filtersApplied.emit([]);
    this.closeModal();
  }

  closeModal(): void {
    this.show = false;
    this.showChange.emit(false);
  }

  onFieldChange(index: number): void {
    // Reset operator and operand when field changes
    this.filterCriteria[index].operator = '';
    this.filterCriteria[index].operand = '';
  }

  onOperatorChange(index: number): void {
    // Reset operand when operator changes
    this.filterCriteria[index].operand = '';
    
    // If sort is selected, clear other sort selections
    if (this.filterCriteria[index].operator === 'sort') {
      this.filterCriteria.forEach((criteria, i) => {
        if (i !== index && criteria.operator === 'sort') {
          criteria.operator = '';
          criteria.operand = '';
        }
      });
    }
  }

  isSortField(operator: string): boolean {
    return operator === 'sort';
  }

  getInputType(fieldName: string): string {
    const fieldType = this.getFieldType(fieldName);
    switch (fieldType) {
      case 'number':
        return 'number';
      case 'boolean':
        return 'text'; // Will be handled with dropdown
      case 'timestamp':
        return 'date';
      default:
        return 'text';
    }
  }

  isBooleanField(fieldName: string): boolean {
    return this.getFieldType(fieldName) === 'boolean';
  }

  getBooleanOptions(): DropdownOption[] {
    return [
      { value: 'true', label: 'True' },
      { value: 'false', label: 'False' }
    ];
  }

  getSortOptions(): DropdownOption[] {
    return this.filterService.getSortOptions();
  }
}