import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, System } from '../../services/api.service';

@Component({
  selector: 'app-systems',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './systems.component.html',
  styleUrl: './systems.component.scss'
})
export class SystemsComponent implements OnInit {
  systems: System[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  
  showNewSystemModal = false;
  isCreating = false;
  newSystem = {
    name: '',
    generation: null as number | null,
    handheld: false
  };

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

  openNewSystemModal(): void {
    this.showNewSystemModal = true;
    this.newSystem = {
      name: '',
      generation: null,
      handheld: false
    };
  }

  closeNewSystemModal(): void {
    this.showNewSystemModal = false;
    this.newSystem = {
      name: '',
      generation: null,
      handheld: false
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
      customFieldValues: [] // Empty array (no custom fields yet)
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
}
