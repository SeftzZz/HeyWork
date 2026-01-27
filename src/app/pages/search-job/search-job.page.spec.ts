import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchJobPage } from './search-job.page';

describe('SearchJobPage', () => {
  let component: SearchJobPage;
  let fixture: ComponentFixture<SearchJobPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchJobPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
