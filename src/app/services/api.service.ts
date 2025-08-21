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

export interface CustomFieldValue {
  customFieldId: number;
  customFieldName: string;
  customFieldType: 'text' | 'number' | 'boolean';
  value: string;
}

export interface Toy {
  key: string;
  id: number;
  name: string;
  set: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  customFieldValues: CustomFieldValue[];
}

export interface System {
  key: string;
  id: number;
  name: string;
  generation: number;
  handheld: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  customFieldValues: CustomFieldValue[];
}

export interface VideoGameBox {
  key: string;
  id: number;
  title: string;
  system: System;
  isPhysical: boolean;
  isCollection: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  customFieldValues: CustomFieldValue[];
}

export interface BoardGameBox {
  key: string;
  id: number;
  title: string;
  isExpansion: boolean;
  isStandAlone: boolean;
  baseSetId?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  customFieldValues: CustomFieldValue[];
}

export interface VideoGame {
  key: string;
  id: number;
  title: string;
  system: System;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  customFieldValues: CustomFieldValue[];
}

export interface BoardGame {
  key: string;
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  customFieldValues: CustomFieldValue[];
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

  createCustomField(customField: { name: string; type: string; entityKey: string }): Observable<CustomField> {
    return this.http.post<{data: CustomField, errors: any}>(`${this.baseUrl}/custom_fields`, {
      custom_field: customField
    })
      .pipe(
        map(response => response.data)
      );
  }

  updateCustomFieldName(customFieldId: number, name: string): Observable<CustomField> {
    return this.http.patch<{data: CustomField, errors: any}>(`${this.baseUrl}/custom_fields/${customFieldId}`, {
      name: name
    })
      .pipe(
        map(response => response.data)
      );
  }

  getToys(): Observable<Toy[]> {
    return this.http.post<{data: Toy[], errors: any}>(`${this.baseUrl}/toys/function/search`, {
      filters: []
    })
      .pipe(
        map(response => response.data || [])
      );
  }

  getSystems(): Observable<System[]> {
    return this.http.post<{data: System[], errors: any}>(`${this.baseUrl}/systems/function/search`, {
      filters: []
    })
      .pipe(
        map(response => response.data || [])
      );
  }

  getVideoGameBoxes(): Observable<VideoGameBox[]> {
    return this.http.post<{data: VideoGameBox[], errors: any}>(`${this.baseUrl}/videoGameBoxes/function/search`, {
      filters: []
    })
      .pipe(
        map(response => response.data || [])
      );
  }

  getBoardGameBoxes(): Observable<BoardGameBox[]> {
    return this.http.post<{data: BoardGameBox[], errors: any}>(`${this.baseUrl}/boardGameBoxes/function/search`, {
      filters: []
    })
      .pipe(
        map(response => response.data || [])
      );
  }

  getVideoGames(): Observable<VideoGame[]> {
    return this.http.post<{data: VideoGame[], errors: any}>(`${this.baseUrl}/videoGames/function/search`, {
      filters: []
    })
      .pipe(
        map(response => response.data || [])
      );
  }

  getBoardGames(): Observable<BoardGame[]> {
    return this.http.post<{data: BoardGame[], errors: any}>(`${this.baseUrl}/boardGames/function/search`, {
      filters: []
    })
      .pipe(
        map(response => response.data || [])
      );
  }
}