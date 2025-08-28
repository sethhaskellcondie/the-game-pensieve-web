import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
export class SelectableTextInputComponent implements ControlValueAccessor {
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() minlength: number | null = null;
  @Input() id: string = '';
  @Input() name: string = '';
  @Input() type: string = 'text';

  value: string = '';
  disabled: boolean = false;

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
}