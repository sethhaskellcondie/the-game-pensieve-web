import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, BoardGameBox } from '../../services/api.service';
import { BooleanDisplayComponent } from '../../components/boolean-display/boolean-display.component';

@Component({
  selector: 'app-board-game-box-detail',
  standalone: true,
  imports: [CommonModule, BooleanDisplayComponent],
  templateUrl: './board-game-box-detail.component.html',
  styleUrl: './board-game-box-detail.component.scss'
})
export class BoardGameBoxDetailComponent implements OnInit {
  boardGameBox: BoardGameBox | null = null;
  isLoading = false;
  errorMessage = '';
  boardGameBoxes: BoardGameBox[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
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

  editBoardGameBox(): void {
    // Navigate back to the board game boxes page and somehow trigger edit modal
    // For now, just navigate back - this could be enhanced later
    this.router.navigate(['/board-game-boxes']);
  }
}
