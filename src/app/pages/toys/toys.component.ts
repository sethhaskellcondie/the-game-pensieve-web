import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Toy } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';

@Component({
  selector: 'app-toys',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent, BooleanDisplayComponent],
  templateUrl: './toys.component.html',
  styleUrl: './toys.component.scss'
})
export class ToysComponent implements OnInit, OnDestroy {
  toys: Toy[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  
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

  constructor(private apiService: ApiService) {
    console.log('ToysComponent constructor called');
  }

  ngOnInit(): void {
    console.log('ToysComponent ngOnInit called');
    this.loadToys();
  }

  ngOnDestroy(): void {
    // Component cleanup
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
          this.errorMessage = `Failed to update toy: ${error.message || 'Unknown error'}`;
          this.isCreating = false;
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
          this.errorMessage = `Failed to create toy: ${error.message || 'Unknown error'}`;
          this.isCreating = false;
        }
      });
    }
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
        this.errorMessage = `Failed to delete toy: ${error.message || 'Unknown error'}`;
        this.isDeleting = false;
      }
    });
  }

}
