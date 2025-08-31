import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
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
export class AppComponent implements OnInit {
  title: string = 'the-game-pensive-web';

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.settingsService.loadSettings().subscribe({
      next: (settings) => {
        console.log('Settings loaded:', settings);
      },
      error: (error) => {
        console.error('Failed to load settings:', error);
      }
    });
  }
}
