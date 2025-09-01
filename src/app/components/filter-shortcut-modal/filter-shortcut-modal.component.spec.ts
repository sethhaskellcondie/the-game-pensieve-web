import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterShortcutModalComponent } from './filter-shortcut-modal.component';

describe('FilterShortcutModalComponent', () => {
  let component: FilterShortcutModalComponent;
  let fixture: ComponentFixture<FilterShortcutModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterShortcutModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FilterShortcutModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
