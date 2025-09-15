import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GoalService, Goal } from '../../services/goal.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-goal-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goal-modal.component.html',
  styleUrl: './goal-modal.component.scss'
})
export class GoalModalComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  
  @Input() goal: Goal | null = null; // If provided, we're editing
  @Output() closeModal = new EventEmitter<void>();
  @ViewChild('nameField', { static: false }) nameField!: ElementRef;
  
  formData = {
    name: '',
    description: '',
    completed: false
  };
  
  isSubmitting = false;
  isDarkMode = false;
  validationErrors: { [key: string]: string } = {};

  constructor(
    private goalService: GoalService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    // Subscribe to dark mode
    this.settingsService.getDarkMode$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(darkMode => {
        this.isDarkMode = darkMode;
      });

    // If editing, populate form with existing goal data
    if (this.goal) {
      this.formData = {
        name: this.goal.name,
        description: this.goal.description || '',
        completed: this.goal.completed
      };
    }
  }

  ngAfterViewInit(): void {
    // Focus the name field when modal opens
    setTimeout(() => {
      if (this.nameField) {
        this.nameField.nativeElement.focus();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  validateForm(): boolean {
    this.validationErrors = {};

    if (!this.formData.name.trim()) {
      this.validationErrors['name'] = 'Goal name is required';
    }

    return Object.keys(this.validationErrors).length === 0;
  }

  onSubmit(): void {
    if (!this.validateForm() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const goalData = {
      name: this.formData.name.trim(),
      description: this.formData.description.trim() || undefined,
      completed: this.formData.completed
    };

    const operation = this.goal 
      ? this.goalService.updateGoal(this.goal.id, goalData)
      : this.goalService.createGoal(goalData);

    operation.subscribe({
      next: (success) => {
        this.isSubmitting = false;
        if (success) {
          this.closeModal.emit();
        } else {
          console.error('Failed to save goal');
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error saving goal:', error);
      }
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  get modalTitle(): string {
    return this.goal ? 'Edit Goal' : 'New Goal';
  }

  get submitButtonText(): string {
    return this.goal ? 'Update Goal' : 'Create Goal';
  }
}