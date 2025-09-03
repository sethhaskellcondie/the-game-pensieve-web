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
  isDarkMode = false;
  isMassInputMode = false;
  
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
    customFieldValues: [] as any[]
  };

  showDeleteConfirmModal = false;
  boardGameBoxToDelete: BoardGameBox | null = null;
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
    
    this.loadBoardGameBoxes();
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
        console.log('Board game boxes received:', boardGameBoxes);
        console.log('Number of board game boxes:', boardGameBoxes.length);
        this.boardGameBoxes = boardGameBoxes;
        this.boardGameBoxesCount = boardGameBoxes.length;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading board game boxes:', error);
        this.errorMessage = `Failed to load board game boxes: ${error.message || 'Unknown error'}`;
        this.boardGameBoxesCount = 0;
        this.isLoading = false;
      }
    });
  }

  extractCustomFieldNames(): void {
    const fieldNamesSet = new Set<string>();
    
    this.boardGameBoxes.forEach(box => {
      box.customFieldValues.forEach(cfv => {
        fieldNamesSet.add(cfv.customFieldName);
      });
    });
    
    this.customFieldNames = Array.from(fieldNamesSet).sort();
    console.log('Custom field names:', this.customFieldNames);
  }

  getCustomFieldValue(box: BoardGameBox, fieldName: string): string {
    const customField = box.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    return customField ? customField.value : '';
  }

  getBoardGameBoxTitle(baseSetId: number): string {
    const baseSet = this.boardGameBoxes.find(box => box.id === baseSetId);
    return baseSet ? baseSet.title : 'Unknown Base Set';
  }

  openNewBoardGameBoxModal(): void {
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
        console.error('Error loading board games:', error);
      }
    });
    
    // Get custom fields for board game boxes when opening modal
    this.apiService.getCustomFieldsByEntity('boardGameBox').subscribe({
      next: (customFields: any[]) => {
        console.log('Custom fields for board game boxes:', customFields);
        this.newBoardGameBox.customFieldValues = customFields.map((field: any) => ({
          customFieldId: field.id,
          customFieldName: field.name,
          customFieldType: field.type,
          value: field.type === 'boolean' ? 'false' : ''
        }));
      },
      error: (error: any) => {
        console.error('Error loading custom fields:', error);
        this.newBoardGameBox.customFieldValues = [];
      }
    });
    
    // Get custom fields for new board games when opening modal
    this.apiService.getCustomFieldsByEntity('boardGame').subscribe({
      next: (customFields: any[]) => {
        console.log('Custom fields for board games:', customFields);
        this.newBoardGameBox.newBoardGame.customFieldValues = customFields.map((field: any) => ({
          customFieldId: field.id,
          customFieldName: field.name,
          customFieldType: field.type,
          value: field.type === 'boolean' ? 'false' : ''
        }));
      },
      error: (error: any) => {
        console.error('Error loading custom fields for board games:', error);
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

  closeNewBoardGameBoxModal(): void {
    this.showNewBoardGameBoxModal = false;
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
      customFieldValues: []
    };
  }

  onSubmitNewBoardGameBox(): void {
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
    
    const boardGameBoxData = {
      title: this.newBoardGameBox.title,
      isExpansion: this.newBoardGameBox.isExpansion,
      isStandAlone: this.newBoardGameBox.isStandAlone,
      baseSetId: this.newBoardGameBox.baseSetId ? parseInt(this.newBoardGameBox.baseSetId) : null,
      boardGameId: this.boardGameSelectionMode === 'existing' && this.newBoardGameBox.boardGameId ? parseInt(this.newBoardGameBox.boardGameId) : null,
      boardGame: this.boardGameSelectionMode === 'new' ? this.newBoardGameBox.newBoardGame : null,
      customFieldValues: this.newBoardGameBox.customFieldValues
    };
    
    this.apiService.createBoardGameBox(boardGameBoxData).subscribe({
      next: (response) => {
        console.log('Board game box created successfully:', response);
        this.isCreating = false;
        this.closeNewBoardGameBoxModal();
        this.loadBoardGameBoxes(); // Refresh the board game boxes list
      },
      error: (error) => {
        console.error('Error creating board game box:', error);
        this.errorMessage = `Failed to create board game box: ${error.message || 'Unknown error'}`;
        this.isCreating = false;
      }
    });
  }

  onSubmitAndAddAnother(): void {
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
    
    const boardGameBoxData = {
      title: this.newBoardGameBox.title,
      isExpansion: this.newBoardGameBox.isExpansion,
      isStandAlone: this.newBoardGameBox.isStandAlone,
      baseSetId: this.newBoardGameBox.baseSetId ? parseInt(this.newBoardGameBox.baseSetId) : null,
      boardGameId: this.boardGameSelectionMode === 'existing' && this.newBoardGameBox.boardGameId ? parseInt(this.newBoardGameBox.boardGameId) : null,
      boardGame: this.boardGameSelectionMode === 'new' ? this.newBoardGameBox.newBoardGame : null,
      customFieldValues: this.newBoardGameBox.customFieldValues
    };
    
    this.apiService.createBoardGameBox(boardGameBoxData).subscribe({
      next: (response) => {
        console.log('Board game box created successfully:', response);
        this.isCreating = false;
        this.loadBoardGameBoxes(); // Refresh the board game boxes list
        
        // Show success toast
        this.errorSnackbarService.showSuccess('Board Game Box created successfully');
        
        // Clear the title field but keep other fields
        this.newBoardGameBox.title = '';
        if (this.boardGameSelectionMode === 'new') {
          this.newBoardGameBox.newBoardGame.title = '';
        }
        
        // Focus the title input
        this.focusTitleInput();
      },
      error: (error) => {
        console.error('Error creating board game box:', error);
        this.errorMessage = `Failed to create board game box: ${error.message || 'Unknown error'}`;
        this.isCreating = false;
      }
    });
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
        console.log('Board game box deleted successfully');
        this.isDeleting = false;
        this.closeDeleteConfirmModal();
        this.loadBoardGameBoxes();
      },
      error: (error) => {
        console.error('Error deleting board game box:', error);
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
}
