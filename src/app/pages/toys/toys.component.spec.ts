import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ToysComponent } from './toys.component';
import { ApiService } from '../../services/api.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';

describe('ToysComponent', () => {
  let component: ToysComponent;
  let fixture: ComponentFixture<ToysComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let filterService: jasmine.SpyObj<FilterService>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let errorSnackbarService: jasmine.SpyObj<ErrorSnackbarService>;

  const mockCustomFields = [
    { id: 1, name: 'Test Text Field', type: 'text' as const, entityKey: 'toy' },
    { id: 2, name: 'Test Number Field', type: 'number' as const, entityKey: 'toy' },
    { id: 3, name: 'Test Boolean Field', type: 'boolean' as const, entityKey: 'toy' }
  ];

  const mockToys = [
    {
      key: 'toy1',
      id: 1,
      name: 'Test Toy',
      set: 'Test Set',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: []
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getToys', 'getCustomFieldsByEntity', 'createToy']);
    const filterSpy = jasmine.createSpyObj('FilterService', ['getActiveFilters', 'getFiltersWithDefaults', 'hasActiveFilters', 'saveFiltersForEntity', 'clearFiltersForEntity', 'getFilterDisplayText']);
    const settingsSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$', 'getMassInputMode$']);
    const errorSpy = jasmine.createSpyObj('ErrorSnackbarService', ['showSuccess']);

    await TestBed.configureTestingModule({
      imports: [ToysComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: FilterService, useValue: filterSpy },
        { provide: SettingsService, useValue: settingsSpy },
        { provide: ErrorSnackbarService, useValue: errorSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToysComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    filterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    errorSnackbarService = TestBed.inject(ErrorSnackbarService) as jasmine.SpyObj<ErrorSnackbarService>;

    // Setup default spy returns
    apiService.getToys.and.returnValue(of(mockToys));
    apiService.getCustomFieldsByEntity.and.returnValue(of(mockCustomFields));
    filterService.getActiveFilters.and.returnValue([]);
    filterService.getFiltersWithDefaults.and.returnValue([]);
    filterService.hasActiveFilters.and.returnValue(false);
    filterService.getFilterDisplayText.and.returnValue('');
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

    it('should initialize newToy with default custom field values when opening new toy modal', () => {
      component.openNewToyModal();
      
      expect(component.newToy.customFieldValues).toEqual([
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

    it('should reset custom field values to defaults when submitting and adding another', () => {
      component.newToy = {
        name: 'Test Toy',
        set: 'Test Set',
        customFieldValues: [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'modified value' }
        ]
      };

      apiService.createToy.and.returnValue(of(mockToys[0]));

      component.onSubmitAndAddAnother();

      expect(component.newToy.name).toBe('');
      expect(component.newToy.customFieldValues).toEqual([
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
      expect(apiService.getCustomFieldsByEntity).toHaveBeenCalledWith('toy');
      expect(component.availableCustomFields).toEqual(mockCustomFields);
    });

    it('should include custom field values in POST request when creating toy', () => {
      const customFieldValues = [
        { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Custom text value' },
        { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '42' },
        { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
      ];

      component.newToy = {
        name: 'Action Figure',
        set: 'Superhero Set',
        customFieldValues: customFieldValues
      };

      apiService.createToy.and.returnValue(of(mockToys[0]));

      component.onSubmitNewToy();

      expect(apiService.createToy).toHaveBeenCalledWith({
        name: 'Action Figure',
        set: 'Superhero Set',
        customFieldValues: customFieldValues
      });
    });

    describe('custom field display logic', () => {
      const toyWithCustomFields = {
        key: 'toy1',
        id: 1,
        name: 'Test Toy',
        set: 'Test Set',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        customFieldValues: [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: 'Some text' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '42' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'true' }
        ]
      };

      const toyWithEmptyCustomFields = {
        key: 'toy2',
        id: 2,
        name: 'Empty Toy',
        set: 'Empty Set',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        customFieldValues: [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'false' }
        ]
      };

      const toyWithNoCustomFields = {
        key: 'toy3',
        id: 3,
        name: 'No Fields Toy',
        set: 'No Fields Set',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        customFieldValues: []
      };

      beforeEach(() => {
        component.toys = [toyWithCustomFields, toyWithEmptyCustomFields, toyWithNoCustomFields];
      });

      describe('shouldDisplayCustomField', () => {
        it('should return true for text field with non-empty value', () => {
          expect(component.shouldDisplayCustomField(toyWithCustomFields, 'Test Text Field')).toBe(true);
        });

        it('should return false for text field with empty value', () => {
          expect(component.shouldDisplayCustomField(toyWithEmptyCustomFields, 'Test Text Field')).toBe(false);
        });

        it('should return true for number field with non-zero value', () => {
          expect(component.shouldDisplayCustomField(toyWithCustomFields, 'Test Number Field')).toBe(true);
        });

        it('should return true for number field with zero value', () => {
          expect(component.shouldDisplayCustomField(toyWithEmptyCustomFields, 'Test Number Field')).toBe(true);
        });

        it('should return false for boolean fields (handled separately)', () => {
          expect(component.shouldDisplayCustomField(toyWithCustomFields, 'Test Boolean Field')).toBe(false);
          expect(component.shouldDisplayCustomField(toyWithEmptyCustomFields, 'Test Boolean Field')).toBe(false);
        });

        it('should return false for non-existent custom fields', () => {
          expect(component.shouldDisplayCustomField(toyWithNoCustomFields, 'Test Text Field')).toBe(false);
          expect(component.shouldDisplayCustomField(toyWithNoCustomFields, 'Test Number Field')).toBe(false);
          expect(component.shouldDisplayCustomField(toyWithNoCustomFields, 'Test Boolean Field')).toBe(false);
        });
      });

      describe('shouldDisplayBooleanBadge', () => {
        it('should return true for boolean field with value', () => {
          expect(component.shouldDisplayBooleanBadge(toyWithCustomFields, 'Test Boolean Field')).toBe(true);
          expect(component.shouldDisplayBooleanBadge(toyWithEmptyCustomFields, 'Test Boolean Field')).toBe(true);
        });

        it('should return false for non-boolean fields', () => {
          expect(component.shouldDisplayBooleanBadge(toyWithCustomFields, 'Test Text Field')).toBe(false);
          expect(component.shouldDisplayBooleanBadge(toyWithCustomFields, 'Test Number Field')).toBe(false);
        });

        it('should return false for non-existent custom fields', () => {
          expect(component.shouldDisplayBooleanBadge(toyWithNoCustomFields, 'Test Boolean Field')).toBe(false);
        });
      });
    });
  });

  describe('edit toy modal logic', () => {
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

    describe('openUpdateToyModal', () => {
      it('should populate modal with toy data and merged custom field values', () => {
        const toyToUpdate = {
          key: 'toy1',
          id: 1,
          name: 'LEGO Castle',
          set: 'Medieval Set',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: 'Existing text' }
          ]
        };

        component.openUpdateToyModal(toyToUpdate);

        expect(component.isUpdateMode).toBe(true);
        expect(component.toyToUpdate).toBe(toyToUpdate);
        expect(component.showNewToyModal).toBe(true);
        expect(component.newToy.name).toBe('LEGO Castle');
        expect(component.newToy.set).toBe('Medieval Set');
        expect(component.newToy.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Existing text' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
        ]);
      });

      it('should provide default values for all custom fields when toy has no custom field values', () => {
        const toyToUpdate = {
          key: 'toy1',
          id: 1,
          name: 'LEGO Castle',
          set: 'Medieval Set',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: []
        };

        component.openUpdateToyModal(toyToUpdate);

        expect(component.newToy.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
        ]);
      });

      it('should preserve existing custom field values and add defaults for new fields', () => {
        const toyToUpdate = {
          key: 'toy1',
          id: 1,
          name: 'LEGO Castle',
          set: 'Medieval Set',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: [
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '25' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'true' }
          ]
        };

        component.openUpdateToyModal(toyToUpdate);

        expect(component.newToy.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '25' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
        ]);
      });
    });
  });
});
