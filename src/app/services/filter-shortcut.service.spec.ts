import { TestBed } from '@angular/core/testing';

import { FilterShortcutService } from './filter-shortcut.service';

describe('FilterShortcutService', () => {
  let service: FilterShortcutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterShortcutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
