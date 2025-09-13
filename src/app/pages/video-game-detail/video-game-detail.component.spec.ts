import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { VideoGameDetailComponent } from './video-game-detail.component';
import { ApiService } from '../../services/api.service';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { mockActivatedRoute, mockApiService, mockSettingsService } from '../../testing/test-utils';
import { of } from 'rxjs';

describe('VideoGameDetailComponent', () => {
  let component: VideoGameDetailComponent;
  let fixture: ComponentFixture<VideoGameDetailComponent>;

  beforeEach(async () => {
    const mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };
    
    const mockFilterService = {
      getActiveFilters: jasmine.createSpy('getActiveFilters').and.returnValue([]),
      getFiltersWithDefaults: jasmine.createSpy('getFiltersWithDefaults').and.returnValue([]),
      hasActiveFilters: jasmine.createSpy('hasActiveFilters').and.returnValue(false),
      saveFiltersForEntity: jasmine.createSpy('saveFiltersForEntity'),
      clearFiltersForEntity: jasmine.createSpy('clearFiltersForEntity')
    };

    await TestBed.configureTestingModule({
      imports: [VideoGameDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ApiService, useValue: mockApiService },
        { provide: FilterService, useValue: mockFilterService },
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VideoGameDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
