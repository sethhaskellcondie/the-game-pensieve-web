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

  private generateId(): string {
    return `shortcut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
