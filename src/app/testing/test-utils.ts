import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

export const mockHttpClient = {
  get: jasmine.createSpy('get').and.returnValue(of({ data: {}, errors: null })),
  post: jasmine.createSpy('post').and.returnValue(of({ data: {}, errors: null })),
  put: jasmine.createSpy('put').and.returnValue(of({ data: {}, errors: null })),
  delete: jasmine.createSpy('delete').and.returnValue(of({ data: {}, errors: null })),
  patch: jasmine.createSpy('patch').and.returnValue(of({ data: {}, errors: null }))
};

export const mockActivatedRoute: Partial<ActivatedRoute> = {
  params: of({}),
  queryParams: of({}),
  fragment: of(''),
  data: of({}),
  paramMap: of({
    get: () => null,
    getAll: () => [],
    has: () => false,
    keys: []
  } as any),
  queryParamMap: of({
    get: () => null,
    getAll: () => [],
    has: () => false,
    keys: []
  } as any)
};

export const mockApiService = {
  getVideoGames: jasmine.createSpy('getVideoGames').and.returnValue(of({ data: [], errors: null })),
  getBoardGames: jasmine.createSpy('getBoardGames').and.returnValue(of({ data: [], errors: null })),
  getToys: jasmine.createSpy('getToys').and.returnValue(of({ data: [], errors: null })),
  getMetadata: jasmine.createSpy('getMetadata').and.returnValue(of({ key: '', value: '{}' })),
  createMetadata: jasmine.createSpy('createMetadata').and.returnValue(of({ key: '', value: '{}' })),
  updateMetadata: jasmine.createSpy('updateMetadata').and.returnValue(of({ key: '', value: '{}' })),
  deleteMetadata: jasmine.createSpy('deleteMetadata').and.returnValue(of({})),
  getFilterSpecifications: jasmine.createSpy('getFilterSpecifications').and.returnValue(of({ data: [], errors: null })),
  getCustomFields: jasmine.createSpy('getCustomFields').and.returnValue(of({ data: [], errors: null }))
};

export const mockMetadataService = {
  getMetadata: jasmine.createSpy('getMetadata').and.returnValue(of({})),
  setMetadata: jasmine.createSpy('setMetadata').and.returnValue(of(true)),
  deleteMetadata: jasmine.createSpy('deleteMetadata').and.returnValue(of(true))
};

export const mockSettingsService = {
  loadSettings: jasmine.createSpy('loadSettings').and.returnValue(of({ darkMode: false, massInputMode: false })),
  getDarkMode$: jasmine.createSpy('getDarkMode$').and.returnValue(of(false)),
  getMassInputMode$: jasmine.createSpy('getMassInputMode$').and.returnValue(of(false)),
  setDarkMode: jasmine.createSpy('setDarkMode').and.returnValue(of(true)),
  setMassInputMode: jasmine.createSpy('setMassInputMode').and.returnValue(of(true))
};

export const mockErrorSnackbarService = {
  showError: jasmine.createSpy('showError'),
  showErrors: jasmine.createSpy('showErrors'),
  dismissErrors: jasmine.createSpy('dismissErrors'),
  snackbarState$: of({ show: false, messages: [], type: 'error' })
};

export const mockFilterShortcutService = {
  getShortcuts: jasmine.createSpy('getShortcuts').and.returnValue(of({})),
  setShortcut: jasmine.createSpy('setShortcut').and.returnValue(of(true)),
  deleteShortcut: jasmine.createSpy('deleteShortcut').and.returnValue(of(true))
};