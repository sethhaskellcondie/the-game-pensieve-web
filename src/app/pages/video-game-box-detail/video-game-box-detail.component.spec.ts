import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoGameBoxDetailComponent } from './video-game-box-detail.component';

describe('VideoGameBoxDetailComponent', () => {
  let component: VideoGameBoxDetailComponent;
  let fixture: ComponentFixture<VideoGameBoxDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoGameBoxDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VideoGameBoxDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
