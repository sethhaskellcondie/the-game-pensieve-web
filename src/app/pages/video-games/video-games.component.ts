import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, VideoGame, System, VideoGameBox, CustomField } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';
import { SelectableTextInputComponent } from '../../components/selectable-text-input/selectable-text-input.component';
import { FilterService, FilterRequestDto } from '../../services/filter.service';
import { EntityFilterModalComponent } from '../../components/entity-filter-modal/entity-filter-modal.component';
import { SettingsService } from '../../services/settings.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';

@Component({
  selector: 'app-video-games',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent, BooleanDisplayComponent, SelectableTextInputComponent, EntityFilterModalComponent],
  templateUrl: './video-games.component.html',
  styleUrl: './video-games.component.scss'
})
export class VideoGamesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('titleField', { static: false }) titleField: any;
  videoGames: VideoGame[] = [];
  videoGamesCount = 0;
  systems: System[] = [];
  videoGameBoxes: VideoGameBox[] = [];
  availableCustomFields: CustomField[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  isDarkMode = false;
  isMassEditMode = false;
  
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

  // Mass Edit Mode properties
  selectedVideoGames: Set<number> = new Set();
  massEditQueue: VideoGame[] = [];
  isMassEditing = false;
  lastClickedVideoGameIndex: number = -1;
  massEditOriginalTotal = 0;

  constructor(
    private apiService: ApiService, 
    private router: Router, 
    public filterService: FilterService,
    private settingsService: SettingsService,
    private errorSnackbarService: ErrorSnackbarService
  ) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });

    this.settingsService.getMassEditMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(massEditMode => {
        this.isMassEditMode = massEditMode;
        if (!massEditMode) {
          this.clearMassEditSelection();
        }
      });
    
    this.loadVideoGames();
    this.loadSystems();
    this.loadVideoGameBoxes();
    this.loadCustomFields();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    if (this.showEditVideoGameModal) {
      this.closeEditVideoGameModal();
    }
  }

  loadVideoGames(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const activeFilters = this.filterService.getActiveFilters('videoGame');
    const filtersWithDefaults = this.filterService.getFiltersWithDefaults('videoGame', activeFilters);
    
    this.apiService.getVideoGames(filtersWithDefaults).subscribe({
      next: (videoGames) => {
        this.videoGames = videoGames;
        this.videoGamesCount = videoGames.length;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
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
        // Error loading systems
      }
    });
  }

  loadVideoGameBoxes(): void {
    this.apiService.getVideoGameBoxes().subscribe({
      next: (videoGameBoxes) => {
        this.videoGameBoxes = videoGameBoxes;
      },
      error: (error) => {
        // Error loading video game boxes
      }
    });
  }

  loadCustomFields(): void {
    this.apiService.getCustomFieldsByEntity('videoGame').subscribe({
      next: (customFields) => {
        this.availableCustomFields = customFields;
      },
      error: (error) => {
        // Error loading custom fields
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
        this.isUpdating = false;
        
        if (this.isMassEditing) {
          // If in mass edit mode, move to the next video game instead of closing
          this.editNextVideoGameInQueue();
        } else {
          // Normal update flow
          this.closeEditVideoGameModal();
          this.loadVideoGames(); // Refresh the video games list
        }
      },
      error: (error) => {
        this.errorMessage = `Failed to update video game: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
        this.closeEditVideoGameModal(); // Close the modal on error
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

  // Mass Edit Mode Methods
  toggleVideoGameSelection(videoGameId: number, event?: MouseEvent): void {
    const currentVideoGameIndex = this.videoGames.findIndex(game => game.id === videoGameId);
    
    if (event?.shiftKey && this.lastClickedVideoGameIndex >= 0 && currentVideoGameIndex >= 0) {
      // Shift+click range selection
      this.handleRangeSelection(currentVideoGameIndex, videoGameId);
    } else {
      // Normal single selection
      if (this.selectedVideoGames.has(videoGameId)) {
        this.selectedVideoGames.delete(videoGameId);
      } else {
        this.selectedVideoGames.add(videoGameId);
      }
    }
    
    this.lastClickedVideoGameIndex = currentVideoGameIndex;
  }

  private handleRangeSelection(currentIndex: number, clickedVideoGameId: number): void {
    const startIndex = Math.min(this.lastClickedVideoGameIndex, currentIndex);
    const endIndex = Math.max(this.lastClickedVideoGameIndex, currentIndex);
    
    // Determine the state to apply to the range (based on the clicked checkbox state)
    const targetState = !this.selectedVideoGames.has(clickedVideoGameId);
    
    // Apply the same state to all video games in the range
    for (let i = startIndex; i <= endIndex; i++) {
      const videoGame = this.videoGames[i];
      if (targetState) {
        this.selectedVideoGames.add(videoGame.id);
      } else {
        this.selectedVideoGames.delete(videoGame.id);
      }
    }
  }

  isVideoGameSelected(videoGameId: number): boolean {
    return this.selectedVideoGames.has(videoGameId);
  }

  hasSelectedVideoGames(): boolean {
    return this.selectedVideoGames.size > 0;
  }

  isAllVideoGamesSelected(): boolean {
    return this.videoGames.length > 0 && this.selectedVideoGames.size === this.videoGames.length;
  }

  isSomeVideoGamesSelected(): boolean {
    return this.selectedVideoGames.size > 0 && this.selectedVideoGames.size < this.videoGames.length;
  }

  toggleAllVideoGames(): void {
    if (this.isAllVideoGamesSelected()) {
      // Unselect all
      this.selectedVideoGames.clear();
    } else {
      // Select all
      this.videoGames.forEach(game => this.selectedVideoGames.add(game.id));
    }
  }

  public clearMassEditSelection(): void {
    this.selectedVideoGames.clear();
    this.massEditQueue = [];
    this.isMassEditing = false;
    this.lastClickedVideoGameIndex = -1;
    this.massEditOriginalTotal = 0;
  }

  startMassEdit(): void {
    if (this.selectedVideoGames.size === 0) return;
    
    // Build the queue of video games to edit
    this.massEditQueue = this.videoGames.filter(game => this.selectedVideoGames.has(game.id));
    this.massEditOriginalTotal = this.massEditQueue.length;
    this.isMassEditing = true;
    
    // Start editing the first video game
    this.editNextVideoGameInQueue();
  }

  private editNextVideoGameInQueue(): void {
    if (this.massEditQueue.length === 0) {
      // All video games have been edited, clean up
      this.completeMassEdit();
      return;
    }
    
    const videoGameToEdit = this.massEditQueue.shift()!;
    this.openEditVideoGameModal(videoGameToEdit);
  }

  private completeMassEdit(): void {
    this.isMassEditing = false;
    this.clearMassEditSelection();
    this.closeEditVideoGameModal(); // Close the modal
    this.loadVideoGames(); // Refresh the list
    this.errorSnackbarService.showSuccess('Mass edit completed successfully');
  }

  getMassEditProgress(): { current: number; total: number } {
    if (!this.isMassEditing) {
      return { current: 0, total: 0 };
    }
    
    const remaining = this.massEditQueue.length;
    const current = this.massEditOriginalTotal - remaining;
    
    return { current, total: this.massEditOriginalTotal };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
