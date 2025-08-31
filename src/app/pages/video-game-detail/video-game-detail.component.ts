import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, VideoGame, VideoGameBox } from '../../services/api.service';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { SelectableTextInputComponent } from '../../components/selectable-text-input/selectable-text-input.component';

@Component({
  selector: 'app-video-game-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, BooleanDisplayComponent, DynamicCustomFieldsComponent, SelectableTextInputComponent],
  templateUrl: './video-game-detail.component.html',
  styleUrl: './video-game-detail.component.scss'
})
export class VideoGameDetailComponent implements OnInit {
  @ViewChild('titleField', { static: false }) titleField: any;
  
  videoGame: VideoGame | null = null;
  videoGameBoxes: VideoGameBox[] = [];
  isLoading = false;
  errorMessage = '';
  
  showEditVideoGameModal = false;
  isUpdating = false;
  editVideoGameData = {
    title: '',
    customFieldValues: [] as any[]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadVideoGame(parseInt(id));
        this.loadVideoGameBoxes();
      } else {
        this.router.navigate(['/video-games']);
      }
    });
  }

  loadVideoGame(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getVideoGame(id).subscribe({
      next: (videoGame: VideoGame) => {
        this.videoGame = videoGame;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading video game:', error);
        this.errorMessage = `Failed to load video game: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  loadVideoGameBoxes(): void {
    this.apiService.getVideoGameBoxes().subscribe({
      next: (videoGameBoxes: VideoGameBox[]) => {
        this.videoGameBoxes = videoGameBoxes;
      },
      error: (error: any) => {
        console.error('Error loading video game boxes:', error);
      }
    });
  }

  getVideoGameBoxesForGame(): VideoGameBox[] {
    if (!this.videoGame) return [];
    return this.videoGameBoxes.filter(box => 
      box.videoGames.some((game: VideoGame) => game.id === this.videoGame!.id)
    );
  }

  navigateToVideoGameBox(id: number): void {
    this.router.navigate(['/video-game-box', id]);
  }

  openEditVideoGameModal(): void {
    if (!this.videoGame) return;
    
    this.showEditVideoGameModal = true;
    this.editVideoGameData = {
      title: this.videoGame.title,
      customFieldValues: [...this.videoGame.customFieldValues]
    };
    
    // Focus the title field after the view updates
    setTimeout(() => {
      if (this.titleField && this.titleField.focus) {
        this.titleField.focus();
      }
    }, 0);
  }

  closeEditVideoGameModal(): void {
    this.showEditVideoGameModal = false;
    this.editVideoGameData = {
      title: '',
      customFieldValues: []
    };
  }

  onSubmitEditVideoGame(): void {
    if (this.isUpdating || !this.editVideoGameData.title || !this.videoGame) {
      return;
    }
    
    this.isUpdating = true;
    this.errorMessage = '';
    
    const videoGameData = {
      title: this.editVideoGameData.title,
      systemId: this.videoGame.system.id,
      customFieldValues: this.editVideoGameData.customFieldValues
    };
    
    this.apiService.updateVideoGame(this.videoGame.id, videoGameData).subscribe({
      next: (response) => {
        console.log('Video game updated successfully:', response);
        this.isUpdating = false;
        this.closeEditVideoGameModal();
        this.loadVideoGame(this.videoGame!.id); // Refresh the current video game
      },
      error: (error) => {
        console.error('Error updating video game:', error);
        this.errorMessage = `Failed to update video game: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
      }
    });
  }

  editVideoGameMethod(): void {
    this.openEditVideoGameModal();
  }
}