import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SettingsService } from '../../services/settings.service';

export interface DropdownOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-filterable-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filterable-dropdown.component.html',
  styleUrl: './filterable-dropdown.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilterableDropdownComponent),
      multi: true
    }
  ]
})
export class FilterableDropdownComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder: string = 'Select an option';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() name: string = '';
  @Input() id: string = '';
  
  searchText: string = '';
  selectedValue: string = '';
  isOpen: boolean = false;
  isDarkMode = false;
  private destroy$ = new Subject<void>();

  constructor(private settingsService: SettingsService) {}
  filteredOptions: DropdownOption[] = [];
  
  private onChange = (value: string) => {};
  private onTouched = () => {};
  private clickListener?: () => void;

  ngOnInit(): void {
    this.filteredOptions = [...this.options];
    this.updateSearchText();
    
    // Subscribe to dark mode changes
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });
    
    // Add click listener to close dropdown when clicking outside
    this.clickListener = () => {
      if (this.isOpen) {
        this.closeDropdown();
      }
    };
    document.addEventListener('click', this.clickListener);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.selectedValue = value || '';
    this.updateSearchText();
    this.filterOptions();
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

  updateSearchText(): void {
    const selectedOption = this.options.find(opt => opt.value === this.selectedValue);
    this.searchText = selectedOption ? selectedOption.label : '';
  }

  onInputChange(): void {
    this.filterOptions();
    if (!this.isOpen) {
      this.openDropdown();
    }
    
    // If the typed text exactly matches an option, select it
    const exactMatch = this.filteredOptions.find(opt => 
      opt.label.toLowerCase() === this.searchText.toLowerCase()
    );
    
    if (exactMatch && exactMatch.value !== this.selectedValue) {
      this.selectOption(exactMatch);
    } else if (!exactMatch && this.selectedValue) {
      // Clear selection if text doesn't match any option
      this.selectedValue = '';
      this.onChange('');
    }
  }

  onInputFocus(): void {
    // Clear the field and show all options when focused
    this.searchText = '';
    this.filteredOptions = [...this.options];
    this.openDropdown();
    this.onTouched();
  }

  onInputBlur(): void {
    // Delay closing to allow option selection
    setTimeout(() => {
      if (this.isOpen) {
        this.closeDropdown();
      }
    }, 150);
  }

  filterOptions(): void {
    const searchLower = this.searchText.toLowerCase();
    this.filteredOptions = this.options.filter(option =>
      option.label.toLowerCase().includes(searchLower)
    );
  }

  selectOption(option: DropdownOption): void {
    this.selectedValue = option.value;
    this.searchText = option.label;
    this.onChange(option.value);
    this.closeDropdown();
  }

  openDropdown(): void {
    if (!this.disabled) {
      this.isOpen = true;
      this.filterOptions();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.updateSearchText();
  }

  onDropdownClick(event: Event): void {
    event.stopPropagation();
  }

  onOptionClick(option: DropdownOption, event: Event): void {
    event.stopPropagation();
    this.selectOption(option);
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.openDropdown();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.openDropdown();
        break;
      case 'Escape':
        this.closeDropdown();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.filteredOptions.length === 1) {
          this.selectOption(this.filteredOptions[0]);
        }
        break;
      case 'Tab':
        // Select the top option if there are filtered options and nothing is currently selected
        if (this.filteredOptions.length > 0 && !this.selectedValue && this.isOpen) {
          this.selectOption(this.filteredOptions[0]);
        }
        break;
    }
  }
}
