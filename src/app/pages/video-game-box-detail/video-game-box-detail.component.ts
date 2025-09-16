import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, VideoGame, VideoGameBox } from '../../services/api.service';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { SelectableTextInputComponent } from '../../components/selectable-text-input/selectable-text-input.component';
import { FilterableDropdownComponent, DropdownOption } from '../../components/filterable-dropdown/filterable-dropdown.component';
import { CustomCheckboxComponent } from '../../components/custom-checkbox/custom-checkbox.component';
import { FilterService, FilterRequestDto } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-video-game-box-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, BooleanDisplayComponent, DynamicCustomFieldsComponent, SelectableTextInputComponent, FilterableDropdownComponent, CustomCheckboxComponent],
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

  showDeleteConfirmModal = false;
  isDeleting = false;
  editVideoGameBoxData = {
    title: '',
    systemId: null as string | null,
    isPhysical: false,
    isCollection: false,
    videoGames: [] as { 
      type: 'existing' | 'new';
      existingVideoGameId?: string | null;
      title?: string; 
      systemId?: string | null; 
      customFieldValues: any[] 
    }[],
    customFieldValues: [] as any[]
  };

  systems: any[] = [];
  allVideoGames: any[] = [];
  editingVideoGameIndex: number | null = null;
  videoGameBackup: any = null;

  get systemOptions(): DropdownOption[] {
    return this.systems.map(system => ({
      value: system.id.toString(),
      label: `${system.name} (Gen ${system.generation})`
    }));
  }

  get videoGameOptions(): DropdownOption[] {
    return this.allVideoGames.map(game => ({
      value: game.id.toString(),
      label: `${game.title} (${game.system.name})`
    }));
  }
  availableCustomFields: any[] = [];

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

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    if (this.showEditVideoGameBoxModal) {
      this.closeEditVideoGameBoxModal();
    } else if (this.showDeleteConfirmModal) {
      this.closeDeleteConfirmModal();
    }
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

  navigateToFiltered(field: string, value: boolean): void {
    const filter: FilterRequestDto = {
      key: 'videoGameBox',
      field: field,
      operator: 'equals',
      operand: value.toString()
    };
    
    this.filterService.clearFiltersForEntity('videoGameBox');
    this.filterService.saveFiltersForEntity('videoGameBox', [filter]);
    this.router.navigate(['/video-game-boxes']);
  }

  navigateToSystemFiltered(systemId: number): void {
    const filter: FilterRequestDto = {
      key: 'videoGameBox',
      field: 'system_id',
      operator: 'equals',
      operand: systemId.toString()
    };
    
    this.filterService.clearFiltersForEntity('videoGameBox');
    this.filterService.saveFiltersForEntity('videoGameBox', [filter]);
    this.router.navigate(['/video-game-boxes']);
  }

  navigateToCustomFieldFiltered(customFieldName: string, value: string): void {
    const filter: FilterRequestDto = {
      key: 'videoGameBox',
      field: customFieldName,
      operator: 'equals',
      operand: value
    };
    
    this.filterService.clearFiltersForEntity('videoGameBox');
    this.filterService.saveFiltersForEntity('videoGameBox', [filter]);
    this.router.navigate(['/video-game-boxes']);
  }

  createDefaultCustomFieldValues(): any[] {
    return this.availableCustomFields.map(field => ({
      customFieldId: field.id,
      customFieldName: field.name,
      customFieldType: field.type,
      value: this.getDefaultValueForType(field.type)
    }));
  }

  private getDefaultValueForType(type: string): string {
    switch (type) {
      case 'number':
        return '0';
      case 'boolean':
        return 'false';
      case 'text':
      default:
        return '';
    }
  }

  private mergeWithDefaultCustomFieldValues(existingCustomFieldValues: any[]): any[] {
    const defaultValues = this.createDefaultCustomFieldValues();
    
    // Create a map of existing values for quick lookup
    const existingValuesMap = new Map();
    existingCustomFieldValues.forEach(existingValue => {
      existingValuesMap.set(existingValue.customFieldId, existingValue);
    });
    
    // Merge defaults with existing values, preferring existing values when they exist
    return defaultValues.map(defaultValue => {
      const existingValue = existingValuesMap.get(defaultValue.customFieldId);
      return existingValue || defaultValue;
    });
  }

  openEditVideoGameBoxModal(): void {
    if (!this.videoGameBox) return;
    
    this.showEditVideoGameBoxModal = true;
    
    // Load systems for dropdown
    this.apiService.getSystems().subscribe({
      next: (systems) => {
        this.systems = systems;
      },
      error: (error) => {
        console.error('Error loading systems:', error);
      }
    });

    // Load available custom fields for video game boxes
    this.apiService.getCustomFieldsByEntity('videoGameBox').subscribe({
      next: (customFields) => {
        this.availableCustomFields = customFields;
        
        // Load all video games for dropdown
        this.apiService.getVideoGames().subscribe({
          next: (videoGames) => {
            this.allVideoGames = videoGames;
            
            // Convert existing video games to the format we need
            const existingVideoGames = this.videoGameBox!.videoGames.map(game => ({
              type: 'existing' as 'existing' | 'new',
              existingVideoGameId: game.id.toString(),
              title: undefined,
              systemId: undefined,
              customFieldValues: []
            }));
            
            this.editVideoGameBoxData = {
              title: this.videoGameBox!.title,
              systemId: this.videoGameBox!.system.id.toString(),
              isPhysical: this.videoGameBox!.isPhysical,
              isCollection: this.videoGameBox!.isCollection,
              videoGames: existingVideoGames,
              customFieldValues: this.mergeWithDefaultCustomFieldValues(this.videoGameBox!.customFieldValues)
            };
          },
          error: (error) => {
            console.error('Error loading video games:', error);
            this.editVideoGameBoxData = {
              title: this.videoGameBox!.title,
              systemId: this.videoGameBox!.system.id.toString(),
              isPhysical: this.videoGameBox!.isPhysical,
              isCollection: this.videoGameBox!.isCollection,
              videoGames: [],
              customFieldValues: this.mergeWithDefaultCustomFieldValues(this.videoGameBox!.customFieldValues)
            };
          }
        });
      },
      error: (error) => {
        console.error('Error loading custom fields for video game box:', error);
        // Fallback to original behavior if custom fields can't be loaded
        this.availableCustomFields = [];
        
        // Load all video games for dropdown
        this.apiService.getVideoGames().subscribe({
          next: (videoGames) => {
            this.allVideoGames = videoGames;
            
            // Convert existing video games to the format we need
            const existingVideoGames = this.videoGameBox!.videoGames.map(game => ({
              type: 'existing' as 'existing' | 'new',
              existingVideoGameId: game.id.toString(),
              title: undefined,
              systemId: undefined,
              customFieldValues: []
            }));
            
            this.editVideoGameBoxData = {
              title: this.videoGameBox!.title,
              systemId: this.videoGameBox!.system.id.toString(),
              isPhysical: this.videoGameBox!.isPhysical,
              isCollection: this.videoGameBox!.isCollection,
              videoGames: existingVideoGames,
              customFieldValues: [...this.videoGameBox!.customFieldValues]
            };
          },
          error: (error) => {
            console.error('Error loading video games:', error);
            this.editVideoGameBoxData = {
              title: this.videoGameBox!.title,
              systemId: this.videoGameBox!.system.id.toString(),
              isPhysical: this.videoGameBox!.isPhysical,
              isCollection: this.videoGameBox!.isCollection,
              videoGames: [],
              customFieldValues: [...this.videoGameBox!.customFieldValues]
            };
          }
        });
      }
    });
    
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
      systemId: null,
      isPhysical: false,
      isCollection: false,
      videoGames: [],
      customFieldValues: []
    };
    this.editingVideoGameIndex = null;
  }

  onSubmitEditVideoGameBox(): void {
    if (this.isUpdating || !this.editVideoGameBoxData.title || !this.videoGameBox || !this.editVideoGameBoxData.systemId) {
      return;
    }
    
    this.isUpdating = true;
    this.errorMessage = '';
    
    // Process video games similar to the main video game boxes component
    const existingVideoGameIds = this.editVideoGameBoxData.videoGames
      .filter(vg => vg.type === 'existing' && vg.existingVideoGameId)
      .map(vg => parseInt(vg.existingVideoGameId!));
    
    const newVideoGames = this.editVideoGameBoxData.videoGames
      .filter(vg => vg.type === 'new' && vg.title && vg.systemId)
      .map(vg => ({
        title: vg.title!,
        systemId: parseInt(vg.systemId!),
        customFieldValues: vg.customFieldValues
      }));
    
    const videoGameBoxData = {
      title: this.editVideoGameBoxData.title,
      systemId: parseInt(this.editVideoGameBoxData.systemId!),
      isPhysical: this.editVideoGameBoxData.isPhysical,
      isCollection: this.editVideoGameBoxData.isCollection,
      existingVideoGameIds,
      newVideoGames,
      customFieldValues: this.editVideoGameBoxData.customFieldValues
    };
    
    this.apiService.updateVideoGameBox(this.videoGameBox.id, videoGameBoxData).subscribe({
      next: (response) => {
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

  addNewVideoGame(): void {
    this.apiService.getCustomFieldsByEntity('videoGame').subscribe({
      next: (customFields: any[]) => {
        const newVideoGame = {
          type: 'new' as 'existing' | 'new',
          existingVideoGameId: null,
          title: '',
          systemId: null,
          customFieldValues: customFields.map((field: any) => ({
            customFieldId: field.id,
            customFieldName: field.name,
            customFieldType: field.type,
            value: ''
          }))
        };
        this.editVideoGameBoxData.videoGames.push(newVideoGame);
        // Set the newly added video game to editing mode
        this.editingVideoGameIndex = this.editVideoGameBoxData.videoGames.length - 1;
      },
      error: (error: any) => {
        console.error('Error loading custom fields for video game:', error);
        this.editVideoGameBoxData.videoGames.push({
          type: 'new' as 'existing' | 'new',
          existingVideoGameId: null,
          title: '',
          systemId: null,
          customFieldValues: []
        });
        // Set the newly added video game to editing mode
        this.editingVideoGameIndex = this.editVideoGameBoxData.videoGames.length - 1;
      }
    });
  }

  removeVideoGame(index: number): void {
    this.editVideoGameBoxData.videoGames.splice(index, 1);
  }

  isVideoGameSelected(videoGame: any): boolean {
    if (videoGame.type === 'existing') {
      return !!videoGame.existingVideoGameId;
    } else if (videoGame.type === 'new') {
      return !!(videoGame.title && videoGame.title.trim() !== '' && videoGame.systemId);
    }
    return false;
  }

  isVideoGameSelectedAndNotBeingEdited(videoGame: any, index: number): boolean {
    return this.isVideoGameSelected(videoGame) && !this.isVideoGameBeingEdited(index);
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

  editVideoGame(index: number): void {
    this.editingVideoGameIndex = index;
    this.videoGameBackup = JSON.parse(JSON.stringify(this.editVideoGameBoxData.videoGames[index]));
  }

  isVideoGameBeingEdited(index: number): boolean {
    return this.editingVideoGameIndex === index;
  }

  saveVideoGameEdit(index: number): void {
    this.editingVideoGameIndex = null;
    this.videoGameBackup = null;
  }

  cancelVideoGameEdit(index: number): void {
    if (this.editingVideoGameIndex === null) return;

    const videoGame = this.editVideoGameBoxData.videoGames[index];

    if (this.videoGameBackup) {
      const isCompletelyNew = !this.isVideoGameSelected(videoGame) && !this.isVideoGameSelected(this.videoGameBackup);

      if (isCompletelyNew) {
        this.editVideoGameBoxData.videoGames.splice(index, 1);
      } else {
        this.editVideoGameBoxData.videoGames[index] = this.videoGameBackup;
      }
    }

    this.editingVideoGameIndex = null;
    this.videoGameBackup = null;
  }

  confirmDeleteVideoGameBox(): void {
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
  }

  deleteVideoGameBox(): void {
    if (!this.videoGameBox || this.isDeleting) return;

    this.isDeleting = true;

    this.apiService.deleteVideoGameBox(this.videoGameBox.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteConfirmModal();
        // Navigate back to the video game boxes list after successful deletion
        this.router.navigate(['/video-game-boxes']);
      },
      error: (error) => {
        this.errorMessage = `Failed to delete video game box: ${error.message || 'Unknown error'}`;
        this.isDeleting = false;
        this.closeDeleteConfirmModal();
      }
    });
  }
}