import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { VideoGamesComponent } from './video-games.component';
import { ApiService } from '../../services/api.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';

describe('VideoGamesComponent', () => {
  let component: VideoGamesComponent;
  let fixture: ComponentFixture<VideoGamesComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let filterService: jasmine.SpyObj<FilterService>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let router: jasmine.SpyObj<Router>;

  const mockCustomFields = [
    { id: 1, name: 'Test Text Field', type: 'text' as const, entityKey: 'videoGame' },
    { id: 2, name: 'Test Number Field', type: 'number' as const, entityKey: 'videoGame' },
    { id: 3, name: 'Test Boolean Field', type: 'boolean' as const, entityKey: 'videoGame' }
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

  const mockVideoGames = [
    {
      key: 'game1',
      id: 1,
      title: 'Test Video Game',
      system: mockSystems[0],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: []
    }
  ];

  const mockVideoGameBoxes = [
    {
      key: 'box1',
      id: 1,
      title: 'Test Video Game Box',
      system: mockSystems[0],
      isPhysical: true,
      isCollection: false,
      videoGames: [],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: []
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getVideoGames', 'getCustomFieldsByEntity', 'getSystems', 'getVideoGameBoxes', 'updateVideoGame']);
    const filterSpy = jasmine.createSpyObj('FilterService', ['getActiveFilters', 'getFiltersWithDefaults', 'hasActiveFilters', 'saveFiltersForEntity', 'clearFiltersForEntity']);
    const settingsSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [VideoGamesComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: FilterService, useValue: filterSpy },
        { provide: SettingsService, useValue: settingsSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoGamesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    filterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default spy returns
    apiService.getVideoGames.and.returnValue(of(mockVideoGames));
    apiService.getCustomFieldsByEntity.and.returnValue(of(mockCustomFields));
    apiService.getSystems.and.returnValue(of(mockSystems));
    apiService.getVideoGameBoxes.and.returnValue(of(mockVideoGameBoxes));
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
      title: 'Test Video Game',
      system: mockSystems[0],
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
      title: 'Empty Video Game',
      system: mockSystems[0],
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
      title: 'No Fields Video Game',
      system: mockSystems[0],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      customFieldValues: []
    };

    const gameWithOnlyEmptyFields = {
      key: 'game4',
      id: 4,
      title: 'Only Empty Fields Video Game',
      system: mockSystems[0],
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
      component.videoGames = [gameWithCustomFields, gameWithEmptyCustomFields, gameWithNoCustomFields];
    });

    it('should load custom fields on component init', () => {
      expect(apiService.getCustomFieldsByEntity).toHaveBeenCalledWith('videoGame');
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

      it('should return false for number field with zero value', () => {
        expect(component.shouldDisplayCustomField(gameWithEmptyCustomFields, 'Test Number Field')).toBe(false);
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

      it('should return false for number fields with zero values', () => {
        const zeroNumberField = { customFieldName: 'Test Number', customFieldType: 'number', value: '0' };
        expect(component.shouldDisplayCustomFieldInModal(zeroNumberField)).toBe(false);
      });

      it('should return false for number fields with empty values', () => {
        const emptyNumberField = { customFieldName: 'Test Number', customFieldType: 'number', value: '' };
        expect(component.shouldDisplayCustomFieldInModal(emptyNumberField)).toBe(false);
      });
    });

    describe('hasDisplayableCustomFields', () => {
      it('should return true for video game with displayable custom fields', () => {
        expect(component.hasDisplayableCustomFields(gameWithCustomFields)).toBe(true);
      });

      it('should return true for video game with boolean custom fields (always displayable)', () => {
        expect(component.hasDisplayableCustomFields(gameWithEmptyCustomFields)).toBe(true);
      });

      it('should return false for video game with only empty text and number fields', () => {
        expect(component.hasDisplayableCustomFields(gameWithOnlyEmptyFields)).toBe(false);
      });

      it('should return false for video game with no custom fields', () => {
        expect(component.hasDisplayableCustomFields(gameWithNoCustomFields)).toBe(false);
      });
    });
  });
});
