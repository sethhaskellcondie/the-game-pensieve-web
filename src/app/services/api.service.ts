import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface ApiResponse {
  data: any;
  errors: any;
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

  seedSampleData(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/function/seedSampleData`, {});
  }
}