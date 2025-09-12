import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { VideoGameBoxesComponent } from './video-game-boxes.component';
import { ApiService } from '../../services/api.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';

describe('VideoGameBoxesComponent', () => {
  let component: VideoGameBoxesComponent;
  let fixture: ComponentFixture<VideoGameBoxesComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let filterService: jasmine.SpyObj<FilterService>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let errorSnackbarService: jasmine.SpyObj<ErrorSnackbarService>;
  let router: jasmine.SpyObj<Router>;

  const mockCustomFields = [
    { id: 1, name: 'Test Text Field', type: 'text' as const, entityKey: 'videoGameBox' },
    { id: 2, name: 'Test Number Field', type: 'number' as const, entityKey: 'videoGameBox' },
    { id: 3, name: 'Test Boolean Field', type: 'boolean' as const, entityKey: 'videoGameBox' }
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

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getVideoGameBoxes', 'getCustomFieldsByEntity', 'createVideoGameBox', 'updateVideoGameBox', 'getSystems', 'getVideoGames']);
    const filterSpy = jasmine.createSpyObj('FilterService', ['getActiveFilters', 'getFiltersWithDefaults', 'hasActiveFilters', 'saveFiltersForEntity', 'clearFiltersForEntity']);
    const settingsSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$', 'getMassInputMode$']);
    const errorSpy = jasmine.createSpyObj('ErrorSnackbarService', ['showSuccess']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [VideoGameBoxesComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: FilterService, useValue: filterSpy },
        { provide: SettingsService, useValue: settingsSpy },
        { provide: ErrorSnackbarService, useValue: errorSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoGameBoxesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    filterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    errorSnackbarService = TestBed.inject(ErrorSnackbarService) as jasmine.SpyObj<ErrorSnackbarService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default spy returns
    apiService.getVideoGameBoxes.and.returnValue(of(mockVideoGameBoxes));
    apiService.getCustomFieldsByEntity.and.returnValue(of(mockCustomFields));
    apiService.getSystems.and.returnValue(of(mockSystems));
    apiService.getVideoGames.and.returnValue(of(mockVideoGames));
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

    it('should initialize newVideoGameBox with default custom field values when opening new modal', () => {
      component.openNewVideoGameBoxModal();
      
      expect(component.newVideoGameBox.customFieldValues).toEqual([
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
      expect(apiService.getCustomFieldsByEntity).toHaveBeenCalledWith('videoGameBox');
      expect(component.availableCustomFields).toEqual(mockCustomFields);
    });


    describe('custom field display logic', () => {
      const boxWithCustomFields = {
        key: 'box1',
        id: 1,
        title: 'Test Video Game Box',
        system: mockSystems[0],
        isPhysical: true,
        isCollection: false,
        videoGames: [],
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
        title: 'Empty Video Game Box',
        system: mockSystems[0],
        isPhysical: true,
        isCollection: false,
        videoGames: [],
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
        title: 'No Fields Video Game Box',
        system: mockSystems[0],
        isPhysical: true,
        isCollection: false,
        videoGames: [],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        customFieldValues: []
      };

      beforeEach(() => {
        component.videoGameBoxes = [boxWithCustomFields, boxWithEmptyCustomFields, boxWithNoCustomFields];
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

  describe('edit video game box modal logic', () => {
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

    describe('openUpdateVideoGameBoxModal', () => {
      it('should populate modal with video game box data and merged custom field values', () => {
        const videoGameBoxToUpdate = {
          key: 'box1',
          id: 1,
          title: 'Call of Duty',
          system: mockSystems[0],
          isPhysical: true,
          isCollection: false,
          videoGames: [],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: 'Existing text' }
          ]
        };

        apiService.getVideoGames.and.returnValue(of(mockVideoGames));

        component.openUpdateVideoGameBoxModal(videoGameBoxToUpdate);

        expect(component.isUpdateMode).toBe(true);
        expect(component.videoGameBoxToUpdate).toBe(videoGameBoxToUpdate);
        expect(component.showNewVideoGameBoxModal).toBe(true);
        expect(component.newVideoGameBox.title).toBe('Call of Duty');
        expect(component.newVideoGameBox.systemId).toBe(1);
        expect(component.newVideoGameBox.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Existing text' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
        ]);
      });

      it('should provide default values for all custom fields when video game box has no custom field values', () => {
        const videoGameBoxToUpdate = {
          key: 'box1',
          id: 1,
          title: 'Call of Duty',
          system: mockSystems[0],
          isPhysical: true,
          isCollection: false,
          videoGames: [],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: []
        };

        apiService.getVideoGames.and.returnValue(of(mockVideoGames));

        component.openUpdateVideoGameBoxModal(videoGameBoxToUpdate);

        expect(component.newVideoGameBox.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
        ]);
      });

      it('should preserve existing custom field values and add defaults for new fields', () => {
        const videoGameBoxToUpdate = {
          key: 'box1',
          id: 1,
          title: 'Call of Duty',
          system: mockSystems[0],
          isPhysical: true,
          isCollection: false,
          videoGames: [],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: [
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number' as const, value: '25' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean' as const, value: 'true' }
          ]
        };

        apiService.getVideoGames.and.returnValue(of(mockVideoGames));

        component.openUpdateVideoGameBoxModal(videoGameBoxToUpdate);

        expect(component.newVideoGameBox.customFieldValues).toEqual([
          { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: '' },
          { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '25' },
          { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
        ]);
      });
    });

    describe('onSubmitNewVideoGameBox with edit mode', () => {
      it('should include default values for number custom fields in PUT request when editing', () => {
        const videoGameBoxToUpdate = {
          key: 'box1',
          id: 1,
          title: 'Call of Duty',
          system: mockSystems[0],
          isPhysical: true,
          isCollection: false,
          videoGames: [],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text' as const, value: 'Some text' }
          ]
        };

        // Set up edit mode
        component.isUpdateMode = true;
        component.videoGameBoxToUpdate = videoGameBoxToUpdate;
        component.newVideoGameBox = {
          title: 'Updated Call of Duty',
          systemId: 1,
          isPhysical: true,
          isCollection: false,
          videoGames: [],
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Some text' },
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
          ]
        };

        apiService.updateVideoGameBox.and.returnValue(of(videoGameBoxToUpdate));

        component.onSubmitNewVideoGameBox();

        expect(apiService.updateVideoGameBox).toHaveBeenCalledWith(1, {
          title: 'Updated Call of Duty',
          systemId: 1,
          isPhysical: true,
          isCollection: false,
          existingVideoGameIds: [],
          newVideoGames: [],
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'Some text' },
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '0' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'false' }
          ]
        });
      });

      it('should include modified custom field values in PUT request when editing', () => {
        const videoGameBoxToUpdate = {
          key: 'box1',
          id: 1,
          title: 'Call of Duty',
          system: mockSystems[0],
          isPhysical: true,
          isCollection: false,
          videoGames: [],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: []
        };

        // Set up edit mode with modified values
        component.isUpdateMode = true;
        component.videoGameBoxToUpdate = videoGameBoxToUpdate;
        component.newVideoGameBox = {
          title: 'Updated Call of Duty',
          systemId: 1,
          isPhysical: true,
          isCollection: false,
          videoGames: [],
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'User entered text' },
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '42' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
          ]
        };

        apiService.updateVideoGameBox.and.returnValue(of(videoGameBoxToUpdate));

        component.onSubmitNewVideoGameBox();

        expect(apiService.updateVideoGameBox).toHaveBeenCalledWith(1, {
          title: 'Updated Call of Duty',
          systemId: 1,
          isPhysical: true,
          isCollection: false,
          existingVideoGameIds: [],
          newVideoGames: [],
          customFieldValues: [
            { customFieldId: 1, customFieldName: 'Test Text Field', customFieldType: 'text', value: 'User entered text' },
            { customFieldId: 2, customFieldName: 'Test Number Field', customFieldType: 'number', value: '42' },
            { customFieldId: 3, customFieldName: 'Test Boolean Field', customFieldType: 'boolean', value: 'true' }
          ]
        });
      });

      it('should reload video game boxes after successful update', () => {
        const videoGameBoxToUpdate = {
          key: 'box1',
          id: 1,
          title: 'Call of Duty',
          system: mockSystems[0],
          isPhysical: true,
          isCollection: false,
          videoGames: [],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          customFieldValues: []
        };

        // Set up edit mode
        component.isUpdateMode = true;
        component.videoGameBoxToUpdate = videoGameBoxToUpdate;
        component.newVideoGameBox = {
          title: 'Updated Call of Duty',
          systemId: 1,
          isPhysical: true,
          isCollection: false,
          videoGames: [],
          customFieldValues: []
        };

        apiService.updateVideoGameBox.and.returnValue(of(videoGameBoxToUpdate));
        spyOn(component, 'loadVideoGameBoxes');

        component.onSubmitNewVideoGameBox();

        expect(component.loadVideoGameBoxes).toHaveBeenCalled();
        expect(component.showNewVideoGameBoxModal).toBe(false);
      });
    });
  });
});