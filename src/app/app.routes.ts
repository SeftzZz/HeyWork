import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in/sign-in.page').then( m => m.SignInPage)
  },
  {
    path: 'pages/home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'pages/all-jobs',
    loadComponent: () => import('./pages/all-jobs/all-jobs.page').then( m => m.AllJobsPage)
  },
  {
    path: 'pages/job-detail',
    loadComponent: () => import('./pages/job-detail/job-detail.page').then( m => m.JobDetailPage)
  },
  {
    path: 'pages/apply-job',
    loadComponent: () => import('./pages/apply-job/apply-job.page').then( m => m.ApplyJobPage)
  },
  {
    path: 'pages/application',
    loadComponent: () => import('./pages/application/application.page').then( m => m.ApplicationPage)
  },
  {
    path: 'pages/message',
    loadComponent: () => import('./pages/message/message.page').then( m => m.MessagePage)
  },
  {
    path: 'pages/message-inbox',
    loadComponent: () => import('./pages/message-inbox/message-inbox.page').then( m => m.MessageInboxPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },
];
