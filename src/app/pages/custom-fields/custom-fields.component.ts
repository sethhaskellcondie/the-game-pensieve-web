import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CustomField } from '../../services/api.service';
import { IconService } from '../../services/icon.service';
import { SafeHtml } from '@angular/platform-browser';
import { FilterableDropdownComponent, DropdownOption } from '../../components/filterable-dropdown/filterable-dropdown.component';

@Component({
  selector: 'app-custom-fields',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterableDropdownComponent],
  templateUrl: './custom-fields.component.html',
  styleUrl: './custom-fields.component.scss'
})
export class CustomFieldsComponent implements OnInit {
  customFields: CustomField[] = [];
  sortedCustomFields: CustomField[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Sorting properties
  sortColumn: 'name' | 'type' | 'entity' | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Dropdown options
  typeOptions: DropdownOption[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' }
  ];
  
  entityOptions: DropdownOption[] = [
    { value: 'toy', label: 'Toy' },
    { value: 'system', label: 'System' },
    { value: 'videoGame', label: 'Video Game' },
    { value: 'videoGameBox', label: 'Video Game Box' },
    { value: 'boardGame', label: 'Board Game' },
    { value: 'boardGameBox', label: 'Board Game Box' }
  ];
  
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

  showDeleteConfirmModal = false;
  fieldToDelete: CustomField | null = null;
  isDeleting = false;

  showFilterModal = false;
  filterEntityKey = '';
  isFiltering = false;
  currentFilter: string | null = null;

  constructor(private apiService: ApiService, public iconService: IconService) {}

  ngOnInit(): void {
    this.loadCustomFields();
  }

  getIconHtml(iconName: string): SafeHtml {
    return this.iconService.getIcon(iconName);
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
        this.sortedCustomFields = [...fields];
        this.applySorting();
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
    
    // Focus the name input after the modal is rendered
    setTimeout(() => {
      const nameInput = document.querySelector('#name') as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
      }
    }, 0);
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
        this.applySorting();
      },
      error: (error) => {
        console.error('Error updating custom field:', error);
        this.errorMessage = `Failed to update custom field: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
        this.cancelEditing();
      }
    });
  }

  confirmDeleteCustomField(field: CustomField): void {
    this.fieldToDelete = field;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.fieldToDelete = null;
  }

  deleteCustomField(): void {
    if (!this.fieldToDelete || this.isDeleting) return;

    this.isDeleting = true;

    this.apiService.deleteCustomField(this.fieldToDelete.id).subscribe({
      next: () => {
        console.log('Custom field deleted successfully');
        this.isDeleting = false;
        this.closeDeleteConfirmModal();
        // Refresh the data from the server
        this.loadCustomFields();
      },
      error: (error) => {
        console.error('Error deleting custom field:', error);
        this.errorMessage = `Failed to delete custom field: ${error.message || 'Unknown error'}`;
        this.isDeleting = false;
      }
    });
  }

  getEntityDisplayName(entityKey: string): string {
    const entityNames: { [key: string]: string } = {
      'toy': 'Toy',
      'system': 'System',
      'videoGame': 'Video Game',
      'videoGameBox': 'Video Game Box',
      'boardGame': 'Board Game',
      'boardGameBox': 'Board Game Box'
    };
    return entityNames[entityKey] || entityKey;
  }

  getEntityColor(entityKey: string): string {
    const entityColors: { [key: string]: string } = {
      'toy': '#e91e63',           // Pink
      'system': '#9c27b0',        // Purple  
      'videoGame': '#3f51b5',     // Indigo
      'videoGameBox': '#2196f3',  // Blue
      'boardGame': '#4caf50',     // Green
      'boardGameBox': '#8bc34a'   // Light Green
    };
    return entityColors[entityKey] || '#f57c00'; // Default orange
  }

  sortTable(column: 'name' | 'type' | 'entity'): void {
    if (this.sortColumn === column) {
      // Toggle sort direction if clicking the same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new column and default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  applySorting(): void {
    if (!this.sortColumn) {
      this.sortedCustomFields = [...this.customFields];
      return;
    }

    this.sortedCustomFields = [...this.customFields].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (this.sortColumn) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'entity':
          aValue = this.getEntityDisplayName(a.entityKey).toLowerCase();
          bValue = this.getEntityDisplayName(b.entityKey).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(column: 'name' | 'type' | 'entity'): string {
    if (this.sortColumn !== column) {
      return '↕'; // Up-down arrow for unsorted
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  openFilterModal(): void {
    this.showFilterModal = true;
    this.filterEntityKey = '';
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
    this.filterEntityKey = '';
  }

  applyFilter(): void {
    if (!this.filterEntityKey || this.isFiltering) return;

    this.isFiltering = true;
    this.currentFilter = this.filterEntityKey;

    this.apiService.getCustomFieldsByEntity(this.filterEntityKey).subscribe({
      next: (fields) => {
        console.log('Filtered custom fields received:', fields);
        this.customFields = fields;
        this.sortedCustomFields = [...fields];
        this.applySorting();
        this.isFiltering = false;
        this.closeFilterModal();
      },
      error: (error) => {
        console.error('Error filtering custom fields:', error);
        this.errorMessage = `Failed to filter custom fields: ${error.message || 'Unknown error'}`;
        this.isFiltering = false;
      }
    });
  }

  clearFilter(): void {
    this.currentFilter = null;
    this.loadCustomFields();
  }

  getFilterDisplayText(): string {
    if (!this.currentFilter) return '';
    return this.getEntityDisplayName(this.currentFilter);
  }
}
