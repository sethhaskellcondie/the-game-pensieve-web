import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Goal, GoalService } from '../../services/goal.service';
import { FilterShortcut, FilterShortcutService } from '../../services/filter-shortcut.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { IconService } from '../../services/icon.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-goal-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './goal-section.component.html',
  styleUrl: './goal-section.component.scss'
})
export class GoalSectionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @Input() goal!: Goal;
  @Input() shortcuts: FilterShortcut[] = [];
  @Input() isDarkMode = false;
  @Input() isExpanded = true;
  
  @Output() editGoal = new EventEmitter<Goal>();
  @Output() deleteGoal = new EventEmitter<Goal>();
  @Output() addShortcut = new EventEmitter<string>(); // Emits goal ID
  @Output() editShortcut = new EventEmitter<FilterShortcut>();
  @Output() deleteShortcut = new EventEmitter<FilterShortcut>();
  @Output() toggleExpanded = new EventEmitter<void>();

  constructor(
    private goalService: GoalService,
    private filterShortcutService: FilterShortcutService,
    private filterService: FilterService,
    private router: Router,
    public iconService: IconService
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleGoalCompletion(): void {
    this.goalService.toggleGoalCompletion(this.goal.id).subscribe({
      next: (success) => {
        if (!success) {
          console.error('Failed to toggle goal completion');
        }
      },
      error: (error) => {
        console.error('Error toggling goal completion:', error);
      }
    });
  }

  onShortcutClick(shortcut: FilterShortcut): void {
    const entityType = this.getEntityTypeFromPage(shortcut.targetPage);
    
    this.filterService.clearFiltersForEntity(entityType);
    if (shortcut.filters.length > 0) {
      this.filterService.saveFiltersForEntity(entityType, shortcut.filters);
    }
    
    this.router.navigate([shortcut.targetPage]);
  }

  onEditGoal(): void {
    this.editGoal.emit(this.goal);
  }

  onDeleteGoal(): void {
    const shortcutCount = this.shortcuts.length;
    const confirmMessage = shortcutCount > 0 
      ? `Are you sure you want to delete "${this.goal.name}"? This will also remove ${shortcutCount} shortcut(s).`
      : `Are you sure you want to delete "${this.goal.name}"?`;
      
    if (confirm(confirmMessage)) {
      this.deleteGoal.emit(this.goal);
    }
  }

  onAddShortcut(): void {
    this.addShortcut.emit(this.goal.id);
  }

  onEditShortcut(shortcut: FilterShortcut, event: Event): void {
    event.stopPropagation();
    this.editShortcut.emit(shortcut);
  }

  onDeleteShortcut(shortcut: FilterShortcut, event: Event): void {
    event.stopPropagation();
    
    if (confirm(`Are you sure you want to delete "${shortcut.name}"?`)) {
      this.deleteShortcut.emit(shortcut);
    }
  }

  onToggleExpanded(): void {
    this.toggleExpanded.emit();
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

  get progressPercentage(): number {
    if (this.shortcuts.length === 0) return 0;
    // For this implementation, we'll consider shortcuts as "completed" when their goal is completed
    // or we could add a completed field to shortcuts in the future
    return this.goal.completed ? 100 : 0;
  }

  get completedShortcutsCount(): number {
    // For now, consider all shortcuts completed if goal is completed
    return this.goal.completed ? this.shortcuts.length : 0;
  }
}