import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    component.title = 'Test Title';
    component.description = 'Test Description';
    component.icon = 'test_icon';
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-title')?.textContent).toContain('Test Title');
  });

  it('should display description', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-description')?.textContent).toContain('Test Description');
  });

  it('should display icon', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-icon')?.textContent).toContain('test_icon');
  });
});