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
        console.log('Systems received:', systems);
        console.log('Number of systems:', systems.length);
        this.systems = systems;
        this.systemsCount = systems.length;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading systems:', error);
        this.systemsCount = 0;
        this.isLoading = false;
        // Error snackbar will be shown automatically by API service
      }
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
    console.log('Custom field names:', this.customFieldNames);
  }

  getCustomFieldValue(system: System, fieldName: string): string {
    const customField = system.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    return customField ? customField.value : '';
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
      customFieldValues: [] as any[]
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
      customFieldValues: [...system.customFieldValues]
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
          console.log('System updated successfully:', response);
          this.isCreating = false;
          this.closeNewSystemModal();
          this.loadSystems(); // Refresh the systems list
        },
        error: (error) => {
          console.error('Error updating system:', error);
          this.isCreating = false;
          this.closeNewSystemModal(); // Close the modal on error
          // Error snackbar will be shown automatically by API service
        }
      });
    } else {
      // Create new system
      this.apiService.createSystem(systemData).subscribe({
        next: (response) => {
          console.log('System created successfully:', response);
          this.isCreating = false;
          this.closeNewSystemModal();
          this.loadSystems(); // Refresh the systems list
        },
        error: (error) => {
          console.error('Error creating system:', error);
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
        console.log('System created successfully:', response);
        this.isCreating = false;
        this.loadSystems(); // Refresh the systems list
        
        // Show success toast
        this.errorSnackbarService.showSuccess('System created successfully');
        
        // Clear the name field but keep other fields
        this.newSystem.name = '';
        
        // Focus the name input
        this.focusNameInput();
      },
      error: (error) => {
        console.error('Error creating system:', error);
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
        console.log('System deleted successfully');
        this.isDeleting = false;
        this.closeDeleteConfirmModal();
        this.loadSystems();
      },
      error: (error) => {
        console.error('Error deleting system:', error);
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
