import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterableDropdownComponent } from './filterable-dropdown.component';
import { SettingsService } from '../../services/settings.service';
import { mockSettingsService } from '../../testing/test-utils';

describe('FilterableDropdownComponent', () => {
  let component: FilterableDropdownComponent;
  let fixture: ComponentFixture<FilterableDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterableDropdownComponent],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FilterableDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
