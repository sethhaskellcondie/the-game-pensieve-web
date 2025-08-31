import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, BoardGame, BoardGameBox } from '../../services/api.service';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { CustomCheckboxComponent } from '../../components/custom-checkbox/custom-checkbox.component';
import { SelectableTextInputComponent } from '../../components/selectable-text-input/selectable-text-input.component';
import { FilterableDropdownComponent, DropdownOption } from '../../components/filterable-dropdown/filterable-dropdown.component';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-board-game-box-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, BooleanDisplayComponent, DynamicCustomFieldsComponent, CustomCheckboxComponent, SelectableTextInputComponent, FilterableDropdownComponent],
  templateUrl: './board-game-box-detail.component.html',
  styleUrl: './board-game-box-detail.component.scss'
})
export class BoardGameBoxDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('titleField', { static: false }) titleField: any;
  
  boardGameBox: BoardGameBox | null = null;
  isLoading = false;
  errorMessage = '';
  boardGameBoxes: BoardGameBox[] = [];
  isDarkMode = false;
  
  showEditBoardGameBoxModal = false;
  isUpdating = false;
  boardGameBoxesForDropdown: BoardGameBox[] = [];
  boardGamesForDropdown: BoardGame[] = [];
  
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
  
  editBoardGameBoxData = {
    title: '',
    isExpansion: false,
    isStandAlone: false,
    baseSetId: null as string | null,
    boardGameId: null as string | null,
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
        this.loadBoardGameBox(parseInt(id));
        this.loadBoardGameBoxes();
      } else {
        this.router.navigate(['/board-game-boxes']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBoardGameBox(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getBoardGameBox(id).subscribe({
      next: (boardGameBox: BoardGameBox) => {
        this.boardGameBox = boardGameBox;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading board game box:', error);
        this.errorMessage = `Failed to load board game box: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  loadBoardGameBoxes(): void {
    this.apiService.getBoardGameBoxes().subscribe({
      next: (boardGameBoxes: BoardGameBox[]) => {
        this.boardGameBoxes = boardGameBoxes;
      },
      error: (error: any) => {
        console.error('Error loading board game boxes for base set lookup:', error);
      }
    });
  }

  getBoardGameBoxTitle(baseSetId: number): string {
    const baseSet = this.boardGameBoxes.find(box => box.id === baseSetId);
    return baseSet ? baseSet.title : 'Unknown Base Set';
  }


  navigateToBaseSet(baseSetId: number): void {
    this.router.navigate(['/board-game-box', baseSetId]);
  }

  navigateToBoardGame(boardGameId: number): void {
    this.router.navigate(['/board-game', boardGameId]);
  }

  openEditBoardGameBoxModal(): void {
    if (!this.boardGameBox) return;
    
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
    
    this.editBoardGameBoxData = {
      title: this.boardGameBox.title,
      isExpansion: this.boardGameBox.isExpansion,
      isStandAlone: this.boardGameBox.isStandAlone,
      baseSetId: this.boardGameBox.baseSetId ? this.boardGameBox.baseSetId.toString() : null,
      boardGameId: this.boardGameBox.boardGame?.id ? this.boardGameBox.boardGame.id.toString() : null,
      customFieldValues: [...this.boardGameBox.customFieldValues]
    };
    
    // Focus the title field after the view updates
    setTimeout(() => {
      if (this.titleField && this.titleField.focus) {
        this.titleField.focus();
      }
    }, 0);
  }

  closeEditBoardGameBoxModal(): void {
    this.showEditBoardGameBoxModal = false;
    this.editBoardGameBoxData = {
      title: '',
      isExpansion: false,
      isStandAlone: false,
      baseSetId: null,
      boardGameId: null,
      customFieldValues: []
    };
  }

  onSubmitEditBoardGameBox(): void {
    if (this.isUpdating || !this.editBoardGameBoxData.title || !this.boardGameBox) {
      return;
    }
    
    this.isUpdating = true;
    this.errorMessage = '';
    
    const boardGameBoxData = {
      title: this.editBoardGameBoxData.title,
      isExpansion: this.editBoardGameBoxData.isExpansion,
      isStandAlone: this.editBoardGameBoxData.isStandAlone,
      baseSetId: this.editBoardGameBoxData.baseSetId ? parseInt(this.editBoardGameBoxData.baseSetId.toString()) : null,
      boardGameId: this.editBoardGameBoxData.boardGameId ? parseInt(this.editBoardGameBoxData.boardGameId.toString()) : null,
      customFieldValues: this.editBoardGameBoxData.customFieldValues
    };
    
    this.apiService.updateBoardGameBox(this.boardGameBox.id, boardGameBoxData).subscribe({
      next: (response) => {
        console.log('Board game box updated successfully:', response);
        this.isUpdating = false;
        this.closeEditBoardGameBoxModal();
        this.loadBoardGameBox(this.boardGameBox!.id); // Refresh the current board game box
      },
      error: (error) => {
        console.error('Error updating board game box:', error);
        this.errorMessage = `Failed to update board game box: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
      }
    });
  }

  onExpansionChange(isExpansion: boolean): void {
    if (!isExpansion) {
      this.editBoardGameBoxData.baseSetId = null;
    }
  }

  editBoardGameBox(): void {
    this.openEditBoardGameBoxModal();
  }
}
