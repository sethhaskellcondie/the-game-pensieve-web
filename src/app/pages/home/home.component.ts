import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FilterShortcutService, FilterShortcut } from '../../services/filter-shortcut.service';
import { GoalService, Goal } from '../../services/goal.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { IconService } from '../../services/icon.service';
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
    public iconService: IconService
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
        if (success) {
          console.log('Goal deleted successfully');
        }
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
        if (success) {
          console.log('Shortcut deleted successfully');
        }
      },
      error: (error) => {
        console.error('Error deleting shortcut:', error);
      }
    });
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
}
