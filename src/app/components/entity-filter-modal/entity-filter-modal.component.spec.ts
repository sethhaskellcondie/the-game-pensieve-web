import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { SimpleChange } from '@angular/core';

import { EntityFilterModalComponent } from './entity-filter-modal.component';
import { FilterService, FilterSpecification, FilterRequestDto } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { FilterableDropdownComponent } from '../filterable-dropdown/filterable-dropdown.component';
import { FilterCriteriaComponent } from '../filter-criteria/filter-criteria.component';

describe('EntityFilterModalComponent', () => {
  let component: EntityFilterModalComponent;
  let fixture: ComponentFixture<EntityFilterModalComponent>;
  let mockFilterService: jasmine.SpyObj<FilterService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;

  const mockFilterSpecification: FilterSpecification = {
    type: 'testEntity',
    fields: {
      title: 'string',
      isPhysical: 'boolean',
      yearReleased: 'number',
      customField1: 'string'
    },
    filters: {
      title: ['contains', 'equals', 'starts_with'],
      isPhysical: ['equals'],
      yearReleased: ['equals', 'greater_than', 'less_than'],
      customField1: ['contains', 'equals']
    }
  };

  const mockFilterRequests: FilterRequestDto[] = [
    {
      key: 'testEntity',
      field: 'title',
      operator: 'contains',
      operand: 'test'
    },
    {
      key: 'testEntity',
      field: 'isPhysical',
      operator: 'equals',
      operand: 'true'
    }
  ];

  beforeEach(async () => {
    const filterServiceSpy = jasmine.createSpyObj('FilterService', [
      'getFiltersForEntity',
      'getActiveFilters',
      'saveFiltersForEntity',
      'clearFiltersForEntity',
      'hasActiveFilters',
      'convertFiltersForAPI'
    ]);
    const settingsServiceSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        EntityFilterModalComponent,
        FilterableDropdownComponent,
        FilterCriteriaComponent
      ],
      providers: [
        { provide: FilterService, useValue: filterServiceSpy },
        { provide: SettingsService, useValue: settingsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntityFilterModalComponent);
    component = fixture.componentInstance;
    mockFilterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    mockSettingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;

    // Setup default mocks
    mockSettingsService.getDarkMode$.and.returnValue(of(false));
    mockFilterService.getFiltersForEntity.and.returnValue(of(mockFilterSpecification));
    mockFilterService.getActiveFilters.and.returnValue([]);
    mockFilterService.hasActiveFilters.and.returnValue(false);
    mockFilterService.convertFiltersForAPI.and.returnValue(mockFilterRequests);
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.entityType).toBe('');
      expect(component.show).toBeFalse();
      expect(component.filterSpec).toBeNull();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.isDarkMode).toBeFalse();
      expect(component.localFilters).toEqual([]);
    });

    it('should subscribe to dark mode changes on init', () => {
      mockSettingsService.getDarkMode$.and.returnValue(of(true));
      component.ngOnInit();
      expect(component.isDarkMode).toBeTrue();
    });

    it('should load filter specification on init when show is true and entityType is set', () => {
      component.show = true;
      component.entityType = 'testEntity';
      component.ngOnInit();
      expect(mockFilterService.getFiltersForEntity).toHaveBeenCalledWith('testEntity');
    });

    it('should not load filter specification on init when show is false', () => {
      component.show = false;
      component.entityType = 'testEntity';
      component.ngOnInit();
      expect(mockFilterService.getFiltersForEntity).not.toHaveBeenCalled();
    });

    it('should not load filter specification on init when entityType is empty', () => {
      component.show = true;
      component.entityType = '';
      component.ngOnInit();
      expect(mockFilterService.getFiltersForEntity).not.toHaveBeenCalled();
    });
  });

  describe('Filter Specification Loading', () => {
    beforeEach(() => {
      component.entityType = 'testEntity';
    });

    it('should load filter specification successfully', () => {
      // Reset the mock for this specific test
      mockFilterService.getFiltersForEntity.and.returnValue(of(mockFilterSpecification));
      
      component.loadFilterSpecification();
      
      expect(mockFilterService.getFiltersForEntity).toHaveBeenCalledWith('testEntity');

      // After the synchronous part of the observable completes
      expect(component.filterSpec).toEqual(mockFilterSpecification);
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('');
    });

    it('should handle API errors when loading filter specification', () => {
      const errorMessage = 'Failed to load filters';
      mockFilterService.getFiltersForEntity.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      component.loadFilterSpecification();
      
      // After the synchronous part of the error handling completes
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toContain('Failed to load filter options');
      expect(component.filterSpec).toBeNull();
    });

    it('should reset error message when loading starts', () => {
      component.errorMessage = 'Previous error';
      component.loadFilterSpecification();
      expect(component.errorMessage).toBe('');
    });
  });

  describe('NgOnChanges', () => {
    it('should load filter specification when show becomes true and entityType is set', () => {
      component.show = true;
      component.entityType = 'testEntity';
      component.filterSpec = null;
      
      spyOn(component, 'loadFilterSpecification');
      component.ngOnChanges();
      
      expect(component.loadFilterSpecification).toHaveBeenCalled();
    });

    it('should not load filter specification when show is false', () => {
      component.show = false;
      component.entityType = 'testEntity';
      component.filterSpec = null;
      
      spyOn(component, 'loadFilterSpecification');
      component.ngOnChanges();
      
      expect(component.loadFilterSpecification).not.toHaveBeenCalled();
    });

    it('should not load filter specification when entityType is empty', () => {
      component.show = true;
      component.entityType = '';
      component.filterSpec = null;
      
      spyOn(component, 'loadFilterSpecification');
      component.ngOnChanges();
      
      expect(component.loadFilterSpecification).not.toHaveBeenCalled();
    });

    it('should not load filter specification when filterSpec already exists', () => {
      component.show = true;
      component.entityType = 'testEntity';
      component.filterSpec = mockFilterSpecification;
      
      spyOn(component, 'loadFilterSpecification');
      component.ngOnChanges();
      
      expect(component.loadFilterSpecification).not.toHaveBeenCalled();
    });
  });

  describe('Field Name Formatting', () => {
    it('should format specific field names correctly', () => {
      expect(component.formatFieldName('is_expansion')).toBe('Expansion');
      expect(component.formatFieldName('is_stand_alone')).toBe('Standalone');
      expect(component.formatFieldName('is_physical')).toBe('Physical');
      expect(component.formatFieldName('is_collection')).toBe('Collection');
    });

    it('should format camelCase field names correctly', () => {
      expect(component.formatFieldName('yearReleased')).toBe('Year Released');
      expect(component.formatFieldName('customFieldName')).toBe('Custom Field Name');
      expect(component.formatFieldName('someVeryLongFieldName')).toBe('Some Very Long Field Name');
    });

    it('should format single word field names correctly', () => {
      expect(component.formatFieldName('title')).toBe('Title');
      expect(component.formatFieldName('name')).toBe('Name');
      expect(component.formatFieldName('description')).toBe('Description');
    });

    it('should handle empty or whitespace field names', () => {
      expect(component.formatFieldName('')).toBe('');
      expect(component.formatFieldName('   ')).toBe('');
    });
  });

  describe('Filter Management', () => {
    beforeEach(() => {
      component.entityType = 'testEntity';
    });

    it('should get initial filters from local filters when available', () => {
      component.localFilters = mockFilterRequests;
      const result = component.getInitialFilters();
      expect(result).toEqual(mockFilterRequests);
      expect(mockFilterService.getActiveFilters).not.toHaveBeenCalled();
    });

    it('should get initial filters from service when local filters are empty', () => {
      component.localFilters = [];
      mockFilterService.getActiveFilters.and.returnValue(mockFilterRequests);
      
      const result = component.getInitialFilters();
      
      expect(result).toEqual(mockFilterRequests);
      expect(mockFilterService.getActiveFilters).toHaveBeenCalledWith('testEntity');
    });

    it('should update local filters when filters change', () => {
      const newFilters = [mockFilterRequests[0]]; // Only first filter
      component.onFiltersChanged(newFilters);
      expect(component.localFilters).toEqual(newFilters);
    });

    it('should determine if filters can be applied based on local filters', () => {
      component.localFilters = [];
      expect(component.canApplyFilters()).toBeFalse();

      component.localFilters = mockFilterRequests;
      expect(component.canApplyFilters()).toBeTrue();
    });
  });

  describe('Filter Actions', () => {
    beforeEach(() => {
      component.entityType = 'testEntity';
      component.localFilters = mockFilterRequests;
      spyOn(component, 'closeModal');
      spyOn(component.filtersApplied, 'emit');
    });

    it('should apply filters successfully', () => {
      component.applyFilters();

      expect(mockFilterService.saveFiltersForEntity).toHaveBeenCalledWith('testEntity', mockFilterRequests);
      expect(mockFilterService.convertFiltersForAPI).toHaveBeenCalledWith(mockFilterRequests);
      expect(component.filtersApplied.emit).toHaveBeenCalledWith(mockFilterRequests);
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should not apply filters when local filters are empty', () => {
      component.localFilters = [];
      component.applyFilters();

      expect(mockFilterService.saveFiltersForEntity).not.toHaveBeenCalled();
      expect(component.filtersApplied.emit).not.toHaveBeenCalled();
      expect(component.closeModal).not.toHaveBeenCalled();
    });

    it('should clear filters successfully', () => {
      component.clearFilters();

      expect(component.localFilters).toEqual([]);
      expect(mockFilterService.clearFiltersForEntity).toHaveBeenCalledWith('testEntity');
      expect(component.filtersApplied.emit).toHaveBeenCalledWith([]);
      expect(component.closeModal).toHaveBeenCalled();
    });
  });

  describe('Modal Management', () => {
    beforeEach(() => {
      component.localFilters = mockFilterRequests;
      component.show = true;
      spyOn(component.showChange, 'emit');
    });

    it('should close modal and reset state', () => {
      component.closeModal();

      expect(component.localFilters).toEqual([]);
      expect(component.show).toBeFalse();
      expect(component.showChange.emit).toHaveBeenCalledWith(false);
    });

    it('should emit show change when modal is closed', () => {
      component.closeModal();
      expect(component.showChange.emit).toHaveBeenCalledWith(false);
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
      component.entityType = 'testEntity';
      component.show = true;
      fixture.detectChanges();
    });

    it('should display modal when show is true', () => {
      const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modalOverlay).toBeTruthy();
    });

    it('should not display modal when show is false', () => {
      component.show = false;
      fixture.detectChanges();
      
      const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modalOverlay).toBeFalsy();
    });

    it('should display formatted entity type in header', () => {
      component.entityType = 'boardGameBox';
      fixture.detectChanges();
      
      const header = fixture.nativeElement.querySelector('.modal-header h2');
      expect(header.textContent).toContain('Filter Board Game Box');
    });

    it('should display loading state', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const loadingState = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingState).toBeTruthy();
      expect(loadingState.textContent).toContain('Loading filter options...');
    });

    it('should display error state with retry button', () => {
      component.isLoading = false;
      component.errorMessage = 'Test error message';
      fixture.detectChanges();
      
      const errorState = fixture.nativeElement.querySelector('.error-state');
      expect(errorState).toBeTruthy();
      expect(errorState.textContent).toContain('Test error message');
      
      const retryButton = fixture.nativeElement.querySelector('.retry-button');
      expect(retryButton).toBeTruthy();
    });

    it('should display filter form when loaded successfully', async () => {
      component.isLoading = false;
      component.errorMessage = '';
      component.filterSpec = mockFilterSpecification;
      
      await fixture.whenStable();
      fixture.detectChanges();
      
      const filterCriteria = fixture.nativeElement.querySelector('app-filter-criteria');
      expect(filterCriteria).toBeTruthy();
    });

    it('should display modal actions when not loading or error', () => {
      component.isLoading = false;
      component.errorMessage = '';
      fixture.detectChanges();
      
      const modalActions = fixture.nativeElement.querySelector('.modal-actions');
      expect(modalActions).toBeTruthy();
      
      const cancelButton = fixture.nativeElement.querySelector('.cancel-button');
      const clearButton = fixture.nativeElement.querySelector('.clear-button');
      const applyButton = fixture.nativeElement.querySelector('.apply-button');
      
      expect(cancelButton).toBeTruthy();
      expect(clearButton).toBeTruthy();
      expect(applyButton).toBeTruthy();
    });

    it('should apply dark mode class when dark mode is enabled', () => {
      mockSettingsService.getDarkMode$.and.returnValue(of(true));
      component.ngOnInit();
      fixture.detectChanges();
      
      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      expect(modalContent.classList.contains('dark-mode')).toBeTruthy();
    });

    it('should disable clear button when no active filters', () => {
      component.isLoading = false;
      component.errorMessage = '';
      mockFilterService.hasActiveFilters.and.returnValue(false);
      fixture.detectChanges();
      
      const clearButton = fixture.nativeElement.querySelector('.clear-button');
      expect(clearButton.disabled).toBeTruthy();
    });

    it('should enable clear button when active filters exist', () => {
      component.isLoading = false;
      component.errorMessage = '';
      mockFilterService.hasActiveFilters.and.returnValue(true);
      fixture.detectChanges();
      
      const clearButton = fixture.nativeElement.querySelector('.clear-button');
      expect(clearButton.disabled).toBeFalsy();
    });

    it('should disable apply button when no local filters', () => {
      component.isLoading = false;
      component.errorMessage = '';
      component.localFilters = [];
      fixture.detectChanges();
      
      const applyButton = fixture.nativeElement.querySelector('.apply-button');
      expect(applyButton.disabled).toBeTruthy();
    });

    it('should enable apply button when local filters exist', () => {
      component.isLoading = false;
      component.errorMessage = '';
      component.localFilters = mockFilterRequests;
      fixture.detectChanges();
      
      const applyButton = fixture.nativeElement.querySelector('.apply-button');
      expect(applyButton.disabled).toBeFalsy();
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      component.entityType = 'testEntity';
      component.show = true;
      component.isLoading = false;
      component.errorMessage = '';
      fixture.detectChanges();
    });

    it('should close modal when clicking overlay', () => {
      spyOn(component, 'closeModal');
      
      const overlay = fixture.nativeElement.querySelector('.modal-overlay');
      overlay.click();
      
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should not close modal when clicking modal content', () => {
      spyOn(component, 'closeModal');
      
      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      const clickEvent = new Event('click');
      spyOn(clickEvent, 'stopPropagation');
      modalContent.dispatchEvent(clickEvent);
      
      expect(clickEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should close modal when clicking close button', () => {
      spyOn(component, 'closeModal');
      
      const closeButton = fixture.nativeElement.querySelector('.close-button');
      closeButton.click();
      
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should close modal when clicking cancel button', () => {
      spyOn(component, 'closeModal');
      
      const cancelButton = fixture.nativeElement.querySelector('.cancel-button');
      cancelButton.click();
      
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should clear filters when clicking clear button', () => {
      spyOn(component, 'clearFilters');
      mockFilterService.hasActiveFilters.and.returnValue(true);
      fixture.detectChanges();
      
      const clearButton = fixture.nativeElement.querySelector('.clear-button');
      clearButton.click();
      
      expect(component.clearFilters).toHaveBeenCalled();
    });

    it('should apply filters when clicking apply button', () => {
      spyOn(component, 'applyFilters');
      component.localFilters = mockFilterRequests;
      fixture.detectChanges();
      
      const applyButton = fixture.nativeElement.querySelector('.apply-button');
      applyButton.click();
      
      expect(component.applyFilters).toHaveBeenCalled();
    });

    it('should retry loading when clicking retry button', () => {
      component.errorMessage = 'Test error';
      fixture.detectChanges();
      
      spyOn(component, 'loadFilterSpecification');
      
      const retryButton = fixture.nativeElement.querySelector('.retry-button');
      retryButton.click();
      
      expect(component.loadFilterSpecification).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow: show modal, load filters, apply filters, close', async () => {
      const filtersAppliedSpy = jasmine.createSpy('filtersApplied');
      component.filtersApplied.subscribe(filtersAppliedSpy);
      
      // Show modal and load specification
      component.entityType = 'testEntity';
      component.show = true;
      component.ngOnInit();
      
      await fixture.whenStable();
      fixture.detectChanges();
      
      // Verify filter spec is loaded
      expect(component.filterSpec).toEqual(mockFilterSpecification);
      expect(component.isLoading).toBeFalse();
      
      // Simulate user adding filters
      component.onFiltersChanged(mockFilterRequests);
      expect(component.localFilters).toEqual(mockFilterRequests);
      
      // Apply filters
      component.applyFilters();
      
      // Verify filters are saved and emitted
      expect(mockFilterService.saveFiltersForEntity).toHaveBeenCalledWith('testEntity', mockFilterRequests);
      expect(filtersAppliedSpy).toHaveBeenCalledWith(mockFilterRequests);
      expect(component.show).toBeFalse();
    });

    it('should handle error and retry workflow', async () => {
      component.entityType = 'testEntity';
      
      // First call fails
      mockFilterService.getFiltersForEntity.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      
      component.loadFilterSpecification();
      await fixture.whenStable();
      fixture.detectChanges();
      
      expect(component.errorMessage).toContain('Failed to load filter options');
      expect(component.isLoading).toBeFalse();
      
      // Retry succeeds
      mockFilterService.getFiltersForEntity.and.returnValue(of(mockFilterSpecification));
      component.loadFilterSpecification();
      await fixture.whenStable();
      fixture.detectChanges();
      
      expect(component.filterSpec).toEqual(mockFilterSpecification);
      expect(component.errorMessage).toBe('');
      expect(component.isLoading).toBeFalse();
    });
  });
});
