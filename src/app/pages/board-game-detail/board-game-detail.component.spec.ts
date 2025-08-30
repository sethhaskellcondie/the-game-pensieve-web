import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardGameDetailComponent } from './board-game-detail.component';

describe('BoardGameDetailComponent', () => {
  let component: BoardGameDetailComponent;
  let fixture: ComponentFixture<BoardGameDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardGameDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BoardGameDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
