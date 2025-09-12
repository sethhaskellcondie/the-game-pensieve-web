import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, System } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';
import { CustomCheckboxComponent } from '../../components/custom-checkbox/custom-checkbox.component';
import { SelectableNumberInputComponent } from '../../components/selectable-number-input/selectable-number-input.component';
import { SelectableTextInputComponent } from '../../components/selectable-text-input/selectable-text-input.component';
import { FilterService, FilterRequestDto } from '../../services/filter.service';
import { EntityFilterModalComponent } from '../../components/entity-filter-modal/entity-filter-modal.component';
import { SettingsService } from '../../services/settings.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';

@Component({
  selector: 'app-systems',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent, BooleanDisplayComponent, CustomCheckboxComponent, SelectableNumberInputComponent, SelectableTextInputComponent, EntityFilterModalComponent],
  templateUrl: './systems.component.html',
  styleUrl: './systems.component.scss'
})
export class SystemsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('nameField', { static: false }) nameField: any;
  
  systems: System[] = [];
  systemsCount = 0;
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  availableCustomFields: any[] = [];
  isDarkMode = false;
  isMassInputMode = false;
  
  showNewSystemModal = false;
  isCreating = false;
  isUpdateMode = false;
  systemToUpdate: System | null = null;
  newSystem = {
    name: '',
    generation: null as number | null,
    handheld: false,
    customFieldValues: [] as any[]
  };

  showDeleteConfirmModal = false;
  systemToDelete: System | null = null;
  isDeleting = false;

  showFilterModal = false;

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
    
    this.loadSystems();
    this.loadCustomFields();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    if (this.showNewSystemModal) {
      this.closeNewSystemModal();
    }
  }

  loadSystems(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const activeFilters = this.filterService.getActiveFilters('system');
    const filtersWithDefaults = this.filterService.getFiltersWithDefaults('system', activeFilters);
    
    this.apiService.getSystems(filtersWithDefaults).subscribe({
      next: (systems) => {
        this.systems = systems;
        this.systemsCount = systems.length;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        this.systemsCount = 0;
        this.isLoading = false;
        // Error snackbar will be shown automatically by API service
      }
    });
  }

  loadCustomFields(): void {
    this.apiService.getCustomFieldsByEntity('system').subscribe({
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
    
    this.systems.forEach(system => {
      system.customFieldValues.forEach(cfv => {
        fieldNamesSet.add(cfv.customFieldName);
      });
    });
    
    this.customFieldNames = Array.from(fieldNamesSet).sort();
  }

  getCustomFieldValue(system: System, fieldName: string): string {
    const customField = system.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    return customField ? customField.value : '';
  }

  shouldDisplayCustomField(system: System, fieldName: string): boolean {
    const customField = system.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
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

  shouldDisplayBooleanBadge(system: System, fieldName: string): boolean {
    const customField = system.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    if (!customField) {
      return false; // Don't display badge if no custom field value exists
    }
    
    const fieldType = this.getCustomFieldType(fieldName);
    return fieldType === 'boolean'; // Only show badge if it's actually a boolean field and has a value
  }

  getCustomFieldType(fieldName: string): string {
    // Check any system that has this field to determine its type
    for (const system of this.systems) {
      const customField = system.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
      if (customField && customField.customFieldType) {
        return customField.customFieldType;
      }
    }
    return 'text'; // default to text if type is unknown
  }

  isCustomFieldBoolean(fieldName: string): boolean {
    return this.getCustomFieldType(fieldName) === 'boolean';
  }

  openNewSystemModal(): void {
    this.isUpdateMode = false;
    this.systemToUpdate = null;
    this.showNewSystemModal = true;
    this.newSystem = {
      name: '',
      generation: null,
      handheld: false,
      customFieldValues: this.createDefaultCustomFieldValues()
    };
    
    // Focus the name field after the view updates
    setTimeout(() => {
      if (this.nameField && this.nameField.focus) {
        this.nameField.focus();
      }
    }, 0);
  }

  openUpdateSystemModal(system: System): void {
    this.isUpdateMode = true;
    this.systemToUpdate = system;
    this.showNewSystemModal = true;
    this.newSystem = {
      name: system.name,
      generation: system.generation,
      handheld: system.handheld,
      customFieldValues: this.mergeWithDefaultCustomFieldValues(system.customFieldValues)
    };
    
    // Focus the name field after the view updates
    setTimeout(() => {
      if (this.nameField && this.nameField.focus) {
        this.nameField.focus();
      }
    }, 0);
  }

  closeNewSystemModal(): void {
    this.showNewSystemModal = false;
    this.isUpdateMode = false;
    this.systemToUpdate = null;
    this.newSystem = {
      name: '',
      generation: null,
      handheld: false,
      customFieldValues: [] as any[]
    };
  }

  onSubmitNewSystem(): void {
    if (this.isCreating || !this.newSystem.name || this.newSystem.generation === null) {
      return;
    }
    
    this.isCreating = true;
    
    const systemData = {
      name: this.newSystem.name,
      generation: this.newSystem.generation,
      handheld: this.newSystem.handheld,
      customFieldValues: this.newSystem.customFieldValues
    };
    
    if (this.isUpdateMode && this.systemToUpdate) {
      // Update existing system
      this.apiService.updateSystem(this.systemToUpdate.id, systemData).subscribe({
        next: (response) => {
          this.isCreating = false;
          this.closeNewSystemModal();
          this.loadSystems(); // Refresh the systems list
        },
        error: (error) => {
          this.isCreating = false;
          this.closeNewSystemModal(); // Close the modal on error
          // Error snackbar will be shown automatically by API service
        }
      });
    } else {
      // Create new system
      this.apiService.createSystem(systemData).subscribe({
        next: (response) => {
          this.isCreating = false;
          this.closeNewSystemModal();
          this.loadSystems(); // Refresh the systems list
        },
        error: (error) => {
          this.isCreating = false;
          this.closeNewSystemModal(); // Close the modal on error
          // Error snackbar will be shown automatically by API service
        }
      });
    }
  }

  onSubmitAndAddAnother(): void {
    if (this.isCreating || !this.newSystem.name || this.newSystem.generation === null) {
      return;
    }
    
    this.isCreating = true;
    
    const systemData = {
      name: this.newSystem.name,
      generation: this.newSystem.generation,
      handheld: this.newSystem.handheld,
      customFieldValues: this.newSystem.customFieldValues
    };
    
    // Only for creating new systems, not updating
    this.apiService.createSystem(systemData).subscribe({
      next: (response) => {
        this.isCreating = false;
        this.loadSystems(); // Refresh the systems list
        
        // Show success toast
        this.errorSnackbarService.showSuccess('System created successfully');
        
        // Clear the name field but reset custom field values to defaults
        this.newSystem.name = '';
        this.newSystem.customFieldValues = this.createDefaultCustomFieldValues();
        
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

  confirmDeleteSystem(system: System): void {
    this.systemToDelete = system;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.systemToDelete = null;
  }

  deleteSystem(): void {
    if (!this.systemToDelete || this.isDeleting) return;

    this.isDeleting = true;

    this.apiService.deleteSystem(this.systemToDelete.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteConfirmModal();
        this.loadSystems();
      },
      error: (error) => {
        this.isDeleting = false;
        this.closeDeleteConfirmModal(); // Close the modal on error
        // Don't reload systems - keep existing display
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
    this.filterService.saveFiltersForEntity('system', filters);
    this.loadSystems();
    this.closeFilterModal();
  }

  clearFilters(): void {
    this.filterService.clearFiltersForEntity('system');
    this.loadSystems();
  }

  getActiveFilterDisplayText(): string {
    const activeFilters = this.filterService.getActiveFilters('system');
    if (activeFilters.length === 0) return '';
    
    if (activeFilters.length === 1) {
      const filter = activeFilters[0];
      return `${filter.field} ${filter.operator} "${filter.operand}"`;
    }
    
    return `${activeFilters.length} active filters`;
  }

}
