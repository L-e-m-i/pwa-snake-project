import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gameover } from './gameover';

describe('Gameover', () => {
  let component: Gameover;
  let fixture: ComponentFixture<Gameover>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gameover]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Gameover);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
