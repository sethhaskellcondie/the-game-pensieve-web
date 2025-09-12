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
  });
});
