import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { SystemsComponent } from './systems.component';
import { ApiService } from '../../services/api.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';

describe('SystemsComponent', () => {
  let component: SystemsComponent;
  let fixture: ComponentFixture<SystemsComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let filterService: jasmine.SpyObj<FilterService>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let errorSnackbarService: jasmine.SpyObj<ErrorSnackbarService>;

  const mockCustomFields = [
    { id: 1, name: 'Test Text Field', type: 'text' as const, entityKey: 'system' },
    { id: 2, name: 'Test Number Field', type: 'number' as const, entityKey: 'system' },
    { id: 3, name: 'Test Boolean Field', type: 'boolean' as const, entityKey: 'system' }
  ];

  const mockSystems = [
    {
      key: 'system1',
      id: 1,
      name: 'Test System',
      generation: 8,
      handheld: false,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: []
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getSystems', 'getCustomFieldsByEntity', 'createSystem']);
    const filterSpy = jasmine.createSpyObj('FilterService', ['getActiveFilters', 'getFiltersWithDefaults', 'hasActiveFilters', 'saveFiltersForEntity', 'clearFiltersForEntity']);
    const settingsSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$', 'getMassInputMode$']);
    const errorSpy = jasmine.createSpyObj('ErrorSnackbarService', ['showSuccess']);

    await TestBed.configureTestingModule({
      imports: [SystemsComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: FilterService, useValue: filterSpy },
        { provide: SettingsService, useValue: settingsSpy },
        { provide: ErrorSnackbarService, useValue: errorSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemsComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    filterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    errorSnackbarService = TestBed.inject(ErrorSnackbarService) as jasmine.SpyObj<ErrorSnackbarService>;

    // Setup default spy returns
    apiService.getSystems.and.returnValue(of(mockSystems));
    apiService.getCustomFieldsByEntity.and.returnValue(of(mockCustomFields));
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

    it('should initialize newSystem with default custom field values when opening new system modal', () => {
      component.openNewSystemModal();
      
      expect(component.newSystem.customFieldValues).toEqual([
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
      component.newSystem = {
        name: 'Test System',
        generation: 8,
        handheld: false,
        customFieldValues: [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'modified value' }
        ]
      };

      apiService.createSystem.and.returnValue(of(mockSystems[0]));

      component.onSubmitAndAddAnother();

      expect(component.newSystem.name).toBe('');
      expect(component.newSystem.customFieldValues).toEqual([
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
      expect(apiService.getCustomFieldsByEntity).toHaveBeenCalledWith('system');
      expect(component.availableCustomFields).toEqual(mockCustomFields);
    });

    it('should include custom field values in POST request when creating system', () => {
      const customFieldValues = [
        { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Custom text value' },
        { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '42' },
        { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
      ];

      component.newSystem = {
        name: 'Nintendo Switch',
        generation: 9,
        handheld: true,
        customFieldValues: customFieldValues
      };

      apiService.createSystem.and.returnValue(of(mockSystems[0]));

      component.onSubmitNewSystem();

      expect(apiService.createSystem).toHaveBeenCalledWith({
        name: 'Nintendo Switch',
        generation: 9,
        handheld: true,
        customFieldValues: customFieldValues
      });
    });

    describe('custom field display logic', () => {
      const systemWithCustomFields = {
        key: 'system1',
        id: 1,
        name: 'Test System',
        generation: 8,
        handheld: false,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        customFieldValues: [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: 'Some text' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '42' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'true' }
        ]
      };

      const systemWithEmptyCustomFields = {
        key: 'system2',
        id: 2,
        name: 'Empty System',
        generation: 8,
        handheld: false,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        customFieldValues: [
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'false' }
        ]
      };

      const systemWithNoCustomFields = {
        key: 'system3',
        id: 3,
        name: 'No Fields System',
        generation: 8,
        handheld: false,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        customFieldValues: []
      };

      beforeEach(() => {
        component.systems = [systemWithCustomFields, systemWithEmptyCustomFields, systemWithNoCustomFields];
      });

      describe('shouldDisplayCustomField', () => {
        it('should return true for text field with non-empty value', () => {
          expect(component.shouldDisplayCustomField(systemWithCustomFields, 'Test Text Field')).toBe(true);
        });

        it('should return false for text field with empty value', () => {
          expect(component.shouldDisplayCustomField(systemWithEmptyCustomFields, 'Test Text Field')).toBe(false);
        });

        it('should return true for number field with non-zero value', () => {
          expect(component.shouldDisplayCustomField(systemWithCustomFields, 'Test Number Field')).toBe(true);
        });

        it('should return true for number field with zero value', () => {
          expect(component.shouldDisplayCustomField(systemWithEmptyCustomFields, 'Test Number Field')).toBe(true);
        });

        it('should return false for boolean fields (handled separately)', () => {
          expect(component.shouldDisplayCustomField(systemWithCustomFields, 'Test Boolean Field')).toBe(false);
          expect(component.shouldDisplayCustomField(systemWithEmptyCustomFields, 'Test Boolean Field')).toBe(false);
        });

        it('should return false for non-existent custom fields', () => {
          expect(component.shouldDisplayCustomField(systemWithNoCustomFields, 'Test Text Field')).toBe(false);
          expect(component.shouldDisplayCustomField(systemWithNoCustomFields, 'Test Number Field')).toBe(false);
          expect(component.shouldDisplayCustomField(systemWithNoCustomFields, 'Test Boolean Field')).toBe(false);
        });
      });

      describe('shouldDisplayBooleanBadge', () => {
        it('should return true for boolean field with value', () => {
          expect(component.shouldDisplayBooleanBadge(systemWithCustomFields, 'Test Boolean Field')).toBe(true);
          expect(component.shouldDisplayBooleanBadge(systemWithEmptyCustomFields, 'Test Boolean Field')).toBe(true);
        });

        it('should return false for non-boolean fields', () => {
          expect(component.shouldDisplayBooleanBadge(systemWithCustomFields, 'Test Text Field')).toBe(false);
          expect(component.shouldDisplayBooleanBadge(systemWithCustomFields, 'Test Number Field')).toBe(false);
        });

        it('should return false for non-existent custom fields', () => {
          expect(component.shouldDisplayBooleanBadge(systemWithNoCustomFields, 'Test Boolean Field')).toBe(false);
        });
      });
    });
  });

  describe('edit system modal logic', () => {
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

    describe('openUpdateSystemModal', () => {
      it('should populate modal with system data and merged custom field values', () => {
        const systemToUpdate = {
          key: 'system1',
          id: 1,
          name: 'Nintendo Switch',
          generation: 8,
          handheld: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: 'Existing text' }
          ]
        };

        component.openUpdateSystemModal(systemToUpdate);

        expect(component.isUpdateMode).toBe(true);
        expect(component.systemToUpdate).toBe(systemToUpdate);
        expect(component.showNewSystemModal).toBe(true);
        expect(component.newSystem.name).toBe('Nintendo Switch');
        expect(component.newSystem.generation).toBe(8);
        expect(component.newSystem.handheld).toBe(true);
        expect(component.newSystem.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Existing text' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
        ]);
      });

      it('should provide default values for all custom fields when system has no custom field values', () => {
        const systemToUpdate = {
          key: 'system1',
          id: 1,
          name: 'Nintendo Switch',
          generation: 8,
          handheld: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: []
        };

        component.openUpdateSystemModal(systemToUpdate);

        expect(component.newSystem.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
        ]);
      });

      it('should preserve existing custom field values and add defaults for new fields', () => {
        const systemToUpdate = {
          key: 'system1',
          id: 1,
          name: 'Nintendo Switch',
          generation: 8,
          handheld: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: [
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '25' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'true' }
          ]
        };

        component.openUpdateSystemModal(systemToUpdate);

        expect(component.newSystem.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '25' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
        ]);
      });
    });
  });
});
