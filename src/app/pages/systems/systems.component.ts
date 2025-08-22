import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, System } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';

@Component({
  selector: 'app-systems',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent],
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
  newSystem = {
    name: '',
    generation: null as number | null,
    handheld: false,
    customFieldValues: [] as any[]
  };
  
  editingSystemId: number | null = null;
  editingSystemName = '';
  editingSystemGeneration = 1;
  editingSystemHandheld = false;
  isUpdating = false;
  private documentClickListener?: (event: Event) => void;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSystems();
  }

  ngOnDestroy(): void {
    this.removeDocumentClickListener();
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

  openNewSystemModal(): void {
    this.showNewSystemModal = true;
    this.newSystem = {
      name: '',
      generation: null,
      handheld: false,
      customFieldValues: [] as any[]
    };
  }

  closeNewSystemModal(): void {
    this.showNewSystemModal = false;
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

  startEditingSystem(system: System): void {
    this.editingSystemId = system.id;
    this.editingSystemName = system.name;
    this.editingSystemGeneration = system.generation;
    this.editingSystemHandheld = system.handheld;
    
    // Add document click listener to save when clicking outside
    this.addDocumentClickListener(system);
    
    // Focus the name input first
    setTimeout(() => {
      const input = document.querySelector('.name-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  cancelEditing(): void {
    this.removeDocumentClickListener();
    this.editingSystemId = null;
    this.editingSystemName = '';
    this.editingSystemGeneration = 1;
    this.editingSystemHandheld = false;
  }

  onGenerationChange(value: any): void {
    this.editingSystemGeneration = +value || 1;
  }

  onGenerationInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.editingSystemGeneration = +target.value || 1;
  }

  moveToNextField(): void {
    // Move from name to generation, or from generation to save
    const currentFocus = document.activeElement;
    if (currentFocus?.classList.contains('name-input')) {
      // Move to generation field
      setTimeout(() => {
        const input = document.querySelector('.generation-input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
    } else {
      // Save from generation field
      const system = this.systems.find(s => s.id === this.editingSystemId);
      if (system) {
        this.saveSystem(system);
      }
    }
  }

  saveSystem(system: System): void {
    if (this.isUpdating || !this.editingSystemName.trim() || this.editingSystemGeneration < 1) {
      this.cancelEditing();
      return;
    }

    // If values haven't changed, just cancel editing
    if (this.editingSystemName.trim() === system.name && 
        this.editingSystemGeneration === system.generation && 
        this.editingSystemHandheld === system.handheld) {
      this.cancelEditing();
      return;
    }

    this.isUpdating = true;

    const updatedSystem = {
      name: this.editingSystemName.trim(),
      generation: this.editingSystemGeneration,
      handheld: this.editingSystemHandheld,
      customFieldValues: system.customFieldValues // Keep existing custom field values
    };

    this.apiService.updateSystem(system.id, updatedSystem).subscribe({
      next: (updatedSystemResponse) => {
        console.log('System updated successfully:', updatedSystemResponse);
        // Update the local system
        const index = this.systems.findIndex(s => s.id === system.id);
        if (index !== -1) {
          this.systems[index].name = updatedSystemResponse.name;
          this.systems[index].generation = updatedSystemResponse.generation;
          this.systems[index].handheld = updatedSystemResponse.handheld;
        }
        this.isUpdating = false;
        this.cancelEditing();
      },
      error: (error) => {
        console.error('Error updating system:', error);
        this.errorMessage = `Failed to update system: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
        this.cancelEditing();
      }
    });
  }

  private addDocumentClickListener(system: System): void {
    // Remove any existing listener first
    this.removeDocumentClickListener();
    
    this.documentClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      const editingRow = target.closest('.table-row');
      
      // Check if the click is outside the current editing row
      if (!editingRow || !editingRow.contains(target.closest('.system-name-edit, .system-generation-edit, .system-handheld-edit'))) {
        // Save the current edits
        this.saveSystem(system);
      }
    };
    
    // Add the listener after a small delay to avoid immediate triggering
    setTimeout(() => {
      if (this.documentClickListener) {
        document.addEventListener('click', this.documentClickListener);
      }
    }, 100);
  }

  private removeDocumentClickListener(): void {
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener);
      this.documentClickListener = undefined;
    }
  }
}
