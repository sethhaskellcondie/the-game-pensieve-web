import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, BoardGameBox, BoardGame } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';

@Component({
  selector: 'app-board-game-boxes',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent],
  templateUrl: './board-game-boxes.component.html',
  styleUrl: './board-game-boxes.component.scss'
})
export class BoardGameBoxesComponent implements OnInit {
  boardGameBoxes: BoardGameBox[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  
  showDetailBoardGameBoxModal = false;
  showEditBoardGameBoxModal = false;
  showNewBoardGameBoxModal = false;
  selectedBoardGameBox: BoardGameBox | null = null;
  boardGameBoxToUpdate: BoardGameBox | null = null;
  isCreating = false;
  isUpdating = false;
  boardGameBoxesForDropdown: BoardGameBox[] = [];
  boardGamesForDropdown: BoardGame[] = [];
  boardGameSelectionMode: 'existing' | 'new' | 'self-contained' = 'self-contained';
  newBoardGameBox = {
    title: '',
    isExpansion: false,
    isStandAlone: false,
    baseSetId: null as number | null,
    boardGameId: null as number | null,
    newBoardGame: {
      title: '',
      customFieldValues: [] as any[]
    },
    customFieldValues: [] as any[]
  };
  editBoardGameBox = {
    title: '',
    isExpansion: false,
    isStandAlone: false,
    baseSetId: null as number | null,
    boardGameId: null as number | null,
    newBoardGame: {
      title: '',
      customFieldValues: [] as any[]
    },
    customFieldValues: [] as any[]
  };

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadBoardGameBoxes();
  }

  loadBoardGameBoxes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getBoardGameBoxes().subscribe({
      next: (boardGameBoxes) => {
        console.log('Board game boxes received:', boardGameBoxes);
        console.log('Number of board game boxes:', boardGameBoxes.length);
        this.boardGameBoxes = boardGameBoxes;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading board game boxes:', error);
        this.errorMessage = `Failed to load board game boxes: ${error.message || 'Unknown error'}`;
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
      baseSetId: this.newBoardGameBox.baseSetId,
      boardGameId: this.boardGameSelectionMode === 'existing' ? this.newBoardGameBox.boardGameId : null,
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

  openDetailBoardGameBoxModal(boardGameBox: BoardGameBox): void {
    this.selectedBoardGameBox = boardGameBox;
    this.showDetailBoardGameBoxModal = true;
  }

  closeDetailBoardGameBoxModal(): void {
    this.showDetailBoardGameBoxModal = false;
    this.selectedBoardGameBox = null;
  }

  openEditBoardGameBoxModal(boardGameBox: BoardGameBox): void {
    this.boardGameBoxToUpdate = boardGameBox;
    this.showEditBoardGameBoxModal = true;
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
    
    this.editBoardGameBox = {
      title: boardGameBox.title,
      isExpansion: boardGameBox.isExpansion,
      isStandAlone: boardGameBox.isStandAlone,
      baseSetId: boardGameBox.baseSetId ?? null,
      boardGameId: boardGameBox.boardGame?.id ?? null,
      newBoardGame: {
        title: '',
        customFieldValues: []
      },
      customFieldValues: [...boardGameBox.customFieldValues]
    };
  }

  closeEditBoardGameBoxModal(): void {
    this.showEditBoardGameBoxModal = false;
    this.boardGameBoxToUpdate = null;
    this.editBoardGameBox = {
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

  openEditFromDetail(): void {
    if (this.selectedBoardGameBox) {
      const boardGameBoxToEdit = this.selectedBoardGameBox;
      this.closeDetailBoardGameBoxModal();
      this.openEditBoardGameBoxModal(boardGameBoxToEdit);
    }
  }

  openDetailFromEdit(): void {
    if (this.boardGameBoxToUpdate) {
      const boardGameBoxToDetail = this.boardGameBoxToUpdate;
      this.closeEditBoardGameBoxModal();
      this.openDetailBoardGameBoxModal(boardGameBoxToDetail);
    }
  }

  onSubmitEditBoardGameBox(): void {
    if (this.isUpdating || !this.editBoardGameBox.title || !this.boardGameBoxToUpdate) {
      return;
    }
    
    this.isUpdating = true;
    this.errorMessage = '';
    
    const boardGameBoxData = {
      title: this.editBoardGameBox.title,
      isExpansion: this.editBoardGameBox.isExpansion,
      isStandAlone: this.editBoardGameBox.isStandAlone,
      baseSetId: this.editBoardGameBox.baseSetId ? parseInt(this.editBoardGameBox.baseSetId.toString()) : null,
      boardGameId: this.editBoardGameBox.boardGameId ? parseInt(this.editBoardGameBox.boardGameId.toString()) : null,
      customFieldValues: this.editBoardGameBox.customFieldValues
    };
    
    this.apiService.updateBoardGameBox(this.boardGameBoxToUpdate.id, boardGameBoxData).subscribe({
      next: (response) => {
        console.log('Board game box updated successfully:', response);
        this.isUpdating = false;
        this.closeEditBoardGameBoxModal();
        this.loadBoardGameBoxes(); // Refresh the board game boxes list
      },
      error: (error) => {
        console.error('Error updating board game box:', error);
        this.errorMessage = `Failed to update board game box: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
      }
    });
  }

  swapView(): void {
    this.router.navigate(['/board-games']);
  }

  onExpansionChange(isExpansion: boolean, isEdit: boolean = false): void {
    if (!isExpansion) {
      // Clear base set selection when expansion is unchecked
      if (isEdit) {
        this.editBoardGameBox.baseSetId = null;
      } else {
        this.newBoardGameBox.baseSetId = null;
      }
    }
  }
}
