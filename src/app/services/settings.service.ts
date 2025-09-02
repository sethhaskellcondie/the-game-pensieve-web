import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map, catchError, switchMap } from 'rxjs/operators';
import { MetadataService } from './metadata.service';
import { ErrorSnackbarService } from './error-snackbar.service';

export interface UiSettings {
  darkMode: boolean;
  massInputMode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly SETTINGS_KEY = 'ui_settings';
  private readonly defaultSettings: UiSettings = {
    darkMode: false,
    massInputMode: false
  };

  private settingsSubject = new BehaviorSubject<UiSettings>(this.defaultSettings);
  public readonly settings$ = this.settingsSubject.asObservable();

  constructor(
    private metadataService: MetadataService,
    private errorSnackbarService: ErrorSnackbarService
  ) { }

  loadSettings(): Observable<UiSettings | null> {
    return this.metadataService.getMetadata<UiSettings>(this.SETTINGS_KEY)
      .pipe(
        catchError((error) => {
          if (error?.status === 404) {
            return this.metadataService.setMetadata(this.SETTINGS_KEY, this.defaultSettings)
              .pipe(
                switchMap((success) => {
                  if (success) {
                    return this.metadataService.getMetadata<UiSettings>(this.SETTINGS_KEY);
                  } else {
                    this.errorSnackbarService.processApiErrors({ errors: ['Failed to create default settings'] });
                    return of(this.defaultSettings);
                  }
                }),
                catchError((retryError) => {
                  this.errorSnackbarService.processApiErrors(retryError);
                  return of(this.defaultSettings);
                })
              );
          } else {
            this.errorSnackbarService.processApiErrors(error);
            return of(this.defaultSettings);
          }
        }),
        tap(settings => {
          const loadedSettings = settings || this.defaultSettings;
          this.settingsSubject.next(loadedSettings);
        })
      );
  }

  updateDarkMode(enabled: boolean): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings: UiSettings = {
      ...currentSettings,
      darkMode: enabled
    };

    this.settingsSubject.next(newSettings);
    
    this.metadataService.setMetadata(this.SETTINGS_KEY, newSettings).subscribe({
      next: (success) => {
        if (!success) {
          console.error('Failed to save settings to backend');
        }
      },
      error: (error) => {
        console.error('Error saving settings:', error);
      }
    });
  }

  updateMassInputMode(enabled: boolean): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings: UiSettings = {
      ...currentSettings,
      massInputMode: enabled
    };

    this.settingsSubject.next(newSettings);
    
    this.metadataService.setMetadata(this.SETTINGS_KEY, newSettings).subscribe({
      next: (success) => {
        if (!success) {
          console.error('Failed to save settings to backend');
        }
      },
      error: (error) => {
        console.error('Error saving settings:', error);
      }
    });
  }

  getDarkMode$(): Observable<boolean> {
    return this.settings$.pipe(
      map(settings => settings.darkMode)
    );
  }

  getMassInputMode$(): Observable<boolean> {
    return this.settings$.pipe(
      map(settings => settings.massInputMode)
    );
  }

  getCurrentSettings(): UiSettings {
    return this.settingsSubject.value;
  }
}