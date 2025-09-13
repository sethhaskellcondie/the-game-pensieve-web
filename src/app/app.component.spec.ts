import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AppComponent } from './app.component';
import { SettingsService } from './services/settings.service';
import { ApiService } from './services/api.service';
import { MetadataService } from './services/metadata.service';
import { mockHttpClient, mockActivatedRoute, mockSettingsService, mockApiService, mockMetadataService } from './testing/test-utils';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ApiService, useValue: mockApiService },
        { provide: MetadataService, useValue: mockMetadataService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'the-game-pensive-web' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('the-game-pensive-web');
  });

});
