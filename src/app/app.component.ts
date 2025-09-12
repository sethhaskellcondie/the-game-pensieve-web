import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {ContainerComponent} from "./components/container/container.component";
import { ErrorSnackbarComponent } from './components/error-snackbar/error-snackbar.component';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ContainerComponent, ErrorSnackbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title: string = 'the-game-pensive-web';
  private destroy$ = new Subject<void>();

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.settingsService.loadSettings().subscribe({
      next: (settings) => {
      },
      error: (error) => {
      }
    });

    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        if (darkMode) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
