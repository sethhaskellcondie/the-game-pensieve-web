import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, System } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';

@Component({
  selector: 'app-systems',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent, BooleanDisplayComponent],
  templateUrl: './systems.component.html',
  styleUrl: './systems.component.scss'
})
export class SystemsComponent implements OnInit, OnDestroy {
  systems: System[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  
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

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSystems();
  }

  ngOnDestroy(): void {
    // Component cleanup
  }

  loadSystems(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getSystems().subscribe({
      next: (systems) => {
        console.log('Systems received:', systems);
        console.log('Number of systems:', systems.length);
        this.systems = systems;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading systems:', error);
        this.errorMessage = `Failed to load systems: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
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
          this.errorMessage = `Failed to update system: ${error.message || 'Unknown error'}`;
          this.isCreating = false;
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
          this.errorMessage = `Failed to create system: ${error.message || 'Unknown error'}`;
          this.isCreating = false;
        }
      });
    }
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
        this.errorMessage = `Failed to delete system: ${error.message || 'Unknown error'}`;
        this.isDeleting = false;
      }
    });
  }

}
