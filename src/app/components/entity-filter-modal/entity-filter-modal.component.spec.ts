import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityFilterModalComponent } from './entity-filter-modal.component';

describe('EntityFilterModalComponent', () => {
  let component: EntityFilterModalComponent;
  let fixture: ComponentFixture<EntityFilterModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityFilterModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EntityFilterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
