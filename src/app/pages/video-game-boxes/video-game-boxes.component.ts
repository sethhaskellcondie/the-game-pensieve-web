import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, VideoGameBox, System, VideoGame } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';
import { CustomCheckboxComponent } from '../../components/custom-checkbox/custom-checkbox.component';
import { SelectableTextInputComponent } from '../../components/selectable-text-input/selectable-text-input.component';
import { FilterableDropdownComponent, DropdownOption } from '../../components/filterable-dropdown/filterable-dropdown.component';
import { FilterService, FilterRequestDto } from '../../services/filter.service';
import { EntityFilterModalComponent } from '../../components/entity-filter-modal/entity-filter-modal.component';
import { SettingsService } from '../../services/settings.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';

@Component({
  selector: 'app-video-game-boxes',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent, BooleanDisplayComponent, CustomCheckboxComponent, SelectableTextInputComponent, FilterableDropdownComponent, EntityFilterModalComponent],
  templateUrl: './video-game-boxes.component.html',
  styleUrl: './video-game-boxes.component.scss'
})
export class VideoGameBoxesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('titleField', { static: false }) titleField: any;
  
  videoGameBoxes: VideoGameBox[] = [];
  videoGameBoxesCount = 0;
  systems: System[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  availableCustomFields: any[] = [];
  isDarkMode = false;
  isMassInputMode = false;
  isMassEditMode = false;
  
  showDetailVideoGameBoxModal = false;
  showNewVideoGameBoxModal = false;
  isCreating = false;
  isUpdateMode = false;
  selectedVideoGameBox: VideoGameBox | null = null;
  videoGameBoxToUpdate: VideoGameBox | null = null;
  allVideoGames: VideoGame[] = [];
  editingVideoGameIndex: number | null = null;
  videoGameBackup: any = null;

  get videoGameOptions(): DropdownOption[] {
    return this.allVideoGames.map(game => ({
      value: game.id.toString(),
      label: `${game.title} (${game.system.name})`
    }));
  }

  get systemOptions(): DropdownOption[] {
    return this.systems.map(system => ({
      value: system.id.toString(),
      label: `${system.name} (Gen ${system.generation})`
    }));
  }

  newVideoGameBox = {
    title: '',
    systemId: null as string | null,
    isPhysical: false,
    isCollection: false,
    videoGames: [] as { 
      type: 'existing' | 'new';
      existingVideoGameId?: number | null;
      title?: string; 
      systemId?: string | null; 
      customFieldValues: any[] 
    }[],
    customFieldValues: [] as any[]
  };

  showDeleteConfirmModal = false;
  videoGameBoxToDelete: VideoGameBox | null = null;
  isDeleting = false;
  showFilterModal = false;

  // Mass Edit Mode properties
  selectedVideoGameBoxes: Set<number> = new Set();
  massEditQueue: VideoGameBox[] = [];
  isMassEditing = false;
  lastClickedVideoGameBoxIndex: number = -1;
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

    this.settingsService.getMassInputMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(massInputMode => {
        this.isMassInputMode = massInputMode;
      });

    this.settingsService.getMassEditMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(massEditMode => {
        this.isMassEditMode = massEditMode;
        if (!massEditMode) {
          this.clearMassEditSelection();
        }
      });
    
    this.loadVideoGameBoxes();
    this.loadSystems();
    this.loadCustomFields();
  }

  loadVideoGameBoxes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const activeFilters = this.filterService.getActiveFilters('videoGameBox');
    const filtersWithDefaults = this.filterService.getFiltersWithDefaults('videoGameBox', activeFilters);
    
    this.apiService.getVideoGameBoxes(filtersWithDefaults).subscribe({
      next: (videoGameBoxes) => {
        this.videoGameBoxes = videoGameBoxes;
        this.videoGameBoxesCount = videoGameBoxes.length;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = `Failed to load video game boxes: ${error.message || 'Unknown error'}`;
        this.videoGameBoxesCount = 0;
        this.isLoading = false;
      }
    });
  }

  loadCustomFields(): void {
    this.apiService.getCustomFieldsByEntity('videoGameBox').subscribe({
      next: (fields) => {
        this.availableCustomFields = fields;
      },
      error: (error) => {
        this.availableCustomFields = [];
      }
    });
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

  extractCustomFieldNames(): void {
    const fieldNamesSet = new Set<string>();
    
    this.videoGameBoxes.forEach(box => {
      box.customFieldValues.forEach(cfv => {
        fieldNamesSet.add(cfv.customFieldName);
      });
    });
    
    this.customFieldNames = Array.from(fieldNamesSet).sort();
  }

  getCustomFieldValue(box: VideoGameBox, fieldName: string): string {
    const customField = box.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    return customField ? customField.value : '';
  }

  shouldDisplayCustomField(box: VideoGameBox, fieldName: string): boolean {
    const customField = box.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    if (!customField) {
      return false; // Don't display anything if no custom field value exists
    }

    const fieldType = this.getCustomFieldType(fieldName);
    
    // For boolean fields, don't display if no value exists
    if (fieldType === 'boolean') {
      return false; // We'll handle boolean display separately
    }
    
    // For text fields, only display if there's a non-empty value
    if (fieldType === 'text') {
      return customField.value !== '';
    }
    
    // For number fields, display if there's any value (including 0)
    if (fieldType === 'number') {
      return customField.value !== '';
    }
    
    return false;
  }

  shouldDisplayBooleanBadge(box: VideoGameBox, fieldName: string): boolean {
    const customField = box.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    if (!customField) {
      return false; // Don't display badge if no custom field value exists
    }
    
    const fieldType = this.getCustomFieldType(fieldName);
    return fieldType === 'boolean'; // Only show badge if it's actually a boolean field and has a value
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/video-game-box', id]);
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
        // Error loading video games
      }
    });
    
    this.newVideoGameBox = {
      title: '',
      systemId: null,
      isPhysical: false,
      isCollection: false,
      videoGames: [],
      customFieldValues: this.createDefaultCustomFieldValues()
    };
  }

  openUpdateVideoGameBoxModal(videoGameBox: VideoGameBox): void {
    this.isUpdateMode = true;
    this.videoGameBoxToUpdate = videoGameBox;
    this.showNewVideoGameBoxModal = true;
    
    // Opening edit modal for video game box
    
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
        
        // Ensure we have merged custom field values with all defaults
        const mergedCustomFieldValues = this.mergeWithDefaultCustomFieldValues(videoGameBox.customFieldValues);
        
        this.newVideoGameBox = {
          title: videoGameBox.title,
          systemId: videoGameBox.system.id.toString(),
          isPhysical: videoGameBox.isPhysical,
          isCollection: videoGameBox.isCollection,
          videoGames: existingVideoGames,
          customFieldValues: mergedCustomFieldValues
        };
        
        // Set newVideoGameBox.customFieldValues
      },
      error: (error) => {
        console.error('Error loading video games:', error);
        
        // Ensure we have merged custom field values with all defaults
        const mergedCustomFieldValues = this.mergeWithDefaultCustomFieldValues(videoGameBox.customFieldValues);
        
        this.newVideoGameBox = {
          title: videoGameBox.title,
          systemId: videoGameBox.system.id.toString(),
          isPhysical: videoGameBox.isPhysical,
          isCollection: videoGameBox.isCollection,
          videoGames: [],
          customFieldValues: mergedCustomFieldValues
        };
        
        // Set newVideoGameBox.customFieldValues (error case)
      }
    });
  }

  closeNewVideoGameBoxModal(): void {
    this.showNewVideoGameBoxModal = false;
    this.isUpdateMode = false;
    this.videoGameBoxToUpdate = null;
    this.editingVideoGameIndex = null;
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
    if (this.isCreating || !this.newVideoGameBox.title || !this.newVideoGameBox.systemId) {
      return;
    }

    // For new video game boxes (not updates), require at least one video game
    if (!this.isUpdateMode && !this.hasAtLeastOneValidVideoGame()) {
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
        systemId: parseInt(game.systemId!),
        customFieldValues: game.customFieldValues
      }));
    
    const videoGameBoxData = {
      title: this.newVideoGameBox.title,
      systemId: parseInt(this.newVideoGameBox.systemId!),
      isPhysical: this.newVideoGameBox.isPhysical,
      isCollection: this.newVideoGameBox.isCollection,
      existingVideoGameIds: existingVideoGameIds,
      newVideoGames: newVideoGames,
      customFieldValues: this.newVideoGameBox.customFieldValues
    };
    
    if (this.isUpdateMode && this.videoGameBoxToUpdate) {
      // Updating video game box
      // Update existing video game box
      this.apiService.updateVideoGameBox(this.videoGameBoxToUpdate.id, videoGameBoxData).subscribe({
        next: (response) => {
          this.isCreating = false;
          
          if (this.isMassEditing) {
            // If in mass edit mode, move to the next video game box instead of closing
            this.editNextVideoGameBoxInQueue();
          } else {
            // Normal update flow
            this.closeNewVideoGameBoxModal();
            this.loadVideoGameBoxes(); // Refresh the video game boxes list
          }
        },
        error: (error) => {
          this.errorMessage = `Failed to update video game box: ${error.message || 'Unknown error'}`;
          this.isCreating = false;
          this.closeNewVideoGameBoxModal(); // Close the modal on error
        }
      });
    } else {
      // Create new video game box
      this.apiService.createVideoGameBox(videoGameBoxData).subscribe({
        next: (response) => {
          this.isCreating = false;
          this.closeNewVideoGameBoxModal();
          this.loadVideoGameBoxes(); // Refresh the video game boxes list
        },
        error: (error) => {
          this.errorMessage = `Failed to create video game box: ${error.message || 'Unknown error'}`;
          this.isCreating = false;
        }
      });
    }
  }

  onSubmitAndAddAnother(): void {
    if (this.isCreating || !this.newVideoGameBox.title || !this.newVideoGameBox.systemId || !this.hasAtLeastOneValidVideoGame()) {
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
        systemId: parseInt(game.systemId!),
        customFieldValues: game.customFieldValues
      }));
    
    const videoGameBoxData = {
      title: this.newVideoGameBox.title,
      systemId: parseInt(this.newVideoGameBox.systemId!),
      isPhysical: this.newVideoGameBox.isPhysical,
      isCollection: this.newVideoGameBox.isCollection,
      existingVideoGameIds: existingVideoGameIds,
      newVideoGames: newVideoGames,
      customFieldValues: this.newVideoGameBox.customFieldValues
    };
    
    this.apiService.createVideoGameBox(videoGameBoxData).subscribe({
      next: (response) => {
        this.isCreating = false;
        this.loadVideoGameBoxes();

        // Refresh the video games dropdown list for the next input
        this.apiService.getVideoGames().subscribe({
          next: (videoGames) => {
            this.allVideoGames = videoGames;
          }
        });

        this.errorSnackbarService.showSuccess('Video Game Box created successfully');

        // Clear the title field, video games list, and reset custom field values to defaults
        this.newVideoGameBox.title = '';
        this.newVideoGameBox.videoGames = [];
        this.newVideoGameBox.customFieldValues = this.createDefaultCustomFieldValues();

        this.focusTitleInput();
      },
      error: (error) => {
        this.errorMessage = `Failed to create video game box: ${error.message || 'Unknown error'}`;
        this.isCreating = false;
      }
    });
  }

  private focusTitleInput(): void {
    setTimeout(() => {
      if (this.titleField && this.titleField.focus) {
        this.titleField.focus();
      } else {
        const titleInput = document.querySelector('#title') as HTMLInputElement;
        if (titleInput) {
          titleInput.focus();
        }
      }
    }, 100);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    if (this.showNewVideoGameBoxModal) {
      this.closeNewVideoGameBoxModal();
    } else if (this.showDetailVideoGameBoxModal) {
      this.closeDetailVideoGameBoxModal();
    } else if (this.showDeleteConfirmModal) {
      this.closeDeleteConfirmModal();
    } else if (this.showFilterModal) {
      this.closeFilterModal();
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
    // Default to 'existing' type when in update mode, 'new' when creating
    const defaultType = this.isUpdateMode ? 'existing' : 'new';
    
    if (defaultType === 'existing') {
      // For existing type, no need to load custom fields
      this.newVideoGameBox.videoGames.push({
        type: 'existing' as 'existing' | 'new',
        existingVideoGameId: null,
        title: undefined,
        systemId: undefined,
        customFieldValues: []
      });
      // Set the newly added video game to editing mode
      this.editingVideoGameIndex = this.newVideoGameBox.videoGames.length - 1;
    } else {
      // For new type, load custom fields but leave them empty for manual entry
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
              value: this.getDefaultValueForType(field.type) // Use default values
            }))
          };
          this.newVideoGameBox.videoGames.push(newVideoGame);
          // Set the newly added video game to editing mode
          this.editingVideoGameIndex = this.newVideoGameBox.videoGames.length - 1;
        },
        error: (error: any) => {
          this.newVideoGameBox.videoGames.push({
            type: 'new' as 'existing' | 'new',
            existingVideoGameId: null,
            title: this.newVideoGameBox.title,
            systemId: this.newVideoGameBox.systemId,
            customFieldValues: []
          });
          // Set the newly added video game to editing mode
          this.editingVideoGameIndex = this.newVideoGameBox.videoGames.length - 1;
        }
      });
    }
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

  editVideoGame(index: number): void {
    // Create a deep copy backup of the current video game state
    this.videoGameBackup = JSON.parse(JSON.stringify(this.newVideoGameBox.videoGames[index]));
    this.editingVideoGameIndex = index;
  }

  isVideoGameBeingEdited(index: number): boolean {
    return this.editingVideoGameIndex === index;
  }

  saveVideoGameEdit(index: number): void {
    // Clear editing state and backup when saving
    this.editingVideoGameIndex = null;
    this.videoGameBackup = null;
  }

  cancelVideoGameEdit(index: number): void {
    // Check if this is a completely new video game that should be removed
    const videoGame = this.newVideoGameBox.videoGames[index];
    const isCompletelyNew = !this.isVideoGameSelected(videoGame) && this.videoGameBackup && !this.isVideoGameSelected(this.videoGameBackup);

    if (isCompletelyNew) {
      // Remove the new video game entirely
      this.newVideoGameBox.videoGames.splice(index, 1);
    } else {
      // Restore the video game to its previous state from backup
      if (this.videoGameBackup !== null && this.editingVideoGameIndex !== null) {
        this.newVideoGameBox.videoGames[this.editingVideoGameIndex] = JSON.parse(JSON.stringify(this.videoGameBackup));
      }
    }

    // Clear editing state
    this.editingVideoGameIndex = null;
    this.videoGameBackup = null;
  }

  confirmDeleteVideoGameBox(videoGameBox: VideoGameBox): void {
    this.videoGameBoxToDelete = videoGameBox;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.videoGameBoxToDelete = null;
  }

  deleteVideoGameBox(): void {
    if (!this.videoGameBoxToDelete || this.isDeleting) return;

    this.isDeleting = true;

    this.apiService.deleteVideoGameBox(this.videoGameBoxToDelete.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteConfirmModal();
        this.loadVideoGameBoxes();
      },
      error: (error) => {
        this.errorMessage = `Failed to delete video game box: ${error.message || 'Unknown error'}`;
        this.isDeleting = false;
      }
    });
  }

  getCustomFieldType(fieldName: string): string {
    // Check any video game box that has this field to determine its type
    for (const box of this.videoGameBoxes) {
      const customField = box.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
      if (customField && customField.customFieldType) {
        return customField.customFieldType;
      }
    }
    return 'text'; // default to text if type is unknown
  }

  isCustomFieldBoolean(fieldName: string): boolean {
    return this.getCustomFieldType(fieldName) === 'boolean';
  }

  hasAtLeastOneValidVideoGame(): boolean {
    if (this.newVideoGameBox.videoGames.length === 0) {
      return false;
    }

    return this.newVideoGameBox.videoGames.some(videoGame => {
      if (videoGame.type === 'existing') {
        return !!videoGame.existingVideoGameId;
      } else if (videoGame.type === 'new') {
        return !!(videoGame.title && videoGame.title.trim() !== '' && videoGame.systemId);
      }
      return false;
    });
  }

  isFormCompletelyValid(ngForm: any): boolean {
    if (!ngForm || !ngForm.valid) {
      return false;
    }

    // For new video game boxes, require at least one video game
    if (!this.isUpdateMode) {
      return this.hasAtLeastOneValidVideoGame();
    }

    // For updates, basic form validity is sufficient
    return true;
  }

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  onFiltersApplied(filters: FilterRequestDto[]): void {
    this.filterService.saveFiltersForEntity('videoGameBox', filters);
    this.loadVideoGameBoxes();
    this.closeFilterModal();
  }

  clearFilters(): void {
    this.filterService.clearFiltersForEntity('videoGameBox');
    this.loadVideoGameBoxes();
  }

  getActiveFilterDisplayText(): string {
    return this.filterService.getFilterDisplayText('videoGameBox');
  }

  private mergeWithDefaultCustomFieldValues(existingCustomFieldValues: any[]): any[] {
    const defaultValues = this.createDefaultCustomFieldValues();
    
    // Merging custom field values
    
    // Create a map of existing values for quick lookup
    const existingValuesMap = new Map();
    existingCustomFieldValues.forEach(existingValue => {
      existingValuesMap.set(existingValue.customFieldId, existingValue);
    });
    
    // Merge defaults with existing values, preferring existing values when they exist
    const mergedValues = defaultValues.map(defaultValue => {
      const existingValue = existingValuesMap.get(defaultValue.customFieldId);
      return existingValue || defaultValue;
    });
    
    // Merged custom field values result
    return mergedValues;
  }

  onCustomFieldValuesChange(newValues: any[]): void {
    this.newVideoGameBox.customFieldValues = newValues;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Mass Edit Mode Methods
  toggleVideoGameBoxSelection(videoGameBoxId: number, event?: MouseEvent): void {
    const currentVideoGameBoxIndex = this.videoGameBoxes.findIndex(box => box.id === videoGameBoxId);
    
    if (event?.shiftKey && this.lastClickedVideoGameBoxIndex >= 0 && currentVideoGameBoxIndex >= 0) {
      // Shift+click range selection
      this.handleRangeSelection(currentVideoGameBoxIndex, videoGameBoxId);
    } else {
      // Normal single selection
      if (this.selectedVideoGameBoxes.has(videoGameBoxId)) {
        this.selectedVideoGameBoxes.delete(videoGameBoxId);
      } else {
        this.selectedVideoGameBoxes.add(videoGameBoxId);
      }
    }
    
    this.lastClickedVideoGameBoxIndex = currentVideoGameBoxIndex;
  }

  private handleRangeSelection(currentIndex: number, clickedVideoGameBoxId: number): void {
    const startIndex = Math.min(this.lastClickedVideoGameBoxIndex, currentIndex);
    const endIndex = Math.max(this.lastClickedVideoGameBoxIndex, currentIndex);
    
    // Determine the state to apply to the range (based on the clicked checkbox state)
    const targetState = !this.selectedVideoGameBoxes.has(clickedVideoGameBoxId);
    
    // Apply the same state to all video game boxes in the range
    for (let i = startIndex; i <= endIndex; i++) {
      const videoGameBox = this.videoGameBoxes[i];
      if (targetState) {
        this.selectedVideoGameBoxes.add(videoGameBox.id);
      } else {
        this.selectedVideoGameBoxes.delete(videoGameBox.id);
      }
    }
  }

  isVideoGameBoxSelected(videoGameBoxId: number): boolean {
    return this.selectedVideoGameBoxes.has(videoGameBoxId);
  }

  hasSelectedVideoGameBoxes(): boolean {
    return this.selectedVideoGameBoxes.size > 0;
  }

  isAllVideoGameBoxesSelected(): boolean {
    return this.videoGameBoxes.length > 0 && this.selectedVideoGameBoxes.size === this.videoGameBoxes.length;
  }

  isSomeVideoGameBoxesSelected(): boolean {
    return this.selectedVideoGameBoxes.size > 0 && this.selectedVideoGameBoxes.size < this.videoGameBoxes.length;
  }

  toggleAllVideoGameBoxes(): void {
    if (this.isAllVideoGameBoxesSelected()) {
      // Unselect all
      this.selectedVideoGameBoxes.clear();
    } else {
      // Select all
      this.videoGameBoxes.forEach(box => this.selectedVideoGameBoxes.add(box.id));
    }
  }

  public clearMassEditSelection(): void {
    this.selectedVideoGameBoxes.clear();
    this.massEditQueue = [];
    this.isMassEditing = false;
    this.lastClickedVideoGameBoxIndex = -1;
    this.massEditOriginalTotal = 0;
  }

  startMassEdit(): void {
    if (this.selectedVideoGameBoxes.size === 0) return;
    
    // Build the queue of video game boxes to edit
    this.massEditQueue = this.videoGameBoxes.filter(box => this.selectedVideoGameBoxes.has(box.id));
    this.massEditOriginalTotal = this.massEditQueue.length;
    this.isMassEditing = true;
    
    // Start editing the first video game box
    this.editNextVideoGameBoxInQueue();
  }

  private editNextVideoGameBoxInQueue(): void {
    if (this.massEditQueue.length === 0) {
      // All video game boxes have been edited, clean up
      this.completeMassEdit();
      return;
    }
    
    const videoGameBoxToEdit = this.massEditQueue.shift()!;
    this.openUpdateVideoGameBoxModal(videoGameBoxToEdit);
  }

  private completeMassEdit(): void {
    this.isMassEditing = false;
    this.clearMassEditSelection();
    this.closeNewVideoGameBoxModal(); // Close the modal
    this.loadVideoGameBoxes(); // Refresh the list
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

  navigateToOptions(): void {
    this.router.navigate(['/options']);
  }
}