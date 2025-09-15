import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FilterShortcutService, FilterShortcut } from '../../services/filter-shortcut.service';
import { GoalService, Goal } from '../../services/goal.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { IconService } from '../../services/icon.service';
import { ApiService } from '../../services/api.service';
import { FilterShortcutModalComponent } from '../../components/filter-shortcut-modal/filter-shortcut-modal.component';
import { GoalModalComponent } from '../../components/goal-modal/goal-modal.component';
import { GoalSectionComponent } from '../../components/goal-section/goal-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FilterShortcutModalComponent, GoalModalComponent, GoalSectionComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  goals: Goal[] = [];
  shortcuts: FilterShortcut[] = [];
  uncategorizedShortcuts: FilterShortcut[] = [];
  expandedGoals: Set<string> = new Set();
  isDarkMode = false;
  
  // Display mode for shortcuts
  showCounts = false;
  shortcutCounts: Map<string, number> = new Map();
  loadingCounts = false;
  
  // Modal states
  showCreateShortcutModal = false;
  showEditShortcutModal = false;
  showCreateGoalModal = false;
  showEditGoalModal = false;
  
  // Editing objects
  editingShortcut: FilterShortcut | null = null;
  editingGoal: Goal | null = null;
  preSelectedGoalId: string | null = null;

  constructor(
    private filterShortcutService: FilterShortcutService,
    private goalService: GoalService,
    private filterService: FilterService,
    private router: Router,
    private settingsService: SettingsService,
    public iconService: IconService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });

    // Subscribe to goals
    this.goalService.goals$
      .pipe(takeUntil(this.destroy$))
      .subscribe(goals => {
        this.goals = goals;
        // Initialize expanded state for all goals
        goals.forEach(goal => this.expandedGoals.add(goal.id));
      });

    // Subscribe to shortcuts
    this.filterShortcutService.shortcuts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(shortcuts => {
        this.shortcuts = Array.isArray(shortcuts) ? shortcuts : [];
        this.updateUncategorizedShortcuts();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent): void {
    if (this.showCreateShortcutModal || this.showEditShortcutModal) {
      this.onCloseShortcutModal();
    } else if (this.showCreateGoalModal || this.showEditGoalModal) {
      this.onCloseGoalModal();
    }
  }

  // Goal-related methods
  onCreateGoal(): void {
    this.showCreateGoalModal = true;
  }

  onCloseGoalModal(): void {
    this.showCreateGoalModal = false;
    this.showEditGoalModal = false;
    this.editingGoal = null;
  }

  onEditGoal(goal: Goal): void {
    this.editingGoal = goal;
    this.showEditGoalModal = true;
  }

  onDeleteGoal(goal: Goal): void {
    this.goalService.deleteGoal(goal.id).subscribe({
      next: (success) => {
        // Goal deleted successfully
      },
      error: (error) => {
        console.error('Error deleting goal:', error);
      }
    });
  }

  onToggleGoalExpansion(goalId: string): void {
    if (this.expandedGoals.has(goalId)) {
      this.expandedGoals.delete(goalId);
    } else {
      this.expandedGoals.add(goalId);
    }
  }

  // Shortcut-related methods
  onAddShortcutToGoal(goalId: string): void {
    this.preSelectedGoalId = goalId;
    this.showCreateShortcutModal = true;
  }

  onCreateShortcut(): void {
    this.preSelectedGoalId = null;
    this.showCreateShortcutModal = true;
  }

  onCloseShortcutModal(): void {
    this.showCreateShortcutModal = false;
    this.showEditShortcutModal = false;
    this.editingShortcut = null;
    this.preSelectedGoalId = null;
  }

  onEditShortcut(shortcut: FilterShortcut): void {
    this.editingShortcut = shortcut;
    this.showEditShortcutModal = true;
  }

  onDeleteShortcut(shortcut: FilterShortcut): void {
    this.filterShortcutService.deleteShortcut(shortcut.id).subscribe({
      next: (success) => {
        // Shortcut deleted successfully
      },
      error: (error) => {
        console.error('Error deleting shortcut:', error);
      }
    });
  }

  onShortcutClick(shortcut: FilterShortcut): void {
    const entityType = this.getEntityTypeFromPage(shortcut.targetPage);
    
    this.filterService.clearFiltersForEntity(entityType);
    if (shortcut.filters && shortcut.filters.length > 0) {
      this.filterService.saveFiltersForEntity(entityType, shortcut.filters);
    }
    
    this.router.navigate([shortcut.targetPage]);
  }

  // Helper methods
  getShortcutsForGoal(goalId: string): FilterShortcut[] {
    if (!Array.isArray(this.shortcuts)) {
      return [];
    }
    return this.shortcuts.filter(shortcut => shortcut.goalId === goalId);
  }

  updateUncategorizedShortcuts(): void {
    if (!Array.isArray(this.shortcuts)) {
      this.uncategorizedShortcuts = [];
      return;
    }
    this.uncategorizedShortcuts = this.shortcuts.filter(shortcut => !shortcut.goalId);
  }

  isGoalExpanded(goalId: string): boolean {
    return this.expandedGoals.has(goalId);
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

  // Display mode methods
  onToggleDisplayCounts(): void {
    this.showCounts = !this.showCounts;
    if (this.showCounts && this.shortcutCounts.size === 0) {
      this.loadShortcutCounts();
    }
  }

  private loadShortcutCounts(): void {
    this.loadingCounts = true;
    const allShortcuts = [...this.shortcuts];
    
    if (allShortcuts.length === 0) {
      this.loadingCounts = false;
      return;
    }

    let completedRequests = 0;
    const totalRequests = allShortcuts.length;

    allShortcuts.forEach(shortcut => {
      this.getShortcutCountFromAPI(shortcut).then(count => {
        this.shortcutCounts.set(shortcut.id, count);
        completedRequests++;
        
        if (completedRequests === totalRequests) {
          this.loadingCounts = false;
        }
      }).catch(() => {
        this.shortcutCounts.set(shortcut.id, 0);
        completedRequests++;
        
        if (completedRequests === totalRequests) {
          this.loadingCounts = false;
        }
      });
    });
  }

  private async getShortcutCountFromAPI(shortcut: FilterShortcut): Promise<number> {
    return new Promise((resolve) => {
      const targetPage = shortcut.targetPage;
      const filters = shortcut.filters || [];

      switch (targetPage) {
        case '/video-games':
          this.apiService.getVideoGames(filters).subscribe({
            next: (results) => resolve(results?.length || 0),
            error: () => resolve(0)
          });
          break;
        case '/video-game-boxes':
          this.apiService.getVideoGameBoxes(filters).subscribe({
            next: (results) => resolve(results?.length || 0),
            error: () => resolve(0)
          });
          break;
        case '/board-games':
          this.apiService.getBoardGames(filters).subscribe({
            next: (results) => resolve(results?.length || 0),
            error: () => resolve(0)
          });
          break;
        case '/board-game-boxes':
          this.apiService.getBoardGameBoxes(filters).subscribe({
            next: (results) => resolve(results?.length || 0),
            error: () => resolve(0)
          });
          break;
        case '/systems':
          this.apiService.getSystems(filters).subscribe({
            next: (results) => resolve(results?.length || 0),
            error: () => resolve(0)
          });
          break;
        case '/toys':
          this.apiService.getToys(filters).subscribe({
            next: (results) => resolve(results?.length || 0),
            error: () => resolve(0)
          });
          break;
        default:
          resolve(0);
          break;
      }
    });
  }

  getShortcutCount(shortcutId: string): number {
    return this.shortcutCounts.get(shortcutId) || 0;
  }

  onShortcutCountClick(shortcut: FilterShortcut): void {
    if (this.showCounts) {
      // When in count mode, navigate to search results
      this.onShortcutClick(shortcut);
    }
  }
}
