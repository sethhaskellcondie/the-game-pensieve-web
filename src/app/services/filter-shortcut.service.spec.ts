import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { FilterShortcutService, FilterShortcut } from './filter-shortcut.service';
import { MetadataService } from './metadata.service';

describe('FilterShortcutService', () => {
  let service: FilterShortcutService;
  let mockMetadataService: jasmine.SpyObj<MetadataService>;

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

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MetadataService', ['getMetadata', 'setMetadata']);
    // Configure default return value before service is created
    spy.getMetadata.and.returnValue(of([]));
    spy.setMetadata.and.returnValue(of(true));

    TestBed.configureTestingModule({
      providers: [
        FilterShortcutService,
        { provide: MetadataService, useValue: spy }
      ]
    });
    
    service = TestBed.inject(FilterShortcutService);
    mockMetadataService = TestBed.inject(MetadataService) as jasmine.SpyObj<MetadataService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadShortcuts', () => {
    it('should load shortcuts from metadata service', () => {
      mockMetadataService.getMetadata.and.returnValue(of(mockShortcuts));
      service.loadShortcuts();
      
      service.shortcuts$.subscribe(shortcuts => {
        expect(shortcuts).toEqual(mockShortcuts);
      });
    });

    it('should handle null data from metadata service', () => {
      mockMetadataService.getMetadata.and.returnValue(of(null));
      service.loadShortcuts();
      
      service.shortcuts$.subscribe(shortcuts => {
        expect(shortcuts).toEqual([]);
      });
    });

    it('should handle object data instead of array from metadata service', () => {
      mockMetadataService.getMetadata.and.returnValue(of({} as any));
      service.loadShortcuts();
      
      service.shortcuts$.subscribe(shortcuts => {
        expect(shortcuts).toEqual([]);
      });
    });

    it('should handle errors from metadata service', () => {
      mockMetadataService.getMetadata.and.returnValue(throwError(() => new Error('Load failed')));
      service.loadShortcuts();
      
      service.shortcuts$.subscribe(shortcuts => {
        expect(shortcuts).toEqual([]);
      });
    });
  });

  describe('createShortcut', () => {
    beforeEach(() => {
      mockMetadataService.getMetadata.and.returnValue(of(mockShortcuts));
    });

    it('should create a new shortcut', () => {
      const newShortcut = {
        name: 'New Shortcut',
        description: 'A new test shortcut',
        targetPage: '/toys',
        filters: [],
        goalId: 'goal2'
      };

      mockMetadataService.setMetadata.and.returnValue(of(true));

      service.createShortcut(newShortcut).subscribe(success => {
        expect(success).toBe(true);
        expect(mockMetadataService.setMetadata).toHaveBeenCalled();
      });
    });

    it('should handle null current shortcuts', () => {
      mockMetadataService.getMetadata.and.returnValue(of(null));
      mockMetadataService.setMetadata.and.returnValue(of(true));

      const newShortcut = {
        name: 'New Shortcut',
        targetPage: '/toys',
        filters: []
      };

      service.createShortcut(newShortcut).subscribe(success => {
        expect(success).toBe(true);
      });
    });
  });

  describe('goal-related methods', () => {
    beforeEach(() => {
      mockMetadataService.getMetadata.and.returnValue(of(mockShortcuts));
      service.loadShortcuts();
    });

    describe('getShortcutsByGoal', () => {
      it('should return shortcuts for specified goal', () => {
        const goalShortcuts = service.getShortcutsByGoal('goal1');
        expect(goalShortcuts.length).toBe(2);
        expect(goalShortcuts.every(s => s.goalId === 'goal1')).toBe(true);
      });

      it('should return empty array for non-existent goal', () => {
        const goalShortcuts = service.getShortcutsByGoal('nonexistent');
        expect(goalShortcuts).toEqual([]);
      });

      it('should handle null shortcuts array', () => {
        mockMetadataService.getMetadata.and.returnValue(of(null));
        service.loadShortcuts();
        
        const goalShortcuts = service.getShortcutsByGoal('goal1');
        expect(goalShortcuts).toEqual([]);
      });
    });

    describe('getUncategorizedShortcuts', () => {
      it('should return shortcuts without goalId', () => {
        const uncategorized = service.getUncategorizedShortcuts();
        expect(uncategorized.length).toBe(1);
        expect(uncategorized[0].id).toBe('shortcut2');
      });

      it('should handle null shortcuts array', () => {
        mockMetadataService.getMetadata.and.returnValue(of(null));
        service.loadShortcuts();
        
        const uncategorized = service.getUncategorizedShortcuts();
        expect(uncategorized).toEqual([]);
      });
    });

    describe('assignShortcutToGoal', () => {
      it('should assign shortcut to goal', () => {
        mockMetadataService.setMetadata.and.returnValue(of(true));

        service.assignShortcutToGoal('shortcut2', 'goal1').subscribe(success => {
          expect(success).toBe(true);
          
          const callArgs = mockMetadataService.setMetadata.calls.mostRecent().args[1] as FilterShortcut[];
          const updatedShortcut = callArgs.find(s => s.id === 'shortcut2');
          expect(updatedShortcut?.goalId).toBe('goal1');
        });
      });

      it('should remove goal assignment when goalId is null', () => {
        mockMetadataService.setMetadata.and.returnValue(of(true));

        service.assignShortcutToGoal('shortcut1', null).subscribe(success => {
          expect(success).toBe(true);
          
          const callArgs = mockMetadataService.setMetadata.calls.mostRecent().args[1] as FilterShortcut[];
          const updatedShortcut = callArgs.find(s => s.id === 'shortcut1');
          expect(updatedShortcut?.goalId).toBeUndefined();
        });
      });
    });

    describe('reassignShortcutsFromGoal', () => {
      it('should reassign all shortcuts from old goal to new goal', () => {
        mockMetadataService.setMetadata.and.returnValue(of(true));

        service.reassignShortcutsFromGoal('goal1', 'goal2').subscribe(success => {
          expect(success).toBe(true);
          
          const callArgs = mockMetadataService.setMetadata.calls.mostRecent().args[1] as FilterShortcut[];
          const reassignedShortcuts = callArgs.filter(s => s.goalId === 'goal2');
          expect(reassignedShortcuts.length).toBe(2);
        });
      });

      it('should remove goal assignment when newGoalId is null', () => {
        mockMetadataService.setMetadata.and.returnValue(of(true));

        service.reassignShortcutsFromGoal('goal1', null).subscribe(success => {
          expect(success).toBe(true);
          
          const callArgs = mockMetadataService.setMetadata.calls.mostRecent().args[1] as FilterShortcut[];
          const unassignedShortcuts = callArgs.filter(s => s.goalId === undefined);
          expect(unassignedShortcuts.length).toBe(3); // 2 previously assigned + 1 already unassigned
        });
      });
    });

    describe('deleteShortcutsByGoal', () => {
      it('should delete all shortcuts assigned to goal', () => {
        mockMetadataService.setMetadata.and.returnValue(of(true));

        service.deleteShortcutsByGoal('goal1').subscribe(success => {
          expect(success).toBe(true);
          
          const callArgs = mockMetadataService.setMetadata.calls.mostRecent().args[1] as FilterShortcut[];
          expect(callArgs.length).toBe(1); // Only shortcut2 should remain
          expect(callArgs[0].id).toBe('shortcut2');
        });
      });

      it('should handle goal with no shortcuts', () => {
        mockMetadataService.setMetadata.and.returnValue(of(true));

        service.deleteShortcutsByGoal('nonexistent').subscribe(success => {
          expect(success).toBe(true);
          
          const callArgs = mockMetadataService.setMetadata.calls.mostRecent().args[1] as FilterShortcut[];
          expect(callArgs.length).toBe(3); // All shortcuts should remain
        });
      });
    });
  });

  describe('updateShortcut', () => {
    beforeEach(() => {
      mockMetadataService.getMetadata.and.returnValue(of(mockShortcuts));
      service.loadShortcuts();
    });

    it('should update existing shortcut', () => {
      mockMetadataService.setMetadata.and.returnValue(of(true));

      service.updateShortcut('shortcut1', { name: 'Updated Shortcut' }).subscribe(success => {
        expect(success).toBe(true);
        
        const callArgs = mockMetadataService.setMetadata.calls.mostRecent().args[1] as FilterShortcut[];
        const updatedShortcut = callArgs.find(s => s.id === 'shortcut1');
        expect(updatedShortcut?.name).toBe('Updated Shortcut');
      });
    });
  });

  describe('deleteShortcut', () => {
    beforeEach(() => {
      mockMetadataService.getMetadata.and.returnValue(of(mockShortcuts));
      service.loadShortcuts();
    });

    it('should delete shortcut', () => {
      mockMetadataService.setMetadata.and.returnValue(of(true));

      service.deleteShortcut('shortcut1').subscribe(success => {
        expect(success).toBe(true);
        
        const callArgs = mockMetadataService.setMetadata.calls.mostRecent().args[1] as FilterShortcut[];
        expect(callArgs.find(s => s.id === 'shortcut1')).toBeUndefined();
        expect(callArgs.length).toBe(2);
      });
    });
  });
});
