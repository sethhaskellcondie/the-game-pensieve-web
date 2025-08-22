import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Toy } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';

@Component({
  selector: 'app-toys',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent],
  templateUrl: './toys.component.html',
  styleUrl: './toys.component.scss'
})
export class ToysComponent implements OnInit {
  toys: Toy[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  
  showNewToyModal = false;
  isCreating = false;
  newToy = {
    name: '',
    set: '',
    customFieldValues: [] as any[]
  };
  
  editingToyId: number | null = null;
  editingToyName = '';
  editingToySet = '';
  isUpdating = false;

  constructor(private apiService: ApiService) {
    console.log('ToysComponent constructor called');
  }

  ngOnInit(): void {
    console.log('ToysComponent ngOnInit called');
    this.loadToys();
  }

  loadToys(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading toys...');
    
    this.apiService.getToys().subscribe({
      next: (toys) => {
        console.log('Toys received:', toys);
        console.log('Number of toys:', toys.length);
        this.toys = toys;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading toys:', error);
        this.errorMessage = `Failed to load toys: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
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

  openNewToyModal(): void {
    this.showNewToyModal = true;
    this.newToy = {
      name: '',
      set: '',
      customFieldValues: [] as any[]
    };
  }

  closeNewToyModal(): void {
    this.showNewToyModal = false;
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
    
    this.apiService.createToy(toyData).subscribe({
      next: (response) => {
        console.log('Toy created successfully:', response);
        this.isCreating = false;
        this.closeNewToyModal();
        this.loadToys(); // Refresh the toys list
      },
      error: (error) => {
        console.error('Error creating toy:', error);
        this.errorMessage = `Failed to create toy: ${error.message || 'Unknown error'}`;
        this.isCreating = false;
      }
    });
  }

  startEditingToy(toy: Toy): void {
    this.editingToyId = toy.id;
    this.editingToyName = toy.name;
    this.editingToySet = toy.set;
    
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
    this.editingToyId = null;
    this.editingToyName = '';
    this.editingToySet = '';
  }

  saveNextField(toy: Toy): void {
    // Move to set field when Enter is pressed in name field
    setTimeout(() => {
      const input = document.querySelector('.set-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  saveToy(toy: Toy): void {
    if (this.isUpdating || (!this.editingToyName.trim() || !this.editingToySet.trim())) {
      this.cancelEditing();
      return;
    }

    // If values haven't changed, just cancel editing
    if (this.editingToyName.trim() === toy.name && this.editingToySet.trim() === toy.set) {
      this.cancelEditing();
      return;
    }

    this.isUpdating = true;

    const updatedToy = {
      name: this.editingToyName.trim(),
      set: this.editingToySet.trim(),
      customFieldValues: toy.customFieldValues // Keep existing custom field values
    };

    this.apiService.updateToy(toy.id, updatedToy).subscribe({
      next: (updatedToyResponse) => {
        console.log('Toy updated successfully:', updatedToyResponse);
        // Update the local toy
        const index = this.toys.findIndex(t => t.id === toy.id);
        if (index !== -1) {
          this.toys[index].name = updatedToyResponse.name;
          this.toys[index].set = updatedToyResponse.set;
        }
        this.isUpdating = false;
        this.cancelEditing();
      },
      error: (error) => {
        console.error('Error updating toy:', error);
        this.errorMessage = `Failed to update toy: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
        this.cancelEditing();
      }
    });
  }
}
