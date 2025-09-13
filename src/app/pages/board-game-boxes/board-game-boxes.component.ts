import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, BoardGameBox, BoardGame } from '../../services/api.service';
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
  selector: 'app-board-game-boxes',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent, BooleanDisplayComponent, CustomCheckboxComponent, SelectableTextInputComponent, FilterableDropdownComponent, EntityFilterModalComponent],
  templateUrl: './board-game-boxes.component.html',
  styleUrl: './board-game-boxes.component.scss'
})
export class BoardGameBoxesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('titleField', { static: false }) titleField: any;
  
  boardGameBoxes: BoardGameBox[] = [];
  boardGameBoxesCount = 0;
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  availableCustomFields: any[] = [];
  isDarkMode = false;
  isMassInputMode = false;
  isMassEditMode = false;
  
  showNewBoardGameBoxModal = false;
  isCreating = false;
  boardGameBoxesForDropdown: BoardGameBox[] = [];
  boardGamesForDropdown: BoardGame[] = [];
  boardGameSelectionMode: 'existing' | 'new' | 'self-contained' = 'self-contained';
  
  get boardGameOptions(): DropdownOption[] {
    return this.boardGamesForDropdown.map(game => ({
      value: game.id.toString(),
      label: game.title
    }));
  }
  
  get baseSetOptions(): DropdownOption[] {
    return this.boardGameBoxesForDropdown.map(box => ({
      value: box.id.toString(),
      label: box.title
    }));
  }
  newBoardGameBox = {
    title: '',
    isExpansion: false,
    isStandAlone: true,
    baseSetId: null as string | null,
    boardGameId: null as string | null,
    newBoardGame: {
      title: '',
      customFieldValues: [] as any[]
    },
    selfContainedBoardGame: {
      title: '',
      customFieldValues: [] as any[]
    },
    customFieldValues: [] as any[]
  };

  showDeleteConfirmModal = false;
  boardGameBoxToDelete: BoardGameBox | null = null;
  isDeleting = false;
  showFilterModal = false;

  // Mass Edit Mode properties
  selectedBoardGameBoxes: Set<number> = new Set();
  massEditQueue: BoardGameBox[] = [];
  isMassEditing = false;
  lastClickedBoardGameBoxIndex: number = -1;
  isUpdateMode = false;
  boardGameBoxToUpdate: BoardGameBox | null = null;

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
    
    this.loadBoardGameBoxes();
    this.loadCustomFields();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    if (this.showNewBoardGameBoxModal) {
      this.closeNewBoardGameBoxModal();
    }
  }

  loadBoardGameBoxes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const activeFilters = this.filterService.getActiveFilters('boardGameBox');
    const filtersWithDefaults = this.filterService.getFiltersWithDefaults('boardGameBox', activeFilters);
    
    this.apiService.getBoardGameBoxes(filtersWithDefaults).subscribe({
      next: (boardGameBoxes) => {
        this.boardGameBoxes = boardGameBoxes;
        this.boardGameBoxesCount = boardGameBoxes.length;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = `Failed to load board game boxes: ${error.message || 'Unknown error'}`;
        this.boardGameBoxesCount = 0;
        this.isLoading = false;
      }
    });
  }

  loadCustomFields(): void {
    this.apiService.getCustomFieldsByEntity('boardGameBox').subscribe({
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

  createDefaultBoardGameCustomFieldValues(boardGameCustomFields: any[]): any[] {
    return boardGameCustomFields.map(field => ({
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
    
    this.boardGameBoxes.forEach(box => {
      box.customFieldValues.forEach(cfv => {
        fieldNamesSet.add(cfv.customFieldName);
      });
    });
    
    this.customFieldNames = Array.from(fieldNamesSet).sort();
  }

  getCustomFieldValue(box: BoardGameBox, fieldName: string): string {
    const customField = box.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    return customField ? customField.value : '';
  }

  shouldDisplayCustomField(box: BoardGameBox, fieldName: string): boolean {
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

  shouldDisplayBooleanBadge(box: BoardGameBox, fieldName: string): boolean {
    const customField = box.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    if (!customField) {
      return false; // Don't display badge if no custom field value exists
    }
    
    const fieldType = this.getCustomFieldType(fieldName);
    return fieldType === 'boolean'; // Only show badge if it's actually a boolean field and has a value
  }

  getBoardGameBoxTitle(baseSetId: number): string {
    const baseSet = this.boardGameBoxes.find(box => box.id === baseSetId);
    return baseSet ? baseSet.title : 'Unknown Base Set';
  }

  openNewBoardGameBoxModal(): void {
    this.isUpdateMode = false;
    this.boardGameBoxToUpdate = null;
    this.showNewBoardGameBoxModal = true;
    this.boardGameSelectionMode = 'self-contained';
    
    // Load board game boxes for the base set dropdown
    this.boardGameBoxesForDropdown = [...this.boardGameBoxes];
    
    // Load existing board games for the dropdown
    this.apiService.getBoardGames().subscribe({
      next: (boardGames) => {
        this.boardGamesForDropdown = boardGames;
      },
      error: (error) => {
        // Error loading board games
      }
    });
    
    // Set default custom field values for board game boxes
    this.newBoardGameBox.customFieldValues = this.createDefaultCustomFieldValues();
    
    // Only load custom fields for new board games when opening modal (not for self-contained)
    this.apiService.getCustomFieldsByEntity('boardGame').subscribe({
      next: (customFields: any[]) => {
        // Set up custom fields for new board games (create new mode)
        this.newBoardGameBox.newBoardGame.customFieldValues = customFields.map((field: any) => ({
          customFieldId: field.id,
          customFieldName: field.name,
          customFieldType: field.type,
          value: field.type === 'boolean' ? 'false' : ''
        }));
      },
      error: (error: any) => {
        this.newBoardGameBox.newBoardGame.customFieldValues = [];
      }
    });
    
    // Focus the title field after the view updates
    setTimeout(() => {
      if (this.titleField && this.titleField.focus) {
        this.titleField.focus();
      }
    }, 0);
  }

  openUpdateBoardGameBoxModal(boardGameBox: BoardGameBox): void {
    this.isUpdateMode = true;
    this.boardGameBoxToUpdate = boardGameBox;
    this.showNewBoardGameBoxModal = true;
    
    // Determine board game selection mode based on existing data
    if (boardGameBox.boardGame) {
      this.boardGameSelectionMode = 'existing';
    } else {
      this.boardGameSelectionMode = 'self-contained';
    }
    
    // Load board game boxes for the base set dropdown
    this.boardGameBoxesForDropdown = [...this.boardGameBoxes];
    
    // Load existing board games for the dropdown
    this.apiService.getBoardGames().subscribe({
      next: (boardGames) => {
        this.boardGamesForDropdown = boardGames;
      },
      error: (error) => {
        // Error loading board games
      }
    });
    
    // Populate form with existing data
    this.newBoardGameBox = {
      title: boardGameBox.title,
      isExpansion: boardGameBox.isExpansion,
      isStandAlone: boardGameBox.isStandAlone,
      baseSetId: boardGameBox.baseSetId ? boardGameBox.baseSetId.toString() : null,
      boardGameId: boardGameBox.boardGame ? boardGameBox.boardGame.id.toString() : null,
      newBoardGame: {
        title: '',
        customFieldValues: []
      },
      selfContainedBoardGame: {
        title: '',
        customFieldValues: []
      },
      customFieldValues: this.mergeWithDefaultCustomFieldValues(boardGameBox.customFieldValues)
    };
    
    // Focus the title field after the view updates
    setTimeout(() => {
      if (this.titleField && this.titleField.focus) {
        this.titleField.focus();
      }
    }, 0);
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

  private loadSelfContainedCustomFields(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.apiService.getCustomFieldsByEntity('boardGame').subscribe({
        next: (customFields: any[]) => {
          const defaultValues = this.createDefaultBoardGameCustomFieldValues(customFields);
          resolve(defaultValues);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  }

  private async prepareBoardGameForSubmission(): Promise<any> {
    switch (this.boardGameSelectionMode) {
      case 'new':
        return this.newBoardGameBox.newBoardGame;
      case 'self-contained':
        // Load custom fields on demand for self-contained games
        try {
          const customFieldValues = await this.loadSelfContainedCustomFields();
          return {
            title: this.newBoardGameBox.title,
            customFieldValues: customFieldValues
          };
        } catch (error) {
          throw new Error('Failed to load custom fields for self-contained board game');
        }
      case 'existing':
      default:
        return null;
    }
  }

  closeNewBoardGameBoxModal(): void {
    this.showNewBoardGameBoxModal = false;
    this.isUpdateMode = false;
    this.boardGameBoxToUpdate = null;
    this.boardGameSelectionMode = 'self-contained';
    this.newBoardGameBox = {
      title: '',
      isExpansion: false,
      isStandAlone: false,
      baseSetId: null,
      boardGameId: null,
      newBoardGame: {
        title: '',
        customFieldValues: []
      },
      selfContainedBoardGame: {
        title: '',
        customFieldValues: []
      },
      customFieldValues: []
    };
  }

  async onSubmitNewBoardGameBox(): Promise<void> {
    if (this.isCreating || !this.newBoardGameBox.title) {
      return;
    }
    
    // Validate based on board game selection mode
    if (this.boardGameSelectionMode === 'existing' && !this.newBoardGameBox.boardGameId) {
      this.errorMessage = 'Please select an existing board game.';
      return;
    }
    
    if (this.boardGameSelectionMode === 'new' && !this.newBoardGameBox.newBoardGame.title) {
      this.errorMessage = 'Please enter a title for the new board game.';
      return;
    }
    
    this.isCreating = true;
    this.errorMessage = '';
    
    try {
      const boardGame = await this.prepareBoardGameForSubmission();
      
      const boardGameBoxData = {
        title: this.newBoardGameBox.title,
        isExpansion: this.newBoardGameBox.isExpansion,
        isStandAlone: this.newBoardGameBox.isStandAlone,
        baseSetId: this.newBoardGameBox.baseSetId ? parseInt(this.newBoardGameBox.baseSetId) : null,
        boardGameId: this.boardGameSelectionMode === 'existing' && this.newBoardGameBox.boardGameId ? parseInt(this.newBoardGameBox.boardGameId) : null,
        boardGame: boardGame,
        customFieldValues: this.newBoardGameBox.customFieldValues
      };
      
      if (this.isUpdateMode && this.boardGameBoxToUpdate) {
        // Update existing board game box
        this.apiService.updateBoardGameBox(this.boardGameBoxToUpdate.id, boardGameBoxData).subscribe({
          next: (response) => {
            this.isCreating = false;
            
            if (this.isMassEditing) {
              // If in mass edit mode, move to the next board game box instead of closing
              this.editNextBoardGameBoxInQueue();
            } else {
              // Normal update flow
              this.closeNewBoardGameBoxModal();
              this.loadBoardGameBoxes(); // Refresh the board game boxes list
            }
          },
          error: (error) => {
            this.errorMessage = `Failed to update board game box: ${error.message || 'Unknown error'}`;
            this.isCreating = false;
            this.closeNewBoardGameBoxModal(); // Close the modal on error
          }
        });
      } else {
        // Create new board game box
        this.apiService.createBoardGameBox(boardGameBoxData).subscribe({
          next: (response) => {
            this.isCreating = false;
            this.closeNewBoardGameBoxModal();
            this.loadBoardGameBoxes(); // Refresh the board game boxes list
          },
          error: (error) => {
            this.errorMessage = `Failed to create board game box: ${error.message || 'Unknown error'}`;
            this.isCreating = false;
          }
        });
      }
    } catch (error) {
      this.errorMessage = 'Failed to load custom fields for board game.';
      this.isCreating = false;
    }
  }

  async onSubmitAndAddAnother(): Promise<void> {
    if (this.isCreating || !this.newBoardGameBox.title) {
      return;
    }
    
    // Validate based on board game selection mode
    if (this.boardGameSelectionMode === 'existing' && !this.newBoardGameBox.boardGameId) {
      this.errorMessage = 'Please select an existing board game.';
      return;
    }
    
    if (this.boardGameSelectionMode === 'new' && !this.newBoardGameBox.newBoardGame.title) {
      this.errorMessage = 'Please enter a title for the new board game.';
      return;
    }
    
    this.isCreating = true;
    this.errorMessage = '';
    
    try {
      const boardGame = await this.prepareBoardGameForSubmission();
      
      const boardGameBoxData = {
        title: this.newBoardGameBox.title,
        isExpansion: this.newBoardGameBox.isExpansion,
        isStandAlone: this.newBoardGameBox.isStandAlone,
        baseSetId: this.newBoardGameBox.baseSetId ? parseInt(this.newBoardGameBox.baseSetId) : null,
        boardGameId: this.boardGameSelectionMode === 'existing' && this.newBoardGameBox.boardGameId ? parseInt(this.newBoardGameBox.boardGameId) : null,
        boardGame: boardGame,
        customFieldValues: this.newBoardGameBox.customFieldValues
      };
      
      this.apiService.createBoardGameBox(boardGameBoxData).subscribe({
        next: (response) => {
          this.isCreating = false;
          this.loadBoardGameBoxes(); // Refresh the board game boxes list
          
          // Show success toast
          this.errorSnackbarService.showSuccess('Board Game Box created successfully');
          
          // Clear the title field but reset custom field values to defaults
          this.newBoardGameBox.title = '';
          this.newBoardGameBox.customFieldValues = this.createDefaultCustomFieldValues();
          
          if (this.boardGameSelectionMode === 'new') {
            this.newBoardGameBox.newBoardGame.title = '';
            // Reset new board game custom fields if needed
            this.apiService.getCustomFieldsByEntity('boardGame').subscribe({
              next: (customFields: any[]) => {
                this.newBoardGameBox.newBoardGame.customFieldValues = customFields.map((field: any) => ({
                  customFieldId: field.id,
                  customFieldName: field.name,
                  customFieldType: field.type,
                  value: this.getDefaultValueForType(field.type)
                }));
              },
              error: () => {
                this.newBoardGameBox.newBoardGame.customFieldValues = [];
              }
            });
          }
          // Note: No need to reset self-contained custom fields since they're loaded on-demand
          
          // Focus the title input
          this.focusTitleInput();
        },
        error: (error) => {
          this.errorMessage = `Failed to create board game box: ${error.message || 'Unknown error'}`;
          this.isCreating = false;
        }
      });
    } catch (error) {
      this.errorMessage = 'Failed to load custom fields for board game.';
      this.isCreating = false;
    }
  }

  private focusTitleInput(): void {
    setTimeout(() => {
      if (this.titleField && this.titleField.focus) {
        this.titleField.focus();
      }
    }, 100);
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/board-game-box', id]);
  }



  swapView(): void {
    this.router.navigate(['/board-games']);
  }

  onExpansionChange(isExpansion: boolean, isEdit: boolean = false): void {
    if (!isExpansion) {
      // Clear base set selection when expansion is unchecked
      this.newBoardGameBox.baseSetId = null;
    }
  }

  confirmDeleteBoardGameBox(boardGameBox: BoardGameBox): void {
    this.boardGameBoxToDelete = boardGameBox;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.boardGameBoxToDelete = null;
  }

  deleteBoardGameBox(): void {
    if (!this.boardGameBoxToDelete || this.isDeleting) return;

    this.isDeleting = true;

    this.apiService.deleteBoardGameBox(this.boardGameBoxToDelete.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteConfirmModal();
        this.loadBoardGameBoxes();
      },
      error: (error) => {
        this.errorMessage = `Failed to delete board game box: ${error.message || 'Unknown error'}`;
        this.isDeleting = false;
      }
    });
  }

  getCustomFieldType(fieldName: string): string {
    // Check any board game box that has this field to determine its type
    for (const box of this.boardGameBoxes) {
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

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  onFiltersApplied(filters: FilterRequestDto[]): void {
    this.filterService.saveFiltersForEntity('boardGameBox', filters);
    this.loadBoardGameBoxes();
    this.closeFilterModal();
  }

  clearFilters(): void {
    this.filterService.clearFiltersForEntity('boardGameBox');
    this.loadBoardGameBoxes();
  }

  getActiveFilterDisplayText(): string {
    const activeFilters = this.filterService.getActiveFilters('boardGameBox');
    if (activeFilters.length === 0) return '';
    
    if (activeFilters.length === 1) {
      const filter = activeFilters[0];
      return `${filter.field} ${filter.operator} "${filter.operand}"`;
    }
    
    return `${activeFilters.length} active filters`;
  }

  // Mass Edit Mode Methods
  toggleBoardGameBoxSelection(boardGameBoxId: number, event?: MouseEvent): void {
    const currentBoardGameBoxIndex = this.boardGameBoxes.findIndex(box => box.id === boardGameBoxId);
    
    if (event?.shiftKey && this.lastClickedBoardGameBoxIndex >= 0 && currentBoardGameBoxIndex >= 0) {
      // Shift+click range selection
      this.handleRangeSelection(currentBoardGameBoxIndex, boardGameBoxId);
    } else {
      // Normal single selection
      if (this.selectedBoardGameBoxes.has(boardGameBoxId)) {
        this.selectedBoardGameBoxes.delete(boardGameBoxId);
      } else {
        this.selectedBoardGameBoxes.add(boardGameBoxId);
      }
    }
    
    this.lastClickedBoardGameBoxIndex = currentBoardGameBoxIndex;
  }

  private handleRangeSelection(currentIndex: number, clickedBoardGameBoxId: number): void {
    const startIndex = Math.min(this.lastClickedBoardGameBoxIndex, currentIndex);
    const endIndex = Math.max(this.lastClickedBoardGameBoxIndex, currentIndex);
    
    // Determine the state to apply to the range (based on the clicked checkbox state)
    const targetState = !this.selectedBoardGameBoxes.has(clickedBoardGameBoxId);
    
    // Apply the same state to all board game boxes in the range
    for (let i = startIndex; i <= endIndex; i++) {
      const boardGameBox = this.boardGameBoxes[i];
      if (targetState) {
        this.selectedBoardGameBoxes.add(boardGameBox.id);
      } else {
        this.selectedBoardGameBoxes.delete(boardGameBox.id);
      }
    }
  }

  isBoardGameBoxSelected(boardGameBoxId: number): boolean {
    return this.selectedBoardGameBoxes.has(boardGameBoxId);
  }

  hasSelectedBoardGameBoxes(): boolean {
    return this.selectedBoardGameBoxes.size > 0;
  }

  isAllBoardGameBoxesSelected(): boolean {
    return this.boardGameBoxes.length > 0 && this.selectedBoardGameBoxes.size === this.boardGameBoxes.length;
  }

  isSomeBoardGameBoxesSelected(): boolean {
    return this.selectedBoardGameBoxes.size > 0 && this.selectedBoardGameBoxes.size < this.boardGameBoxes.length;
  }

  toggleAllBoardGameBoxes(): void {
    if (this.isAllBoardGameBoxesSelected()) {
      // Unselect all
      this.selectedBoardGameBoxes.clear();
    } else {
      // Select all
      this.boardGameBoxes.forEach(box => this.selectedBoardGameBoxes.add(box.id));
    }
  }

  public clearMassEditSelection(): void {
    this.selectedBoardGameBoxes.clear();
    this.massEditQueue = [];
    this.isMassEditing = false;
    this.lastClickedBoardGameBoxIndex = -1;
  }

  startMassEdit(): void {
    if (this.selectedBoardGameBoxes.size === 0) return;
    
    // Build the queue of board game boxes to edit
    this.massEditQueue = this.boardGameBoxes.filter(box => this.selectedBoardGameBoxes.has(box.id));
    this.isMassEditing = true;
    
    // Start editing the first board game box
    this.editNextBoardGameBoxInQueue();
  }

  private editNextBoardGameBoxInQueue(): void {
    if (this.massEditQueue.length === 0) {
      // All board game boxes have been edited, clean up
      this.completeMassEdit();
      return;
    }
    
    const boardGameBoxToEdit = this.massEditQueue.shift()!;
    this.openUpdateBoardGameBoxModal(boardGameBoxToEdit);
  }

  private completeMassEdit(): void {
    this.isMassEditing = false;
    this.clearMassEditSelection();
    this.closeNewBoardGameBoxModal(); // Close the modal
    this.loadBoardGameBoxes(); // Refresh the list
    this.errorSnackbarService.showSuccess('Mass edit completed successfully');
  }
}
