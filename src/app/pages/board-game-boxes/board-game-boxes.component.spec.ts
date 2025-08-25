import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardGameBoxesComponent } from './board-game-boxes.component';

describe('BoardGameBoxesComponent', () => {
  let component: BoardGameBoxesComponent;
  let fixture: ComponentFixture<BoardGameBoxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardGameBoxesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BoardGameBoxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
