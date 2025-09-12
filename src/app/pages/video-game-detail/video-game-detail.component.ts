import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, VideoGame, VideoGameBox } from '../../services/api.service';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { SelectableTextInputComponent } from '../../components/selectable-text-input/selectable-text-input.component';
import { FilterService, FilterRequestDto } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-video-game-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, BooleanDisplayComponent, DynamicCustomFieldsComponent, SelectableTextInputComponent],
  templateUrl: './video-game-detail.component.html',
  styleUrl: './video-game-detail.component.scss'
})
export class VideoGameDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('titleField', { static: false }) titleField: any;
  
  videoGame: VideoGame | null = null;
  videoGameBoxes: VideoGameBox[] = [];
  isLoading = false;
  errorMessage = '';
  isDarkMode = false;
  
  showEditVideoGameModal = false;
  isUpdating = false;
  editVideoGameData = {
    title: '',
    customFieldValues: [] as any[]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private filterService: FilterService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        // Error loading video game boxes
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

  navigateToSystemFiltered(systemId: number): void {
    const filter: FilterRequestDto = {
      key: 'videoGame',
      field: 'system_id',
      operator: 'equals',
      operand: systemId.toString()
    };
    
    this.filterService.clearFiltersForEntity('videoGame');
    this.filterService.saveFiltersForEntity('videoGame', [filter]);
    this.router.navigate(['/video-games']);
  }

  navigateToCustomFieldFiltered(customFieldName: string, value: string): void {
    const filter: FilterRequestDto = {
      key: 'videoGame',
      field: customFieldName,
      operator: 'equals',
      operand: value
    };
    
    this.filterService.clearFiltersForEntity('videoGame');
    this.filterService.saveFiltersForEntity('videoGame', [filter]);
    this.router.navigate(['/video-games']);
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
        this.isUpdating = false;
        this.closeEditVideoGameModal();
        this.loadVideoGame(this.videoGame!.id); // Refresh the current video game
      },
      error: (error) => {
        this.errorMessage = `Failed to update video game: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
      }
    });
  }

  editVideoGameMethod(): void {
    this.openEditVideoGameModal();
  }
}