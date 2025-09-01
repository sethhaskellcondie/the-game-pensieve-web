import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FilterShortcutService, FilterShortcut } from '../../services/filter-shortcut.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { FilterShortcutModalComponent } from '../../components/filter-shortcut-modal/filter-shortcut-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FilterShortcutModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  shortcuts: FilterShortcut[] = [];
  isDarkMode = false;
  showCreateModal = false;

  constructor(
    private filterShortcutService: FilterShortcutService,
    private filterService: FilterService,
    private router: Router,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });

    this.filterShortcutService.shortcuts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(shortcuts => {
        this.shortcuts = shortcuts;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onShortcutClick(shortcut: FilterShortcut): void {
    const entityType = this.getEntityTypeFromPage(shortcut.targetPage);
    
    this.filterService.clearFiltersForEntity(entityType);
    if (shortcut.filters.length > 0) {
      this.filterService.saveFiltersForEntity(entityType, shortcut.filters);
    }
    
    this.router.navigate([shortcut.targetPage]);
  }

  deleteShortcut(shortcut: FilterShortcut, event: Event): void {
    event.stopPropagation();
    
    if (confirm(`Are you sure you want to delete "${shortcut.name}"?`)) {
      this.filterShortcutService.deleteShortcut(shortcut.id).subscribe({
        next: (success) => {
          if (success) {
            console.log('Shortcut deleted successfully');
          }
        },
        error: (error) => {
          console.error('Error deleting shortcut:', error);
        }
      });
    }
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  getPageDisplayName(page: string): string {
    const pageDisplayMap: { [key: string]: string } = {
      '/video-games': 'Video Games',
      '/video-game-boxes': 'Video Game Boxes',
      '/board-games': 'Board Games',
      '/board-game-boxes': 'Board Game Boxes',
      '/systems': 'Systems',
      '/toys': 'Toys'
    };
    return pageDisplayMap[page] || page;
  }

  private getEntityTypeFromPage(page: string): string {
    const pageMap: { [key: string]: string } = {
      '/video-games': 'videoGame',
      '/video-game-boxes': 'videoGameBox',
      '/board-games': 'boardGame',
      '/board-game-boxes': 'boardGameBox',
      '/systems': 'system',
      '/toys': 'toy'
    };
    return pageMap[page] || 'videoGameBox';
  }
}
