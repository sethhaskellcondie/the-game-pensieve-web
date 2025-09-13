import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GoalService, Goal } from './goal.service';
import { MetadataService } from './metadata.service';

describe('GoalService', () => {
  let service: GoalService;
  let mockMetadataService: jasmine.SpyObj<MetadataService>;

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
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-03T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MetadataService', ['getMetadata', 'setMetadata']);
    // Configure default return value before service is created
    spy.getMetadata.and.returnValue(of([]));
    spy.setMetadata.and.returnValue(of(true));

    TestBed.configureTestingModule({
      providers: [
        GoalService,
        { provide: MetadataService, useValue: spy }
      ]
    });

    service = TestBed.inject(GoalService);
    mockMetadataService = TestBed.inject(MetadataService) as jasmine.SpyObj<MetadataService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadGoals', () => {
    it('should load goals from metadata service', () => {
      mockMetadataService.getMetadata.and.returnValue(of(mockGoals));
      service.loadGoals();
      
      service.goals$.subscribe(goals => {
        expect(goals).toEqual(mockGoals);
      });
    });

    it('should handle null data from metadata service', () => {
      mockMetadataService.getMetadata.and.returnValue(of(null));
      service.loadGoals();
      
      service.goals$.subscribe(goals => {
        expect(goals).toEqual([]);
      });
    });

    it('should handle object data instead of array from metadata service', () => {
      mockMetadataService.getMetadata.and.returnValue(of({} as any));
      service.loadGoals();
      
      service.goals$.subscribe(goals => {
        expect(goals).toEqual([]);
      });
    });

    it('should handle errors from metadata service', () => {
      mockMetadataService.getMetadata.and.returnValue(throwError(() => new Error('Load failed')));
      service.loadGoals();
      
      service.goals$.subscribe(goals => {
        expect(goals).toEqual([]);
      });
    });
  });

  describe('createGoal', () => {
    it('should create a new goal', () => {
      const newGoal = {
        name: 'New Goal',
        description: 'A new test goal',
        completed: false
      };

      mockMetadataService.getMetadata.and.returnValue(of(mockGoals));
      mockMetadataService.setMetadata.and.returnValue(of(true));

      service.createGoal(newGoal).subscribe(success => {
        expect(success).toBe(true);
        expect(mockMetadataService.setMetadata).toHaveBeenCalled();
      });
    });

    it('should handle null current goals', () => {
      const newGoal = {
        name: 'New Goal',
        completed: false
      };

      mockMetadataService.getMetadata.and.returnValue(of(null));
      mockMetadataService.setMetadata.and.returnValue(of(true));

      service.createGoal(newGoal).subscribe(success => {
        expect(success).toBe(true);
      });
    });
  });

  describe('updateGoal', () => {
    beforeEach(() => {
      mockMetadataService.getMetadata.and.returnValue(of(mockGoals));
      service.loadGoals();
    });

    it('should update an existing goal', () => {
      mockMetadataService.setMetadata.and.returnValue(of(true));

      service.updateGoal('goal1', { name: 'Updated Goal' }).subscribe(success => {
        expect(success).toBe(true);
        expect(mockMetadataService.setMetadata).toHaveBeenCalled();
      });
    });

    it('should add updatedAt timestamp when updating', () => {
      mockMetadataService.setMetadata.and.returnValue(of(true));

      service.updateGoal('goal1', { completed: true }).subscribe(() => {
        const callArgs = mockMetadataService.setMetadata.calls.mostRecent().args[1] as Goal[];
        const updatedGoal = callArgs.find(g => g.id === 'goal1');
        expect(updatedGoal?.updatedAt).toBeDefined();
      });
    });
  });

  describe('deleteGoal', () => {
    beforeEach(() => {
      mockMetadataService.getMetadata.and.returnValue(of(mockGoals));
      service.loadGoals();
    });

    it('should delete a goal', () => {
      mockMetadataService.setMetadata.and.returnValue(of(true));

      service.deleteGoal('goal1').subscribe(success => {
        expect(success).toBe(true);
        const callArgs = mockMetadataService.setMetadata.calls.mostRecent().args[1] as Goal[];
        expect(callArgs.find(g => g.id === 'goal1')).toBeUndefined();
      });
    });
  });

  describe('toggleGoalCompletion', () => {
    beforeEach(() => {
      mockMetadataService.getMetadata.and.returnValue(of(mockGoals));
      service.loadGoals();
    });

    it('should toggle goal completion status', () => {
      mockMetadataService.setMetadata.and.returnValue(of(true));

      service.toggleGoalCompletion('goal1').subscribe(success => {
        expect(success).toBe(true);
      });
    });

    it('should return false for non-existent goal', () => {
      service.toggleGoalCompletion('nonexistent').subscribe(success => {
        expect(success).toBe(false);
      });
    });
  });

  describe('getGoals', () => {
    it('should return current goals', () => {
      mockMetadataService.getMetadata.and.returnValue(of(mockGoals));
      service.loadGoals();
      
      const goals = service.getGoals();
      expect(goals).toEqual(mockGoals);
    });

    it('should return empty array when goals are null', () => {
      mockMetadataService.getMetadata.and.returnValue(of(null));
      service.loadGoals();
      
      const goals = service.getGoals();
      expect(goals).toEqual([]);
    });
  });

  describe('getGoalById', () => {
    beforeEach(() => {
      mockMetadataService.getMetadata.and.returnValue(of(mockGoals));
      service.loadGoals();
    });

    it('should return goal by id', () => {
      const goal = service.getGoalById('goal1');
      expect(goal).toEqual(mockGoals[0]);
    });

    it('should return undefined for non-existent goal', () => {
      const goal = service.getGoalById('nonexistent');
      expect(goal).toBeUndefined();
    });
  });
});