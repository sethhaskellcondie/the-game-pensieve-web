import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { SettingsService } from '../../services/settings.service';
import { DefaultSortService, DefaultSortFilter } from '../../services/default-sort.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';
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

  isBackingUp = false;
  backupResult = '';
  backupStatus: 'success' | 'error' = 'success';

  isImporting = false;
  importResult = '';
  importStatus: 'success' | 'error' = 'success';

  isImportingFromBackup = false;
  importFromBackupResult = '';
  importFromBackupStatus: 'success' | 'error' = 'success';

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
    public defaultSortService: DefaultSortService,
    private errorSnackbarService: ErrorSnackbarService
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
        this.errorSnackbarService.showSuccess(`API is healthy: ${response}`);
        this.isChecking = false;
      },
      error: (error) => {
        this.errorSnackbarService.showError(`API connection failed: ${error.message || 'Unknown error'}`);
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
            this.errorSnackbarService.showSuccess(`Sample data seeded successfully`);
          } else {
            this.errorSnackbarService.showSuccess('Sample data seeded successfully!');
          }
        } else {
          const responseBody = httpResponse.body;
          if (responseBody?.errors) {
            this.errorSnackbarService.showError(`Seeding failed (Status ${httpResponse.status}): ${JSON.stringify(responseBody.errors)}`);
          } else {
            this.errorSnackbarService.showError(`Seeding failed with status code: ${httpResponse.status}`);
          }
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
        
        this.errorSnackbarService.showError(`Seeding failed: ${errorMessage}`);
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

  backupData(): void {
    this.isBackingUp = true;
    this.backupResult = '';
    
    this.apiService.backup().subscribe({
      next: (response: any) => {
        this.errorSnackbarService.showSuccess('Data backup completed successfully');
        this.isBackingUp = false;
        this.downloadBackupFile(response);
      },
      error: (error: any) => {
        this.errorSnackbarService.showError(`Backup failed: ${error.message || 'Unknown error'}`);
        this.isBackingUp = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.readFile(file);
    }
  }

  private readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const fileContent = e.target.result;
      this.importData(fileContent);
    };
    reader.readAsText(file);
  }

  importData(fileContent: string): void {
    this.isImporting = true;
    this.importResult = '';
    
    let parsedData: any;
    try {
      parsedData = JSON.parse(fileContent);
    } catch (error) {
      this.errorSnackbarService.showError('Invalid JSON file format');
      this.isImporting = false;
      return;
    }
    
    this.apiService.import(parsedData).subscribe({
      next: (response: any) => {
        this.errorSnackbarService.showSuccess('Data import completed successfully');
        this.isImporting = false;
      },
      error: (error: any) => {
        this.errorSnackbarService.showError(`Import failed: ${error.message || 'Unknown error'}`);
        this.isImporting = false;
      }
    });
  }

  importFromBackup(): void {
    this.isImportingFromBackup = true;
    this.importFromBackupResult = '';
    
    this.apiService.importFromFile('').subscribe({
      next: (response: any) => {
        this.errorSnackbarService.showSuccess('Import from backup completed successfully');
        this.isImportingFromBackup = false;
      },
      error: (error: any) => {
        this.errorSnackbarService.showError(`Import from backup failed: ${error.message || 'Unknown error'}`);
        this.isImportingFromBackup = false;
      }
    });
  }

  private downloadBackupFile(data: any): void {
    const backupContent = JSON.stringify(data, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.txt`;
    
    const blob = new Blob([backupContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    window.URL.revokeObjectURL(url);
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
