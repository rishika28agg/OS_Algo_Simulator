import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeadlockComponent } from './deadlock.component';
import { FormsModule } from '@angular/forms';

describe('DeadlockComponent', () => {
  let component: DeadlockComponent;
  let fixture: ComponentFixture<DeadlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeadlockComponent ],
      imports: [ FormsModule ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeadlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
