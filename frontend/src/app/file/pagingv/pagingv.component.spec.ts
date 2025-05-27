import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagingvComponent } from './pagingv.component';

describe('PagingvComponent', () => {
  let component: PagingvComponent;
  let fixture: ComponentFixture<PagingvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagingvComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagingvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
