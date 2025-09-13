import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GoalSectionComponent } from './goal-section.component';
import { GoalService, Goal } from '../../services/goal.service';
import { FilterShortcutService, FilterShortcut } from '../../services/filter-shortcut.service';
import { FilterService } from '../../services/filter.service';
import { IconService } from '../../services/icon.service';

describe('GoalSectionComponent', () => {
  let component: GoalSectionComponent;
  let fixture: ComponentFixture<GoalSectionComponent>;
  let mockGoalService: jasmine.SpyObj<GoalService>;
  let mockFilterShortcutService: jasmine.SpyObj<FilterShortcutService>;
  let mockFilterService: jasmine.SpyObj<FilterService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockIconService: jasmine.SpyObj<IconService>;

  const mockGoal: Goal = {
    id: 'goal1',
    name: 'Test Goal',
    description: 'Test Description',
    completed: false,
    createdAt: '2023-01-01T00:00:00.000Z'
  };

  const mockShortcuts: FilterShortcut[] = [
    {
      id: 'shortcut1',
      name: 'Test Shortcut 1',
      description: 'First shortcut',
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
      goalId: 'goal1',
      createdAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  beforeEach(async () => {
    const goalServiceSpy = jasmine.createSpyObj('GoalService', ['toggleGoalCompletion']);
    const filterShortcutServiceSpy = jasmine.createSpyObj('FilterShortcutService', ['shortcuts$']);
    const filterServiceSpy = jasmine.createSpyObj('FilterService', ['clearFiltersForEntity', 'saveFiltersForEntity']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const iconServiceSpy = jasmine.createSpyObj('IconService', ['getIcon']);

    await TestBed.configureTestingModule({
      imports: [GoalSectionComponent],
      providers: [
        { provide: GoalService, useValue: goalServiceSpy },
        { provide: FilterShortcutService, useValue: filterShortcutServiceSpy },
        { provide: FilterService, useValue: filterServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: IconService, useValue: iconServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GoalSectionComponent);
    component = fixture.componentInstance;
    
    mockGoalService = TestBed.inject(GoalService) as jasmine.SpyObj<GoalService>;
    mockFilterShortcutService = TestBed.inject(FilterShortcutService) as jasmine.SpyObj<FilterShortcutService>;
    mockFilterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockIconService = TestBed.inject(IconService) as jasmine.SpyObj<IconService>;

    // Set required inputs
    component.goal = mockGoal;
    component.shortcuts = mockShortcuts;
    component.isDarkMode = false;
    component.isExpanded = true;

    mockIconService.getIcon.and.returnValue('<svg>test</svg>');
    mockGoalService.toggleGoalCompletion.and.returnValue(of(true));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onToggleGoalCompletion', () => {
    it('should toggle goal completion', () => {
      mockGoalService.toggleGoalCompletion.and.returnValue(of(true));
      
      component.onToggleGoalCompletion();
      
      expect(mockGoalService.toggleGoalCompletion).toHaveBeenCalledWith('goal1');
    });

    it('should handle toggle goal completion error', () => {
      mockGoalService.toggleGoalCompletion.and.returnValue(of(false));
      spyOn(console, 'error');
      
      component.onToggleGoalCompletion();
      
      expect(console.error).toHaveBeenCalledWith('Failed to toggle goal completion');
    });

    it('should handle service error', () => {
      mockGoalService.toggleGoalCompletion.and.returnValue(throwError(() => new Error('Service error')));
      spyOn(console, 'error');
      
      component.onToggleGoalCompletion();
      
      expect(console.error).toHaveBeenCalledWith('Error toggling goal completion:', jasmine.any(Error));
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

  describe('event emitters', () => {
    it('should emit editGoal', () => {
      spyOn(component.editGoal, 'emit');
      
      component.onEditGoal();
      
      expect(component.editGoal.emit).toHaveBeenCalledWith(mockGoal);
    });

    it('should emit deleteGoal after confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component.deleteGoal, 'emit');
      
      component.onDeleteGoal();
      
      expect(component.deleteGoal.emit).toHaveBeenCalledWith(mockGoal);
    });

    it('should not emit deleteGoal if not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      spyOn(component.deleteGoal, 'emit');
      
      component.onDeleteGoal();
      
      expect(component.deleteGoal.emit).not.toHaveBeenCalled();
    });

    it('should emit addShortcut with goal id', () => {
      spyOn(component.addShortcut, 'emit');
      
      component.onAddShortcut();
      
      expect(component.addShortcut.emit).toHaveBeenCalledWith('goal1');
    });

    it('should emit editShortcut and stop propagation', () => {
      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
      spyOn(component.editShortcut, 'emit');
      
      component.onEditShortcut(mockShortcuts[0], mockEvent);
      
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.editShortcut.emit).toHaveBeenCalledWith(mockShortcuts[0]);
    });

    it('should emit deleteShortcut after confirmation', () => {
      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component.deleteShortcut, 'emit');
      
      component.onDeleteShortcut(mockShortcuts[0], mockEvent);
      
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.deleteShortcut.emit).toHaveBeenCalledWith(mockShortcuts[0]);
    });

    it('should emit toggleExpanded', () => {
      spyOn(component.toggleExpanded, 'emit');
      
      component.onToggleExpanded();
      
      expect(component.toggleExpanded.emit).toHaveBeenCalled();
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
      expect(component.getPageDisplayName('/unknown-page')).toBe('/unknown-page');
    });
  });

  describe('getEntityTypeFromPage', () => {
    it('should return correct entity types', () => {
      expect(component['getEntityTypeFromPage']('/video-games')).toBe('videoGame');
      expect(component['getEntityTypeFromPage']('/board-games')).toBe('boardGame');
      expect(component['getEntityTypeFromPage']('/systems')).toBe('system');
      expect(component['getEntityTypeFromPage']('/toys')).toBe('toy');
    });

    it('should return default entity type for unknown pages', () => {
      expect(component['getEntityTypeFromPage']('/unknown')).toBe('videoGameBox');
    });
  });

  describe('template integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display goal name', () => {
      const titleElement = fixture.nativeElement.querySelector('.goal-title');
      expect(titleElement.textContent.trim()).toBe('Test Goal');
    });

    it('should display goal description when present', () => {
      const descriptionElement = fixture.nativeElement.querySelector('.goal-description');
      expect(descriptionElement.textContent.trim()).toBe('Test Description');
    });

    it('should display shortcuts when expanded', () => {
      const shortcutCards = fixture.nativeElement.querySelectorAll('.shortcut-card');
      expect(shortcutCards.length).toBe(2);
    });

    it('should apply completed class when goal is completed', () => {
      component.goal = { ...mockGoal, completed: true };
      fixture.detectChanges();
      
      const goalSection = fixture.nativeElement.querySelector('.goal-section');
      const goalTitle = fixture.nativeElement.querySelector('.goal-title');
      
      expect(goalSection).toHaveClass('completed');
      expect(goalTitle).toHaveClass('completed');
    });

    it('should apply dark-mode class when isDarkMode is true', () => {
      component.isDarkMode = true;
      fixture.detectChanges();
      
      const goalSection = fixture.nativeElement.querySelector('.goal-section');
      expect(goalSection).toHaveClass('dark-mode');
    });

    it('should show expand icon as expanded when isExpanded is true', () => {
      const expandIcon = fixture.nativeElement.querySelector('.expand-icon');
      expect(expandIcon).toHaveClass('expanded');
    });
  });

  describe('delete confirmation messages', () => {
    it('should show shortcut count in delete confirmation when shortcuts exist', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.onDeleteGoal();
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Test Goal"? This will also remove 2 shortcut(s).'
      );
    });

    it('should show simple confirmation when no shortcuts', () => {
      component.shortcuts = [];
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.onDeleteGoal();
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Test Goal"?'
      );
    });
  });

  describe('count display functionality', () => {
    beforeEach(() => {
      component.showCounts = false;
      component.shortcutCounts = new Map();
      component.loadingCounts = false;
      fixture.detectChanges();
    });

    describe('getShortcutCount', () => {
      it('should return count from shortcutCounts map', () => {
        component.shortcutCounts.set('shortcut1', 5);
        component.shortcutCounts.set('shortcut2', 0);
        
        expect(component.getShortcutCount('shortcut1')).toBe(5);
        expect(component.getShortcutCount('shortcut2')).toBe(0);
      });

      it('should return 0 for shortcuts not in map', () => {
        expect(component.getShortcutCount('nonexistent')).toBe(0);
      });
    });

    describe('template integration with count view', () => {
      it('should show count view for shortcuts when showCounts is true', () => {
        component.showCounts = true;
        component.shortcutCounts.set('shortcut1', 5);
        fixture.detectChanges();
        
        const shortcutCards = fixture.nativeElement.querySelectorAll('.shortcut-card');
        const countViewCard = Array.from(shortcutCards).find((card: any) => 
          card.classList.contains('count-view')
        );
        
        expect(countViewCard).toBeTruthy();
      });

      it('should hide shortcut actions in count view', () => {
        component.showCounts = true;
        fixture.detectChanges();
        
        const shortcutActions = fixture.nativeElement.querySelector('.shortcut-actions');
        expect(shortcutActions).toBeFalsy();
      });

      it('should hide shortcut description in count view', () => {
        component.showCounts = true;
        fixture.detectChanges();
        
        const shortcutDescription = fixture.nativeElement.querySelector('.shortcut-description');
        expect(shortcutDescription).toBeFalsy();
      });

      it('should show loading spinner when loadingCounts is true', () => {
        component.showCounts = true;
        component.loadingCounts = true;
        fixture.detectChanges();
        
        const loadingSpinner = fixture.nativeElement.querySelector('.loading-spinner');
        expect(loadingSpinner).toBeTruthy();
      });

      it('should display count numbers when counts are loaded', () => {
        component.showCounts = true;
        component.loadingCounts = false;
        component.shortcutCounts.set('shortcut1', 25);
        fixture.detectChanges();
        
        const countNumber = fixture.nativeElement.querySelector('.count-number');
        expect(countNumber).toBeTruthy();
        expect(countNumber.textContent.trim()).toBe('25');
      });

      it('should show count label with page display name', () => {
        component.showCounts = true;
        component.loadingCounts = false;
        component.shortcutCounts.set('shortcut1', 10);
        fixture.detectChanges();
        
        const countLabel = fixture.nativeElement.querySelector('.count-label');
        expect(countLabel).toBeTruthy();
        expect(countLabel.textContent.trim().toLowerCase()).toBe('video games'.toLowerCase());
      });

      it('should show shortcut info in details view', () => {
        component.showCounts = false;
        fixture.detectChanges();
        
        const shortcutInfo = fixture.nativeElement.querySelector('.shortcut-info');
        const shortcutCountInfo = fixture.nativeElement.querySelector('.shortcut-count-info');
        
        expect(shortcutInfo).toBeTruthy();
        expect(shortcutCountInfo).toBeFalsy();
      });

      it('should show shortcut count info in count view', () => {
        component.showCounts = true;
        fixture.detectChanges();
        
        const shortcutInfo = fixture.nativeElement.querySelector('.shortcut-info');
        const shortcutCountInfo = fixture.nativeElement.querySelector('.shortcut-count-info');
        
        expect(shortcutInfo).toBeFalsy();
        expect(shortcutCountInfo).toBeTruthy();
      });

      it('should maintain shortcut card clickability in both views', () => {
        // Test details view
        component.showCounts = false;
        fixture.detectChanges();
        
        let shortcutCard = fixture.nativeElement.querySelector('.shortcut-card');
        expect(shortcutCard).toHaveClass('clickable');
        
        // Test count view
        component.showCounts = true;
        fixture.detectChanges();
        
        shortcutCard = fixture.nativeElement.querySelector('.shortcut-card');
        expect(shortcutCard).toHaveClass('clickable');
      });

      it('should apply count-view class only when showCounts is true', () => {
        // Details view
        component.showCounts = false;
        fixture.detectChanges();
        
        let shortcutCard = fixture.nativeElement.querySelector('.shortcut-card');
        expect(shortcutCard).not.toHaveClass('count-view');
        
        // Count view
        component.showCounts = true;
        fixture.detectChanges();
        
        shortcutCard = fixture.nativeElement.querySelector('.shortcut-card');
        expect(shortcutCard).toHaveClass('count-view');
      });
    });
  });
});