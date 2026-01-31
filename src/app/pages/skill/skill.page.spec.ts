import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkillViewPage } from './skill-view.page';

describe('SkillViewPage', () => {
  let component: SkillViewPage;
  let fixture: ComponentFixture<SkillViewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
