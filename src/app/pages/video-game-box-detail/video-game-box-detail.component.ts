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
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-video-game-box-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, BooleanDisplayComponent, DynamicCustomFieldsComponent, SelectableTextInputComponent],
  templateUrl: './video-game-box-detail.component.html',
  styleUrl: './video-game-box-detail.component.scss'
})
export class VideoGameBoxDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('titleField', { static: false }) titleField: any;
  
  videoGameBox: VideoGameBox | null = null;
  isLoading = false;
  errorMessage = '';
  isDarkMode = false;
  
  showEditVideoGameBoxModal = false;
  isUpdating = false;
  editVideoGameBoxData = {
    title: '',
    customFieldValues: [] as any[]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
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
        this.loadVideoGameBox(parseInt(id));
      } else {
        this.router.navigate(['/video-game-boxes']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVideoGameBox(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getVideoGameBox(id).subscribe({
      next: (videoGameBox: VideoGameBox) => {
        this.videoGameBox = videoGameBox;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading video game box:', error);
        this.errorMessage = `Failed to load video game box: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  navigateToVideoGame(videoGameId: number): void {
    this.router.navigate(['/video-game', videoGameId]);
  }

  openEditVideoGameBoxModal(): void {
    if (!this.videoGameBox) return;
    
    this.showEditVideoGameBoxModal = true;
    this.editVideoGameBoxData = {
      title: this.videoGameBox.title,
      customFieldValues: [...this.videoGameBox.customFieldValues]
    };
    
    // Focus the title field after the view updates
    setTimeout(() => {
      if (this.titleField && this.titleField.focus) {
        this.titleField.focus();
      }
    }, 0);
  }

  closeEditVideoGameBoxModal(): void {
    this.showEditVideoGameBoxModal = false;
    this.editVideoGameBoxData = {
      title: '',
      customFieldValues: []
    };
  }

  onSubmitEditVideoGameBox(): void {
    if (this.isUpdating || !this.editVideoGameBoxData.title || !this.videoGameBox) {
      return;
    }
    
    this.isUpdating = true;
    this.errorMessage = '';
    
    const videoGameBoxData = {
      title: this.editVideoGameBoxData.title,
      systemId: this.videoGameBox.system.id,
      isPhysical: this.videoGameBox.isPhysical,
      isCollection: this.videoGameBox.isCollection,
      customFieldValues: this.editVideoGameBoxData.customFieldValues
    };
    
    this.apiService.updateVideoGameBox(this.videoGameBox.id, videoGameBoxData).subscribe({
      next: (response) => {
        console.log('Video game box updated successfully:', response);
        this.isUpdating = false;
        this.closeEditVideoGameBoxModal();
        this.loadVideoGameBox(this.videoGameBox!.id); // Refresh the current video game box
      },
      error: (error) => {
        console.error('Error updating video game box:', error);
        this.errorMessage = `Failed to update video game box: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
      }
    });
  }

  editVideoGameBoxMethod(): void {
    this.openEditVideoGameBoxModal();
  }
}