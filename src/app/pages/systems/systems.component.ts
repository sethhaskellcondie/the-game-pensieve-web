import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, System } from '../../services/api.service';

@Component({
  selector: 'app-systems',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './systems.component.html',
  styleUrl: './systems.component.scss'
})
export class SystemsComponent implements OnInit {
  systems: System[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSystems();
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
}
