import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-boolean-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boolean-display.component.html',
  styleUrl: './boolean-display.component.scss'
})
export class BooleanDisplayComponent {
  @Input() value: boolean | string | null = null;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

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
