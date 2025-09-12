import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { BoardGamesComponent } from './board-games.component';
import { ApiService } from '../../services/api.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';

describe('BoardGamesComponent', () => {
  let component: BoardGamesComponent;
  let fixture: ComponentFixture<BoardGamesComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let filterService: jasmine.SpyObj<FilterService>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let router: jasmine.SpyObj<Router>;

  const mockCustomFields = [
    { id: 1, name: 'Test Text Field', type: 'text' as const, entityKey: 'boardGame' },
    { id: 2, name: 'Test Number Field', type: 'number' as const, entityKey: 'boardGame' },
    { id: 3, name: 'Test Boolean Field', type: 'boolean' as const, entityKey: 'boardGame' }
  ];

  const mockBoardGames = [
    {
      key: 'game1',
      id: 1,
      title: 'Test Board Game',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: []
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getBoardGames', 'getCustomFieldsByEntity', 'updateBoardGame']);
    const filterSpy = jasmine.createSpyObj('FilterService', ['getActiveFilters', 'getFiltersWithDefaults', 'hasActiveFilters', 'saveFiltersForEntity', 'clearFiltersForEntity']);
    const settingsSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BoardGamesComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: FilterService, useValue: filterSpy },
        { provide: SettingsService, useValue: settingsSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardGamesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    filterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default spy returns
    apiService.getBoardGames.and.returnValue(of(mockBoardGames));
    apiService.getCustomFieldsByEntity.and.returnValue(of(mockCustomFields));
    filterService.getActiveFilters.and.returnValue([]);
    filterService.getFiltersWithDefaults.and.returnValue([]);
    filterService.hasActiveFilters.and.returnValue(false);
    settingsService.getDarkMode$.and.returnValue(of(false));
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('custom field display logic', () => {
    const gameWithCustomFields = {
      key: 'game1',
      id: 1,
      title: 'Test Board Game',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: [
        { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: 'Some text' },
        { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '42' },
        { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'true' }
      ]
    };

    const gameWithEmptyCustomFields = {
      key: 'game2',
      id: 2,
      title: 'Empty Board Game',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: [
        { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: '' },
        { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '0' },
        { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'false' }
      ]
    };

    const gameWithNoCustomFields = {
      key: 'game3',
      id: 3,
      title: 'No Fields Board Game',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: []
    };

    const gameWithOnlyEmptyFields = {
      key: 'game4',
      id: 4,
      title: 'Only Empty Fields Board Game',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: [
        { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: '' },
        { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '0' }
      ]
    };

    beforeEach(() => {
      fixture.detectChanges();
      component.availableCustomFields = mockCustomFields;
      component.boardGames = [gameWithCustomFields, gameWithEmptyCustomFields, gameWithNoCustomFields];
    });

    it('should load custom fields on component init', () => {
      expect(apiService.getCustomFieldsByEntity).toHaveBeenCalledWith('boardGame');
      expect(component.availableCustomFields).toEqual(mockCustomFields);
    });

    describe('shouldDisplayCustomField', () => {
      it('should return true for text field with non-empty value', () => {
        expect(component.shouldDisplayCustomField(gameWithCustomFields, 'Test Text Field')).toBe(true);
      });

      it('should return false for text field with empty value', () => {
        expect(component.shouldDisplayCustomField(gameWithEmptyCustomFields, 'Test Text Field')).toBe(false);
      });

      it('should return true for number field with non-zero value', () => {
        expect(component.shouldDisplayCustomField(gameWithCustomFields, 'Test Number Field')).toBe(true);
      });

      it('should return true for number field with zero value', () => {
        expect(component.shouldDisplayCustomField(gameWithEmptyCustomFields, 'Test Number Field')).toBe(true);
      });

      it('should return false for boolean fields (handled separately)', () => {
        expect(component.shouldDisplayCustomField(gameWithCustomFields, 'Test Boolean Field')).toBe(false);
        expect(component.shouldDisplayCustomField(gameWithEmptyCustomFields, 'Test Boolean Field')).toBe(false);
      });

      it('should return false for non-existent custom fields', () => {
        expect(component.shouldDisplayCustomField(gameWithNoCustomFields, 'Test Text Field')).toBe(false);
        expect(component.shouldDisplayCustomField(gameWithNoCustomFields, 'Test Number Field')).toBe(false);
        expect(component.shouldDisplayCustomField(gameWithNoCustomFields, 'Test Boolean Field')).toBe(false);
      });
    });

    describe('shouldDisplayBooleanBadge', () => {
      it('should return true for boolean field with value', () => {
        expect(component.shouldDisplayBooleanBadge(gameWithCustomFields, 'Test Boolean Field')).toBe(true);
        expect(component.shouldDisplayBooleanBadge(gameWithEmptyCustomFields, 'Test Boolean Field')).toBe(true);
      });

      it('should return false for non-boolean fields', () => {
        expect(component.shouldDisplayBooleanBadge(gameWithCustomFields, 'Test Text Field')).toBe(false);
        expect(component.shouldDisplayBooleanBadge(gameWithCustomFields, 'Test Number Field')).toBe(false);
      });

      it('should return false for non-existent custom fields', () => {
        expect(component.shouldDisplayBooleanBadge(gameWithNoCustomFields, 'Test Boolean Field')).toBe(false);
      });
    });

    describe('shouldDisplayCustomFieldInModal', () => {
      it('should return true for boolean fields (always display badges)', () => {
        const booleanField = { customFieldName: 'Test Boolean', customFieldType: 'boolean', value: 'true' };
        const falseBooleanField = { customFieldName: 'Test Boolean', customFieldType: 'boolean', value: 'false' };
        
        expect(component.shouldDisplayCustomFieldInModal(booleanField)).toBe(true);
        expect(component.shouldDisplayCustomFieldInModal(falseBooleanField)).toBe(true);
      });

      it('should return true for text fields with non-empty values', () => {
        const textField = { customFieldName: 'Test Text', customFieldType: 'text', value: 'Some text' };
        expect(component.shouldDisplayCustomFieldInModal(textField)).toBe(true);
      });

      it('should return false for text fields with empty values', () => {
        const emptyTextField = { customFieldName: 'Test Text', customFieldType: 'text', value: '' };
        expect(component.shouldDisplayCustomFieldInModal(emptyTextField)).toBe(false);
      });

      it('should return true for number fields with non-zero values', () => {
        const numberField = { customFieldName: 'Test Number', customFieldType: 'number', value: '42' };
        expect(component.shouldDisplayCustomFieldInModal(numberField)).toBe(true);
      });

      it('should return true for number fields with zero values', () => {
        const zeroNumberField = { customFieldName: 'Test Number', customFieldType: 'number', value: '0' };
        expect(component.shouldDisplayCustomFieldInModal(zeroNumberField)).toBe(true);
      });

      it('should return false for number fields with empty values', () => {
        const emptyNumberField = { customFieldName: 'Test Number', customFieldType: 'number', value: '' };
        expect(component.shouldDisplayCustomFieldInModal(emptyNumberField)).toBe(false);
      });
    });

    describe('hasDisplayableCustomFields', () => {
      it('should return true for board game with displayable custom fields', () => {
        expect(component.hasDisplayableCustomFields(gameWithCustomFields)).toBe(true);
      });

      it('should return true for board game with boolean custom fields (always displayable)', () => {
        expect(component.hasDisplayableCustomFields(gameWithEmptyCustomFields)).toBe(true);
      });

      it('should return true for board game with only empty text and number fields', () => {
        expect(component.hasDisplayableCustomFields(gameWithOnlyEmptyFields)).toBe(true);
      });

      it('should return false for board game with no custom fields', () => {
        expect(component.hasDisplayableCustomFields(gameWithNoCustomFields)).toBe(false);
      });
    });
  });

  describe('edit board game modal logic', () => {
    beforeEach(() => {
      component.availableCustomFields = mockCustomFields;
      fixture.detectChanges();
    });

    describe('mergeWithDefaultCustomFieldValues', () => {
      it('should merge existing custom field values with defaults for missing fields', () => {
        const existingCustomFieldValues = [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Existing text' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
        ];

        const result = component['mergeWithDefaultCustomFieldValues'](existingCustomFieldValues);

        expect(result).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Existing text' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
        ]);
      });

      it('should create all default values when no existing values provided', () => {
        const existingCustomFieldValues: any[] = [];

        const result = component['mergeWithDefaultCustomFieldValues'](existingCustomFieldValues);

        expect(result).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
        ]);
      });

      it('should preserve all existing values when they match available fields', () => {
        const existingCustomFieldValues = [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Existing text' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '42' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
        ];

        const result = component['mergeWithDefaultCustomFieldValues'](existingCustomFieldValues);

        expect(result).toEqual(existingCustomFieldValues);
      });
    });

    describe('openEditBoardGameModal', () => {
      it('should populate modal with board game data and merged custom field values', () => {
        const boardGameToUpdate = {
          key: 'game1',
          id: 1,
          title: 'Monopoly',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: 'Existing text' }
          ]
        };

        component.openEditBoardGameModal(boardGameToUpdate);

        expect(component.boardGameToUpdate).toBe(boardGameToUpdate);
        expect(component.showEditBoardGameModal).toBe(true);
        expect(component.editBoardGame.title).toBe('Monopoly');
        expect(component.editBoardGame.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Existing text' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
        ]);
      });

      it('should provide default values for all custom fields when board game has no custom field values', () => {
        const boardGameToUpdate = {
          key: 'game1',
          id: 1,
          title: 'Monopoly',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: []
        };

        component.openEditBoardGameModal(boardGameToUpdate);

        expect(component.editBoardGame.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
        ]);
      });

      it('should preserve existing custom field values and add defaults for new fields', () => {
        const boardGameToUpdate = {
          key: 'game1',
          id: 1,
          title: 'Monopoly',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: [
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '25' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'true' }
          ]
        };

        component.openEditBoardGameModal(boardGameToUpdate);

        expect(component.editBoardGame.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '25' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
        ]);
      });
    });

    describe('onSubmitEditBoardGame', () => {
      it('should include default values for number custom fields in PUT request', () => {
        const boardGameToUpdate = {
          key: 'game1',
          id: 1,
          title: 'Monopoly',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: 'Some text' }
          ]
        };

        component.openEditBoardGameModal(boardGameToUpdate);
        component.editBoardGame.title = 'Updated Monopoly';

        apiService.updateBoardGame.and.returnValue(of(boardGameToUpdate));

        component.onSubmitEditBoardGame();

        expect(apiService.updateBoardGame).toHaveBeenCalledWith(1, {
          title: 'Updated Monopoly',
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Some text' },
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
          ]
        });
      });

      it('should include modified custom field values in PUT request', () => {
        const boardGameToUpdate = {
          key: 'game1',
          id: 1,
          title: 'Monopoly',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: []
        };

        component.openEditBoardGameModal(boardGameToUpdate);
        component.editBoardGame.title = 'Updated Monopoly';
        
        // Modify the custom field values to simulate user input
        component.editBoardGame.customFieldValues = [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'User entered text' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '42' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
        ];

        apiService.updateBoardGame.and.returnValue(of(boardGameToUpdate));

        component.onSubmitEditBoardGame();

        expect(apiService.updateBoardGame).toHaveBeenCalledWith(1, {
          title: 'Updated Monopoly',
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'User entered text' },
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '42' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
          ]
        });
      });

      it('should reload board games after successful update', () => {
        const boardGameToUpdate = {
          key: 'game1',
          id: 1,
          title: 'Monopoly',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: []
        };

        component.openEditBoardGameModal(boardGameToUpdate);
        component.editBoardGame.title = 'Updated Monopoly';

        apiService.updateBoardGame.and.returnValue(of(boardGameToUpdate));
        spyOn(component, 'loadBoardGames');

        component.onSubmitEditBoardGame();

        expect(component.loadBoardGames).toHaveBeenCalled();
        expect(component.showEditBoardGameModal).toBe(false);
      });
    });

    describe('createDefaultCustomFieldValues', () => {
      it('should create default values for all custom field types', () => {
        const defaultValues = component.createDefaultCustomFieldValues();
        
        expect(defaultValues).toEqual([
          {
            customFieldId: 1,
            customFieldName: 'Test Text Field',
            customFieldType: 'text',
            value: ''
          },
          {
            customFieldId: 2,
            customFieldName: 'Test Number Field',
            customFieldType: 'number',
            value: '0'
          },
          {
            customFieldId: 3,
            customFieldName: 'Test Boolean Field',
            customFieldType: 'boolean',
            value: 'false'
          }
        ]);
      });

      it('should return correct default values for each type', () => {
        expect(component['getDefaultValueForType']('text')).toBe('');
        expect(component['getDefaultValueForType']('number')).toBe('0');
        expect(component['getDefaultValueForType']('boolean')).toBe('false');
        expect(component['getDefaultValueForType']('unknown')).toBe(''); // defaults to empty string
      });
    });

    describe('integration with dynamic custom fields', () => {
      it('should pass default number value "0" to PUT request when user does not modify the field', () => {
        // Simulate a board game with no custom field values initially
        const boardGameToUpdate = {
          key: 'game1',
          id: 1,
          title: 'Monopoly',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: []
        };

        component.openEditBoardGameModal(boardGameToUpdate);
        
        // The edit form should have default values including '0' for number field
        expect(component.editBoardGame.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
        ]);

        // Simulate the form being submitted without the user changing any values
        // The dynamic custom fields component should emit these default values back
        component.editBoardGame.title = 'Updated Title';

        apiService.updateBoardGame.and.returnValue(of(boardGameToUpdate));

        component.onSubmitEditBoardGame();

        // Verify that the PUT request includes the default '0' value for the number field
        expect(apiService.updateBoardGame).toHaveBeenCalledWith(1, {
          title: 'Updated Title',
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
          ]
        });
      });

      it('should pass user-modified number values to PUT request', () => {
        const boardGameToUpdate = {
          key: 'game1',
          id: 1,
          title: 'Monopoly',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: []
        };

        component.openEditBoardGameModal(boardGameToUpdate);
        component.editBoardGame.title = 'Updated Title';
        
        // Simulate user modifying the number field from default '0' to '42'
        component.editBoardGame.customFieldValues = [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '42' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
        ];

        apiService.updateBoardGame.and.returnValue(of(boardGameToUpdate));

        component.onSubmitEditBoardGame();

        // Verify that the PUT request includes the user-modified '42' value
        expect(apiService.updateBoardGame).toHaveBeenCalledWith(1, {
          title: 'Updated Title',
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '42' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
          ]
        });
      });
    });
  });
});
