import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-boolean-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boolean-display.component.html',
  styleUrl: './boolean-display.component.scss'
})
export class BooleanDisplayComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() value: boolean | string | null = null;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  isDarkMode = false;

  constructor(private settingsService: SettingsService) {}

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

  get displayValue(): boolean {
    if (typeof this.value === 'boolean') {
      return this.value;
    }
    if (typeof this.value === 'string') {
      return this.value.toLowerCase() === 'true';
    }
    return false;
  }

  get displayText(): string {
    return this.displayValue ? 'Yes' : 'No';
  }
}
