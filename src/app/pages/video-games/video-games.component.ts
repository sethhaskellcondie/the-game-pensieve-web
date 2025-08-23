import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, VideoGame, System, VideoGameBox } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';

@Component({
  selector: 'app-video-games',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent],
  templateUrl: './video-games.component.html',
  styleUrl: './video-games.component.scss'
})
export class VideoGamesComponent implements OnInit {
  videoGames: VideoGame[] = [];
  systems: System[] = [];
  videoGameBoxes: VideoGameBox[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  
  showDetailVideoGameModal = false;
  showEditVideoGameModal = false;
  isUpdating = false;
  selectedVideoGame: VideoGame | null = null;
  videoGameToUpdate: VideoGame | null = null;
  editVideoGame = {
    title: '',
    systemId: null as number | null,
    customFieldValues: [] as any[]
  };
  

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadVideoGames();
    this.loadSystems();
    this.loadVideoGameBoxes();
  }

  loadVideoGames(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getVideoGames().subscribe({
      next: (videoGames) => {
        console.log('Video games received:', videoGames);
        console.log('Number of video games:', videoGames.length);
        this.videoGames = videoGames;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading video games:', error);
        this.errorMessage = `Failed to load video games: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  extractCustomFieldNames(): void {
    const fieldNamesSet = new Set<string>();
    
    this.videoGames.forEach(game => {
      game.customFieldValues.forEach(cfv => {
        fieldNamesSet.add(cfv.customFieldName);
      });
    });
    
    this.customFieldNames = Array.from(fieldNamesSet).sort();
    console.log('Custom field names:', this.customFieldNames);
  }

  getCustomFieldValue(game: VideoGame, fieldName: string): string {
    const customField = game.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
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

  loadVideoGameBoxes(): void {
    this.apiService.getVideoGameBoxes().subscribe({
      next: (videoGameBoxes) => {
        this.videoGameBoxes = videoGameBoxes;
      },
      error: (error) => {
        console.error('Error loading video game boxes:', error);
      }
    });
  }

  getVideoGameBoxesForGame(videoGame: VideoGame): VideoGameBox[] {
    return this.videoGameBoxes.filter(box => 
      box.videoGames.some((game: VideoGame) => game.id === videoGame.id)
    );
  }

  openDetailVideoGameModal(videoGame: VideoGame): void {
    this.selectedVideoGame = videoGame;
    this.showDetailVideoGameModal = true;
  }

  closeDetailVideoGameModal(): void {
    this.showDetailVideoGameModal = false;
    this.selectedVideoGame = null;
  }

  openEditFromDetail(): void {
    if (this.selectedVideoGame) {
      const videoGameToEdit = this.selectedVideoGame;
      this.closeDetailVideoGameModal();
      this.openEditVideoGameModal(videoGameToEdit);
    }
  }

  openDetailFromEdit(): void {
    if (this.videoGameToUpdate) {
      const videoGameToDetail = this.videoGameToUpdate;
      this.closeEditVideoGameModal();
      this.openDetailVideoGameModal(videoGameToDetail);
    }
  }

  openEditVideoGameModal(videoGame: VideoGame): void {
    this.videoGameToUpdate = videoGame;
    this.showEditVideoGameModal = true;
    this.editVideoGame = {
      title: videoGame.title,
      systemId: videoGame.system.id,
      customFieldValues: [...videoGame.customFieldValues]
    };
  }

  closeEditVideoGameModal(): void {
    this.showEditVideoGameModal = false;
    this.videoGameToUpdate = null;
    this.editVideoGame = {
      title: '',
      systemId: null,
      customFieldValues: [] as any[]
    };
  }

  onSubmitEditVideoGame(): void {
    if (this.isUpdating || !this.editVideoGame.title || this.editVideoGame.systemId === null || !this.videoGameToUpdate) {
      return;
    }
    
    this.isUpdating = true;
    
    const videoGameData = {
      title: this.editVideoGame.title,
      systemId: this.editVideoGame.systemId,
      customFieldValues: this.editVideoGame.customFieldValues
    };
    
    this.apiService.updateVideoGame(this.videoGameToUpdate.id, videoGameData).subscribe({
      next: (response) => {
        console.log('Video game updated successfully:', response);
        this.isUpdating = false;
        this.closeEditVideoGameModal();
        this.loadVideoGames(); // Refresh the video games list
      },
      error: (error) => {
        console.error('Error updating video game:', error);
        this.errorMessage = `Failed to update video game: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
      }
    });
  }

  swapView(): void {
    this.router.navigate(['/video-game-boxes']);
  }
}
