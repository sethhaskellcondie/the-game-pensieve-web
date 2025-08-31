import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, CustomField, CustomFieldValue } from '../../services/api.service';
import { SettingsService } from '../../services/settings.service';
import { CustomCheckboxComponent } from '../custom-checkbox/custom-checkbox.component';
import { SelectableNumberInputComponent } from '../selectable-number-input/selectable-number-input.component';

export interface DynamicFieldValue {
  [key: string]: any;
}

@Component({
  selector: 'app-dynamic-custom-fields',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomCheckboxComponent, SelectableNumberInputComponent],
  templateUrl: './dynamic-custom-fields.component.html',
  styleUrl: './dynamic-custom-fields.component.scss'
})
export class DynamicCustomFieldsComponent implements OnInit, OnChanges, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() entityKey!: string;
  @Input() customFieldValues: CustomFieldValue[] = [];
  @Input() sectionTitle?: string;
  @Output() customFieldValuesChange = new EventEmitter<CustomFieldValue[]>();
  @Output() enterPressed = new EventEmitter<void>();
  isDarkMode = false;

  customFields: CustomField[] = [];
  fieldValues: DynamicFieldValue = {};
  isLoading = false;
  errorMessage = '';
  
  get hasCustomFields(): boolean {
    return this.customFields.length > 0;
  }

  constructor(private apiService: ApiService, private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });

    if (this.entityKey) {
      this.loadCustomFields();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityKey'] && !changes['entityKey'].firstChange) {
      this.loadCustomFields();
    }
    if (changes['customFieldValues']) {
      // Always try to populate field values when they change, including first time
      if (this.customFields.length > 0) {
        this.populateFieldValues();
      }
    }
  }

  loadCustomFields(): void {
    if (!this.entityKey) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getCustomFieldsByEntity(this.entityKey).subscribe({
      next: (fields) => {
        this.customFields = fields;
        this.initializeFieldValues();
        // If we have custom field values waiting to be populated, do it now
        if (this.customFieldValues.length > 0) {
          this.populateFieldValues();
          this.emitCustomFieldValues();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading custom fields:', error);
        this.errorMessage = `Failed to load custom fields: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  initializeFieldValues(): void {
    this.fieldValues = {};
    this.customFields.forEach(field => {
      // Set default values based on field type - use empty/blank defaults
      switch (field.type) {
        case 'text':
          this.fieldValues[field.id] = '';
          break;
        case 'number':
          this.fieldValues[field.id] = '';
          break;
        case 'boolean':
          this.fieldValues[field.id] = false;
          break;
        default:
          this.fieldValues[field.id] = '';
      }
    });

    // Populate with existing values if provided
    this.populateFieldValues();
    this.emitCustomFieldValues();
  }

  populateFieldValues(): void {
    this.customFieldValues.forEach(cfv => {
      if (this.fieldValues.hasOwnProperty(cfv.customFieldId)) {
        // Convert string value back to appropriate type
        switch (cfv.customFieldType) {
          case 'number':
            this.fieldValues[cfv.customFieldId] = +cfv.value || 0;
            break;
          case 'boolean':
            this.fieldValues[cfv.customFieldId] = cfv.value === 'true';
            break;
          default:
            this.fieldValues[cfv.customFieldId] = cfv.value;
        }
      }
    });
  }

  onFieldValueChange(): void {
    this.emitCustomFieldValues();
  }

  onEnterPressed(): void {
    this.enterPressed.emit();
  }

  private emitCustomFieldValues(): void {
    const customFieldValues: CustomFieldValue[] = this.customFields.map(field => ({
      customFieldId: field.id,
      customFieldName: field.name,
      customFieldType: field.type,
      value: this.convertValueToString(this.fieldValues[field.id], field.type)
    }));

    this.customFieldValuesChange.emit(customFieldValues);
  }

  private convertValueToString(value: any, type: string): string {
    switch (type) {
      case 'number':
        return value === '' || value === null || value === undefined ? '' : value.toString();
      case 'boolean':
        return (!!value).toString();
      default:
        return (value || '').toString();
    }
  }
}
