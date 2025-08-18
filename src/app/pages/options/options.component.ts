import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './options.component.html',
  styleUrl: './options.component.scss'
})
export class OptionsComponent {
  isChecking = false;
  heartbeatResult = '';
  heartbeatStatus: 'success' | 'error' = 'success';

  isSeeding = false;
  seedResult = '';
  seedStatus: 'success' | 'error' = 'success';

  constructor(private apiService: ApiService) {}

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
      next: (response) => {
        if (response.errors) {
          this.seedResult = `Seeding failed: ${JSON.stringify(response.errors)}`;
          this.seedStatus = 'error';
        } else {
          this.seedResult = 'Sample data seeded successfully!';
          this.seedStatus = 'success';
        }
        this.isSeeding = false;
      },
      error: (error) => {
        this.seedResult = `Seeding failed: ${error.message || 'Unknown error'}`;
        this.seedStatus = 'error';
        this.isSeeding = false;
      }
    });
  }
}
