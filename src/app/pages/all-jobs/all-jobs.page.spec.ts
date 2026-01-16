import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllJobsPage } from './all-jobs.page';

describe('AllJobsPage', () => {
  let component: AllJobsPage;
  let fixture: ComponentFixture<AllJobsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AllJobsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
