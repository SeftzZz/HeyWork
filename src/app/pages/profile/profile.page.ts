import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonModal } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { Title } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthStorage, AuthData } from '../../services/auth-storage.service';
import { ProfileService } from '../../services/profile.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WsService } from '../../services/ws.service';

declare const initAllSwipers: any;

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
    standalone: true,
    imports: [IonContent, IonModal, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {
    showSidebar = false;
    user: any = null;
    greeting: string = '';
    photoPreview: string | null = null;
    public auth!: AuthData;
    rating: number = 4.8;
    workerSkills: any[] = [];
    loading = false;

    // =========================
    // 🌙 DARK MODE STATE
    // =========================
    isDarkMode = false;

    jobs: any[] = [];
    popular_jobs: any[] = [];
    avatarUrl = 'assets/images/avt/avt-1.jpg';

    constructor(
      private nav: NavController,
      private authStorage: AuthStorage,
      private title: Title,
      private http: HttpClient,
      private ws: WsService,
      private profileService: ProfileService
    ) { }

    async ngOnInit() {
        this.title.setTitle('Profile | Hey! Work');

        // =========================
        // INIT DARK MODE
        // =========================
        this.initDarkMode();

        const loggedIn = await this.authStorage.isLoggedIn();
        if (!loggedIn) {
            this.nav.navigateRoot('/sign-in');
            return;
        }

        // =========================
        // SET GREETING (WIB)
        // =========================
        this.setGreeting();

        // ambil user dari storage
        try {
            const auth = await this.authStorage.getAuth();
            if (!auth) throw new Error();

            this.auth = auth;
            this.user = auth.user;

            if (auth?.user?.photo) {
              this.avatarUrl =
                `${environment.base_url}/${auth.user.photo}?t=${Date.now()}`;
            }
        } catch {
            await this.authStorage.removeToken();
            this.nav.navigateRoot('/sign-in');
        }

        // Swipers slide
        setTimeout(() => {
            if (typeof initAllSwipers === 'function') {
                initAllSwipers();
            }
        }, 50);

        // load worker skills
        await this.loadWorkerSkills();

        // connect websocket
        this.ws.connect((data) => {
            console.log('[WS PROFILE]', data);
        });
    }

    // =========================
    // 🌙 DARK MODE HANDLER
    // =========================
    initDarkMode() {
        const html = document.documentElement;
        const theme = localStorage.getItem('toggled');

        this.isDarkMode = theme === 'dark-theme';
        html.classList.toggle('dark-theme', this.isDarkMode);
    }

    toggleDarkMode() {
        const html = document.documentElement;

        html.classList.toggle('dark-theme', this.isDarkMode);

        localStorage.setItem(
          'toggled',
          this.isDarkMode ? 'dark-theme' : 'light-theme'
        );

        // tutup sidebar setelah toggle
        setTimeout(() => {
            this.closeSidebar();
        }, 150);
    }

    setGreeting() {
        const now = new Date();

        // WIB = UTC + 7
        const jakartaHour = now.getUTCHours() + 7;

        if (jakartaHour >= 5 && jakartaHour < 12) {
          this.greeting = 'Good morning';
        } else if (jakartaHour >= 12 && jakartaHour < 18) {
          this.greeting = 'Good day';
        } else {
          this.greeting = 'Good evening';
        }
    }

    // ===============================
    // LOAD WORKER SKILLS
    // ===============================
    async loadWorkerSkills() {
        const cacheKey = 'cache_worker_skills';

        // =========================
        // LOAD FROM CACHE
        // =========================
        const cached = this.getCache<any[]>(cacheKey);
        if (cached && cached.length) {
            this.workerSkills = cached;
            return;
        }

        // =========================
        // LOAD FROM API
        // =========================
        try {
            this.loading = true;

            const token = await this.authStorage.getToken();
            if (!token) throw new Error('No auth token');

            const headers = new HttpHeaders({
                Authorization: `Bearer ${token}`
            });

            const res = await firstValueFrom(
                this.http.get<any>(
                    `${environment.api_url}/worker/my-skills`,
                    { headers }
                )
            );

            const data = res?.data || res || [];

            this.workerSkills = data;
            this.setCache(cacheKey, data);

        } catch (err) {
            console.error('Failed to load worker skills', err);
            this.workerSkills = [];
        } finally {
            this.loading = false;
        }
    }

    // ===============================
    // CACHE HELPERS
    // ===============================
    private getCache<T>(key: string): T | null {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) as T : null;
        } catch {
            localStorage.removeItem(key);
            return null;
        }
    }

    private setCache<T>(key: string, value: T) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    getStars(rating: number = 0) {
        const full = Math.floor(rating);
        const half = rating - full >= 0.5 ? 1 : 0;
        const empty = 5 - full - half;

        return {
            full: Array(full),
            half: Array(half),
            empty: Array(empty)
        };
    }

    ionViewWillLeave() {
        this.ws.disconnect();
    }

    openSidebar() {
        this.showSidebar = true;
    }

    closeSidebar() {
        this.showSidebar = false;
    }

    navigateWithClose(url: string) {
        this.showSidebar = false;

        setTimeout(() => {
            this.nav.navigateForward(url);
        }, 150);
    }

    // ===============================
    // NAVIGATION
    // ===============================
    goBack() {
        this.nav.back();
    }

    goApplication() {
        this.nav.navigateForward('/pages/application');
    }

    goHome() {
        this.navigateWithClose('/pages/home');
    }

    goApplyJob() {
        this.nav.navigateForward('/pages/apply-job');
    }

    goMessage() {
        this.nav.navigateForward('/pages/message');
    }

    goMessageInbox() {
        this.nav.navigateForward('/pages/message-inbox');
    }

    goProfile() {
        this.navigateWithClose('/pages/profile');
    }

    goPersonalInformation() {
        this.nav.navigateForward('/pages/personal-information');
    }

    goAllJobs() {
        this.nav.navigateForward('/pages/all-job');
    }

    goJobDetail() {
        this.nav.navigateForward('/pages/job-detail');
    }

    goSkillView() {
        this.nav.navigateForward('/pages/skill-view');
    }

    goWorkExperience() {
        this.nav.navigateForward('/pages/work-experience');
    }

    goEducation() {
        this.nav.navigateForward('/pages/education');
    }

    goAwards() {
        this.nav.navigateForward('/pages/awards');
    }

    async confirmLogout() {
        const confirm = window.confirm('Yakin ingin keluar?');
        if (confirm) {
          await this.logout();
        }
    }

    async logout() {
        this.showSidebar = false;
        localStorage.removeItem('cache_hotels');
        localStorage.removeItem('cache_jobs');
        localStorage.removeItem('cache_app_counts');
        localStorage.removeItem('cache_popular_jobs');
        localStorage.removeItem('cache_applications');
        localStorage.removeItem('cache_worker_skills');
        localStorage.removeItem('toggled');
        this.ws.disconnect();
        await this.authStorage.removeToken();
        this.nav.navigateRoot('/sign-in');
    }
}
