import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardGameBoxDetailComponent } from './board-game-box-detail.component';

describe('BoardGameBoxDetailComponent', () => {
  let component: BoardGameBoxDetailComponent;
  let fixture: ComponentFixture<BoardGameBoxDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardGameBoxDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BoardGameBoxDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
