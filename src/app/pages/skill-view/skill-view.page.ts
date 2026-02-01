import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavController, LoadingController, ToastController } from '@ionic/angular';
import { WorkerSkillService } from '../../services/worker-skill.service';
import { IonContent } from '@ionic/angular/standalone';

interface SkillItem {
  id: number;
  name: string;
  category: string;
  checked: boolean;
}

@Component({
  selector: 'app-skill-view',
  templateUrl: './skill-view.page.html',
  styleUrls: ['./skill-view.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule]
})
export class SkillViewPage implements OnInit {

  skillsByCategory: { [key: string]: SkillItem[] } = {};
  categories: string[] = [];

  loading = false;

  constructor(
    private nav: NavController,
    private skillService: WorkerSkillService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.loadSkills();
  }

  async ionViewWillEnter() {
    await this.loadSkills();
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

  goMessageInbox() {
    this.nav.navigateForward('/pages/message-inbox');
  }

  goProfile() {
    this.nav.navigateForward('/pages/profile');
  }

  /* ===============================
     LOAD + MERGE SKILLS
  =============================== */
  async loadSkills() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading skills...'
    });
    await loading.present();

    const cached = localStorage.getItem('cache_worker_skills');
    let cachedIds: number[] = [];

    if (cached) {
      cachedIds = JSON.parse(cached).map((s: any) => Number(s.id));
    }

    try {
      const [allSkills, mySkills] = await Promise.all([
        this.skillService.getAllSkills(),
        this.skillService.getMySkills()
      ]);

      const mySkillIds = mySkills?.length
        ? mySkills.map(s => Number(s.id))
        : cachedIds;

      this.skillsByCategory = {};
      this.categories = [];

      allSkills.forEach(skill => {
        const category = skill.category || 'Other';

        if (!this.skillsByCategory[category]) {
          this.skillsByCategory[category] = [];
          this.categories.push(category);
        }

        this.skillsByCategory[category].push({
          id: Number(skill.id),
          name: skill.name,
          category,
          checked: mySkillIds.includes(Number(skill.id))
        });
      });

    } catch (err) {
      console.error(err);
      this.toast('Failed to load skills');
    } finally {
      loading.dismiss();
    }
  }

  /* ===============================
     TOGGLE SKILL
  =============================== */
  toggleSkill(skill: SkillItem) {

    // kalau mau MATIKAN → selalu boleh
    if (skill.checked) {
      skill.checked = false;
      return;
    }

    // kalau mau NYALAKAN → cek limit
    const selectedCount = this.getSelectedCount();

    if (selectedCount >= 3) {
      this.toast('Maksimal 3 skill saja');
      return; // ⛔ BLOCK
    }

    // boleh nyalakan
    skill.checked = true;
  }

  /* ===============================
     SAVE SKILLS
  =============================== */
  async saveSkills() {
    const selectedIds = Object.values(this.skillsByCategory)
      .reduce((acc: SkillItem[], curr) => acc.concat(curr), [])
      .filter(s => s.checked)
      .map(s => s.id);

    if (selectedIds.length === 0) {
      return this.toast('Pilih minimal 1 skill');
    }

    if (selectedIds.length > 3) {
      return this.toast('Maksimal 3 skill saja');
    }

    // 🔥 1. UPDATE CACHE
    this.updateMySkillsCache(selectedIds);

    // 🔥 2. APPLY KE STATE UI (AGAR LANGSUNG RERENDER)
    this.applyCachedSkillsToState(
      JSON.parse(localStorage.getItem('cache_worker_skills') || '[]')
    );

    const loading = await this.loadingCtrl.create({
      message: 'Saving skills...'
    });
    await loading.present();

    try {
      // 🔥 2. UPDATE DB
      await this.skillService.saveSkills(selectedIds);

      this.toast('Skills berhasil disimpan ✅');
      this.nav.back();

    } catch (err) {
      console.error(err);

      // 🔴 OPSIONAL: rollback cache kalau DB gagal
      await this.loadSkills();

      this.toast('Gagal menyimpan skill');
    } finally {
      loading.dismiss();
    }
  }

  /* ===============================
     UI HELPERS
  =============================== */
  async toast(msg: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      position: 'top'
    });
    t.present();
  }

  getSelectedCount(): number {
    return Object.values(this.skillsByCategory)
      .reduce((acc: SkillItem[], curr) => acc.concat(curr), [])
      .filter(s => s.checked)
      .length;
  }

  private updateMySkillsCache(selectedIds: number[]) {
    // simpan dalam format yang SAMA dengan API my-skills
    const cachedSkills = Object.values(this.skillsByCategory)
      .reduce((acc: SkillItem[], curr) => acc.concat(curr), [])
      .filter(s => selectedIds.includes(s.id))
      .map(s => ({
        id: s.id,
        name: s.name,
        category: s.category
      }));

    localStorage.setItem(
      'cache_worker_skills',
      JSON.stringify(cachedSkills)
    );
  }

  private applyCachedSkillsToState(cachedSkills: any[]) {
    const cachedIds = cachedSkills.map(s => Number(s.id));

    Object.values(this.skillsByCategory)
      .reduce((acc: SkillItem[], curr) => acc.concat(curr), [])
      .forEach(skill => {
        skill.checked = cachedIds.includes(skill.id);
      });
  }

}
