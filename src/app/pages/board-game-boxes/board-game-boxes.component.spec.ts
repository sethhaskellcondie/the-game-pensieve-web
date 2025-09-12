import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { BoardGameBoxesComponent } from './board-game-boxes.component';
import { ApiService } from '../../services/api.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';

describe('BoardGameBoxesComponent', () => {
  let component: BoardGameBoxesComponent;
  let fixture: ComponentFixture<BoardGameBoxesComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let filterService: jasmine.SpyObj<FilterService>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let errorSnackbarService: jasmine.SpyObj<ErrorSnackbarService>;
  let router: jasmine.SpyObj<Router>;

  const mockCustomFields = [
    { id: 1, name: 'Test Text Field', type: 'text' as const, entityKey: 'boardGameBox' },
    { id: 2, name: 'Test Number Field', type: 'number' as const, entityKey: 'boardGameBox' },
    { id: 3, name: 'Test Boolean Field', type: 'boolean' as const, entityKey: 'boardGameBox' }
  ];

  const mockBoardGameBoxes = [
    {
      key: 'box1',
      id: 1,
      title: 'Test Board Game Box',
      isExpansion: false,
      isStandAlone: true,
      baseSetId: null,
      boardGameId: 1,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: []
    }
  ];

  const mockBoardGames = [
    {
      id: 1,
      key: 'game1',
      title: 'Test Board Game',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: []
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getBoardGameBoxes', 'getCustomFieldsByEntity', 'createBoardGameBox', 'getBoardGames']);
    const filterSpy = jasmine.createSpyObj('FilterService', ['getActiveFilters', 'getFiltersWithDefaults', 'hasActiveFilters', 'saveFiltersForEntity', 'clearFiltersForEntity']);
    const settingsSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$', 'getMassInputMode$']);
    const errorSpy = jasmine.createSpyObj('ErrorSnackbarService', ['showSuccess']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BoardGameBoxesComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: FilterService, useValue: filterSpy },
        { provide: SettingsService, useValue: settingsSpy },
        { provide: ErrorSnackbarService, useValue: errorSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardGameBoxesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    filterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    errorSnackbarService = TestBed.inject(ErrorSnackbarService) as jasmine.SpyObj<ErrorSnackbarService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default spy returns
    apiService.getBoardGameBoxes.and.returnValue(of(mockBoardGameBoxes));
    apiService.getCustomFieldsByEntity.and.returnValue(of(mockCustomFields));
    apiService.getBoardGames.and.returnValue(of(mockBoardGames));
    filterService.getActiveFilters.and.returnValue([]);
    filterService.getFiltersWithDefaults.and.returnValue([]);
    filterService.hasActiveFilters.and.returnValue(false);
    settingsService.getDarkMode$.and.returnValue(of(false));
    settingsService.getMassInputMode$.and.returnValue(of(false));
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('custom field default values', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.availableCustomFields = mockCustomFields;
    });

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

    it('should initialize newBoardGameBox with default custom field values when opening modal', () => {
      component.openNewBoardGameBoxModal();
      
      expect(component.newBoardGameBox.customFieldValues).toEqual([
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


    it('should load custom fields on component init', () => {
      expect(apiService.getCustomFieldsByEntity).toHaveBeenCalledWith('boardGameBox');
      expect(component.availableCustomFields).toEqual(mockCustomFields);
    });


    describe('custom field display logic', () => {
      const boxWithCustomFields = {
        key: 'box1',
        id: 1,
        title: 'Test Board Game Box',
        isExpansion: false,
        isStandAlone: true,
        baseSetId: null,
        boardGameId: 1,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        customFieldValues: [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: 'Some text' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '42' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'true' }
        ]
      };

      const boxWithEmptyCustomFields = {
        key: 'box2',
        id: 2,
        title: 'Empty Board Game Box',
        isExpansion: false,
        isStandAlone: true,
        baseSetId: null,
        boardGameId: 1,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        customFieldValues: [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'false' }
        ]
      };

      const boxWithNoCustomFields = {
        key: 'box3',
        id: 3,
        title: 'No Fields Board Game Box',
        isExpansion: false,
        isStandAlone: true,
        baseSetId: null,
        boardGameId: 1,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        customFieldValues: []
      };

      beforeEach(() => {
        component.boardGameBoxes = [boxWithCustomFields, boxWithEmptyCustomFields, boxWithNoCustomFields];
      });

      describe('shouldDisplayCustomField', () => {
        it('should return true for text field with non-empty value', () => {
          expect(component.shouldDisplayCustomField(boxWithCustomFields, 'Test Text Field')).toBe(true);
        });

        it('should return false for text field with empty value', () => {
          expect(component.shouldDisplayCustomField(boxWithEmptyCustomFields, 'Test Text Field')).toBe(false);
        });

        it('should return true for number field with non-zero value', () => {
          expect(component.shouldDisplayCustomField(boxWithCustomFields, 'Test Number Field')).toBe(true);
        });

        it('should return true for number field with zero value', () => {
          expect(component.shouldDisplayCustomField(boxWithEmptyCustomFields, 'Test Number Field')).toBe(true);
        });

        it('should return false for boolean fields (handled separately)', () => {
          expect(component.shouldDisplayCustomField(boxWithCustomFields, 'Test Boolean Field')).toBe(false);
          expect(component.shouldDisplayCustomField(boxWithEmptyCustomFields, 'Test Boolean Field')).toBe(false);
        });

        it('should return false for non-existent custom fields', () => {
          expect(component.shouldDisplayCustomField(boxWithNoCustomFields, 'Test Text Field')).toBe(false);
          expect(component.shouldDisplayCustomField(boxWithNoCustomFields, 'Test Number Field')).toBe(false);
          expect(component.shouldDisplayCustomField(boxWithNoCustomFields, 'Test Boolean Field')).toBe(false);
        });
      });

      describe('shouldDisplayBooleanBadge', () => {
        it('should return true for boolean field with value', () => {
          expect(component.shouldDisplayBooleanBadge(boxWithCustomFields, 'Test Boolean Field')).toBe(true);
          expect(component.shouldDisplayBooleanBadge(boxWithEmptyCustomFields, 'Test Boolean Field')).toBe(true);
        });

        it('should return false for non-boolean fields', () => {
          expect(component.shouldDisplayBooleanBadge(boxWithCustomFields, 'Test Text Field')).toBe(false);
          expect(component.shouldDisplayBooleanBadge(boxWithCustomFields, 'Test Number Field')).toBe(false);
        });

        it('should return false for non-existent custom fields', () => {
          expect(component.shouldDisplayBooleanBadge(boxWithNoCustomFields, 'Test Boolean Field')).toBe(false);
        });
      });
    });
  });
});
