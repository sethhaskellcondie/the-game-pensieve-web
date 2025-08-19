import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse {
  data: any;
  errors: any;
}

export interface CustomField {
  id: number;
  name: string;
  type: 'text' | 'number' | 'boolean';
  entityKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:8080/v1';

  constructor(private http: HttpClient) { }

  heartbeat(): Observable<string> {
    return this.http.get(`${this.baseUrl}/heartbeat`, { 
      responseType: 'text' 
    });
  }

  seedSampleData(): Observable<HttpResponse<ApiResponse>> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/function/seedSampleData`, {}, {
      observe: 'response'
    });
  }

  getCustomFields(): Observable<CustomField[]> {
    return this.http.get<{data: CustomField[], errors: any}>(`${this.baseUrl}/custom_fields`)
      .pipe(
        map(response => response.data || [])
      );
  }
}