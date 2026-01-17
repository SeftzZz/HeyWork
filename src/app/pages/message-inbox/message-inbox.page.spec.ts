import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageInboxPage } from './message-inbox.page';

describe('MessageInboxPage', () => {
  let component: MessageInboxPage;
  let fixture: ComponentFixture<MessageInboxPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageInboxPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
