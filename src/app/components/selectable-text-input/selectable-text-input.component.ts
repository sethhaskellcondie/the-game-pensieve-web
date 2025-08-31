import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-selectable-text-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selectable-text-input.component.html',
  styleUrl: './selectable-text-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectableTextInputComponent),
      multi: true
    }
  ]
})
export class SelectableTextInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() minlength: number | null = null;
  @Input() id: string = '';
  @Input() name: string = '';
  @Input() type: string = 'text';
  @ViewChild('inputElement', { static: false }) inputElement!: ElementRef<HTMLInputElement>;

  value: string = '';
  disabled: boolean = false;
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

  private onChange = (value: string) => {};
  private onTouched = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onFocus(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    // Select all text when the input gains focus
    setTimeout(() => {
      target.select();
    }, 0);
    this.onTouched();
  }

  onBlur(): void {
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  focus(): void {
    if (this.inputElement) {
      this.inputElement.nativeElement.focus();
    }
  }
}