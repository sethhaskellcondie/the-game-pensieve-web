import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, BoardGame } from '../../services/api.service';

@Component({
  selector: 'app-board-games-individual',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-games-individual.component.html',
  styleUrl: './board-games-individual.component.scss'
})
export class BoardGamesIndividualComponent implements OnInit {
  boardGames: BoardGame[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];

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

  swapView(): void {
    this.router.navigate(['/board-games']);
  }
}