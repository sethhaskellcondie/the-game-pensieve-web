import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, VideoGameBox } from '../../services/api.service';

@Component({
  selector: 'app-video-game-boxes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-game-boxes.component.html',
  styleUrl: './video-game-boxes.component.scss'
})
export class VideoGameBoxesComponent implements OnInit {
  videoGameBoxes: VideoGameBox[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadVideoGameBoxes();
  }

  loadVideoGameBoxes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getVideoGameBoxes().subscribe({
      next: (videoGameBoxes) => {
        console.log('Video game boxes received:', videoGameBoxes);
        console.log('Number of video game boxes:', videoGameBoxes.length);
        this.videoGameBoxes = videoGameBoxes;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading video game boxes:', error);
        this.errorMessage = `Failed to load video game boxes: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  extractCustomFieldNames(): void {
    const fieldNamesSet = new Set<string>();
    
    this.videoGameBoxes.forEach(box => {
      box.customFieldValues.forEach(cfv => {
        fieldNamesSet.add(cfv.customFieldName);
      });
    });
    
    this.customFieldNames = Array.from(fieldNamesSet).sort();
    console.log('Custom field names:', this.customFieldNames);
  }

  getCustomFieldValue(box: VideoGameBox, fieldName: string): string {
    const customField = box.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    return customField ? customField.value : '';
  }

  swapView(): void {
    this.router.navigate(['/video-games']);
  }
}