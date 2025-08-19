import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, CustomField } from '../../services/api.service';

@Component({
  selector: 'app-custom-fields',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-fields.component.html',
  styleUrl: './custom-fields.component.scss'
})
export class CustomFieldsComponent implements OnInit {
  customFields: CustomField[] = [];
  isLoading = false;
  errorMessage = '';

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
}
