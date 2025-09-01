import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FilterService, FilterSpecification, FilterRequestDto } from '../../services/filter.service';
import { FilterableDropdownComponent, DropdownOption } from '../filterable-dropdown/filterable-dropdown.component';
import { FilterCriteriaComponent } from '../filter-criteria/filter-criteria.component';
import { SettingsService } from '../../services/settings.service';


@Component({
  selector: 'app-entity-filter-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterableDropdownComponent, FilterCriteriaComponent],
  templateUrl: './entity-filter-modal.component.html',
  styleUrl: './entity-filter-modal.component.scss'
})
export class EntityFilterModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() entityType: string = '';
  @Input() show: boolean = false;
  @Output() showChange = new EventEmitter<boolean>();
  @Output() filtersApplied = new EventEmitter<FilterRequestDto[]>();

  filterSpec: FilterSpecification | null = null;
  isLoading = false;
  errorMessage = '';
  isDarkMode = false;

  constructor(public filterService: FilterService, private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });

    if (this.show && this.entityType) {
      this.loadFilterSpecification();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading filter specification:', error);
        this.errorMessage = `Failed to load filter options: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  formatFieldName(fieldName: string): string {
    // Handle specific field name mappings
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

  getInitialFilters(): FilterRequestDto[] {
    return this.filterService.getActiveFilters(this.entityType);
  }


  onFiltersChanged(filters: FilterRequestDto[]): void {
    this.filterService.saveFiltersForEntity(this.entityType, filters);
  }

  canApplyFilters(): boolean {
    return this.filterService.hasActiveFilters(this.entityType);
  }

  applyFilters(): void {
    const activeFilters = this.filterService.getActiveFilters(this.entityType);
    if (activeFilters.length === 0) return;

    const filterRequests = this.filterService.convertFiltersForAPI(activeFilters);
    this.filtersApplied.emit(filterRequests);
    this.closeModal();
  }

  clearFilters(): void {
    this.filterService.clearFiltersForEntity(this.entityType);
    this.filtersApplied.emit([]);
    this.closeModal();
  }

  closeModal(): void {
    this.show = false;
    this.showChange.emit(false);
  }

}