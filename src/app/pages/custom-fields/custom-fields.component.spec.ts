import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { CustomFieldsComponent } from './custom-fields.component';
import { ApiService, CustomField } from '../../services/api.service';
import { IconService } from '../../services/icon.service';
import { SettingsService } from '../../services/settings.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';
import { FilterableDropdownComponent } from '../../components/filterable-dropdown/filterable-dropdown.component';
import { SelectableTextInputComponent } from '../../components/selectable-text-input/selectable-text-input.component';

describe('CustomFieldsComponent', () => {
  let component: CustomFieldsComponent;
  let fixture: ComponentFixture<CustomFieldsComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockIconService: jasmine.SpyObj<IconService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let mockErrorSnackbarService: jasmine.SpyObj<ErrorSnackbarService>;

  const mockCustomFields: CustomField[] = [
    {
      id: 1,
      name: 'Test Text Field',
      type: 'text',
      entityKey: 'videoGame'
    },
    {
      id: 2,
      name: 'Test Number Field', 
      type: 'number',
      entityKey: 'system'
    },
    {
      id: 3,
      name: 'Test Boolean Field',
      type: 'boolean', 
      entityKey: 'toy'
    }
  ];

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getCustomFields',
      'getCustomFieldsByEntity',
      'createCustomField',
      'updateCustomFieldName',
      'deleteCustomField'
    ]);
    const iconServiceSpy = jasmine.createSpyObj('IconService', ['getIcon']);
    const settingsServiceSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$', 'getMassInputMode$']);
    const errorSnackbarServiceSpy = jasmine.createSpyObj('ErrorSnackbarService', ['processApiErrors', 'showSuccess']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        CustomFieldsComponent,
        FilterableDropdownComponent,
        SelectableTextInputComponent
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: IconService, useValue: iconServiceSpy },
        { provide: SettingsService, useValue: settingsServiceSpy },
        { provide: ErrorSnackbarService, useValue: errorSnackbarServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomFieldsComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockIconService = TestBed.inject(IconService) as jasmine.SpyObj<IconService>;
    mockSettingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    mockErrorSnackbarService = TestBed.inject(ErrorSnackbarService) as jasmine.SpyObj<ErrorSnackbarService>;

    // Setup default mocks
    mockSettingsService.getDarkMode$.and.returnValue(of(false));
    mockSettingsService.getMassInputMode$.and.returnValue(of(false));
    mockApiService.getCustomFields.and.returnValue(of(mockCustomFields));
    mockIconService.getIcon.and.returnValue('<svg></svg>' as any);

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.customFields).toEqual([]);
      expect(component.customFieldsCount).toBe(0);
      expect(component.sortedCustomFields).toEqual([]);
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.sortColumn).toBe('entity');
      expect(component.sortDirection).toBe('asc');
      expect(component.showNewCustomFieldModal).toBeFalse();
      expect(component.isCreating).toBeFalse();
      expect(component.editingFieldId).toBeNull();
      expect(component.showDeleteConfirmModal).toBeFalse();
      expect(component.showFilterModal).toBeFalse();
      expect(component.isDarkMode).toBeFalse();
      expect(component.isMassInputMode).toBeFalse();
    });

    it('should have correct type and entity options', () => {
      expect(component.typeOptions).toEqual([
        { value: 'text', label: 'Text' },
        { value: 'number', label: 'Number' },
        { value: 'boolean', label: 'Boolean' }
      ]);

      expect(component.entityOptions).toEqual([
        { value: 'toy', label: 'Toy' },
        { value: 'system', label: 'System' },
        { value: 'videoGame', label: 'Video Game' },
        { value: 'videoGameBox', label: 'Video Game Box' },
        { value: 'boardGame', label: 'Board Game' },
        { value: 'boardGameBox', label: 'Board Game Box' }
      ]);
    });

    it('should subscribe to dark mode changes on init', () => {
      mockSettingsService.getDarkMode$.and.returnValue(of(true));
      component.ngOnInit();
      expect(component.isDarkMode).toBeTrue();
    });

    it('should subscribe to mass input mode changes on init', () => {
      mockSettingsService.getMassInputMode$.and.returnValue(of(true));
      component.ngOnInit();
      expect(component.isMassInputMode).toBeTrue();
    });

    it('should load saved filter on init', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('videoGame');
      mockApiService.getCustomFieldsByEntity.and.returnValue(of([mockCustomFields[0]]));
      component.ngOnInit();
      expect(component.currentFilter).toBe('videoGame');
    });

    it('should load custom fields on init', () => {
      component.ngOnInit();
      expect(mockApiService.getCustomFields).toHaveBeenCalled();
    });
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load all custom fields when no filter is applied', () => {
      component.currentFilter = null;
      component.loadCustomFields();

      expect(mockApiService.getCustomFields).toHaveBeenCalled();
      expect(component.customFields).toEqual(mockCustomFields);
      expect(component.customFieldsCount).toBe(3);
      expect(component.isLoading).toBeFalse();
    });

    it('should load filtered custom fields when filter is applied', () => {
      const filteredFields = [mockCustomFields[0]];
      mockApiService.getCustomFieldsByEntity.and.returnValue(of(filteredFields));
      component.currentFilter = 'videoGame';
      
      component.loadCustomFields();

      expect(mockApiService.getCustomFieldsByEntity).toHaveBeenCalledWith('videoGame');
      expect(component.customFields).toEqual(filteredFields);
      expect(component.customFieldsCount).toBe(1);
    });

    it('should handle errors when loading all custom fields', () => {
      mockApiService.getCustomFields.and.returnValue(throwError(() => new Error('API Error')));
      component.loadCustomFields();

      expect(component.customFieldsCount).toBe(0);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle errors when loading filtered custom fields', () => {
      mockApiService.getCustomFieldsByEntity.and.returnValue(throwError(() => new Error('API Error')));
      component.currentFilter = 'videoGame';
      component.loadCustomFields();

      expect(component.customFieldsCount).toBe(0);
      expect(component.isLoading).toBeFalse();
    });

    it('should apply sorting after loading data', () => {
      spyOn(component, 'applySorting');
      component.loadCustomFields();
      expect(component.applySorting).toHaveBeenCalled();
    });
  });

  describe('Sorting Functionality', () => {
    beforeEach(() => {
      component.customFields = mockCustomFields;
      component.sortedCustomFields = [...mockCustomFields];
      fixture.detectChanges();
    });

    it('should sort by name in ascending order', () => {
      component.sortTable('name');
      expect(component.sortColumn).toBe('name');
      expect(component.sortDirection).toBe('asc');
    });

    it('should toggle sort direction when clicking same column', () => {
      component.sortColumn = 'name';
      component.sortDirection = 'asc';
      component.sortTable('name');
      expect(component.sortDirection).toBe('desc');
    });

    it('should reset to ascending when switching columns', () => {
      component.sortColumn = 'name';
      component.sortDirection = 'desc';
      component.sortTable('type');
      expect(component.sortColumn).toBe('type');
      expect(component.sortDirection).toBe('asc');
    });


    it('should apply sorting correctly for entity column', () => {
      component.sortColumn = 'entity';
      component.sortDirection = 'asc';
      component.applySorting();
      
      expect(component.sortedCustomFields[0].entityKey).toBe('system');
      expect(component.sortedCustomFields[2].entityKey).toBe('videoGame');
    });

    it('should return correct sort icons', () => {
      component.sortColumn = 'name';
      component.sortDirection = 'asc';
      expect(component.getSortIcon('name')).toBe('↑');
      
      component.sortDirection = 'desc';
      expect(component.getSortIcon('name')).toBe('↓');
      
      expect(component.getSortIcon('type')).toBe('↕');
    });
  });

  describe('Create Modal Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open new custom field modal', () => {
      spyOn(component as any, 'focusNameInput');
      component.openNewCustomFieldModal();
      
      expect(component.showNewCustomFieldModal).toBeTrue();
      expect(component.newCustomField).toEqual({
        name: '',
        type: '',
        entityKey: ''
      });
      expect((component as any).focusNameInput).toHaveBeenCalled();
    });

    it('should close new custom field modal and reset form', () => {
      component.showNewCustomFieldModal = true;
      component.newCustomField = { name: 'test', type: 'text', entityKey: 'toy' };
      
      component.closeNewCustomFieldModal();
      
      expect(component.showNewCustomFieldModal).toBeFalse();
      expect(component.newCustomField).toEqual({
        name: '',
        type: '',
        entityKey: ''
      });
    });

    it('should submit new custom field successfully', () => {
      const newField = { name: 'New Field', type: 'text', entityKey: 'toy' };
      component.newCustomField = newField;
      mockApiService.createCustomField.and.returnValue(of({ id: 4, ...newField } as CustomField));
      spyOn(component, 'loadCustomFields');
      
      component.onSubmitNewCustomField();
      
      expect(component.isCreating).toBeFalse();
      expect(mockApiService.createCustomField).toHaveBeenCalledWith(newField);
      expect(component.showNewCustomFieldModal).toBeFalse();
      expect(component.loadCustomFields).toHaveBeenCalled();
    });

    it('should handle error when submitting new custom field', () => {
      component.newCustomField = { name: 'New Field', type: 'text', entityKey: 'toy' };
      mockApiService.createCustomField.and.returnValue(throwError(() => new Error('API Error')));
      
      component.onSubmitNewCustomField();
      
      expect(component.isCreating).toBeFalse();
      expect(component.showNewCustomFieldModal).toBeFalse();
    });

    it('should not submit when already creating', () => {
      component.isCreating = true;
      component.onSubmitNewCustomField();
      expect(mockApiService.createCustomField).not.toHaveBeenCalled();
    });

    it('should submit and add another successfully', () => {
      const newField = { name: 'New Field', type: 'text', entityKey: 'toy' };
      component.newCustomField = newField;
      component.showNewCustomFieldModal = true; // Modal should already be open
      mockApiService.createCustomField.and.returnValue(of({ id: 4, ...newField } as CustomField));
      spyOn(component, 'loadCustomFields');
      spyOn(component as any, 'focusNameInput');
      
      component.onSubmitAndAddAnother();
      
      expect(component.isCreating).toBeFalse();
      expect(component.showNewCustomFieldModal).toBeTrue(); // Modal stays open
      expect(component.newCustomField.name).toBe(''); // Only name is cleared
      expect(component.newCustomField.type).toBe('text'); // Type stays
      expect(component.newCustomField.entityKey).toBe('toy'); // Entity stays
      expect(component.loadCustomFields).toHaveBeenCalled();
      expect((component as any).focusNameInput).toHaveBeenCalled();
      expect(mockErrorSnackbarService.showSuccess).toHaveBeenCalledWith('Custom Field created successfully');
    });
  });

  describe('Edit Operations', () => {
    beforeEach(() => {
      component.customFields = mockCustomFields;
      fixture.detectChanges();
    });

    it('should start editing field', () => {
      const field = mockCustomFields[0];
      component.startEditingField(field);
      
      expect(component.editingFieldId).toBe(field.id);
      expect(component.editingFieldName).toBe(field.name);
    });

    it('should cancel editing', () => {
      component.editingFieldId = 1;
      component.editingFieldName = 'Edited Name';
      
      component.cancelEditing();
      
      expect(component.editingFieldId).toBeNull();
      expect(component.editingFieldName).toBe('');
    });

    it('should save field name successfully', () => {
      const field = mockCustomFields[0];
      component.editingFieldId = field.id;
      component.editingFieldName = 'Updated Name';
      const updatedField = { ...field, name: 'Updated Name' };
      mockApiService.updateCustomFieldName.and.returnValue(of(updatedField));
      spyOn(component, 'applySorting');
      
      component.saveFieldName(field);
      
      expect(mockApiService.updateCustomFieldName).toHaveBeenCalledWith(field.id, 'Updated Name');
      expect(component.isUpdating).toBeFalse();
      expect(component.editingFieldId).toBeNull();
      expect(component.applySorting).toHaveBeenCalled();
    });

    it('should handle error when saving field name', () => {
      const field = mockCustomFields[0];
      component.editingFieldName = 'Updated Name';
      mockApiService.updateCustomFieldName.and.returnValue(throwError(() => new Error('API Error')));
      
      component.saveFieldName(field);
      
      expect(component.isUpdating).toBeFalse();
      expect(component.editingFieldId).toBeNull();
    });

    it('should not save when already updating', () => {
      const field = mockCustomFields[0];
      component.isUpdating = true;
      component.saveFieldName(field);
      expect(mockApiService.updateCustomFieldName).not.toHaveBeenCalled();
    });

    it('should not save when name is empty', () => {
      const field = mockCustomFields[0];
      component.editingFieldName = '';
      component.saveFieldName(field);
      expect(mockApiService.updateCustomFieldName).not.toHaveBeenCalled();
    });

    it('should not save when name is only whitespace', () => {
      const field = mockCustomFields[0];
      component.editingFieldName = '   ';
      component.saveFieldName(field);
      expect(mockApiService.updateCustomFieldName).not.toHaveBeenCalled();
    });
  });

  describe('Delete Operations', () => {
    beforeEach(() => {
      component.customFields = mockCustomFields;
      fixture.detectChanges();
    });

    it('should open delete confirmation modal', () => {
      const field = mockCustomFields[0];
      component.confirmDeleteCustomField(field);
      
      expect(component.showDeleteConfirmModal).toBeTrue();
      expect(component.fieldToDelete).toBe(field);
    });

    it('should close delete confirmation modal', () => {
      component.showDeleteConfirmModal = true;
      component.fieldToDelete = mockCustomFields[0];
      
      component.closeDeleteConfirmModal();
      
      expect(component.showDeleteConfirmModal).toBeFalse();
      expect(component.fieldToDelete).toBeNull();
    });

    it('should delete custom field successfully', () => {
      const field = mockCustomFields[0];
      component.fieldToDelete = field;
      mockApiService.deleteCustomField.and.returnValue(of({}));
      spyOn(component, 'loadCustomFields');
      
      component.deleteCustomField();
      
      expect(mockApiService.deleteCustomField).toHaveBeenCalledWith(field.id);
      expect(component.isDeleting).toBeFalse();
      expect(component.showDeleteConfirmModal).toBeFalse();
      expect(component.fieldToDelete).toBeNull();
      expect(component.loadCustomFields).toHaveBeenCalled();
    });

    it('should handle error when deleting custom field', () => {
      component.fieldToDelete = mockCustomFields[0];
      mockApiService.deleteCustomField.and.returnValue(throwError(() => new Error('API Error')));
      
      component.deleteCustomField();
      
      expect(component.isDeleting).toBeFalse();
      expect(component.showDeleteConfirmModal).toBeFalse();
      expect(component.fieldToDelete).toBeNull();
    });

    it('should not delete when field to delete is null', () => {
      component.fieldToDelete = null;
      component.deleteCustomField();
      expect(mockApiService.deleteCustomField).not.toHaveBeenCalled();
    });

    it('should not delete when already deleting', () => {
      component.fieldToDelete = mockCustomFields[0];
      component.isDeleting = true;
      component.deleteCustomField();
      expect(mockApiService.deleteCustomField).not.toHaveBeenCalled();
    });
  });

  describe('Filter Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Clear any existing spies
      if (mockApiService.getCustomFieldsByEntity && mockApiService.getCustomFieldsByEntity.calls) {
        mockApiService.getCustomFieldsByEntity.calls.reset();
      }
    });

    it('should open filter modal', () => {
      component.openFilterModal();
      expect(component.showFilterModal).toBeTrue();
      expect(component.filterEntityKey).toBe('');
    });

    it('should close filter modal', () => {
      component.showFilterModal = true;
      component.filterEntityKey = 'toy';
      
      component.closeFilterModal();
      
      expect(component.showFilterModal).toBeFalse();
      expect(component.filterEntityKey).toBe('');
    });

    it('should apply filter and save to localStorage', () => {
      component.filterEntityKey = 'videoGame';
      mockApiService.getCustomFieldsByEntity.and.returnValue(of([mockCustomFields[0]]));
      
      component.applyFilter();
      
      expect(component.currentFilter).toBe('videoGame');
      expect(component.showFilterModal).toBeFalse();
      expect(component.isFiltering).toBeFalse();
      expect(localStorage.setItem).toHaveBeenCalledWith('customFields.filter', 'videoGame');
      expect(mockApiService.getCustomFieldsByEntity).toHaveBeenCalledWith('videoGame');
    });

    it('should not apply filter when already filtering', () => {
      // Reset the spy calls count instead of creating a new spy
      mockApiService.getCustomFieldsByEntity.calls.reset();
      component.isFiltering = true;
      component.applyFilter();
      expect(mockApiService.getCustomFieldsByEntity).not.toHaveBeenCalled();
    });

    it('should clear filter and remove from localStorage', () => {
      component.currentFilter = 'videoGame';
      spyOn(component, 'loadCustomFields');
      
      component.clearFilter();
      
      expect(component.currentFilter).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('customFields.filter');
      expect(component.loadCustomFields).toHaveBeenCalled();
    });

    it('should load saved filter from localStorage', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('system');
      (component as any).loadSavedFilter();
      expect(component.currentFilter).toBe('system');
    });

    it('should handle null saved filter from localStorage', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      (component as any).loadSavedFilter();
      expect(component.currentFilter).toBeNull();
    });

    it('should get correct filter display text', () => {
      component.currentFilter = 'videoGame';
      expect(component.getFilterDisplayText()).toBe('Video Game');
      
      component.currentFilter = null;
      expect(component.getFilterDisplayText()).toBe('');
    });
  });

  describe('UI Helper Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should get entity display names correctly', () => {
      expect(component.getEntityDisplayName('toy')).toBe('Toy');
      expect(component.getEntityDisplayName('system')).toBe('System');
      expect(component.getEntityDisplayName('videoGame')).toBe('Video Game');
      expect(component.getEntityDisplayName('videoGameBox')).toBe('Video Game Box');
      expect(component.getEntityDisplayName('boardGame')).toBe('Board Game');
      expect(component.getEntityDisplayName('boardGameBox')).toBe('Board Game Box');
      expect(component.getEntityDisplayName('unknown')).toBe('unknown');
    });

    it('should get entity colors correctly', () => {
      expect(component.getEntityColor('toy')).toBe('#e91e63');
      expect(component.getEntityColor('system')).toBe('#9c27b0');
      expect(component.getEntityColor('videoGame')).toBe('#3f51b5');
      expect(component.getEntityColor('videoGameBox')).toBe('#2196f3');
      expect(component.getEntityColor('boardGame')).toBe('#4caf50');
      expect(component.getEntityColor('boardGameBox')).toBe('#8bc34a');
      expect(component.getEntityColor('unknown')).toBe('#f57c00');
    });

    it('should get icon HTML from icon service', () => {
      const mockIcon = '<svg>test</svg>';
      mockIconService.getIcon.and.returnValue(mockIcon as any);
      
      const result = component.getIconHtml('test-icon');
      
      expect(mockIconService.getIcon).toHaveBeenCalledWith('test-icon');
      expect(result).toBe(mockIcon);
    });

    it('should focus name input', fakeAsync(() => {
      // Create a mock component with focus method
      const mockComponent = {
        focus: jasmine.createSpy('focus')
      };
      component.nameInputComponent = mockComponent as any;
      
      (component as any).focusNameInput();
      tick(100);
      
      expect(mockComponent.focus).toHaveBeenCalled();
    }));
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close new custom field modal on escape press', () => {
      component.showNewCustomFieldModal = true;
      spyOn(component, 'closeNewCustomFieldModal');
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onEscapePress(event);
      
      expect(component.closeNewCustomFieldModal).toHaveBeenCalled();
    });

    it('should not close modal on escape when modal is not open', () => {
      component.showNewCustomFieldModal = false;
      spyOn(component, 'closeNewCustomFieldModal');
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onEscapePress(event);
      
      expect(component.closeNewCustomFieldModal).not.toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should destroy subscriptions on component destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle empty custom fields array', () => {
      mockApiService.getCustomFields.and.returnValue(of([]));
      component.loadCustomFields();
      
      expect(component.customFields).toEqual([]);
      expect(component.customFieldsCount).toBe(0);
      expect(component.sortedCustomFields).toEqual([]);
    });

    it('should handle sorting with empty array', () => {
      component.customFields = [];
      component.sortedCustomFields = [];
      component.applySorting();
      
      expect(component.sortedCustomFields).toEqual([]);
    });

    it('should handle focus name input when component is not ready', fakeAsync(() => {
      component.nameInputComponent = undefined as any;
      
      expect(() => {
        (component as any).focusNameInput();
        tick(100);
      }).not.toThrow();
    }));

    it('should handle empty form submission', () => {
      component.newCustomField = { name: '', type: '', entityKey: '' };
      // Mock the createCustomField to return an observable
      mockApiService.createCustomField.and.returnValue(of({} as any));
      spyOn(component, 'loadCustomFields');
      
      component.onSubmitNewCustomField();
      
      // API will be called even with empty form - validation is typically handled by backend or form validation
      expect(mockApiService.createCustomField).toHaveBeenCalledWith({ name: '', type: '', entityKey: '' });
      expect(component.loadCustomFields).toHaveBeenCalled();
    });
  });
});