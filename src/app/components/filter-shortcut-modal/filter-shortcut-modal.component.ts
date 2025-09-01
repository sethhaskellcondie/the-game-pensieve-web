import { Component, EventEmitter, Input, Output, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterShortcutService, FilterShortcut } from '../../services/filter-shortcut.service';
import { FilterRequestDto } from '../../services/filter.service';
import { SelectableTextInputComponent } from '../selectable-text-input/selectable-text-input.component';

@Component({
  selector: 'app-filter-shortcut-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectableTextInputComponent],
  templateUrl: './filter-shortcut-modal.component.html',
  styleUrl: './filter-shortcut-modal.component.scss'
})
export class FilterShortcutModalComponent implements OnInit {
  @Input() shortcut: FilterShortcut | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @ViewChild('nameField', { static: false }) nameField: any;
  
  formData = {
    name: '',
    description: '',
    targetPage: '/video-game-boxes',
    filters: [] as FilterRequestDto[]
  };
  
  isSubmitting = false;
  availablePages = [
    { value: '/video-games', label: 'Video Games' },
    { value: '/video-game-boxes', label: 'Video Game Boxes' },
    { value: '/board-games', label: 'Board Games' },
    { value: '/board-game-boxes', label: 'Board Game Boxes' },
    { value: '/systems', label: 'Systems' },
    { value: '/toys', label: 'Toys' }
  ];

  constructor(private filterShortcutService: FilterShortcutService) {}

  ngOnInit(): void {
    if (this.shortcut) {
      this.formData = {
        name: this.shortcut.name,
        description: this.shortcut.description || '',
        targetPage: this.shortcut.targetPage,
        filters: [...this.shortcut.filters]
      };
    }
    
    setTimeout(() => {
      if (this.nameField && this.nameField.focus) {
        this.nameField.focus();
      }
    }, 0);
  }

  onSubmit(): void {
    if (this.isSubmitting || !this.formData.name.trim()) {
      return;
    }
    
    this.isSubmitting = true;
    
    const shortcutData = {
      name: this.formData.name.trim(),
      description: this.formData.description.trim() || undefined,
      targetPage: this.formData.targetPage,
      filters: this.formData.filters
    };
    
    const operation = this.shortcut
      ? this.filterShortcutService.updateShortcut(this.shortcut.id, shortcutData)
      : this.filterShortcutService.createShortcut(shortcutData);
    
    operation.subscribe({
      next: (success) => {
        if (success) {
          this.closeModal.emit();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error saving shortcut:', error);
        this.isSubmitting = false;
      }
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  addFilter(): void {
    this.formData.filters.push({
      key: this.getEntityTypeFromPage(this.formData.targetPage),
      field: '',
      operator: 'equals',
      operand: ''
    });
  }

  removeFilter(index: number): void {
    this.formData.filters.splice(index, 1);
  }

  private getEntityTypeFromPage(page: string): string {
    const pageMap: { [key: string]: string } = {
      '/video-games': 'videoGame',
      '/video-game-boxes': 'videoGameBox',
      '/board-games': 'boardGame',
      '/board-game-boxes': 'boardGameBox',
      '/systems': 'system',
      '/toys': 'toy'
    };
    return pageMap[page] || 'videoGameBox';
  }
}
