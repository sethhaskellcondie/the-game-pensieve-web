import { Component, Input, Output, EventEmitter, forwardRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-selectable-number-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selectable-number-input.component.html',
  styleUrl: './selectable-number-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectableNumberInputComponent),
      multi: true
    }
  ]
})
export class SelectableNumberInputComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('numberInput', { static: true }) numberInput!: ElementRef<HTMLInputElement>;
  
  @Input() id?: string;
  @Input() placeholder?: string = '';
  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number = 1;
  @Input() disabled = false;
  
  @Output() valueChange = new EventEmitter<number | null>();
  
  private _value: number | null = null;
  private onChange = (value: number | null) => {};
  private onTouched = () => {};

  ngAfterViewInit(): void {
    // Ensure the input element exists
    if (this.numberInput) {
      // Set initial value if it exists
      if (this._value !== null) {
        this.numberInput.nativeElement.value = this._value.toString();
      }
    }
  }

  get value(): number | null {
    return this._value;
  }

  set value(val: number | null) {
    if (val !== this._value) {
      this._value = val;
      this.onChange(val);
      this.valueChange.emit(val);
      
      if (this.numberInput) {
        this.numberInput.nativeElement.value = val !== null ? val.toString() : '';
      }
    }
  }

  onInputFocus(): void {
    // Select all text when input gains focus
    if (this.numberInput) {
      setTimeout(() => {
        this.numberInput.nativeElement.select();
      }, 0);
    }
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const stringValue = target.value;
    
    if (stringValue === '') {
      this.value = null;
    } else {
      const numericValue = parseFloat(stringValue);
      if (!isNaN(numericValue)) {
        this.value = numericValue;
      }
    }
    
    this.onTouched();
  }

  onInputBlur(): void {
    this.onTouched();
  }

  onKeyup(event: KeyboardEvent): void {
    // The keyup event will naturally bubble up to parent components
    // We don't need to do anything special here, just let it propagate
  }

  // ControlValueAccessor implementation
  writeValue(value: number | null): void {
    this._value = value;
    if (this.numberInput) {
      this.numberInput.nativeElement.value = value !== null ? value.toString() : '';
    }
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Public method to programmatically focus the input
  focus(): void {
    if (this.numberInput) {
      this.numberInput.nativeElement.focus();
    }
  }
}