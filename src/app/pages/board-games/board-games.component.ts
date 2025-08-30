import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, BoardGame } from '../../services/api.service';
import { DynamicCustomFieldsComponent } from '../../components/dynamic-custom-fields/dynamic-custom-fields.component';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';

@Component({
  selector: 'app-board-games',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent, BooleanDisplayComponent],
  templateUrl: './board-games.component.html',
  styleUrl: './board-games.component.scss'
})
export class BoardGamesComponent implements OnInit {
  boardGames: BoardGame[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];
  
  showDetailBoardGameModal = false;
  selectedBoardGame: BoardGame | null = null;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadBoardGames();
  }

  loadBoardGames(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getBoardGames().subscribe({
      next: (boardGames) => {
        console.log('Board games received:', boardGames);
        console.log('Number of board games:', boardGames.length);
        this.boardGames = boardGames;
        this.extractCustomFieldNames();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading board games:', error);
        this.errorMessage = `Failed to load board games: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
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
    console.log('Custom field names:', this.customFieldNames);
  }

  getCustomFieldValue(game: BoardGame, fieldName: string): string {
    const customField = game.customFieldValues.find(cfv => cfv.customFieldName === fieldName);
    return customField ? customField.value : '';
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
}