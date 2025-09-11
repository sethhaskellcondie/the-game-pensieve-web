import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, Toy } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';
import { SelectableTextInputComponent } from '../../components/selectable-text-input/selectable-text-input.component';
import { FilterService, FilterRequestDto } from '../../services/filter.service';
import { EntityFilterModalComponent } from '../../components/entity-filter-modal/entity-filter-modal.component';
import { SettingsService } from '../../services/settings.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';

@Component({
  selector: 'app-toys',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent, BooleanDisplayComponent, SelectableTextInputComponent, EntityFilterModalComponent],
  templateUrl: './toys.component.html',
  styleUrl: './toys.component.scss'
})
export class ToysComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('nameField', { static: false }) nameField: any;
  toys: Toy[] = [];
  toysCount = 0;
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  isDarkMode = false;
  isMassInputMode = false;
  
  showNewToyModal = false;
  isCreating = false;
  isUpdateMode = false;
  toyToUpdate: Toy | null = null;
  newToy = {
    name: '',
    set: '',
    customFieldValues: [] as any[]
  };

  showDeleteConfirmModal = false;
  toyToDelete: Toy | null = null;
  isDeleting = false;

  showFilterModal = false;

  constructor(
    private apiService: ApiService, 
    public filterService: FilterService,
    private settingsService: SettingsService,
    private errorSnackbarService: ErrorSnackbarService
  ) {
    console.log('ToysComponent constructor called');
  }

  ngOnInit(): void {
    console.log('ToysComponent ngOnInit called');
    
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });

    this.settingsService.getMassInputMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(massInputMode => {
        this.isMassInputMode = massInputMode;
      });
    
    this.loadToys();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    if (this.showNewToyModal) {
      this.closeNewToyModal();
    }
  }

  loadToys(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading toys...');
    
    const activeFilters = this.filterService.getActiveFilters('toy');
    const filtersWithDefaults = this.filterService.getFiltersWithDefaults('toy', activeFilters);
    
    this.apiService.getToys(filtersWithDefaults).subscribe({
      next: (toys) => {
        console.log('Toys received:', toys);
        console.log('Number of toys:', toys.length);
        this.toys = toys;
        this.toysCount = toys.length;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading toys:', error);
        this.toysCount = 0;
        this.isLoading = false;
        // Error snackbar will be shown automatically by API service
      }
    });
  }

  extractCustomFieldNames(): void {
    const fieldNamesSet = new Set<string>();
    
    this.toys.forEach(toy => {
      toy.customFieldValues.forEach(cfv => {
        fieldNamesSet.add(cfv.customFieldName);
      });
    });
    
    this.customFieldNames = Array.from(fieldNamesSet).sort();
    console.log('Custom field names:', this.customFieldNames);
  }

  getCustomFieldValue(toy: Toy, fieldName: string): string {
    const customField = toy.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    return customField ? customField.value : '';
  }

  getCustomFieldType(fieldName: string): string {
    // Check any toy that has this field to determine its type
    for (const toy of this.toys) {
      const customField = toy.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
      if (customField && customField.customFieldType) {
        return customField.customFieldType;
      }
    }
    return 'text'; // default to text if type is unknown
  }

  isCustomFieldBoolean(fieldName: string): boolean {
    return this.getCustomFieldType(fieldName) === 'boolean';
  }

  openNewToyModal(): void {
    this.isUpdateMode = false;
    this.toyToUpdate = null;
    this.showNewToyModal = true;
    this.newToy = {
      name: '',
      set: '',
      customFieldValues: [] as any[]
    };
    
    // Focus the name field after the view updates
    setTimeout(() => {
      if (this.nameField && this.nameField.focus) {
        this.nameField.focus();
      }
    }, 0);
  }

  openUpdateToyModal(toy: Toy): void {
    this.isUpdateMode = true;
    this.toyToUpdate = toy;
    this.showNewToyModal = true;
    this.newToy = {
      name: toy.name,
      set: toy.set,
      customFieldValues: [...toy.customFieldValues]
    };
    
    // Focus the name field after the view updates
    setTimeout(() => {
      if (this.nameField && this.nameField.focus) {
        this.nameField.focus();
      }
    }, 0);
  }

  closeNewToyModal(): void {
    this.showNewToyModal = false;
    this.isUpdateMode = false;
    this.toyToUpdate = null;
    this.newToy = {
      name: '',
      set: '',
      customFieldValues: [] as any[]
    };
  }

  onSubmitNewToy(): void {
    if (this.isCreating) return;
    
    this.isCreating = true;
    
    const toyData = {
      ...this.newToy,
      customFieldValues: this.newToy.customFieldValues
    };
    
    if (this.isUpdateMode && this.toyToUpdate) {
      // Update existing toy
      this.apiService.updateToy(this.toyToUpdate.id, toyData).subscribe({
        next: (response) => {
          console.log('Toy updated successfully:', response);
          this.isCreating = false;
          this.closeNewToyModal();
          this.loadToys(); // Refresh the toys list
        },
        error: (error) => {
          console.error('Error updating toy:', error);
          this.isCreating = false;
          this.closeNewToyModal(); // Close the modal on error
          // Error snackbar will be shown automatically by API service
        }
      });
    } else {
      // Create new toy
      this.apiService.createToy(toyData).subscribe({
        next: (response) => {
          console.log('Toy created successfully:', response);
          this.isCreating = false;
          this.closeNewToyModal();
          this.loadToys(); // Refresh the toys list
        },
        error: (error) => {
          console.error('Error creating toy:', error);
          this.isCreating = false;
          this.closeNewToyModal(); // Close the modal on error
          // Error snackbar will be shown automatically by API service
        }
      });
    }
  }

  onSubmitAndAddAnother(): void {
    if (this.isCreating) return;
    
    this.isCreating = true;
    
    const toyData = {
      ...this.newToy,
      customFieldValues: this.newToy.customFieldValues
    };
    
    // Only for creating new toys, not updating
    this.apiService.createToy(toyData).subscribe({
      next: (response) => {
        console.log('Toy created successfully:', response);
        this.isCreating = false;
        this.loadToys(); // Refresh the toys list
        
        // Show success toast
        this.errorSnackbarService.showSuccess('Toy created successfully');
        
        // Clear the name field but keep other fields
        this.newToy.name = '';
        
        // Focus the name input
        this.focusNameInput();
      },
      error: (error) => {
        console.error('Error creating toy:', error);
        this.isCreating = false;
        // Error snackbar will be shown automatically by API service
      }
    });
  }

  private focusNameInput(): void {
    setTimeout(() => {
      if (this.nameField && this.nameField.focus) {
        this.nameField.focus();
      }
    }, 100);
  }

  confirmDeleteToy(toy: Toy): void {
    this.toyToDelete = toy;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.toyToDelete = null;
  }

  deleteToy(): void {
    if (!this.toyToDelete || this.isDeleting) return;

    this.isDeleting = true;

    this.apiService.deleteToy(this.toyToDelete.id).subscribe({
      next: () => {
        console.log('Toy deleted successfully');
        this.isDeleting = false;
        this.closeDeleteConfirmModal();
        this.loadToys();
      },
      error: (error) => {
        console.error('Error deleting toy:', error);
        this.isDeleting = false;
        this.closeDeleteConfirmModal(); // Close the modal on error
        // Don't reload toys - keep existing display
        // Error snackbar will be shown automatically by API service
      }
    });
  }

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  onFiltersApplied(filters: FilterRequestDto[]): void {
    this.filterService.saveFiltersForEntity('toy', filters);
    this.loadToys();
    this.closeFilterModal();
  }

  clearFilters(): void {
    this.filterService.clearFiltersForEntity('toy');
    this.loadToys();
  }

  getActiveFilterDisplayText(): string {
    return this.filterService.getFilterDisplayText('toy');
  }

}
