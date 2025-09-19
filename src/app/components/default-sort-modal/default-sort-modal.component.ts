import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FilterService, FilterSpecification } from '../../services/filter.service';
import { DefaultSortService, DefaultSortFilter } from '../../services/default-sort.service';
import { FilterableDropdownComponent, DropdownOption } from '../filterable-dropdown/filterable-dropdown.component';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-default-sort-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterableDropdownComponent],
  templateUrl: './default-sort-modal.component.html',
  styleUrl: './default-sort-modal.component.scss'
})
export class DefaultSortModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @Input() show: boolean = false;
  @Input() entityType: string = '';
  @Output() showChange = new EventEmitter<boolean>();
  @Output() sortSaved = new EventEmitter<void>();
  
  formData = {
    field: '',
    operand: ''
  };
  
  isLoading = false;
  errorMessage = '';
  isSubmitting = false;
  isDarkMode = false;
  
  fieldOptions: DropdownOption[] = [];
  sortOptions: DropdownOption[] = [];

  constructor(
    private filterService: FilterService,
    private defaultSortService: DefaultSortService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });

    this.sortOptions = this.filterService.getSortOptions();
    
    if (this.show && this.entityType) {
      this.loadFieldOptions();
      this.loadCurrentSort();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    if (this.show && this.entityType) {
      this.loadFieldOptions();
      this.loadCurrentSort();
    }
  }

  loadFieldOptions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.filterService.getFiltersForEntity(this.entityType).subscribe({
      next: (spec) => {
        this.buildFieldOptions(spec);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading field options:', error);
        this.errorMessage = `Failed to load field options: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  buildFieldOptions(spec: FilterSpecification): void {
    // Base fields to exclude for all entities
    let excludedFields = ['all_fields', 'pagination_fields', 'created_at', 'updated_at'];

    // Additionally exclude system_id for video games and video game boxes since it cannot be sorted
    if (this.entityType === 'videoGame' || this.entityType === 'videoGameBox') {
      excludedFields.push('system_id');
    }

    this.fieldOptions = Object.keys(spec.fields)
      .filter(fieldName => !excludedFields.includes(fieldName))
      .map(fieldName => ({
        value: fieldName,
        label: this.formatFieldName(fieldName)
      }));
  }

  loadCurrentSort(): void {
    const currentSort = this.defaultSortService.getDefaultSort(this.entityType);
    if (currentSort) {
      this.formData = {
        field: currentSort.field,
        operand: currentSort.operand
      };
    } else {
      this.formData = {
        field: '',
        operand: ''
      };
    }
  }

  onSubmit(): void {
    if (this.isSubmitting || !this.formData.field || !this.formData.operand) {
      return;
    }

    this.isSubmitting = true;

    this.defaultSortService.setDefaultSort(
      this.entityType, 
      this.formData.field, 
      this.formData.operand
    ).subscribe({
      next: (success) => {
        if (success) {
          this.sortSaved.emit();
          this.closeModal();
        } else {
          console.error('Failed to save default sort');
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error saving default sort:', error);
        this.isSubmitting = false;
      }
    });
  }

  closeModal(): void {
    this.show = false;
    this.showChange.emit(false);
  }

  formatEntityName(entityType: string): string {
    const entityNames: { [key: string]: string } = {
      'videoGame': 'Video Games',
      'videoGameBox': 'Video Game Boxes',
      'boardGame': 'Board Games',
      'boardGameBox': 'Board Game Boxes',
      'toy': 'Toys',
      'system': 'Systems'
    };
    return entityNames[entityType] || entityType;
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
}