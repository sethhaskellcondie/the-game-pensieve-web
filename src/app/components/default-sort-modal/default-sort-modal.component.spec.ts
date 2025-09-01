import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultSortModalComponent } from './default-sort-modal.component';

describe('DefaultSortModalComponent', () => {
  let component: DefaultSortModalComponent;
  let fixture: ComponentFixture<DefaultSortModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultSortModalComponent]
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
