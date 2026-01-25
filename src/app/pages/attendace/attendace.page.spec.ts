import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttendacePage } from './attendace.page';

describe('AttendacePage', () => {
  let component: AttendacePage;
  let fixture: ComponentFixture<AttendacePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendacePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
