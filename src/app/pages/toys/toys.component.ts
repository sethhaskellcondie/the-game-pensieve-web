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
  availableCustomFields: any[] = [];
  isDarkMode = false;
  isMassInputMode = false;
  isMassEditMode = false;
  
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

  // Mass Edit Mode properties
  selectedToys: Set<number> = new Set();
  massEditQueue: Toy[] = [];
  isMassEditing = false;
  lastClickedToyIndex: number = -1;
  massEditOriginalTotal = 0;

  constructor(
    private apiService: ApiService, 
    public filterService: FilterService,
    private settingsService: SettingsService,
    private errorSnackbarService: ErrorSnackbarService
  ) {}

  ngOnInit(): void {
    
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

    this.settingsService.getMassEditMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(massEditMode => {
        this.isMassEditMode = massEditMode;
        if (!massEditMode) {
          this.clearMassEditSelection();
        }
      });
    
    this.loadToys();
    this.loadCustomFields();
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
    
    const activeFilters = this.filterService.getActiveFilters('toy');
    const filtersWithDefaults = this.filterService.getFiltersWithDefaults('toy', activeFilters);
    
    this.apiService.getToys(filtersWithDefaults).subscribe({
      next: (toys) => {
        this.toys = toys;
        this.toysCount = toys.length;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        this.toysCount = 0;
        this.isLoading = false;
        // Error snackbar will be shown automatically by API service
      }
    });
  }

  loadCustomFields(): void {
    this.apiService.getCustomFieldsByEntity('toy').subscribe({
      next: (fields) => {
        this.availableCustomFields = fields;
      },
      error: (error) => {
        this.availableCustomFields = [];
      }
    });
  }

  createDefaultCustomFieldValues(): any[] {
    return this.availableCustomFields.map(field => ({
      customFieldId: field.id,
      customFieldName: field.name,
      customFieldType: field.type,
      value: this.getDefaultValueForType(field.type)
    }));
  }

  private getDefaultValueForType(type: string): string {
    switch (type) {
      case 'number':
        return '0';
      case 'boolean':
        return 'false';
      case 'text':
      default:
        return '';
    }
  }

  private mergeWithDefaultCustomFieldValues(existingCustomFieldValues: any[]): any[] {
    const defaultValues = this.createDefaultCustomFieldValues();
    
    // Create a map of existing values for quick lookup
    const existingValuesMap = new Map();
    existingCustomFieldValues.forEach(existingValue => {
      existingValuesMap.set(existingValue.customFieldId, existingValue);
    });
    
    // Merge defaults with existing values, preferring existing values when they exist
    return defaultValues.map(defaultValue => {
      const existingValue = existingValuesMap.get(defaultValue.customFieldId);
      return existingValue || defaultValue;
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
  }

  getCustomFieldValue(toy: Toy, fieldName: string): string {
    const customField = toy.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    return customField ? customField.value : '';
  }

  shouldDisplayCustomField(toy: Toy, fieldName: string): boolean {
    const customField = toy.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    if (!customField) {
      return false; // Don't display anything if no custom field value exists
    }

    const fieldType = this.getCustomFieldType(fieldName);
    
    // For boolean fields, don't display if no value exists
    if (fieldType === 'boolean') {
      return false; // We'll handle boolean display separately
    }
    
    // For text fields, only display if there's a non-empty value
    if (fieldType === 'text') {
      return customField.value !== '';
    }
    
    // For number fields, display if there's any value (including 0)
    if (fieldType === 'number') {
      return customField.value !== '';
    }
    
    return false;
  }

  shouldDisplayBooleanBadge(toy: Toy, fieldName: string): boolean {
    const customField = toy.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    if (!customField) {
      return false; // Don't display badge if no custom field value exists
    }
    
    const fieldType = this.getCustomFieldType(fieldName);
    return fieldType === 'boolean'; // Only show badge if it's actually a boolean field and has a value
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
      customFieldValues: this.createDefaultCustomFieldValues()
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
      customFieldValues: this.mergeWithDefaultCustomFieldValues(toy.customFieldValues)
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
          this.isCreating = false;
          
          if (this.isMassEditing) {
            // If in mass edit mode, move to the next toy instead of closing
            this.editNextToyInQueue();
          } else {
            // Normal update flow
            this.closeNewToyModal();
            this.loadToys(); // Refresh the toys list
          }
        },
        error: (error) => {
          this.isCreating = false;
          this.closeNewToyModal(); // Close the modal on error
          // Error snackbar will be shown automatically by API service
        }
      });
    } else {
      // Create new toy
      this.apiService.createToy(toyData).subscribe({
        next: (response) => {
          this.isCreating = false;
          this.closeNewToyModal();
          this.loadToys(); // Refresh the toys list
        },
        error: (error) => {
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
        this.isCreating = false;
        this.loadToys(); // Refresh the toys list
        
        // Show success toast
        this.errorSnackbarService.showSuccess('Toy created successfully');
        
        // Clear the name field but reset custom field values to defaults
        this.newToy.name = '';
        this.newToy.customFieldValues = this.createDefaultCustomFieldValues();
        
        // Focus the name input
        this.focusNameInput();
      },
      error: (error) => {
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
        this.isDeleting = false;
        this.closeDeleteConfirmModal();
        this.loadToys();
      },
      error: (error) => {
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

  // Mass Edit Mode Methods
  toggleToySelection(toyId: number, event?: MouseEvent): void {
    const currentToyIndex = this.toys.findIndex(toy => toy.id === toyId);
    
    if (event?.shiftKey && this.lastClickedToyIndex >= 0 && currentToyIndex >= 0) {
      // Shift+click range selection
      this.handleRangeSelection(currentToyIndex, toyId);
    } else {
      // Normal single selection
      if (this.selectedToys.has(toyId)) {
        this.selectedToys.delete(toyId);
      } else {
        this.selectedToys.add(toyId);
      }
    }
    
    this.lastClickedToyIndex = currentToyIndex;
  }

  private handleRangeSelection(currentIndex: number, clickedToyId: number): void {
    const startIndex = Math.min(this.lastClickedToyIndex, currentIndex);
    const endIndex = Math.max(this.lastClickedToyIndex, currentIndex);
    
    // Determine the state to apply to the range (based on the clicked checkbox state)
    const targetState = !this.selectedToys.has(clickedToyId);
    
    // Apply the same state to all toys in the range
    for (let i = startIndex; i <= endIndex; i++) {
      const toy = this.toys[i];
      if (targetState) {
        this.selectedToys.add(toy.id);
      } else {
        this.selectedToys.delete(toy.id);
      }
    }
  }

  isToySelected(toyId: number): boolean {
    return this.selectedToys.has(toyId);
  }

  hasSelectedToys(): boolean {
    return this.selectedToys.size > 0;
  }

  isAllToysSelected(): boolean {
    return this.toys.length > 0 && this.selectedToys.size === this.toys.length;
  }

  isSomeToysSelected(): boolean {
    return this.selectedToys.size > 0 && this.selectedToys.size < this.toys.length;
  }

  toggleAllToys(): void {
    if (this.isAllToysSelected()) {
      // Unselect all
      this.selectedToys.clear();
    } else {
      // Select all
      this.toys.forEach(toy => this.selectedToys.add(toy.id));
    }
  }

  public clearMassEditSelection(): void {
    this.selectedToys.clear();
    this.massEditQueue = [];
    this.isMassEditing = false;
    this.lastClickedToyIndex = -1;
    this.massEditOriginalTotal = 0;
  }

  startMassEdit(): void {
    if (this.selectedToys.size === 0) return;
    
    // Build the queue of toys to edit
    this.massEditQueue = this.toys.filter(toy => this.selectedToys.has(toy.id));
    this.massEditOriginalTotal = this.massEditQueue.length;
    this.isMassEditing = true;
    
    // Start editing the first toy
    this.editNextToyInQueue();
  }

  private editNextToyInQueue(): void {
    if (this.massEditQueue.length === 0) {
      // All toys have been edited, clean up
      this.completeMassEdit();
      return;
    }
    
    const toyToEdit = this.massEditQueue.shift()!;
    this.openUpdateToyModal(toyToEdit);
  }

  private completeMassEdit(): void {
    this.isMassEditing = false;
    this.clearMassEditSelection();
    this.closeNewToyModal(); // Close the modal
    this.loadToys(); // Refresh the list
    this.errorSnackbarService.showSuccess('Mass edit completed successfully');
  }

  getMassEditProgress(): { current: number; total: number } {
    if (!this.isMassEditing) {
      return { current: 0, total: 0 };
    }
    
    const remaining = this.massEditQueue.length;
    const current = this.massEditOriginalTotal - remaining;
    
    return { current, total: this.massEditOriginalTotal };
  }

}
