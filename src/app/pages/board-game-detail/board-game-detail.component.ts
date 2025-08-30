import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, BoardGame, BoardGameBox } from '../../services/api.service';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';

@Component({
  selector: 'app-board-game-detail',
  standalone: true,
  imports: [CommonModule, BooleanDisplayComponent],
  templateUrl: './board-game-detail.component.html',
  styleUrl: './board-game-detail.component.scss'
})
export class BoardGameDetailComponent implements OnInit {
  boardGame: BoardGame | null = null;
  boardGameBoxes: BoardGameBox[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
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

  editBoardGame(): void {
    this.router.navigate(['/board-games']);
  }
}
