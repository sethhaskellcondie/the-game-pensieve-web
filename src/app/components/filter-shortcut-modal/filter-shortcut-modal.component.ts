import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FilterShortcutService, FilterShortcut } from '../../services/filter-shortcut.service';
import { FilterService, FilterRequestDto, FilterSpecification } from '../../services/filter.service';
import { GoalService, Goal } from '../../services/goal.service';
import { SelectableTextInputComponent } from '../selectable-text-input/selectable-text-input.component';
import { FilterableDropdownComponent, DropdownOption } from '../filterable-dropdown/filterable-dropdown.component';
import { FilterCriteriaComponent } from '../filter-criteria/filter-criteria.component';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-filter-shortcut-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectableTextInputComponent, FilterableDropdownComponent, FilterCriteriaComponent],
  templateUrl: './filter-shortcut-modal.component.html',
  styleUrl: './filter-shortcut-modal.component.scss'
})
export class FilterShortcutModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() shortcut: FilterShortcut | null = null;
  @Input() preSelectedGoalId: string | null = null; // For creating shortcuts in specific goals
  @Output() closeModal = new EventEmitter<void>();
  @ViewChild('nameField', { static: false }) nameField: any;
  
  formData = {
    name: '',
    description: '',
    targetPage: '',
    goalId: null as string | null,
    filters: [] as FilterRequestDto[]
  };
  
  isSubmitting = false;
  filterSpec: FilterSpecification | null = null;
  isLoadingFilterSpec = false;
  filterSpecErrorMessage = '';
  hasLoadedFilterSpec = false;
  isDarkMode = false;
  goals: Goal[] = [];
  availableGoals: DropdownOption[] = [];
  availablePages: DropdownOption[] = [
    { value: '/video-games', label: 'Video Games' },
    { value: '/video-game-boxes', label: 'Video Game Boxes' },
    { value: '/board-games', label: 'Board Games' },
    { value: '/board-game-boxes', label: 'Board Game Boxes' },
    { value: '/systems', label: 'Systems' },
    { value: '/toys', label: 'Toys' }
  ];

  constructor(
    private filterShortcutService: FilterShortcutService,
    private filterService: FilterService,
    private goalService: GoalService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });

    // Load goals
    this.goalService.goals$
      .pipe(takeUntil(this.destroy$))
      .subscribe(goals => {
        this.goals = goals;
        this.updateAvailableGoals();
      });

    if (this.shortcut) {
      this.formData = {
        name: this.shortcut.name,
        description: this.shortcut.description || '',
        targetPage: this.shortcut.targetPage,
        goalId: this.shortcut.goalId || null,
        filters: [...this.shortcut.filters]
      };
      
      // Load filter spec if editing existing shortcut
      if (this.shortcut.targetPage) {
        this.loadFilterSpecification();
      }
    } else if (this.preSelectedGoalId) {
      // If creating a new shortcut for a specific goal
      this.formData.goalId = this.preSelectedGoalId;
    }
    
    setTimeout(() => {
      if (this.nameField && this.nameField.focus) {
        this.nameField.focus();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateAvailableGoals(): void {
    this.availableGoals = [
      { value: '', label: 'No Goal (Uncategorized)' },
      ...this.goals.map(goal => ({
        value: goal.id,
        label: goal.name
      }))
    ];
  }

  onSubmit(): void {
    if (this.isSubmitting || !this.formData.name.trim()) {
      return;
    }
    
    this.isSubmitting = true;
    
    const shortcutData = {
      name: this.formData.name.trim(),
      description: this.formData.description.trim() || undefined,
      targetPage: this.formData.targetPage,
      filters: this.formData.filters,
      goalId: this.formData.goalId || undefined
    };
    
    const operation = this.shortcut
      ? this.filterShortcutService.updateShortcut(this.shortcut.id, shortcutData)
      : this.filterShortcutService.createShortcut(shortcutData);
    
    operation.subscribe({
      next: (success) => {
        if (success) {
          this.closeModal.emit();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error saving shortcut:', error);
        this.isSubmitting = false;
      }
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  addFilter(): void {
    if (!this.formData.targetPage) return;
    
    if (!this.hasLoadedFilterSpec) {
      this.loadFilterSpecification();
    }
  }
  
  loadFilterSpecification(): void {
    const entityType = this.getEntityTypeFromPage(this.formData.targetPage);
    this.isLoadingFilterSpec = true;
    this.filterSpecErrorMessage = '';
    
    this.filterService.getFiltersForEntity(entityType).subscribe({
      next: (spec) => {
        this.filterSpec = spec;
        this.hasLoadedFilterSpec = true;
        this.isLoadingFilterSpec = false;
      },
      error: (error) => {
        console.error('Error loading filter specification:', error);
        this.filterSpecErrorMessage = 'Failed to load filter options';
        this.isLoadingFilterSpec = false;
      }
    });
  }
  
  getInitialFilters(): FilterRequestDto[] {
    return this.formData.filters;
  }

  onFiltersChanged(filters: FilterRequestDto[]): void {
    this.formData.filters = filters;
  }
  
  onTargetPageChange(): void {
    // Reset filter specification when target page changes
    this.filterSpec = null;
    this.hasLoadedFilterSpec = false;
    this.formData.filters = [];
  }

  getEntityTypeFromPage(page: string): string {
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
