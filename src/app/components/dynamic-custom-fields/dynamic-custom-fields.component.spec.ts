import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';

import { DynamicCustomFieldsComponent } from './dynamic-custom-fields.component';
import { ApiService, CustomField, CustomFieldValue } from '../../services/api.service';
import { SettingsService } from '../../services/settings.service';
import { CustomCheckboxComponent } from '../custom-checkbox/custom-checkbox.component';
import { SelectableNumberInputComponent } from '../selectable-number-input/selectable-number-input.component';
import { SelectableTextInputComponent } from '../selectable-text-input/selectable-text-input.component';

describe('DynamicCustomFieldsComponent', () => {
  let component: DynamicCustomFieldsComponent;
  let fixture: ComponentFixture<DynamicCustomFieldsComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;

  const mockCustomFields: CustomField[] = [
    {
      id: 1,
      name: 'Text Field',
      type: 'text',
      entityKey: 'testEntity'
    },
    {
      id: 2,
      name: 'Number Field',
      type: 'number',
      entityKey: 'testEntity'
    },
    {
      id: 3,
      name: 'Boolean Field',
      type: 'boolean',
      entityKey: 'testEntity'
    }
  ];

  const mockCustomFieldValues: CustomFieldValue[] = [
    {
      customFieldId: 1,
      customFieldName: 'Text Field',
      customFieldType: 'text',
      value: 'test value'
    },
    {
      customFieldId: 2,
      customFieldName: 'Number Field',
      customFieldType: 'number',
      value: '42'
    },
    {
      customFieldId: 3,
      customFieldName: 'Boolean Field',
      customFieldType: 'boolean',
      value: 'true'
    }
  ];

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getCustomFieldsByEntity']);
    const settingsServiceSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        DynamicCustomFieldsComponent,
        CustomCheckboxComponent,
        SelectableNumberInputComponent,
        SelectableTextInputComponent
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: SettingsService, useValue: settingsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicCustomFieldsComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockSettingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;

    // Setup default mocks
    mockSettingsService.getDarkMode$.and.returnValue(of(false));
    mockApiService.getCustomFieldsByEntity.and.returnValue(of(mockCustomFields));
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.customFieldValues).toEqual([]);
      expect(component.customFields).toEqual([]);
      expect(component.fieldValues).toEqual({});
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.isDarkMode).toBeFalse();
      expect(component.hasCustomFields).toBeFalse();
    });

    it('should subscribe to dark mode changes on init', () => {
      mockSettingsService.getDarkMode$.and.returnValue(of(true));
      component.ngOnInit();
      expect(component.isDarkMode).toBeTrue();
    });

    it('should load custom fields on init when entityKey is provided', () => {
      component.entityKey = 'testEntity';
      component.ngOnInit();
      expect(mockApiService.getCustomFieldsByEntity).toHaveBeenCalledWith('testEntity');
    });

    it('should not load custom fields on init when entityKey is not provided', () => {
      component.ngOnInit();
      expect(mockApiService.getCustomFieldsByEntity).not.toHaveBeenCalled();
    });
  });

  describe('Custom Fields Loading', () => {
    beforeEach(() => {
      component.entityKey = 'testEntity';
    });


    it('should handle API errors when loading custom fields', async () => {
      const errorMessage = 'Failed to load custom fields';
      mockApiService.getCustomFieldsByEntity.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      component.loadCustomFields();
      
      // Wait for the observable to complete and then check results
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toContain('Failed to load custom fields');
    });

    it('should not load custom fields when entityKey is not provided', () => {
      component.entityKey = '';
      component.loadCustomFields();
      expect(mockApiService.getCustomFieldsByEntity).not.toHaveBeenCalled();
    });

    it('should populate field values after loading custom fields', async () => {
      component.customFieldValues = mockCustomFieldValues;
      component.loadCustomFields();
      
      // Wait for the observable to complete and then check results
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.fieldValues[1]).toBe('test value'); // text field
      expect(component.fieldValues[2]).toBe(42); // number field (converted from string)
      expect(component.fieldValues[3]).toBeTrue(); // boolean field (converted from string)
    });
  });

  describe('Field Value Initialization', () => {
    beforeEach(() => {
      component.customFields = mockCustomFields;
    });

    it('should initialize field values with defaults', () => {
      component.initializeFieldValues();

      expect(component.fieldValues[1]).toBe(''); // text field default
      expect(component.fieldValues[2]).toBe(''); // number field default
      expect(component.fieldValues[3]).toBeFalse(); // boolean field default
    });

    it('should populate field values from provided custom field values', () => {
      component.customFieldValues = mockCustomFieldValues;
      component.initializeFieldValues();

      expect(component.fieldValues[1]).toBe('test value');
      expect(component.fieldValues[2]).toBe(42);
      expect(component.fieldValues[3]).toBeTrue();
    });

    it('should emit custom field values after initialization', () => {
      spyOn(component.customFieldValuesChange, 'emit');
      component.initializeFieldValues();
      expect(component.customFieldValuesChange.emit).toHaveBeenCalled();
    });
  });

  describe('Field Value Population', () => {
    beforeEach(() => {
      component.customFields = mockCustomFields;
      component.initializeFieldValues();
    });

    it('should populate text field values correctly', () => {
      const textFieldValue: CustomFieldValue = {
        customFieldId: 1,
        customFieldName: 'Text Field',
        customFieldType: 'text',
        value: 'updated text'
      };
      component.customFieldValues = [textFieldValue];
      component.populateFieldValues();

      expect(component.fieldValues[1]).toBe('updated text');
    });

    it('should populate number field values correctly', () => {
      const numberFieldValue: CustomFieldValue = {
        customFieldId: 2,
        customFieldName: 'Number Field',
        customFieldType: 'number',
        value: '100'
      };
      component.customFieldValues = [numberFieldValue];
      component.populateFieldValues();

      expect(component.fieldValues[2]).toBe(100);
    });

    it('should handle zero values for number fields correctly', () => {
      const numberFieldValue: CustomFieldValue = {
        customFieldId: 2,
        customFieldName: 'Number Field',
        customFieldType: 'number',
        value: '0'
      };
      component.customFieldValues = [numberFieldValue];
      component.populateFieldValues();

      expect(component.fieldValues[2]).toBe(0);
    });

    it('should handle empty string values for number fields correctly', () => {
      const numberFieldValue: CustomFieldValue = {
        customFieldId: 2,
        customFieldName: 'Number Field',
        customFieldType: 'number',
        value: ''
      };
      component.customFieldValues = [numberFieldValue];
      component.populateFieldValues();

      expect(component.fieldValues[2]).toBe(0);
    });

    it('should populate boolean field values correctly', () => {
      const booleanFieldValue: CustomFieldValue = {
        customFieldId: 3,
        customFieldName: 'Boolean Field',
        customFieldType: 'boolean',
        value: 'false'
      };
      component.customFieldValues = [booleanFieldValue];
      component.populateFieldValues();

      expect(component.fieldValues[3]).toBeFalse();
    });

    it('should ignore field values for fields that do not exist', () => {
      const invalidFieldValue: CustomFieldValue = {
        customFieldId: 999,
        customFieldName: 'Non-existent Field',
        customFieldType: 'text',
        value: 'should be ignored'
      };
      component.customFieldValues = [invalidFieldValue];
      component.populateFieldValues();

      expect(component.fieldValues[999]).toBeUndefined();
    });
  });

  describe('Value Conversion', () => {
    beforeEach(() => {
      component.customFields = mockCustomFields;
      component.initializeFieldValues();
    });

    it('should convert text values to strings correctly', () => {
      const result = component['convertValueToString']('test text', 'text');
      expect(result).toBe('test text');
    });

    it('should convert empty text values to empty strings', () => {
      const result = component['convertValueToString']('', 'text');
      expect(result).toBe('');
    });

    it('should convert null text values to empty strings', () => {
      const result = component['convertValueToString'](null, 'text');
      expect(result).toBe('');
    });

    it('should convert number values to strings correctly', () => {
      const result = component['convertValueToString'](42, 'number');
      expect(result).toBe('42');
    });

    it('should convert zero number values to strings correctly', () => {
      const result = component['convertValueToString'](0, 'number');
      expect(result).toBe('0');
    });

    it('should convert empty number values to "0"', () => {
      const result = component['convertValueToString']('', 'number');
      expect(result).toBe('0');
    });

    it('should convert null number values to "0"', () => {
      const result = component['convertValueToString'](null, 'number');
      expect(result).toBe('0');
    });

    it('should convert boolean values to strings correctly', () => {
      expect(component['convertValueToString'](true, 'boolean')).toBe('true');
      expect(component['convertValueToString'](false, 'boolean')).toBe('false');
    });

    it('should convert truthy values to "true" for boolean fields', () => {
      expect(component['convertValueToString']('yes', 'boolean')).toBe('true');
      expect(component['convertValueToString'](1, 'boolean')).toBe('true');
    });

    it('should convert falsy values to "false" for boolean fields', () => {
      expect(component['convertValueToString']('', 'boolean')).toBe('false');
      expect(component['convertValueToString'](0, 'boolean')).toBe('false');
      expect(component['convertValueToString'](null, 'boolean')).toBe('false');
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      component.customFields = mockCustomFields;
      component.initializeFieldValues();
    });

    it('should emit custom field values when field value changes', () => {
      spyOn(component.customFieldValuesChange, 'emit');
      component.onFieldValueChange();
      expect(component.customFieldValuesChange.emit).toHaveBeenCalled();
    });

    it('should emit enter pressed event', () => {
      spyOn(component.enterPressed, 'emit');
      component.onEnterPressed();
      expect(component.enterPressed.emit).toHaveBeenCalled();
    });

    it('should emit correctly formatted custom field values', () => {
      spyOn(component.customFieldValuesChange, 'emit');
      
      // Set some field values
      component.fieldValues[1] = 'test text';
      component.fieldValues[2] = 123;
      component.fieldValues[3] = true;
      
      component.onFieldValueChange();
      
      const expectedValues: CustomFieldValue[] = [
        {
          customFieldId: 1,
          customFieldName: 'Text Field',
          customFieldType: 'text',
          value: 'test text'
        },
        {
          customFieldId: 2,
          customFieldName: 'Number Field',
          customFieldType: 'number',
          value: '123'
        },
        {
          customFieldId: 3,
          customFieldName: 'Boolean Field',
          customFieldType: 'boolean',
          value: 'true'
        }
      ];
      
      expect(component.customFieldValuesChange.emit).toHaveBeenCalledWith(expectedValues);
    });
  });

  describe('Component Changes', () => {
    it('should reload custom fields when entityKey changes', () => {
      component.customFields = mockCustomFields;
      spyOn(component, 'loadCustomFields');
      
      const changes = {
        entityKey: new SimpleChange('oldEntity', 'newEntity', false)
      };
      
      component.ngOnChanges(changes);
      expect(component.loadCustomFields).toHaveBeenCalled();
    });

    it('should not reload custom fields on first change of entityKey', () => {
      spyOn(component, 'loadCustomFields');
      
      const changes = {
        entityKey: new SimpleChange(undefined, 'newEntity', true)
      };
      
      component.ngOnChanges(changes);
      expect(component.loadCustomFields).not.toHaveBeenCalled();
    });

    it('should populate field values when customFieldValues change and customFields exist', () => {
      component.customFields = mockCustomFields;
      spyOn(component, 'populateFieldValues');
      
      const changes = {
        customFieldValues: new SimpleChange([], mockCustomFieldValues, false)
      };
      
      component.ngOnChanges(changes);
      expect(component.populateFieldValues).toHaveBeenCalled();
    });

    it('should not populate field values when customFieldValues change but no customFields exist', () => {
      component.customFields = [];
      spyOn(component, 'populateFieldValues');
      
      const changes = {
        customFieldValues: new SimpleChange([], mockCustomFieldValues, false)
      };
      
      component.ngOnChanges(changes);
      expect(component.populateFieldValues).not.toHaveBeenCalled();
    });
  });

  describe('Component Destruction', () => {
    it('should complete destroy subject on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      component.entityKey = 'testEntity';
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should display loading message when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const loadingElement = fixture.nativeElement.querySelector('.loading-message');
      expect(loadingElement).toBeTruthy();
      expect(loadingElement.textContent).toContain('Loading custom fields...');
    });

    it('should display error message when there is an error', () => {
      component.isLoading = false;
      component.errorMessage = 'Test error message';
      fixture.detectChanges();
      
      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error message');
    });

    it('should display custom fields when loaded successfully', () => {
      component.isLoading = false;
      component.errorMessage = '';
      fixture.detectChanges();
      
      const customFieldsContainer = fixture.nativeElement.querySelector('.custom-fields-container');
      expect(customFieldsContainer).toBeTruthy();
      
      const fieldGroups = fixture.nativeElement.querySelectorAll('.custom-field-group');
      expect(fieldGroups.length).toBe(mockCustomFields.length);
    });

    it('should display section title when provided', () => {
      component.sectionTitle = 'Test Section Title';
      component.isLoading = false;
      component.errorMessage = '';
      fixture.detectChanges();
      
      const sectionTitle = fixture.nativeElement.querySelector('.section-title');
      expect(sectionTitle).toBeTruthy();
      expect(sectionTitle.textContent).toContain('Test Section Title');
    });

    it('should not display section title when not provided', () => {
      component.sectionTitle = undefined;
      component.isLoading = false;
      component.errorMessage = '';
      fixture.detectChanges();
      
      const sectionTitle = fixture.nativeElement.querySelector('.section-title');
      expect(sectionTitle).toBeFalsy();
    });

    it('should apply dark mode class when dark mode is enabled', () => {
      mockSettingsService.getDarkMode$.and.returnValue(of(true));
      component.ngOnInit();
      component.isLoading = false;
      component.errorMessage = '';
      fixture.detectChanges();
      
      const container = fixture.nativeElement.querySelector('.custom-fields-container');
      expect(container.classList.contains('dark-mode')).toBeTruthy();
    });

    it('should not display custom fields container when no custom fields exist', () => {
      component.customFields = [];
      component.isLoading = false;
      component.errorMessage = '';
      fixture.detectChanges();
      
      const customFieldsContainer = fixture.nativeElement.querySelector('.custom-fields-container');
      expect(customFieldsContainer).toBeFalsy();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow: load fields, populate values, emit changes', async () => {
      let emittedValues: CustomFieldValue[] = [];
      component.customFieldValuesChange.subscribe(values => {
        emittedValues = values;
      });
      
      component.entityKey = 'testEntity';
      component.customFieldValues = mockCustomFieldValues;
      
      component.ngOnInit();
      
      // Wait for the observable to complete and then check results
      await fixture.whenStable();
      fixture.detectChanges();
      
      // Should have loaded custom fields and populated values
      expect(component.customFields).toEqual(mockCustomFields);
      expect(component.fieldValues[1]).toBe('test value');
      expect(component.fieldValues[2]).toBe(42);
      expect(component.fieldValues[3]).toBeTrue();
      
      // Should have emitted the formatted values
      expect(emittedValues.length).toBe(3);
      expect(emittedValues[0].value).toBe('test value');
      expect(emittedValues[1].value).toBe('42');
      expect(emittedValues[2].value).toBe('true');
    });

    it('should handle field value changes and emit updates', async () => {
      component.entityKey = 'testEntity';
      component.ngOnInit();
      
      // Wait for the observable to complete and then check results
      await fixture.whenStable();
      fixture.detectChanges();
      
      let emittedValues: CustomFieldValue[] = [];
      component.customFieldValuesChange.subscribe(values => {
        emittedValues = values;
      });
      
      // Simulate user input
      component.fieldValues[1] = 'new text value';
      component.fieldValues[2] = 999;
      component.fieldValues[3] = false;
      
      component.onFieldValueChange();
      
      expect(emittedValues.length).toBe(3);
      expect(emittedValues[0].value).toBe('new text value');
      expect(emittedValues[1].value).toBe('999');
      expect(emittedValues[2].value).toBe('false');
    });
  });
});