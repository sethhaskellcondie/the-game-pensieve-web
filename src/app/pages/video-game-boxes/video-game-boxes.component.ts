import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, VideoGameBox, System, VideoGame } from '../../services/api.service';
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
  
  showDetailVideoGameBoxModal = false;
  showNewVideoGameBoxModal = false;
  isCreating = false;
  isUpdateMode = false;
  selectedVideoGameBox: VideoGameBox | null = null;
  videoGameBoxToUpdate: VideoGameBox | null = null;
  allVideoGames: VideoGame[] = [];
  newVideoGameBox = {
    title: '',
    systemId: null as number | null,
    isPhysical: false,
    isCollection: false,
    videoGames: [] as { 
      type: 'existing' | 'new';
      existingVideoGameId?: number | null;
      title?: string; 
      systemId?: number | null; 
      customFieldValues: any[] 
    }[],
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
    
    // Load all video games for the dropdown
    this.apiService.getVideoGames().subscribe({
      next: (videoGames) => {
        this.allVideoGames = videoGames;
      },
      error: (error) => {
        console.error('Error loading video games:', error);
      }
    });
    
    this.newVideoGameBox = {
      title: '',
      systemId: null,
      isPhysical: false,
      isCollection: false,
      videoGames: [],
      customFieldValues: [] as any[]
    };
  }

  openUpdateVideoGameBoxModal(videoGameBox: VideoGameBox): void {
    this.isUpdateMode = true;
    this.videoGameBoxToUpdate = videoGameBox;
    this.showNewVideoGameBoxModal = true;
    
    // Load all video games for the dropdown
    this.apiService.getVideoGames().subscribe({
      next: (videoGames) => {
        this.allVideoGames = videoGames;
        
        // Convert existing video games to the format we need
        const existingVideoGames = videoGameBox.videoGames.map(game => ({
          type: 'existing' as 'existing' | 'new',
          existingVideoGameId: game.id,
          title: undefined,
          systemId: undefined,
          customFieldValues: []
        }));
        
        this.newVideoGameBox = {
          title: videoGameBox.title,
          systemId: videoGameBox.system.id,
          isPhysical: videoGameBox.isPhysical,
          isCollection: videoGameBox.isCollection,
          videoGames: existingVideoGames,
          customFieldValues: [...videoGameBox.customFieldValues]
        };
      },
      error: (error) => {
        console.error('Error loading video games:', error);
        this.newVideoGameBox = {
          title: videoGameBox.title,
          systemId: videoGameBox.system.id,
          isPhysical: videoGameBox.isPhysical,
          isCollection: videoGameBox.isCollection,
          videoGames: [],
          customFieldValues: [...videoGameBox.customFieldValues]
        };
      }
    });
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
      videoGames: [],
      customFieldValues: [] as any[]
    };
  }

  onSubmitNewVideoGameBox(): void {
    if (this.isCreating || !this.newVideoGameBox.title || this.newVideoGameBox.systemId === null) {
      return;
    }

    // Validate video games if any are added
    for (let i = 0; i < this.newVideoGameBox.videoGames.length; i++) {
      const videoGame = this.newVideoGameBox.videoGames[i];
      
      if (videoGame.type === 'existing') {
        if (!videoGame.existingVideoGameId) {
          this.errorMessage = `Please select an existing video game for item ${i + 1}.`;
          return;
        }
      } else if (videoGame.type === 'new') {
        if (!videoGame.title || videoGame.title.trim() === '') {
          this.errorMessage = `Please enter a title for new video game item ${i + 1}.`;
          return;
        }
        if (!videoGame.systemId) {
          this.errorMessage = `Please select a system for new video game item ${i + 1}.`;
          return;
        }
      }
    }
    
    this.isCreating = true;
    this.errorMessage = '';
    
    // Separate existing and new video games
    const existingVideoGameIds = this.newVideoGameBox.videoGames
      .filter(game => game.type === 'existing' && game.existingVideoGameId)
      .map(game => game.existingVideoGameId!);
    
    const newVideoGames = this.newVideoGameBox.videoGames
      .filter(game => game.type === 'new')
      .map(game => ({
        title: game.title!,
        systemId: game.systemId!,
        customFieldValues: game.customFieldValues
      }));
    
    const videoGameBoxData = {
      title: this.newVideoGameBox.title,
      systemId: this.newVideoGameBox.systemId,
      isPhysical: this.newVideoGameBox.isPhysical,
      isCollection: this.newVideoGameBox.isCollection,
      existingVideoGameIds: existingVideoGameIds,
      newVideoGames: newVideoGames,
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

  openDetailVideoGameBoxModal(videoGameBox: VideoGameBox): void {
    this.selectedVideoGameBox = videoGameBox;
    this.showDetailVideoGameBoxModal = true;
  }

  closeDetailVideoGameBoxModal(): void {
    this.showDetailVideoGameBoxModal = false;
    this.selectedVideoGameBox = null;
  }

  openEditFromDetail(): void {
    if (this.selectedVideoGameBox) {
      const videoGameBoxToEdit = this.selectedVideoGameBox;
      this.closeDetailVideoGameBoxModal();
      this.openUpdateVideoGameBoxModal(videoGameBoxToEdit);
    }
  }

  openDetailFromEdit(): void {
    if (this.videoGameBoxToUpdate) {
      const videoGameBoxToDetail = this.videoGameBoxToUpdate;
      this.closeNewVideoGameBoxModal();
      this.openDetailVideoGameBoxModal(videoGameBoxToDetail);
    }
  }

  swapView(): void {
    this.router.navigate(['/video-games']);
  }

  addNewVideoGame(): void {
    // Add a new video game item with default type 'new' but allow user to choose
    this.apiService.getCustomFieldsByEntity('videoGame').subscribe({
      next: (customFields: any[]) => {
        const newVideoGame = {
          type: 'new' as 'existing' | 'new',
          existingVideoGameId: null,
          title: this.newVideoGameBox.title,
          systemId: this.newVideoGameBox.systemId,
          customFieldValues: customFields.map((field: any) => ({
            customFieldId: field.id,
            customFieldName: field.name,
            customFieldType: field.type,
            value: field.type === 'boolean' ? 'false' : ''
          }))
        };
        this.newVideoGameBox.videoGames.push(newVideoGame);
      },
      error: (error: any) => {
        console.error('Error loading custom fields for video game:', error);
        this.newVideoGameBox.videoGames.push({
          type: 'new' as 'existing' | 'new',
          existingVideoGameId: null,
          title: this.newVideoGameBox.title,
          systemId: this.newVideoGameBox.systemId,
          customFieldValues: []
        });
      }
    });
  }

  removeVideoGame(index: number): void {
    this.newVideoGameBox.videoGames.splice(index, 1);
  }

  isVideoGameSelected(videoGame: any): boolean {
    if (videoGame.type === 'existing') {
      return !!videoGame.existingVideoGameId;
    } else if (videoGame.type === 'new') {
      return !!(videoGame.title && videoGame.title.trim() !== '' && videoGame.systemId);
    }
    return false;
  }

  getVideoGameDisplayText(videoGame: any): string {
    if (videoGame.type === 'existing' && videoGame.existingVideoGameId) {
      const selectedGame = this.allVideoGames.find(game => game.id == videoGame.existingVideoGameId);
      return selectedGame ? `${selectedGame.title} (${selectedGame.system.name})` : 'Unknown Game';
    } else if (videoGame.type === 'new' && videoGame.title && videoGame.systemId) {
      const selectedSystem = this.systems.find(system => system.id == videoGame.systemId);
      return selectedSystem ? `${videoGame.title} (${selectedSystem.name})` : videoGame.title;
    }
    return '';
  }

  getVideoGameTypeLabel(videoGame: any): string {
    return videoGame.type === 'existing' ? 'Existing' : 'New';
  }
}