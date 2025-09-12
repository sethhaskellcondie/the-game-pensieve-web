import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BooleanDisplayComponent } from './boolean-display.component';
import { SettingsService } from '../../services/settings.service';
import { mockSettingsService } from '../../testing/test-utils';

describe('BooleanDisplayComponent', () => {
  let component: BooleanDisplayComponent;
  let fixture: ComponentFixture<BooleanDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BooleanDisplayComponent],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BooleanDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
