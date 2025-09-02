import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { SettingsService } from '../../services/settings.service';
import { DefaultSortService, DefaultSortFilter } from '../../services/default-sort.service';
import { DefaultSortModalComponent } from '../../components/default-sort-modal/default-sort-modal.component';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [CommonModule, DefaultSortModalComponent],
  templateUrl: './options.component.html',
  styleUrl: './options.component.scss'
})
export class OptionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isChecking = false;
  heartbeatResult = '';
  heartbeatStatus: 'success' | 'error' = 'success';

  isSeeding = false;
  seedResult = '';
  seedStatus: 'success' | 'error' = 'success';

  isDarkMode = false;
  isMassInputMode = false;

  entityTypes = [
    { key: 'videoGame', label: 'Video Games' },
    { key: 'videoGameBox', label: 'Video Game Boxes' },
    { key: 'boardGame', label: 'Board Games' },
    { key: 'boardGameBox', label: 'Board Game Boxes' },
    { key: 'toy', label: 'Toys' },
    { key: 'system', label: 'Systems' }
  ];

  showDefaultSortModal = false;
  editingEntityType = '';

  constructor(
    private apiService: ApiService,
    private settingsService: SettingsService,
    public defaultSortService: DefaultSortService
  ) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });

    this.settingsService.getMassInputMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(massInputMode => {
        this.isMassInputMode = massInputMode;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDarkModeToggle(enabled: boolean): void {
    this.settingsService.updateDarkMode(enabled);
  }

  onMassInputModeToggle(enabled: boolean): void {
    this.settingsService.updateMassInputMode(enabled);
  }

  checkHeartbeat(): void {
    this.isChecking = true;
    this.heartbeatResult = '';
    
    this.apiService.heartbeat().subscribe({
      next: (response) => {
        this.heartbeatResult = `API is healthy: ${response}`;
        this.heartbeatStatus = 'success';
        this.isChecking = false;
      },
      error: (error) => {
        this.heartbeatResult = `API connection failed: ${error.message || 'Unknown error'}`;
        this.heartbeatStatus = 'error';
        this.isChecking = false;
      }
    });
  }

  seedSampleData(): void {
    this.isSeeding = true;
    this.seedResult = '';
    
    this.apiService.seedSampleData().subscribe({
      next: (httpResponse) => {
        if (httpResponse.status === 200) {
          const responseBody = httpResponse.body;
          if (responseBody?.data) {
            this.seedResult = `Sample data seeded successfully:\n${JSON.stringify(responseBody.data, null, 2)}`;
          } else {
            this.seedResult = 'Sample data seeded successfully!';
          }
          this.seedStatus = 'success';
        } else {
          const responseBody = httpResponse.body;
          if (responseBody?.errors) {
            this.seedResult = `Seeding failed (Status ${httpResponse.status}): ${JSON.stringify(responseBody.errors)}`;
          } else {
            this.seedResult = `Seeding failed with status code: ${httpResponse.status}`;
          }
          this.seedStatus = 'error';
        }
        this.isSeeding = false;
      },
      error: (error) => {
        // Handle HTTP error responses (4xx, 5xx)
        let errorMessage = 'Unknown error';
        if (error.error?.errors) {
          errorMessage = JSON.stringify(error.error.errors);
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.status) {
          errorMessage = `HTTP ${error.status} ${error.statusText || ''}`;
        }
        
        this.seedResult = `Seeding failed: ${errorMessage}`;
        this.seedStatus = 'error';
        this.isSeeding = false;
      }
    });
  }

  getDefaultSort(entityType: string): DefaultSortFilter | null {
    return this.defaultSortService.getDefaultSort(entityType);
  }

  editDefaultSort(entityType: string): void {
    this.editingEntityType = entityType;
    this.showDefaultSortModal = true;
  }

  removeDefaultSort(entityType: string): void {
    this.defaultSortService.removeDefaultSort(entityType).subscribe({
      next: (success) => {
        if (!success) {
          console.error('Failed to remove default sort');
        }
      },
      error: (error) => {
        console.error('Error removing default sort:', error);
      }
    });
  }

  onDefaultSortModalClose(): void {
    this.showDefaultSortModal = false;
    this.editingEntityType = '';
  }

  formatFieldName(fieldName: string): string {
    switch (fieldName) {
      case 'is_expansion':
        return 'Expansion';
      case 'is_stand_alone':
        return 'Standalone';
      case 'is_physical':
        return 'Physical';
      case 'is_collection':
        return 'Collection';
      default:
        return fieldName
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
    }
  }
}
