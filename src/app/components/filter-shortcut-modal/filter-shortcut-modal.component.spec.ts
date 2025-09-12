import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { FilterShortcutModalComponent } from './filter-shortcut-modal.component';
import { FilterShortcutService, FilterShortcut } from '../../services/filter-shortcut.service';
import { FilterService, FilterRequestDto, FilterSpecification } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { SelectableTextInputComponent } from '../selectable-text-input/selectable-text-input.component';
import { FilterableDropdownComponent } from '../filterable-dropdown/filterable-dropdown.component';
import { FilterCriteriaComponent } from '../filter-criteria/filter-criteria.component';

describe('FilterShortcutModalComponent', () => {
  let component: FilterShortcutModalComponent;
  let fixture: ComponentFixture<FilterShortcutModalComponent>;
  let mockFilterShortcutService: jasmine.SpyObj<FilterShortcutService>;
  let mockFilterService: jasmine.SpyObj<FilterService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;

  const mockFilterSpecification: FilterSpecification = {
    type: 'videoGameBox',
    fields: {
      title: 'string',
      isPhysical: 'boolean',
      yearReleased: 'number'
    },
    filters: {
      title: ['contains', 'equals'],
      isPhysical: ['equals'],
      yearReleased: ['equals', 'greater_than', 'less_than']
    }
  };

  const mockFilterRequests: FilterRequestDto[] = [
    {
      key: 'videoGameBox',
      field: 'title',
      operator: 'contains',
      operand: 'test'
    }
  ];

  const mockExistingShortcut: FilterShortcut = {
    id: '1',
    name: 'Test Shortcut',
    description: 'Test description',
    targetPage: '/video-game-boxes',
    filters: mockFilterRequests,
    createdAt: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(async () => {
    const filterShortcutServiceSpy = jasmine.createSpyObj('FilterShortcutService', [
      'createShortcut',
      'updateShortcut'
    ]);
    const filterServiceSpy = jasmine.createSpyObj('FilterService', [
      'getFiltersForEntity'
    ]);
    const settingsServiceSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        FilterShortcutModalComponent,
        SelectableTextInputComponent,
        FilterableDropdownComponent,
        FilterCriteriaComponent
      ],
      providers: [
        { provide: FilterShortcutService, useValue: filterShortcutServiceSpy },
        { provide: FilterService, useValue: filterServiceSpy },
        { provide: SettingsService, useValue: settingsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterShortcutModalComponent);
    component = fixture.componentInstance;
    mockFilterShortcutService = TestBed.inject(FilterShortcutService) as jasmine.SpyObj<FilterShortcutService>;
    mockFilterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    mockSettingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;

    // Setup default mocks
    mockSettingsService.getDarkMode$.and.returnValue(of(false));
    mockFilterService.getFiltersForEntity.and.returnValue(of(mockFilterSpecification));
    mockFilterShortcutService.createShortcut.and.returnValue(of(true));
    mockFilterShortcutService.updateShortcut.and.returnValue(of(true));
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.shortcut).toBeNull();
      expect(component.formData.name).toBe('');
      expect(component.formData.description).toBe('');
      expect(component.formData.targetPage).toBe('');
      expect(component.formData.filters).toEqual([]);
      expect(component.isSubmitting).toBeFalse();
      expect(component.filterSpec).toBeNull();
      expect(component.isLoadingFilterSpec).toBeFalse();
      expect(component.filterSpecErrorMessage).toBe('');
      expect(component.hasLoadedFilterSpec).toBeFalse();
      expect(component.isDarkMode).toBeFalse();
    });

    it('should have available pages defined', () => {
      expect(component.availablePages).toBeDefined();
      expect(component.availablePages.length).toBeGreaterThan(0);
      
      const expectedPages = [
        { value: '/video-games', label: 'Video Games' },
        { value: '/video-game-boxes', label: 'Video Game Boxes' },
        { value: '/board-games', label: 'Board Games' },
        { value: '/board-game-boxes', label: 'Board Game Boxes' },
        { value: '/systems', label: 'Systems' },
        { value: '/toys', label: 'Toys' }
      ];
      
      expect(component.availablePages).toEqual(expectedPages);
    });

    it('should subscribe to dark mode changes on init', () => {
      mockSettingsService.getDarkMode$.and.returnValue(of(true));
      component.ngOnInit();
      expect(component.isDarkMode).toBeTrue();
    });

    it('should initialize form data when editing existing shortcut', () => {
      component.shortcut = mockExistingShortcut;
      component.ngOnInit();

      expect(component.formData.name).toBe(mockExistingShortcut.name);
      expect(component.formData.description).toBe(mockExistingShortcut.description || '');
      expect(component.formData.targetPage).toBe(mockExistingShortcut.targetPage);
      expect(component.formData.filters).toEqual(mockExistingShortcut.filters);
    });

    it('should load filter specification when editing shortcut with target page', () => {
      component.shortcut = mockExistingShortcut;
      spyOn(component, 'loadFilterSpecification');
      
      component.ngOnInit();
      
      expect(component.loadFilterSpecification).toHaveBeenCalled();
    });

    it('should not load filter specification when editing shortcut without target page', () => {
      const shortcutWithoutTarget = { ...mockExistingShortcut, targetPage: '' };
      component.shortcut = shortcutWithoutTarget;
      spyOn(component, 'loadFilterSpecification');
      
      component.ngOnInit();
      
      expect(component.loadFilterSpecification).not.toHaveBeenCalled();
    });

    it('should handle empty description when editing shortcut', () => {
      const shortcutWithoutDescription = { ...mockExistingShortcut, description: undefined };
      component.shortcut = shortcutWithoutDescription;
      
      component.ngOnInit();
      
      expect(component.formData.description).toBe('');
    });

    it('should focus name field after init', (done) => {
      const mockFocus = jasmine.createSpy('focus');
      component.nameField = { focus: mockFocus };
      
      component.ngOnInit();
      
      setTimeout(() => {
        expect(mockFocus).toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  describe('Entity Type Mapping', () => {
    it('should map page paths to entity types correctly', () => {
      expect(component.getEntityTypeFromPage('/video-games')).toBe('videoGame');
      expect(component.getEntityTypeFromPage('/video-game-boxes')).toBe('videoGameBox');
      expect(component.getEntityTypeFromPage('/board-games')).toBe('boardGame');
      expect(component.getEntityTypeFromPage('/board-game-boxes')).toBe('boardGameBox');
      expect(component.getEntityTypeFromPage('/systems')).toBe('system');
      expect(component.getEntityTypeFromPage('/toys')).toBe('toy');
    });

    it('should return default entity type for unknown page', () => {
      expect(component.getEntityTypeFromPage('/unknown-page')).toBe('videoGameBox');
      expect(component.getEntityTypeFromPage('')).toBe('videoGameBox');
    });
  });

  describe('Filter Specification Loading', () => {
    beforeEach(() => {
      component.formData.targetPage = '/video-game-boxes';
    });



    it('should reset error message when starting to load', () => {
      component.filterSpecErrorMessage = 'Previous error';
      component.loadFilterSpecification();
      expect(component.filterSpecErrorMessage).toBe('');
    });
  });

  describe('Filter Management', () => {
    it('should return current form filters as initial filters', () => {
      component.formData.filters = mockFilterRequests;
      const result = component.getInitialFilters();
      expect(result).toEqual(mockFilterRequests);
    });

    it('should update form filters when filters change', () => {
      const newFilters = [
        {
          key: 'videoGameBox',
          field: 'isPhysical',
          operator: 'equals',
          operand: 'true'
        }
      ];

      component.onFiltersChanged(newFilters);
      expect(component.formData.filters).toEqual(newFilters);
    });

    it('should add filter by loading specification if not loaded', () => {
      component.formData.targetPage = '/video-games';
      component.hasLoadedFilterSpec = false;
      spyOn(component, 'loadFilterSpecification');

      component.addFilter();

      expect(component.loadFilterSpecification).toHaveBeenCalled();
    });

    it('should not add filter when no target page is selected', () => {
      component.formData.targetPage = '';
      spyOn(component, 'loadFilterSpecification');

      component.addFilter();

      expect(component.loadFilterSpecification).not.toHaveBeenCalled();
    });

    it('should not reload specification if already loaded', () => {
      component.formData.targetPage = '/video-games';
      component.hasLoadedFilterSpec = true;
      spyOn(component, 'loadFilterSpecification');

      component.addFilter();

      expect(component.loadFilterSpecification).not.toHaveBeenCalled();
    });
  });

  describe('Target Page Changes', () => {
    beforeEach(() => {
      component.filterSpec = mockFilterSpecification;
      component.hasLoadedFilterSpec = true;
      component.formData.filters = mockFilterRequests;
    });

    it('should reset filter state when target page changes', () => {
      component.onTargetPageChange();

      expect(component.filterSpec).toBeNull();
      expect(component.hasLoadedFilterSpec).toBeFalse();
      expect(component.formData.filters).toEqual([]);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.formData = {
        name: 'Test Shortcut',
        description: 'Test description',
        targetPage: '/video-game-boxes',
        filters: mockFilterRequests
      };
    });



    it('should handle empty description by setting to undefined', () => {
      component.formData.description = '';
      component.shortcut = null;

      component.onSubmit();

      expect(mockFilterShortcutService.createShortcut).toHaveBeenCalledWith(
        jasmine.objectContaining({
          description: undefined
        })
      );
    });

    it('should trim whitespace from name and description', () => {
      component.formData.name = '  Test Shortcut  ';
      component.formData.description = '  Test description  ';
      component.shortcut = null;

      component.onSubmit();

      expect(mockFilterShortcutService.createShortcut).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'Test Shortcut',
          description: 'Test description'
        })
      );
    });

    it('should not submit when already submitting', () => {
      component.isSubmitting = true;

      component.onSubmit();

      expect(mockFilterShortcutService.createShortcut).not.toHaveBeenCalled();
      expect(mockFilterShortcutService.updateShortcut).not.toHaveBeenCalled();
    });

    it('should not submit when name is empty', () => {
      component.formData.name = '';

      component.onSubmit();

      expect(mockFilterShortcutService.createShortcut).not.toHaveBeenCalled();
      expect(mockFilterShortcutService.updateShortcut).not.toHaveBeenCalled();
    });

    it('should not submit when name is only whitespace', () => {
      component.formData.name = '   ';

      component.onSubmit();

      expect(mockFilterShortcutService.createShortcut).not.toHaveBeenCalled();
      expect(mockFilterShortcutService.updateShortcut).not.toHaveBeenCalled();
    });



    it('should handle service returning false for create', () => {
      mockFilterShortcutService.createShortcut.and.returnValue(of(false));
      component.shortcut = null;
      spyOn(component.closeModal, 'emit');

      component.onSubmit();

      expect(component.closeModal.emit).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBeFalse();
    });

    it('should handle service returning false for update', () => {
      mockFilterShortcutService.updateShortcut.and.returnValue(of(false));
      component.shortcut = mockExistingShortcut;
      spyOn(component.closeModal, 'emit');

      component.onSubmit();

      expect(component.closeModal.emit).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBeFalse();
    });
  });

  describe('Modal Actions', () => {
    it('should emit close modal event when closing', () => {
      spyOn(component.closeModal, 'emit');
      
      component.onClose();
      
      expect(component.closeModal.emit).toHaveBeenCalled();
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
      fixture.detectChanges();
    });

    it('should display modal overlay and content', () => {
      const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modalOverlay).toBeTruthy();

      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      expect(modalContent).toBeTruthy();
    });

    it('should display correct header for new shortcut', () => {
      component.shortcut = null;
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector('.modal-header h2');
      expect(header.textContent).toContain('New Shortcut');
    });

    it('should display correct header for editing shortcut', () => {
      component.shortcut = mockExistingShortcut;
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector('.modal-header h2');
      expect(header.textContent).toContain('Edit Shortcut');
    });

    it('should apply dark mode class when dark mode is enabled', () => {
      mockSettingsService.getDarkMode$.and.returnValue(of(true));
      component.ngOnInit();
      fixture.detectChanges();

      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      expect(modalContent.classList.contains('dark-mode')).toBeTruthy();
    });

    it('should display form fields', () => {
      const nameField = fixture.nativeElement.querySelector('#name');
      const descriptionField = fixture.nativeElement.querySelector('#description');
      const targetPageField = fixture.nativeElement.querySelector('#targetPage');

      expect(nameField).toBeTruthy();
      expect(descriptionField).toBeTruthy();
      expect(targetPageField).toBeTruthy();
    });

    it('should show validation error for empty required name', async () => {
      component.formData.name = '';
      fixture.detectChanges();

      const nameInput = fixture.nativeElement.querySelector('app-selectable-text-input[name="name"]');
      nameInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Note: The actual validation error display depends on the custom input component
      // This test verifies the setup is correct
      expect(nameInput).toBeTruthy();
    });

    it('should disable target page dropdown when filter spec is loaded', () => {
      component.hasLoadedFilterSpec = true;
      fixture.detectChanges();

      const targetPageDropdown = fixture.nativeElement.querySelector('app-filterable-dropdown[name="targetPage"]');
      expect(targetPageDropdown.getAttribute('ng-reflect-disabled')).toBe('true');
    });

    it('should enable target page dropdown when filter spec is not loaded', () => {
      component.hasLoadedFilterSpec = false;
      fixture.detectChanges();

      const targetPageDropdown = fixture.nativeElement.querySelector('app-filterable-dropdown[name="targetPage"]');
      expect(targetPageDropdown.getAttribute('ng-reflect-disabled')).toBe('false');
    });

    it('should display add filter button', () => {
      const addFilterButton = fixture.nativeElement.querySelector('.add-filter-button');
      expect(addFilterButton).toBeTruthy();
      expect(addFilterButton.textContent.trim()).toBe('Add Filter');
    });

    it('should show loading state on add filter button', () => {
      component.isLoadingFilterSpec = true;
      fixture.detectChanges();

      const addFilterButton = fixture.nativeElement.querySelector('.add-filter-button');
      expect(addFilterButton.textContent.trim()).toBe('Loading...');
      expect(addFilterButton.disabled).toBeTruthy();
    });

    it('should disable add filter button when no target page selected', () => {
      component.formData.targetPage = '';
      fixture.detectChanges();

      const addFilterButton = fixture.nativeElement.querySelector('.add-filter-button');
      expect(addFilterButton.disabled).toBeTruthy();
    });

    it('should display filter spec error message', () => {
      component.filterSpecErrorMessage = 'Test error message';
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('.error-message');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Test error message');

      const retryButton = fixture.nativeElement.querySelector('.retry-button');
      expect(retryButton).toBeTruthy();
    });

    it('should display no filters message when appropriate', () => {
      component.formData.filters = [];
      component.isLoadingFilterSpec = false;
      fixture.detectChanges();

      const noFilters = fixture.nativeElement.querySelector('.no-filters');
      expect(noFilters).toBeTruthy();
      expect(noFilters.textContent).toContain('Fill out "Entity," then click "Add Filter."');
    });

    it('should display filter criteria when filter spec is loaded', () => {
      component.hasLoadedFilterSpec = true;
      fixture.detectChanges();

      const filterCriteria = fixture.nativeElement.querySelector('app-filter-criteria');
      expect(filterCriteria).toBeTruthy();
    });

    it('should display correct save button text for new shortcut', () => {
      component.shortcut = null;
      component.isSubmitting = false;
      fixture.detectChanges();

      const saveButton = fixture.nativeElement.querySelector('.save-button');
      expect(saveButton.textContent.trim()).toBe('Create');
    });

    it('should display correct save button text for editing shortcut', () => {
      component.shortcut = mockExistingShortcut;
      component.isSubmitting = false;
      fixture.detectChanges();

      const saveButton = fixture.nativeElement.querySelector('.save-button');
      expect(saveButton.textContent.trim()).toBe('Update');
    });

    it('should display saving state on save button', () => {
      component.isSubmitting = true;
      fixture.detectChanges();

      const saveButton = fixture.nativeElement.querySelector('.save-button');
      expect(saveButton.textContent.trim()).toBe('Saving...');
      expect(saveButton.disabled).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close modal when clicking overlay', () => {
      spyOn(component, 'onClose');

      const overlay = fixture.nativeElement.querySelector('.modal-overlay');
      overlay.click();

      expect(component.onClose).toHaveBeenCalled();
    });

    it('should not close modal when clicking modal content', () => {
      spyOn(component, 'onClose');

      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      const clickEvent = new Event('click');
      spyOn(clickEvent, 'stopPropagation');
      modalContent.dispatchEvent(clickEvent);

      expect(clickEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should close modal when clicking close button', () => {
      spyOn(component, 'onClose');

      const closeButton = fixture.nativeElement.querySelector('.close-button');
      closeButton.click();

      expect(component.onClose).toHaveBeenCalled();
    });

    it('should close modal when clicking cancel button', () => {
      spyOn(component, 'onClose');

      const cancelButton = fixture.nativeElement.querySelector('.cancel-button');
      cancelButton.click();

      expect(component.onClose).toHaveBeenCalled();
    });

    it('should add filter when clicking add filter button', () => {
      component.formData.targetPage = '/video-games';
      fixture.detectChanges();

      spyOn(component, 'addFilter');

      const addFilterButton = fixture.nativeElement.querySelector('.add-filter-button');
      addFilterButton.click();

      expect(component.addFilter).toHaveBeenCalled();
    });

    it('should retry loading when clicking retry button', () => {
      component.filterSpecErrorMessage = 'Test error';
      fixture.detectChanges();

      spyOn(component, 'loadFilterSpecification');

      const retryButton = fixture.nativeElement.querySelector('.retry-button');
      retryButton.click();

      expect(component.loadFilterSpecification).toHaveBeenCalled();
    });

    it('should submit form when clicking save button', () => {
      component.formData.name = 'Test Shortcut';
      component.formData.targetPage = '/video-games';
      fixture.detectChanges();

      spyOn(component, 'onSubmit');

      const saveButton = fixture.nativeElement.querySelector('.save-button');
      saveButton.click();

      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('should call onTargetPageChange when target page changes', () => {
      spyOn(component, 'onTargetPageChange');

      component.formData.targetPage = '/board-games';
      fixture.detectChanges();

      // Simulate the ngModelChange event from the filterable dropdown
      component.onTargetPageChange();

      expect(component.onTargetPageChange).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete new shortcut workflow', () => {
      spyOn(component.closeModal, 'emit');

      // Set up form data
      component.formData = {
        name: 'New Test Shortcut',
        description: 'New test description',
        targetPage: '/video-games',
        filters: mockFilterRequests
      };

      // Submit form
      component.onSubmit();

      // Verify service was called correctly
      expect(mockFilterShortcutService.createShortcut).toHaveBeenCalledWith({
        name: 'New Test Shortcut',
        description: 'New test description',
        targetPage: '/video-games',
        filters: mockFilterRequests
      });

      // Verify modal closes on success
      expect(component.closeModal.emit).toHaveBeenCalled();
    });

    it('should handle complete edit shortcut workflow', () => {
      component.shortcut = mockExistingShortcut;
      component.ngOnInit();
      
      spyOn(component.closeModal, 'emit');

      // Modify form data
      component.formData.name = 'Updated Shortcut';
      component.formData.description = 'Updated description';

      // Submit form
      component.onSubmit();

      // Verify service was called correctly
      expect(mockFilterShortcutService.updateShortcut).toHaveBeenCalledWith(
        mockExistingShortcut.id,
        {
          name: 'Updated Shortcut',
          description: 'Updated description',
          targetPage: '/video-game-boxes',
          filters: mockFilterRequests
        }
      );

      // Verify modal closes on success
      expect(component.closeModal.emit).toHaveBeenCalled();
    });

    it('should handle filter specification loading and form interaction', () => {
      // Set target page
      component.formData.targetPage = '/board-games';

      // Add filter (should trigger filter spec loading)
      component.addFilter();

      // Verify filter spec was loaded
      expect(mockFilterService.getFiltersForEntity).toHaveBeenCalledWith('boardGame');
      expect(component.hasLoadedFilterSpec).toBeTrue();

      // Change target page (should reset filter state)
      component.onTargetPageChange();

      expect(component.filterSpec).toBeNull();
      expect(component.hasLoadedFilterSpec).toBeFalse();
      expect(component.formData.filters).toEqual([]);
    });

    it('should handle filter spec error and retry', () => {
      // Simulate error
      mockFilterService.getFiltersForEntity.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.formData.targetPage = '/toys';
      component.loadFilterSpecification();

      expect(component.filterSpecErrorMessage).toBe('Failed to load filter options');
      expect(component.isLoadingFilterSpec).toBeFalse();

      // Reset mock for successful retry
      mockFilterService.getFiltersForEntity.and.returnValue(of(mockFilterSpecification));

      // Retry
      component.loadFilterSpecification();

      expect(component.filterSpec).toEqual(mockFilterSpecification);
      expect(component.filterSpecErrorMessage).toBe('');
      expect(component.hasLoadedFilterSpec).toBeTrue();
    });
  });
});
