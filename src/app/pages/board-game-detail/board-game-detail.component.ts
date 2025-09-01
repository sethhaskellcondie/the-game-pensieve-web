import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, BoardGame, BoardGameBox } from '../../services/api.service';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { SelectableTextInputComponent } from '../../components/selectable-text-input/selectable-text-input.component';
import { FilterService, FilterRequestDto } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-board-game-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, BooleanDisplayComponent, DynamicCustomFieldsComponent, SelectableTextInputComponent],
  templateUrl: './board-game-detail.component.html',
  styleUrl: './board-game-detail.component.scss'
})
export class BoardGameDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('titleField', { static: false }) titleField: any;
  
  boardGame: BoardGame | null = null;
  boardGameBoxes: BoardGameBox[] = [];
  isLoading = false;
  errorMessage = '';
  isDarkMode = false;
  
  showEditBoardGameModal = false;
  isUpdating = false;
  editBoardGameData = {
    title: '',
    customFieldValues: [] as any[]
  };

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
        this.loadBoardGame(parseInt(id));
        this.loadBoardGameBoxes();
      } else {
        this.router.navigate(['/board-games']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBoardGame(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getBoardGame(id).subscribe({
      next: (boardGame: BoardGame) => {
        this.boardGame = boardGame;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading board game:', error);
        this.errorMessage = `Failed to load board game: ${error.message || 'Unknown error'}`;
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
        console.error('Error loading board game boxes:', error);
      }
    });
  }

  getBoardGameBoxesForGame(): BoardGameBox[] {
    if (!this.boardGame) return [];
    return this.boardGameBoxes.filter(box => box.boardGame?.id === this.boardGame!.id);
  }

  navigateToBoardGameBox(id: number): void {
    this.router.navigate(['/board-game-box', id]);
  }

  navigateToCustomFieldFiltered(customFieldName: string, value: string): void {
    const filter: FilterRequestDto = {
      key: 'boardGame',
      field: customFieldName,
      operator: 'equals',
      operand: value
    };
    
    this.filterService.clearFiltersForEntity('boardGame');
    this.filterService.saveFiltersForEntity('boardGame', [filter]);
    this.router.navigate(['/board-games']);
  }

  openEditBoardGameModal(): void {
    if (!this.boardGame) return;
    
    this.showEditBoardGameModal = true;
    this.editBoardGameData = {
      title: this.boardGame.title,
      customFieldValues: [...this.boardGame.customFieldValues]
    };
    
    // Focus the title field after the view updates
    setTimeout(() => {
      if (this.titleField && this.titleField.focus) {
        this.titleField.focus();
      }
    }, 0);
  }

  closeEditBoardGameModal(): void {
    this.showEditBoardGameModal = false;
    this.editBoardGameData = {
      title: '',
      customFieldValues: []
    };
  }

  onSubmitEditBoardGame(): void {
    if (this.isUpdating || !this.editBoardGameData.title || !this.boardGame) {
      return;
    }
    
    this.isUpdating = true;
    this.errorMessage = '';
    
    const boardGameData = {
      title: this.editBoardGameData.title,
      customFieldValues: this.editBoardGameData.customFieldValues
    };
    
    this.apiService.updateBoardGame(this.boardGame.id, boardGameData).subscribe({
      next: (response) => {
        console.log('Board game updated successfully:', response);
        this.isUpdating = false;
        this.closeEditBoardGameModal();
        this.loadBoardGame(this.boardGame!.id); // Refresh the current board game
      },
      error: (error) => {
        console.error('Error updating board game:', error);
        this.errorMessage = `Failed to update board game: ${error.message || 'Unknown error'}`;
        this.isUpdating = false;
      }
    });
  }

  editBoardGameMethod(): void {
    this.openEditBoardGameModal();
  }
}
