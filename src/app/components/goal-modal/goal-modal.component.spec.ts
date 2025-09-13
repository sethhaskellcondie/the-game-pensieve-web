import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { GoalModalComponent } from './goal-modal.component';
import { GoalService, Goal } from '../../services/goal.service';
import { SettingsService } from '../../services/settings.service';

describe('GoalModalComponent', () => {
  let component: GoalModalComponent;
  let fixture: ComponentFixture<GoalModalComponent>;
  let mockGoalService: jasmine.SpyObj<GoalService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;

  const mockGoal: Goal = {
    id: 'goal1',
    name: 'Test Goal',
    description: 'Test Description',
    completed: false,
    createdAt: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(async () => {
    const goalServiceSpy = jasmine.createSpyObj('GoalService', ['createGoal', 'updateGoal']);
    const settingsServiceSpy = jasmine.createSpyObj('SettingsService', ['getDarkMode$']);

    await TestBed.configureTestingModule({
      imports: [GoalModalComponent, FormsModule],
      providers: [
        { provide: GoalService, useValue: goalServiceSpy },
        { provide: SettingsService, useValue: settingsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GoalModalComponent);
    component = fixture.componentInstance;
    mockGoalService = TestBed.inject(GoalService) as jasmine.SpyObj<GoalService>;
    mockSettingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;

    // Setup default return values
    mockSettingsService.getDarkMode$.and.returnValue(of(false));
    mockGoalService.createGoal.and.returnValue(of(true));
    mockGoalService.updateGoal.and.returnValue(of(true));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form data for new goal', () => {
    fixture.detectChanges();
    
    expect(component.formData.name).toBe('');
    expect(component.formData.description).toBe('');
    expect(component.formData.completed).toBe(false);
  });

  it('should initialize with existing goal data for editing', () => {
    component.goal = mockGoal;
    fixture.detectChanges();
    
    expect(component.formData.name).toBe(mockGoal.name);
    expect(component.formData.description).toBe(mockGoal.description || '');
    expect(component.formData.completed).toBe(mockGoal.completed);
  });

  it('should subscribe to dark mode changes', () => {
    mockSettingsService.getDarkMode$.and.returnValue(of(true));
    fixture.detectChanges();
    
    expect(component.isDarkMode).toBe(true);
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit if name is empty', () => {
      component.formData.name = '';
      component.onSubmit();
      
      expect(mockGoalService.createGoal).not.toHaveBeenCalled();
      expect(mockGoalService.updateGoal).not.toHaveBeenCalled();
    });

    it('should not submit if already submitting', () => {
      component.formData.name = 'Test Goal';
      component.isSubmitting = true;
      component.onSubmit();
      
      expect(mockGoalService.createGoal).not.toHaveBeenCalled();
      expect(mockGoalService.updateGoal).not.toHaveBeenCalled();
    });

    it('should create new goal when no existing goal', () => {
      component.formData.name = 'New Goal';
      component.formData.description = 'New Description';
      component.formData.completed = true;
      
      mockGoalService.createGoal.and.returnValue(of(true));
      
      spyOn(component.closeModal, 'emit');
      component.onSubmit();
      
      expect(mockGoalService.createGoal).toHaveBeenCalledWith({
        name: 'New Goal',
        description: 'New Description',
        completed: true
      });
      expect(component.closeModal.emit).toHaveBeenCalled();
    });

    it('should update existing goal', () => {
      component.goal = mockGoal;
      component.formData.name = 'Updated Goal';
      component.formData.description = 'Updated Description';
      component.formData.completed = true;
      
      mockGoalService.updateGoal.and.returnValue(of(true));
      
      spyOn(component.closeModal, 'emit');
      component.onSubmit();
      
      expect(mockGoalService.updateGoal).toHaveBeenCalledWith('goal1', {
        name: 'Updated Goal',
        description: 'Updated Description',
        completed: true
      });
      expect(component.closeModal.emit).toHaveBeenCalled();
    });

    it('should handle create goal error', () => {
      component.formData.name = 'Test Goal';
      
      mockGoalService.createGoal.and.returnValue(throwError(() => new Error('Create failed')));
      spyOn(console, 'error');
      
      component.onSubmit();
      
      expect(component.isSubmitting).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error saving goal:', jasmine.any(Error));
    });

    it('should handle update goal error', () => {
      component.goal = mockGoal;
      component.formData.name = 'Updated Goal';
      
      mockGoalService.updateGoal.and.returnValue(throwError(() => new Error('Update failed')));
      spyOn(console, 'error');
      
      component.onSubmit();
      
      expect(component.isSubmitting).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error saving goal:', jasmine.any(Error));
    });

    it('should handle service returning false', () => {
      component.formData.name = 'Test Goal';
      
      mockGoalService.createGoal.and.returnValue(of(false));
      spyOn(component.closeModal, 'emit');
      
      component.onSubmit();
      
      expect(component.isSubmitting).toBe(false);
      expect(component.closeModal.emit).not.toHaveBeenCalled();
    });

    it('should trim whitespace from form data', () => {
      component.formData.name = '  Test Goal  ';
      component.formData.description = '  Test Description  ';
      
      mockGoalService.createGoal.and.returnValue(of(true));
      
      component.onSubmit();
      
      expect(mockGoalService.createGoal).toHaveBeenCalledWith({
        name: 'Test Goal',
        description: 'Test Description',
        completed: false
      });
    });

    it('should handle empty description', () => {
      component.formData.name = 'Test Goal';
      component.formData.description = '';
      
      mockGoalService.createGoal.and.returnValue(of(true));
      
      component.onSubmit();
      
      expect(mockGoalService.createGoal).toHaveBeenCalledWith({
        name: 'Test Goal',
        description: undefined,
        completed: false
      });
    });
  });

  describe('onClose', () => {
    it('should emit closeModal event', () => {
      spyOn(component.closeModal, 'emit');
      
      component.onClose();
      
      expect(component.closeModal.emit).toHaveBeenCalled();
    });
  });

  describe('template', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display "Create New Goal" title when creating', () => {
      const titleElement = fixture.nativeElement.querySelector('h2');
      expect(titleElement.textContent).toBe('Create New Goal');
    });

    it('should display "Edit Goal" title when editing', () => {
      component.goal = mockGoal;
      fixture.detectChanges();
      
      const titleElement = fixture.nativeElement.querySelector('h2');
      expect(titleElement.textContent).toBe('Edit Goal');
    });

    it('should have form fields bound to formData', () => {
      const nameInput = fixture.nativeElement.querySelector('input[name="goalName"]');
      const descriptionTextarea = fixture.nativeElement.querySelector('textarea[name="goalDescription"]');
      
      expect(nameInput).toBeTruthy();
      expect(descriptionTextarea).toBeTruthy();
    });

    it('should show completed checkbox when editing existing goal', () => {
      component.goal = mockGoal;
      fixture.detectChanges();
      
      const completedCheckbox = fixture.nativeElement.querySelector('input[name="goalCompleted"]');
      expect(completedCheckbox).toBeTruthy();
    });

    it('should disable submit button when form is invalid or submitting', () => {
      const submitButton = fixture.nativeElement.querySelector('.submit-button');
      
      // Initially disabled because name is empty
      expect(submitButton.disabled).toBe(true);
      
      // Enable when name is provided
      component.formData.name = 'Test Goal';
      fixture.detectChanges();
      expect(submitButton.disabled).toBe(false);
      
      // Disable when submitting
      component.isSubmitting = true;
      fixture.detectChanges();
      expect(submitButton.disabled).toBe(true);
    });
  });
});