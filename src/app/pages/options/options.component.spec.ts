import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { OptionsComponent } from './options.component';
import { ApiService } from '../../services/api.service';
import { mockHttpClient, mockApiService } from '../../testing/test-utils';

describe('OptionsComponent', () => {
  let component: OptionsComponent;
  let fixture: ComponentFixture<OptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionsComponent],
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: ApiService, useValue: mockApiService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
