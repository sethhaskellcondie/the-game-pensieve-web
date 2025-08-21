import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Toy } from '../../services/api.service';

@Component({
  selector: 'app-toys',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    set: ''
  };

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
      set: ''
    };
  }

  closeNewToyModal(): void {
    this.showNewToyModal = false;
    this.newToy = {
      name: '',
      set: ''
    };
  }

  onSubmitNewToy(): void {
    if (this.isCreating) return;
    
    this.isCreating = true;
    
    const toyData = {
      ...this.newToy,
      customFieldValues: [] // Empty array as requested (no custom fields yet)
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
}
