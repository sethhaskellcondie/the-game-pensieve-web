import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, BoardGame } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';
import { SelectableTextInputComponent } from '../../components/selectable-text-input/selectable-text-input.component';
import { FilterService, FilterRequestDto } from '../../services/filter.service';
import { EntityFilterModalComponent } from '../../components/entity-filter-modal/entity-filter-modal.component';
import { SettingsService } from '../../services/settings.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';

@Component({
  selector: 'app-board-games',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent, BooleanDisplayComponent, SelectableTextInputComponent, EntityFilterModalComponent],
  templateUrl: './board-games.component.html',
  styleUrl: './board-games.component.scss'
})
export class BoardGamesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('titleField', { static: false }) titleField: any;
  boardGames: BoardGame[] = [];
  boardGamesCount = 0;
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  availableCustomFields: any[] = [];
  isDarkMode = false;
  isMassEditMode = false;
  
  showDetailBoardGameModal = false;
  showEditBoardGameModal = false;
  isUpdating = false;
  selectedBoardGame: BoardGame | null = null;
  boardGameToUpdate: BoardGame | null = null;
  editBoardGame = {
    title: '',
    customFieldValues: [] as any[]
  };
  showFilterModal = false;

  // Mass Edit Mode properties
  selectedBoardGames: Set<number> = new Set();
  massEditQueue: BoardGame[] = [];
  isMassEditing = false;
  lastClickedBoardGameIndex: number = -1;

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
    
    this.loadBoardGames();
    this.loadCustomFields();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    if (this.showEditBoardGameModal) {
      this.closeEditBoardGameModal();
    }
  }

  loadBoardGames(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const activeFilters = this.filterService.getActiveFilters('boardGame');
    const filtersWithDefaults = this.filterService.getFiltersWithDefaults('boardGame', activeFilters);
    
    this.apiService.getBoardGames(filtersWithDefaults).subscribe({
      next: (boardGames) => {
        this.boardGames = boardGames;
        this.boardGamesCount = boardGames.length;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = `Failed to load board games: ${error.message || 'Unknown error'}`;
        this.boardGamesCount = 0;
        this.isLoading = false;
      }
    });
  }

  loadCustomFields(): void {
    this.apiService.getCustomFieldsByEntity('boardGame').subscribe({
      next: (fields) => {
        this.availableCustomFields = fields;
      },
      error: (error) => {
        this.availableCustomFields = [];
      }
    });
  }

  extractCustomFieldNames(): void {
    const fieldNamesSet = new Set<string>();
    
    this.boardGames.forEach(game => {
      game.customFieldValues.forEach(cfv => {
        fieldNamesSet.add(cfv.customFieldName);
      });
    });
    
    this.customFieldNames = Array.from(fieldNamesSet).sort();
  }

  getCustomFieldValue(game: BoardGame, fieldName: string): string {
    const customField = game.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    return customField ? customField.value : '';
  }

  shouldDisplayCustomField(game: BoardGame, fieldName: string): boolean {
    const customField = game.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
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

  shouldDisplayBooleanBadge(game: BoardGame, fieldName: string): boolean {
    const customField = game.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    if (!customField) {
      return false; // Don't display badge if no custom field value exists
    }
    
    const fieldType = this.getCustomFieldType(fieldName);
    return fieldType === 'boolean'; // Only show badge if it's actually a boolean field and has a value
  }

  shouldDisplayCustomFieldInModal(field: any): boolean {
    // For boolean fields, always display the badge if the field exists
    if (field.customFieldType === 'boolean') {
      return true;
    }
    
    // For text fields, only display if there's a non-empty value
    if (field.customFieldType === 'text') {
      return field.value !== '';
    }
    
    // For number fields, display if there's any value (including 0)
    if (field.customFieldType === 'number') {
      return field.value !== '';
    }
    
    // Default to displaying if we're unsure about the type
    return field.value !== '';
  }

  hasDisplayableCustomFields(boardGame: BoardGame): boolean {
    return boardGame.customFieldValues.some(field => this.shouldDisplayCustomFieldInModal(field));
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/board-game', id]);
  }

  openDetailBoardGameModal(boardGame: BoardGame): void {
    this.selectedBoardGame = boardGame;
    this.showDetailBoardGameModal = true;
  }

  closeDetailBoardGameModal(): void {
    this.showDetailBoardGameModal = false;
    this.selectedBoardGame = null;
  }

  openEditFromDetail(): void {
    if (this.selectedBoardGame) {
      const boardGameToEdit = this.selectedBoardGame;
      this.closeDetailBoardGameModal();
      this.openEditBoardGameModal(boardGameToEdit);
    }
  }

  openDetailFromEdit(): void {
    if (this.boardGameToUpdate) {
      const boardGameToDetail = this.boardGameToUpdate;
      this.closeEditBoardGameModal();
      this.openDetailBoardGameModal(boardGameToDetail);
    }
  }

  openEditBoardGameModal(boardGame: BoardGame): void {
    this.boardGameToUpdate = boardGame;
    this.showEditBoardGameModal = true;
    this.editBoardGame = {
      title: boardGame.title,
      customFieldValues: this.mergeWithDefaultCustomFieldValues(boardGame.customFieldValues)
    };
  }

  closeEditBoardGameModal(): void {
    this.showEditBoardGameModal = false;
    this.boardGameToUpdate = null;
    this.editBoardGame = {
      title: '',
      customFieldValues: [] as any[]
    };
  }

  onSubmitEditBoardGame(): void {
    if (this.isUpdating || !this.editBoardGame.title || !this.boardGameToUpdate) {
      return;
    }
    
    this.isUpdating = true;
    
    const boardGameData = {
      title: this.editBoardGame.title,
      customFieldValues: this.editBoardGame.customFieldValues
    };
    
    this.apiService.updateBoardGame(this.boardGameToUpdate.id, boardGameData).subscribe({
      next: (response) => {
        this.isUpdating = false;
        
        if (this.isMassEditing) {
          // If in mass edit mode, move to the next board game instead of closing
          this.editNextBoardGameInQueue();
        } else {
          // Normal update flow
          this.closeEditBoardGameModal();
          this.loadBoardGames(); // Refresh the board games list
        }
      },
      error: (error) => {
        this.errorMessage = `Failed to update board game: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
        this.closeEditBoardGameModal(); // Close the modal on error
      }
    });
  }


  swapView(): void {
    this.router.navigate(['/board-game-boxes']);
  }

  getCustomFieldType(fieldName: string): string {
    // Check any board game that has this field to determine its type
    for (const game of this.boardGames) {
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

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  onFiltersApplied(filters: FilterRequestDto[]): void {
    this.filterService.saveFiltersForEntity('boardGame', filters);
    this.loadBoardGames();
    this.closeFilterModal();
  }

  clearFilters(): void {
    this.filterService.clearFiltersForEntity('boardGame');
    this.loadBoardGames();
  }

  getActiveFilterDisplayText(): string {
    const activeFilters = this.filterService.getActiveFilters('boardGame');
    if (activeFilters.length === 0) return '';
    
    if (activeFilters.length === 1) {
      const filter = activeFilters[0];
      return `${filter.field} ${filter.operator} "${filter.operand}"`;
    }
    
    return `${activeFilters.length} active filters`;
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

  // Mass Edit Mode Methods
  toggleBoardGameSelection(boardGameId: number, event?: MouseEvent): void {
    const currentBoardGameIndex = this.boardGames.findIndex(game => game.id === boardGameId);
    
    if (event?.shiftKey && this.lastClickedBoardGameIndex >= 0 && currentBoardGameIndex >= 0) {
      // Shift+click range selection
      this.handleRangeSelection(currentBoardGameIndex, boardGameId);
    } else {
      // Normal single selection
      if (this.selectedBoardGames.has(boardGameId)) {
        this.selectedBoardGames.delete(boardGameId);
      } else {
        this.selectedBoardGames.add(boardGameId);
      }
    }
    
    this.lastClickedBoardGameIndex = currentBoardGameIndex;
  }

  private handleRangeSelection(currentIndex: number, clickedBoardGameId: number): void {
    const startIndex = Math.min(this.lastClickedBoardGameIndex, currentIndex);
    const endIndex = Math.max(this.lastClickedBoardGameIndex, currentIndex);
    
    // Determine the state to apply to the range (based on the clicked checkbox state)
    const targetState = !this.selectedBoardGames.has(clickedBoardGameId);
    
    // Apply the same state to all board games in the range
    for (let i = startIndex; i <= endIndex; i++) {
      const boardGame = this.boardGames[i];
      if (targetState) {
        this.selectedBoardGames.add(boardGame.id);
      } else {
        this.selectedBoardGames.delete(boardGame.id);
      }
    }
  }

  isBoardGameSelected(boardGameId: number): boolean {
    return this.selectedBoardGames.has(boardGameId);
  }

  hasSelectedBoardGames(): boolean {
    return this.selectedBoardGames.size > 0;
  }

  isAllBoardGamesSelected(): boolean {
    return this.boardGames.length > 0 && this.selectedBoardGames.size === this.boardGames.length;
  }

  isSomeBoardGamesSelected(): boolean {
    return this.selectedBoardGames.size > 0 && this.selectedBoardGames.size < this.boardGames.length;
  }

  toggleAllBoardGames(): void {
    if (this.isAllBoardGamesSelected()) {
      // Unselect all
      this.selectedBoardGames.clear();
    } else {
      // Select all
      this.boardGames.forEach(game => this.selectedBoardGames.add(game.id));
    }
  }

  public clearMassEditSelection(): void {
    this.selectedBoardGames.clear();
    this.massEditQueue = [];
    this.isMassEditing = false;
    this.lastClickedBoardGameIndex = -1;
  }

  startMassEdit(): void {
    if (this.selectedBoardGames.size === 0) return;
    
    // Build the queue of board games to edit
    this.massEditQueue = this.boardGames.filter(game => this.selectedBoardGames.has(game.id));
    this.isMassEditing = true;
    
    // Start editing the first board game
    this.editNextBoardGameInQueue();
  }

  private editNextBoardGameInQueue(): void {
    if (this.massEditQueue.length === 0) {
      // All board games have been edited, clean up
      this.completeMassEdit();
      return;
    }
    
    const boardGameToEdit = this.massEditQueue.shift()!;
    this.openEditBoardGameModal(boardGameToEdit);
  }

  private completeMassEdit(): void {
    this.isMassEditing = false;
    this.clearMassEditSelection();
    this.closeEditBoardGameModal(); // Close the modal
    this.loadBoardGames(); // Refresh the list
    this.errorSnackbarService.showSuccess('Mass edit completed successfully');
  }
}