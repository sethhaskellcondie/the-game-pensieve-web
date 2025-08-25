import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CustomField } from '../../services/api.service';

@Component({
  selector: 'app-custom-fields',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-fields.component.html',
  styleUrl: './custom-fields.component.scss'
})
export class CustomFieldsComponent implements OnInit {
  customFields: CustomField[] = [];
  isLoading = false;
  errorMessage = '';
  
  showNewCustomFieldModal = false;
  isCreating = false;
  newCustomField = {
    name: '',
    type: '',
    entityKey: ''
  };
  
  editingFieldId: number | null = null;
  editingFieldName = '';
  isUpdating = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCustomFields();
  }

  loadCustomFields(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading custom fields...');
    
    this.apiService.getCustomFields().subscribe({
      next: (fields) => {
        console.log('Custom fields received:', fields);
        console.log('Number of fields:', fields.length);
        this.customFields = fields;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading custom fields:', error);
        this.errorMessage = `Failed to load custom fields: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  openNewCustomFieldModal(): void {
    this.showNewCustomFieldModal = true;
    this.newCustomField = {
      name: '',
      type: '',
      entityKey: ''
    };
  }

  closeNewCustomFieldModal(): void {
    this.showNewCustomFieldModal = false;
    this.newCustomField = {
      name: '',
      type: '',
      entityKey: ''
    };
  }

  onSubmitNewCustomField(): void {
    if (this.isCreating) return;
    
    this.isCreating = true;
    
    this.apiService.createCustomField(this.newCustomField).subscribe({
      next: (response) => {
        console.log('Custom field created successfully:', response);
        this.isCreating = false;
        this.closeNewCustomFieldModal();
        this.loadCustomFields();
      },
      error: (error) => {
        console.error('Error creating custom field:', error);
        this.errorMessage = `Failed to create custom field: ${error.message || 'Unknown error'}`;
        this.isCreating = false;
      }
    });
  }

  startEditingField(field: CustomField): void {
    this.editingFieldId = field.id;
    this.editingFieldName = field.name;
    
    // Focus the input after view update
    setTimeout(() => {
      const input = document.querySelector('.edit-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  cancelEditing(): void {
    this.editingFieldId = null;
    this.editingFieldName = '';
  }

  saveFieldName(field: CustomField): void {
    if (this.isUpdating || !this.editingFieldName.trim()) {
      this.cancelEditing();
      return;
    }

    // If name hasn't changed, just cancel editing
    if (this.editingFieldName.trim() === field.name) {
      this.cancelEditing();
      return;
    }

    this.isUpdating = true;

    this.apiService.updateCustomFieldName(field.id, this.editingFieldName.trim()).subscribe({
      next: (updatedField) => {
        console.log('Custom field updated successfully:', updatedField);
        // Update the local field
        const index = this.customFields.findIndex(f => f.id === field.id);
        if (index !== -1) {
          this.customFields[index].name = updatedField.name;
        }
        this.isUpdating = false;
        this.cancelEditing();
      },
      error: (error) => {
        console.error('Error updating custom field:', error);
        this.errorMessage = `Failed to update custom field: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
        this.cancelEditing();
      }
    });
  }
}
