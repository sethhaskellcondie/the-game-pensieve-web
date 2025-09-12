import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DefaultSortModalComponent } from './default-sort-modal.component';
import { FilterService } from '../../services/filter.service';
import { DefaultSortService } from '../../services/default-sort.service';
import { SettingsService } from '../../services/settings.service';
import { mockSettingsService } from '../../testing/test-utils';

describe('DefaultSortModalComponent', () => {
  let component: DefaultSortModalComponent;
  let fixture: ComponentFixture<DefaultSortModalComponent>;

  beforeEach(async () => {
    const mockFilterService = {
      getSortOptions: jasmine.createSpy('getSortOptions').and.returnValue([]),
      getFilterSpecifications: jasmine.createSpy('getFilterSpecifications').and.returnValue(of({ data: [], errors: null }))
    };

    const mockDefaultSortService = {
      getDefaultSort: jasmine.createSpy('getDefaultSort').and.returnValue(of(null)),
      saveDefaultSort: jasmine.createSpy('saveDefaultSort').and.returnValue(of(true))
    };

    await TestBed.configureTestingModule({
      imports: [DefaultSortModalComponent],
      providers: [
        { provide: FilterService, useValue: mockFilterService },
        { provide: DefaultSortService, useValue: mockDefaultSortService },
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DefaultSortModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
