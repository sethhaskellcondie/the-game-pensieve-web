import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterCriteriaComponent } from './filter-criteria.component';
import { FilterService } from '../../services/filter.service';
import { SettingsService } from '../../services/settings.service';
import { mockSettingsService } from '../../testing/test-utils';
import { of } from 'rxjs';

describe('FilterCriteriaComponent', () => {
  let component: FilterCriteriaComponent;
  let fixture: ComponentFixture<FilterCriteriaComponent>;

  beforeEach(async () => {
    const mockFilterService = {
      getFilterSpecifications: jasmine.createSpy('getFilterSpecifications').and.returnValue(of({ data: [], errors: null }))
    };

    await TestBed.configureTestingModule({
      imports: [FilterCriteriaComponent],
      providers: [
        { provide: FilterService, useValue: mockFilterService },
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FilterCriteriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
