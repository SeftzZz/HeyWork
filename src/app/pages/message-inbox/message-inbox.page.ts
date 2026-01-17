import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-message-inbox',
  templateUrl: './message-inbox.page.html',
  styleUrls: ['./message-inbox.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class MessageInboxPage implements OnInit {

  messages: {
    text: string;
    time: string;
    me: boolean;
  }[] = [];

  messageText = '';

  constructor(
    private nav: NavController,
  ) { }

  ngOnInit() {
  }

  goBack() {
    this.nav.back();
  }

  goApplication() {
    this.nav.navigateForward('/pages/application');
  }

  goHome() {
    this.nav.navigateForward('/pages/home');
  }

  goApplyJob() {
    this.nav.navigateForward('/pages/apply-job');
  }

  goMessage() {
    this.nav.navigateForward('/pages/message');
  }

  sendMessage() {
    if (!this.messageText || !this.messageText.trim()) {
      return;
    }

    const now = new Date();
    const hours = now.getHours() >= 12 ? 'PM' : 'AM';
    const time =
      (now.getHours() % 12 || 12) +
      ':' +
      now.getMinutes().toString().padStart(2, '0') +
      ' ' +
      hours;

    this.messages.push({
      text: this.messageText,
      time,
      me: true
    });

    this.messageText = '';

    // auto scroll
    setTimeout(() => {
      const chat = document.querySelector('.chat-area');
      chat?.scrollTo({
        top: chat.scrollHeight,
        behavior: 'smooth'
      });
    }, 50);
  }

}
