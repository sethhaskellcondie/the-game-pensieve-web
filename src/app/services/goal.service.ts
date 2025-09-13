import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { MetadataService } from './metadata.service';

export interface Goal {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private readonly GOALS_KEY = 'goals';
  private goalsSubject = new BehaviorSubject<Goal[] | null>(null);
  
  public goals$ = this.goalsSubject.asObservable().pipe(
    map(goals => goals || [])
  );

  constructor(private metadataService: MetadataService) {
    this.loadGoals();
  }

  loadGoals(): void {
    this.metadataService.getMetadata<Goal[]>(this.GOALS_KEY).subscribe({
      next: (data) => {
        // Ensure we have an array, metadata service might return an object or null
        const goals = Array.isArray(data) ? data : [];
        this.goalsSubject.next(goals);
      },
      error: (error) => {
        console.error('Error loading goals:', error);
        this.goalsSubject.next([]);
      }
    });
  }

  saveGoals(goals: Goal[]): Observable<boolean> {
    this.goalsSubject.next(goals);
    return this.metadataService.setMetadata(this.GOALS_KEY, goals);
  }

  createGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Observable<boolean> {
    const currentGoals = this.goalsSubject.value || [];
    const newGoal: Goal = {
      ...goal,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    
    const updatedGoals = [...currentGoals, newGoal];
    return this.saveGoals(updatedGoals);
  }

  updateGoal(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>): Observable<boolean> {
    const currentGoals = this.goalsSubject.value || [];
    const updatedGoals = currentGoals.map(goal => 
      goal.id === id ? { 
        ...goal, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      } : goal
    );
    return this.saveGoals(updatedGoals);
  }

  deleteGoal(id: string): Observable<boolean> {
    const currentGoals = this.goalsSubject.value || [];
    const updatedGoals = currentGoals.filter(goal => goal.id !== id);
    return this.saveGoals(updatedGoals);
  }

  toggleGoalCompletion(id: string): Observable<boolean> {
    const currentGoals = this.goalsSubject.value || [];
    const goal = currentGoals.find(g => g.id === id);
    if (!goal) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }
    
    return this.updateGoal(id, { completed: !goal.completed });
  }

  getGoals(): Goal[] {
    return this.goalsSubject.value || [];
  }

  getGoalById(id: string): Goal | undefined {
    return (this.goalsSubject.value || []).find(goal => goal.id === id);
  }

  private generateId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}