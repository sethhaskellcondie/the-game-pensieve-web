import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HomeComponent } from './home.component';
import { GoalService, Goal } from '../../services/goal.service';
import { FilterShortcutService, FilterShortcut } from '../../services/filter-shortcut.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { IconService } from '../../services/icon.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockGoalService: jasmine.SpyObj<GoalService>;
  let mockFilterShortcutService: jasmine.SpyObj<FilterShortcutService>;
  let mockFilterService: jasmine.SpyObj<FilterService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockIconService: jasmine.SpyObj<IconService>;

  const mockGoals: Goal[] = [
    {
      id: 'goal1',
      name: 'Test Goal 1',
      description: 'First test goal',
      completed: false,
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'goal2',
      name: 'Test Goal 2',
      completed: true,
      createdAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  const mockShortcuts: FilterShortcut[] = [
    {
      id: 'shortcut1',
      name: 'Test Shortcut 1',
      targetPage: '/video-games',
      filters: [],
      goalId: 'goal1',
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'shortcut2',
      name: 'Test Shortcut 2',
      targetPage: '/board-games',
      filters: [{ key: 'test-key', field: 'name', operator: 'contains', operand: 'test' }],
      createdAt: '2023-01-02T00:00:00.000Z'
    },
    {
      id: 'shortcut3',
      name: 'Test Shortcut 3',
      targetPage: '/systems',
      filters: [],
      goalId: 'goal1',
      createdAt: '2023-01-03T00:00:00.000Z'
    }
  ];

  beforeEach(async () => {
    const goalServiceSpy = jasmine.createSpyObj('GoalService', ['deleteGoal', 'goals$']);
    const filterShortcutServiceSpy = jasmine.createSpyObj('FilterShortcutService', ['deleteShortcut', 'shortcuts$']);
    const filterServiceSpy = jasmine.createSpyObj('FilterService', ['clearFiltersForEntity', 'saveFiltersForEntity']);
    const settingsServiceSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const iconServiceSpy = jasmine.createSpyObj('IconService', ['getIcon']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: GoalService, useValue: goalServiceSpy },
        { provide: FilterShortcutService, useValue: filterShortcutServiceSpy },
        { provide: FilterService, useValue: filterServiceSpy },
        { provide: SettingsService, useValue: settingsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: IconService, useValue: iconServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    
    mockGoalService = TestBed.inject(GoalService) as jasmine.SpyObj<GoalService>;
    mockFilterShortcutService = TestBed.inject(FilterShortcutService) as jasmine.SpyObj<FilterShortcutService>;
    mockFilterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    mockSettingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockIconService = TestBed.inject(IconService) as jasmine.SpyObj<IconService>;

    // Setup default return values
    mockSettingsService.getDarkMode$.and.returnValue(of(false));
    mockGoalService.goals$ = of(mockGoals);
    mockFilterShortcutService.shortcuts$ = of(mockShortcuts);
    mockIconService.getIcon.and.returnValue('<svg>test</svg>');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to dark mode changes', () => {
      mockSettingsService.getDarkMode$.and.returnValue(of(true));
      
      component.ngOnInit();
      
      expect(component.isDarkMode).toBe(true);
    });

    it('should subscribe to goals and initialize expanded state', () => {
      component.ngOnInit();
      
      expect(component.goals).toEqual(mockGoals);
      expect(component.expandedGoals.has('goal1')).toBe(true);
      expect(component.expandedGoals.has('goal2')).toBe(true);
    });

    it('should subscribe to shortcuts and update uncategorized', () => {
      component.ngOnInit();
      
      expect(component.shortcuts).toEqual(mockShortcuts);
      expect(component.uncategorizedShortcuts.length).toBe(1);
      expect(component.uncategorizedShortcuts[0].id).toBe('shortcut2');
    });

    it('should handle non-array shortcuts data', () => {
      mockFilterShortcutService.shortcuts$ = of({} as any);
      
      component.ngOnInit();
      
      expect(component.shortcuts).toEqual([]);
      expect(component.uncategorizedShortcuts).toEqual([]);
    });
  });

  describe('goal management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('onCreateGoal', () => {
      it('should show create goal modal', () => {
        component.onCreateGoal();
        expect(component.showCreateGoalModal).toBe(true);
      });
    });

    describe('onCloseGoalModal', () => {
      it('should close all goal modals and clear editing goal', () => {
        component.showCreateGoalModal = true;
        component.showEditGoalModal = true;
        component.editingGoal = mockGoals[0];
        
        component.onCloseGoalModal();
        
        expect(component.showCreateGoalModal).toBe(false);
        expect(component.showEditGoalModal).toBe(false);
        expect(component.editingGoal).toBeNull();
      });
    });

    describe('onEditGoal', () => {
      it('should set editing goal and show edit modal', () => {
        component.onEditGoal(mockGoals[0]);
        
        expect(component.editingGoal).toEqual(mockGoals[0]);
        expect(component.showEditGoalModal).toBe(true);
      });
    });

    describe('onDeleteGoal', () => {
      it('should delete goal successfully', () => {
        mockGoalService.deleteGoal.and.returnValue(of(true));
        
        component.onDeleteGoal(mockGoals[0]);
        
        expect(mockGoalService.deleteGoal).toHaveBeenCalledWith('goal1');
      });

      it('should handle delete goal error', () => {
        mockGoalService.deleteGoal.and.returnValue(throwError(() => new Error('Delete failed')));
        spyOn(console, 'error');
        
        component.onDeleteGoal(mockGoals[0]);
        
        expect(console.error).toHaveBeenCalledWith('Error deleting goal:', jasmine.any(Error));
      });
    });

    describe('onToggleGoalExpansion', () => {
      it('should collapse expanded goal', () => {
        component.expandedGoals.add('goal1');
        
        component.onToggleGoalExpansion('goal1');
        
        expect(component.expandedGoals.has('goal1')).toBe(false);
      });

      it('should expand collapsed goal', () => {
        component.expandedGoals.delete('goal1');
        
        component.onToggleGoalExpansion('goal1');
        
        expect(component.expandedGoals.has('goal1')).toBe(true);
      });
    });
  });

  describe('shortcut management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('onAddShortcutToGoal', () => {
      it('should set pre-selected goal and show create modal', () => {
        component.onAddShortcutToGoal('goal1');
        
        expect(component.preSelectedGoalId).toBe('goal1');
        expect(component.showCreateShortcutModal).toBe(true);
      });
    });

    describe('onCreateShortcut', () => {
      it('should clear pre-selected goal and show create modal', () => {
        component.onCreateShortcut();
        
        expect(component.preSelectedGoalId).toBeNull();
        expect(component.showCreateShortcutModal).toBe(true);
      });
    });

    describe('onCloseShortcutModal', () => {
      it('should close all shortcut modals and clear state', () => {
        component.showCreateShortcutModal = true;
        component.showEditShortcutModal = true;
        component.editingShortcut = mockShortcuts[0];
        component.preSelectedGoalId = 'goal1';
        
        component.onCloseShortcutModal();
        
        expect(component.showCreateShortcutModal).toBe(false);
        expect(component.showEditShortcutModal).toBe(false);
        expect(component.editingShortcut).toBeNull();
        expect(component.preSelectedGoalId).toBeNull();
      });
    });

    describe('onEditShortcut', () => {
      it('should set editing shortcut and show edit modal', () => {
        component.onEditShortcut(mockShortcuts[0]);
        
        expect(component.editingShortcut).toEqual(mockShortcuts[0]);
        expect(component.showEditShortcutModal).toBe(true);
      });
    });

    describe('onDeleteShortcut', () => {
      it('should delete shortcut successfully', () => {
        mockFilterShortcutService.deleteShortcut.and.returnValue(of(true));
        
        component.onDeleteShortcut(mockShortcuts[0]);
        
        expect(mockFilterShortcutService.deleteShortcut).toHaveBeenCalledWith('shortcut1');
      });

      it('should handle delete shortcut error', () => {
        mockFilterShortcutService.deleteShortcut.and.returnValue(throwError(() => new Error('Delete failed')));
        spyOn(console, 'error');
        
        component.onDeleteShortcut(mockShortcuts[0]);
        
        expect(console.error).toHaveBeenCalledWith('Error deleting shortcut:', jasmine.any(Error));
      });
    });

    describe('onShortcutClick', () => {
      it('should clear and set filters then navigate', () => {
        const shortcut = mockShortcuts[1]; // Has filters
        
        component.onShortcutClick(shortcut);
        
        expect(mockFilterService.clearFiltersForEntity).toHaveBeenCalledWith('boardGame');
        expect(mockFilterService.saveFiltersForEntity).toHaveBeenCalledWith('boardGame', shortcut.filters);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/board-games']);
      });

      it('should only clear filters when shortcut has no filters', () => {
        const shortcut = mockShortcuts[0]; // No filters
        
        component.onShortcutClick(shortcut);
        
        expect(mockFilterService.clearFiltersForEntity).toHaveBeenCalledWith('videoGame');
        expect(mockFilterService.saveFiltersForEntity).not.toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/video-games']);
      });
    });
  });

  describe('helper methods', () => {
    beforeEach(() => {
      component.shortcuts = mockShortcuts;
      component.updateUncategorizedShortcuts();
    });

    describe('getShortcutsForGoal', () => {
      it('should return shortcuts for specified goal', () => {
        const goalShortcuts = component.getShortcutsForGoal('goal1');
        
        expect(goalShortcuts.length).toBe(2);
        expect(goalShortcuts.every(s => s.goalId === 'goal1')).toBe(true);
      });

      it('should return empty array for non-existent goal', () => {
        const goalShortcuts = component.getShortcutsForGoal('nonexistent');
        
        expect(goalShortcuts).toEqual([]);
      });

      it('should handle non-array shortcuts', () => {
        component.shortcuts = {} as any;
        
        const goalShortcuts = component.getShortcutsForGoal('goal1');
        
        expect(goalShortcuts).toEqual([]);
      });
    });

    describe('updateUncategorizedShortcuts', () => {
      it('should filter shortcuts without goalId', () => {
        expect(component.uncategorizedShortcuts.length).toBe(1);
        expect(component.uncategorizedShortcuts[0].id).toBe('shortcut2');
      });

      it('should handle non-array shortcuts', () => {
        component.shortcuts = {} as any;
        component.updateUncategorizedShortcuts();
        
        expect(component.uncategorizedShortcuts).toEqual([]);
      });
    });

    describe('isGoalExpanded', () => {
      it('should return true for expanded goal', () => {
        component.expandedGoals.add('goal1');
        
        expect(component.isGoalExpanded('goal1')).toBe(true);
      });

      it('should return false for collapsed goal', () => {
        component.expandedGoals.delete('goal1');
        
        expect(component.isGoalExpanded('goal1')).toBe(false);
      });
    });

    describe('getPageDisplayName', () => {
      it('should return display name for known pages', () => {
        expect(component.getPageDisplayName('/video-games')).toBe('Video Games');
        expect(component.getPageDisplayName('/board-games')).toBe('Board Games');
        expect(component.getPageDisplayName('/systems')).toBe('Systems');
        expect(component.getPageDisplayName('/toys')).toBe('Toys');
      });

      it('should return original page for unknown pages', () => {
        expect(component.getPageDisplayName('/unknown')).toBe('/unknown');
      });
    });
  });

  describe('template integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display page header with title and action buttons', () => {
      const header = fixture.nativeElement.querySelector('.page-header');
      const title = header.querySelector('h1');
      const buttons = header.querySelectorAll('.create-button');
      
      expect(title.textContent).toBe('Goals & Shortcuts');
      expect(buttons.length).toBe(2);
    });

    it('should show goals section when goals exist', () => {
      component.goals = mockGoals;
      fixture.detectChanges();
      
      const goalsSection = fixture.nativeElement.querySelector('.goals-section');
      expect(goalsSection).toBeTruthy();
    });

    it('should show more shortcuts section when uncategorized shortcuts exist', () => {
      component.uncategorizedShortcuts = [mockShortcuts[1]];
      fixture.detectChanges();
      
      const moreShortcutsSection = fixture.nativeElement.querySelector('.more-shortcuts-section');
      expect(moreShortcutsSection).toBeTruthy();
    });

    it('should show empty state when no goals or shortcuts', () => {
      component.goals = [];
      component.shortcuts = [];
      fixture.detectChanges();
      
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('should apply dark-mode class when isDarkMode is true', () => {
      component.isDarkMode = true;
      fixture.detectChanges();
      
      const container = fixture.nativeElement.querySelector('.home-container');
      expect(container).toHaveClass('dark-mode');
    });
  });
});