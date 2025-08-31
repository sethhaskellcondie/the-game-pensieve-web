import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [CommonModule],
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

  constructor(
    private apiService: ApiService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDarkModeToggle(enabled: boolean): void {
    this.settingsService.updateDarkMode(enabled);
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
}
