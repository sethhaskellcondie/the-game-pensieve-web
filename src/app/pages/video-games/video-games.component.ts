import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, VideoGame, System, VideoGameBox, CustomField } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';
import { FilterService, FilterRequestDto } from '../../services/filter.service';
import { EntityFilterModalComponent } from '../../components/entity-filter-modal/entity-filter-modal.component';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-video-games',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent, BooleanDisplayComponent, EntityFilterModalComponent],
  templateUrl: './video-games.component.html',
  styleUrl: './video-games.component.scss'
})
export class VideoGamesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  videoGames: VideoGame[] = [];
  videoGamesCount = 0;
  systems: System[] = [];
  videoGameBoxes: VideoGameBox[] = [];
  availableCustomFields: CustomField[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  isDarkMode = false;
  
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
  

  showFilterModal = false;

  constructor(
    private apiService: ApiService, 
    private router: Router, 
    public filterService: FilterService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });
    
    this.loadVideoGames();
    this.loadSystems();
    this.loadVideoGameBoxes();
    this.loadCustomFields();
  }

  loadVideoGames(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const activeFilters = this.filterService.getActiveFilters('videoGame');
    const filtersWithDefaults = this.filterService.getFiltersWithDefaults('videoGame', activeFilters);
    
    this.apiService.getVideoGames(filtersWithDefaults).subscribe({
      next: (videoGames) => {
        console.log('Video games received:', videoGames);
        console.log('Number of video games:', videoGames.length);
        this.videoGames = videoGames;
        this.videoGamesCount = videoGames.length;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading video games:', error);
        this.errorMessage = `Failed to load video games: ${error.message || 'Unknown error'}`;
        this.videoGamesCount = 0;
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

  navigateToDetail(id: number): void {
    this.router.navigate(['/video-game', id]);
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

  loadCustomFields(): void {
    this.apiService.getCustomFieldsByEntity('videoGame').subscribe({
      next: (customFields) => {
        this.availableCustomFields = customFields;
      },
      error: (error) => {
        console.error('Error loading custom fields:', error);
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
      customFieldValues: this.mergeWithDefaultCustomFieldValues(videoGame.customFieldValues)
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

  getCustomFieldType(fieldName: string): string {
    // Check any video game that has this field to determine its type
    for (const game of this.videoGames) {
      const customField = game.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
      if (customField && customField.customFieldType) {
        return customField.customFieldType;
      }
    }
    return 'text'; // default to text if type is unknown
  }

  isCustomFieldBoolean(fieldName: string): boolean {
    return this.getCustomFieldType(fieldName) === 'boolean';
  }

  shouldDisplayCustomField(videoGame: VideoGame, fieldName: string): boolean {
    const customField = videoGame.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    if (!customField) {
      return false;
    }
    
    if (customField.customFieldType === 'boolean') {
      return false;
    }
    
    if (customField.customFieldType === 'text') {
      return customField.value.trim() !== '';
    }
    
    if (customField.customFieldType === 'number') {
      return customField.value.trim() !== '';
    }
    
    return customField.value.trim() !== '';
  }

  shouldDisplayBooleanBadge(videoGame: VideoGame, fieldName: string): boolean {
    const customField = videoGame.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    return customField?.customFieldType === 'boolean';
  }

  shouldDisplayCustomFieldInModal(field: any): boolean {
    if (field.customFieldType === 'boolean') {
      return true;
    }
    
    if (field.customFieldType === 'text') {
      return field.value.trim() !== '';
    }
    
    if (field.customFieldType === 'number') {
      return field.value.trim() !== '';
    }
    
    return field.value.trim() !== '';
  }

  hasDisplayableCustomFields(videoGame: VideoGame): boolean {
    return videoGame.customFieldValues.some(field => this.shouldDisplayCustomFieldInModal(field));
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

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  onFiltersApplied(filters: FilterRequestDto[]): void {
    this.filterService.saveFiltersForEntity('videoGame', filters);
    this.loadVideoGames();
    this.closeFilterModal();
  }

  clearFilters(): void {
    this.filterService.clearFiltersForEntity('videoGame');
    this.loadVideoGames();
  }

  getActiveFilterDisplayText(): string {
    const activeFilters = this.filterService.getActiveFilters('videoGame');
    if (activeFilters.length === 0) return '';
    
    if (activeFilters.length === 1) {
      const filter = activeFilters[0];
      return `${filter.field} ${filter.operator} "${filter.operand}"`;
    }
    
    return `${activeFilters.length} active filters`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
