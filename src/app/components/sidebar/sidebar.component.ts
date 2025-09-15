import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { IconService } from '../../services/icon.service';
import { SettingsService } from '../../services/settings.service';
import { SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  private destroy$ = new Subject<void>();

  constructor(
    public iconService: IconService,
    private router: Router,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getIconHtml(iconName: string): SafeHtml {
    return this.iconService.getIcon(iconName);
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }
}
