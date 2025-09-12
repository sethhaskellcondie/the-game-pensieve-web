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
import { FilterService, FilterRequestDto } from '../../services/filter.service';
import { EntityFilterModalComponent } from '../../components/entity-filter-modal/entity-filter-modal.component';
import { SettingsService } from '../../services/settings.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';

@Component({
  selector: 'app-video-game-boxes',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent, BooleanDisplayComponent, CustomCheckboxComponent, EntityFilterModalComponent],
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
  
  showDetailVideoGameBoxModal = false;
  showNewVideoGameBoxModal = false;
  isCreating = false;
  isUpdateMode = false;
  selectedVideoGameBox: VideoGameBox | null = null;
  videoGameBoxToUpdate: VideoGameBox | null = null;
  allVideoGames: VideoGame[] = [];
  editingVideoGameIndex: number | null = null;
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

  showDeleteConfirmModal = false;
  videoGameBoxToDelete: VideoGameBox | null = null;
  isDeleting = false;
  showFilterModal = false;

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
          systemId: videoGameBox.system.id,
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
          systemId: videoGameBox.system.id,
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
    if (this.isCreating || !this.newVideoGameBox.title || this.newVideoGameBox.systemId === null) {
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
      // Updating video game box
      // Update existing video game box
      this.apiService.updateVideoGameBox(this.videoGameBoxToUpdate.id, videoGameBoxData).subscribe({
        next: (response) => {
          this.isCreating = false;
          this.closeNewVideoGameBoxModal();
          this.loadVideoGameBoxes(); // Refresh the video game boxes list
        },
        error: (error) => {
          this.errorMessage = `Failed to update video game box: ${error.message || 'Unknown error'}`;
          this.isCreating = false;
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
    if (this.isCreating || !this.newVideoGameBox.title || this.newVideoGameBox.systemId === null || !this.hasAtLeastOneValidVideoGame()) {
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
    
    this.apiService.createVideoGameBox(videoGameBoxData).subscribe({
      next: (response) => {
        this.isCreating = false;
        this.loadVideoGameBoxes();
        
        this.errorSnackbarService.showSuccess('Video Game Box created successfully');
        
        // Clear the title field but reset custom field values to defaults
        this.newVideoGameBox.title = '';
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
        },
        error: (error: any) => {
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
    this.editingVideoGameIndex = index;
  }

  isVideoGameBeingEdited(index: number): boolean {
    return this.editingVideoGameIndex === index;
  }

  saveVideoGameEdit(index: number): void {
    this.editingVideoGameIndex = null;
  }

  cancelVideoGameEdit(index: number): void {
    this.editingVideoGameIndex = null;
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
    const activeFilters = this.filterService.getActiveFilters('videoGameBox');
    if (activeFilters.length === 0) return '';
    
    if (activeFilters.length === 1) {
      const filter = activeFilters[0];
      return `${filter.field} ${filter.operator} "${filter.operand}"`;
    }
    
    return `${activeFilters.length} active filters`;
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
}