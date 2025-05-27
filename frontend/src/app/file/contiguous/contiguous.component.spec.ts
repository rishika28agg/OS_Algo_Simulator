import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContiguousComponent } from './contiguous.component';

describe('ContiguousComponent', () => {
  let component: ContiguousComponent;
  let fixture: ComponentFixture<ContiguousComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContiguousComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContiguousComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
