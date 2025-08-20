import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, BoardGameBox } from '../../services/api.service';

@Component({
  selector: 'app-board-games',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-games.component.html',
  styleUrl: './board-games.component.scss'
})
export class BoardGamesComponent implements OnInit {
  boardGameBoxes: BoardGameBox[] = [];
  isLoading = false;
  errorMessage = '';
  customFieldNames: string[] = [];

  constructor(private apiService: ApiService) {}

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
}
