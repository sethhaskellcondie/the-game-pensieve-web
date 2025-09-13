import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { MetadataService } from './metadata.service';
import { FilterRequestDto } from './filter.service';

export interface FilterShortcut {
  id: string;
  name: string;
  description?: string;
  targetPage: string;
  filters: FilterRequestDto[];
  goalId?: string; // Optional reference to parent goal
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilterShortcutService {
  private readonly SHORTCUTS_KEY = 'filter_shortcuts';
  private shortcutsSubject = new BehaviorSubject<FilterShortcut[]>([]);
  
  public shortcuts$ = this.shortcutsSubject.asObservable();

  constructor(private metadataService: MetadataService) {
    this.loadShortcuts();
  }

  loadShortcuts(): void {
    this.metadataService.getMetadata<FilterShortcut[]>(this.SHORTCUTS_KEY).subscribe({
      next: (shortcuts) => {
        this.shortcutsSubject.next(shortcuts || []);
      },
      error: (error) => {
        console.error('Error loading filter shortcuts:', error);
        this.shortcutsSubject.next([]);
      }
    });
  }

  saveShortcuts(shortcuts: FilterShortcut[]): Observable<boolean> {
    this.shortcutsSubject.next(shortcuts);
    return this.metadataService.setMetadata(this.SHORTCUTS_KEY, shortcuts);
  }

  createShortcut(shortcut: Omit<FilterShortcut, 'id' | 'createdAt'>): Observable<boolean> {
    const currentShortcuts = this.shortcutsSubject.value;
    const newShortcut: FilterShortcut = {
      ...shortcut,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    
    const updatedShortcuts = [...currentShortcuts, newShortcut];
    return this.saveShortcuts(updatedShortcuts);
  }

  updateShortcut(id: string, updates: Partial<Omit<FilterShortcut, 'id' | 'createdAt'>>): Observable<boolean> {
    const currentShortcuts = this.shortcutsSubject.value;
    const updatedShortcuts = currentShortcuts.map(shortcut => 
      shortcut.id === id ? { ...shortcut, ...updates } : shortcut
    );
    return this.saveShortcuts(updatedShortcuts);
  }

  deleteShortcut(id: string): Observable<boolean> {
    const currentShortcuts = this.shortcutsSubject.value;
    const updatedShortcuts = currentShortcuts.filter(shortcut => shortcut.id !== id);
    return this.saveShortcuts(updatedShortcuts);
  }

  getShortcuts(): FilterShortcut[] {
    return this.shortcutsSubject.value;
  }

  getShortcutsByGoal(goalId: string): FilterShortcut[] {
    return this.shortcutsSubject.value.filter(shortcut => shortcut.goalId === goalId);
  }

  getUncategorizedShortcuts(): FilterShortcut[] {
    return this.shortcutsSubject.value.filter(shortcut => !shortcut.goalId);
  }

  assignShortcutToGoal(shortcutId: string, goalId: string | null): Observable<boolean> {
    const currentShortcuts = this.shortcutsSubject.value;
    const updatedShortcuts = currentShortcuts.map(shortcut => 
      shortcut.id === shortcutId ? { ...shortcut, goalId: goalId || undefined } : shortcut
    );
    return this.saveShortcuts(updatedShortcuts);
  }

  reassignShortcutsFromGoal(oldGoalId: string, newGoalId: string | null): Observable<boolean> {
    const currentShortcuts = this.shortcutsSubject.value;
    const updatedShortcuts = currentShortcuts.map(shortcut => 
      shortcut.goalId === oldGoalId ? { ...shortcut, goalId: newGoalId || undefined } : shortcut
    );
    return this.saveShortcuts(updatedShortcuts);
  }

  deleteShortcutsByGoal(goalId: string): Observable<boolean> {
    const currentShortcuts = this.shortcutsSubject.value;
    const updatedShortcuts = currentShortcuts.filter(shortcut => shortcut.goalId !== goalId);
    return this.saveShortcuts(updatedShortcuts);
  }

  private generateId(): string {
    return `shortcut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
