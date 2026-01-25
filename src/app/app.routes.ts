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
    path: 'pages/profile',
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'pages/personal-information',
    loadComponent: () => import('./pages/personal-information/personal-information.page').then( m => m.PersonalInformationPage)
  },
  {
    path: 'pages/skill-view',
    loadComponent: () => import('./pages/skill-view/skill-view.page').then( m => m.SkillViewPage)
  },
  {
    path: 'pages/work-experience',
    loadComponent: () => import('./pages/work-experience/work-experience.page').then( m => m.WorkExperiencePage)
  },
  {
    path: 'pages/education',
    loadComponent: () => import('./pages/education/education.page').then( m => m.EducationPage)
  },
  {
    path: 'pages/awards',
    loadComponent: () => import('./pages/awards/awards.page').then( m => m.AwardsPage)
  },  {
    path: 'sign-up',
    loadComponent: () => import('./sign-up/sign-up.page').then( m => m.SignUpPage)
  },
  {
    path: 'schedule',
    loadComponent: () => import('./pages/schedule/schedule.page').then( m => m.SchedulePage)
  },
  {
    path: 'attendace',
    loadComponent: () => import('./pages/attendace/attendace.page').then( m => m.AttendacePage)
  },







];
