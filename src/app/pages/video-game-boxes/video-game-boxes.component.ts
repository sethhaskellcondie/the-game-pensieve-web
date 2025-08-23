import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, VideoGameBox, System } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';

@Component({
  selector: 'app-video-game-boxes',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent],
  templateUrl: './video-game-boxes.component.html',
  styleUrl: './video-game-boxes.component.scss'
})
export class VideoGameBoxesComponent implements OnInit {
  videoGameBoxes: VideoGameBox[] = [];
  systems: System[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  
  showNewVideoGameBoxModal = false;
  isCreating = false;
  isUpdateMode = false;
  videoGameBoxToUpdate: VideoGameBox | null = null;
  newVideoGameBox = {
    title: '',
    systemId: null as number | null,
    isPhysical: false,
    isCollection: false,
    customFieldValues: [] as any[]
  };

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadVideoGameBoxes();
    this.loadSystems();
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

  loadSystems(): void {
    this.apiService.getSystems().subscribe({
      next: (systems) => {
        this.systems = systems;
      },
      error: (error) => {
        console.error('Error loading systems:', error);
      }
    });
  }

  openNewVideoGameBoxModal(): void {
    this.isUpdateMode = false;
    this.videoGameBoxToUpdate = null;
    this.showNewVideoGameBoxModal = true;
    this.newVideoGameBox = {
      title: '',
      systemId: null,
      isPhysical: false,
      isCollection: false,
      customFieldValues: [] as any[]
    };
  }

  openUpdateVideoGameBoxModal(videoGameBox: VideoGameBox): void {
    this.isUpdateMode = true;
    this.videoGameBoxToUpdate = videoGameBox;
    this.showNewVideoGameBoxModal = true;
    this.newVideoGameBox = {
      title: videoGameBox.title,
      systemId: videoGameBox.system.id,
      isPhysical: videoGameBox.isPhysical,
      isCollection: videoGameBox.isCollection,
      customFieldValues: [...videoGameBox.customFieldValues]
    };
  }

  closeNewVideoGameBoxModal(): void {
    this.showNewVideoGameBoxModal = false;
    this.isUpdateMode = false;
    this.videoGameBoxToUpdate = null;
    this.newVideoGameBox = {
      title: '',
      systemId: null,
      isPhysical: false,
      isCollection: false,
      customFieldValues: [] as any[]
    };
  }

  onSubmitNewVideoGameBox(): void {
    if (this.isCreating || !this.newVideoGameBox.title || this.newVideoGameBox.systemId === null) {
      return;
    }
    
    this.isCreating = true;
    
    const videoGameBoxData = {
      title: this.newVideoGameBox.title,
      systemId: this.newVideoGameBox.systemId,
      isPhysical: this.newVideoGameBox.isPhysical,
      isCollection: this.newVideoGameBox.isCollection,
      customFieldValues: this.newVideoGameBox.customFieldValues
    };
    
    if (this.isUpdateMode && this.videoGameBoxToUpdate) {
      // Update existing video game box
      this.apiService.updateVideoGameBox(this.videoGameBoxToUpdate.id, videoGameBoxData).subscribe({
        next: (response) => {
          console.log('Video game box updated successfully:', response);
          this.isCreating = false;
          this.closeNewVideoGameBoxModal();
          this.loadVideoGameBoxes(); // Refresh the video game boxes list
        },
        error: (error) => {
          console.error('Error updating video game box:', error);
          this.errorMessage = `Failed to update video game box: ${error.message || 'Unknown error'}`;
          this.isCreating = false;
        }
      });
    } else {
      // Create new video game box
      this.apiService.createVideoGameBox(videoGameBoxData).subscribe({
        next: (response) => {
          console.log('Video game box created successfully:', response);
          this.isCreating = false;
          this.closeNewVideoGameBoxModal();
          this.loadVideoGameBoxes(); // Refresh the video game boxes list
        },
        error: (error) => {
          console.error('Error creating video game box:', error);
          this.errorMessage = `Failed to create video game box: ${error.message || 'Unknown error'}`;
          this.isCreating = false;
        }
      });
    }
  }

  swapView(): void {
    this.router.navigate(['/video-games']);
  }
}