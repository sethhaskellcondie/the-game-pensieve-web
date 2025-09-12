import { TestBed } from '@angular/core/testing';

import { FilterShortcutService } from './filter-shortcut.service';
import { MetadataService } from './metadata.service';
import { mockMetadataService } from '../testing/test-utils';

describe('FilterShortcutService', () => {
  let service: FilterShortcutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MetadataService, useValue: mockMetadataService }
      ]
    });
    service = TestBed.inject(FilterShortcutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
