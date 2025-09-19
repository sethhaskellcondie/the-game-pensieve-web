import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FilterRequestDto } from './filter.service';
import { ErrorSnackbarService } from './error-snackbar.service';

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
  videoGames: VideoGame[];
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
  boardGame?: BoardGame | null;
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

export interface Metadata {
  id: number;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:8080/v1';

  constructor(private http: HttpClient, private errorSnackbarService: ErrorSnackbarService) { }

  private handleApiResponse<T>(response: {data: T, errors: any}): T {
    if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
      this.errorSnackbarService.processApiErrors({errors: response.errors});
    }
    return response.data;
  }

  private handleHttpError = (error: any): Observable<never> => {
    // Extract errors from the HTTP error response
    this.errorSnackbarService.processApiErrors(error);
    throw error;
  }

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

  seedMyCollection(): Observable<HttpResponse<ApiResponse>> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/function/seedMyCollection`, {}, {
      observe: 'response'
    });
  }

  backup(): Observable<any> {
    return this.http.post(`${this.baseUrl}/function/backup`, {})
      .pipe(
        catchError(this.handleHttpError)
      );
  }

  importFromFile(fileContent: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/function/importFromFile`, {
      fileContent: fileContent
    })
      .pipe(
        catchError(this.handleHttpError)
      );
  }

  import(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/function/import`, data)
      .pipe(
        catchError(this.handleHttpError)
      );
  }

  getCustomFields(): Observable<CustomField[]> {
    return this.http.get<{data: CustomField[], errors: any}>(`${this.baseUrl}/custom_fields`)
      .pipe(
        map(response => this.handleApiResponse(response) || []),
        catchError(this.handleHttpError)
      );
  }

  getCustomFieldsByEntity(entityKey: string): Observable<CustomField[]> {
    return this.http.get<{data: CustomField[], errors: any}>(`${this.baseUrl}/custom_fields/entity/${entityKey}`)
      .pipe(
        map(response => this.handleApiResponse(response) || []),
        catchError(this.handleHttpError)
      );
  }

  createCustomField(customField: { name: string; type: string; entityKey: string }): Observable<CustomField> {
    return this.http.post<{data: CustomField, errors: any}>(`${this.baseUrl}/custom_fields`, {
      custom_field: customField
    })
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError(this.handleHttpError)
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

  deleteCustomField(customFieldId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/custom_fields/${customFieldId}`)
      .pipe(
        catchError(this.handleHttpError)
      );
  }

  getToys(filters: FilterRequestDto[] = []): Observable<Toy[]> {
    return this.http.post<{data: Toy[], errors: any}>(`${this.baseUrl}/toys/function/search`, {
      filters: filters
    })
      .pipe(
        map(response => this.handleApiResponse(response) || []),
        catchError(this.handleHttpError)
      );
  }

  createToy(toy: { name: string; set: string; customFieldValues: any[] }): Observable<Toy> {
    return this.http.post<{data: Toy, errors: any}>(`${this.baseUrl}/toys`, {
      toy: toy
    })
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError(this.handleHttpError)
      );
  }

  updateToy(toyId: number, toy: { name: string; set: string; customFieldValues: any[] }): Observable<Toy> {
    return this.http.put<{data: Toy, errors: any}>(`${this.baseUrl}/toys/${toyId}`, {
      toy: toy
    })
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError(this.handleHttpError)
      );
  }

  deleteToy(toyId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/toys/${toyId}`)
      .pipe(
        catchError(this.handleHttpError)
      );
  }

  getSystems(filters: FilterRequestDto[] = []): Observable<System[]> {
    return this.http.post<{data: System[], errors: any}>(`${this.baseUrl}/systems/function/search`, {
      filters: filters
    })
      .pipe(
        map(response => this.handleApiResponse(response) || []),
        catchError(this.handleHttpError)
      );
  }

  createSystem(system: { name: string; generation: number; handheld: boolean; customFieldValues: any[] }): Observable<System> {
    return this.http.post<{data: System, errors: any}>(`${this.baseUrl}/systems`, {
      system: system
    })
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError(this.handleHttpError)
      );
  }

  updateSystem(systemId: number, system: { name: string; generation: number; handheld: boolean; customFieldValues: any[] }): Observable<System> {
    return this.http.put<{data: System, errors: any}>(`${this.baseUrl}/systems/${systemId}`, {
      system: system
    })
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError(this.handleHttpError)
      );
  }

  deleteSystem(systemId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/systems/${systemId}`)
      .pipe(
        catchError(this.handleHttpError)
      );
  }

  getVideoGameBoxes(filters: FilterRequestDto[] = []): Observable<VideoGameBox[]> {
    return this.http.post<{data: VideoGameBox[], errors: any}>(`${this.baseUrl}/videoGameBoxes/function/search`, {
      filters: filters
    })
      .pipe(
        map(response => response.data || [])
      );
  }

  getVideoGameBox(id: number): Observable<VideoGameBox> {
    return this.http.get<{data: VideoGameBox, errors: any}>(`${this.baseUrl}/videoGameBoxes/${id}`)
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError(this.handleHttpError)
      );
  }

  getBoardGameBoxes(filters: FilterRequestDto[] = []): Observable<BoardGameBox[]> {
    return this.http.post<{data: BoardGameBox[], errors: any}>(`${this.baseUrl}/boardGameBoxes/function/search`, {
      filters: filters
    })
      .pipe(
        map(response => response.data || [])
      );
  }

  getBoardGameBox(id: number): Observable<BoardGameBox> {
    return this.http.get<{data: BoardGameBox, errors: any}>(`${this.baseUrl}/boardGameBoxes/${id}`)
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError(this.handleHttpError)
      );
  }

  getVideoGames(filters: FilterRequestDto[] = []): Observable<VideoGame[]> {
    return this.http.post<{data: VideoGame[], errors: any}>(`${this.baseUrl}/videoGames/function/search`, {
      filters: filters
    })
      .pipe(
        map(response => response.data || [])
      );
  }

  getVideoGame(id: number): Observable<VideoGame> {
    return this.http.get<{data: VideoGame, errors: any}>(`${this.baseUrl}/videoGames/${id}`)
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError(this.handleHttpError)
      );
  }

  getBoardGames(filters: FilterRequestDto[] = []): Observable<BoardGame[]> {
    return this.http.post<{data: BoardGame[], errors: any}>(`${this.baseUrl}/boardGames/function/search`, {
      filters: filters
    })
      .pipe(
        map(response => response.data || [])
      );
  }

  getBoardGame(id: number): Observable<BoardGame> {
    return this.http.get<{data: BoardGame, errors: any}>(`${this.baseUrl}/boardGames/${id}`)
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError(this.handleHttpError)
      );
  }

  createVideoGame(videoGame: { title: string; systemId: number; customFieldValues: any[] }): Observable<VideoGame> {
    return this.http.post<{data: VideoGame, errors: any}>(`${this.baseUrl}/videoGames`, {
      title: videoGame.title,
      systemId: videoGame.systemId,
      customFieldValues: videoGame.customFieldValues
    })
      .pipe(
        map(response => response.data)
      );
  }

  updateVideoGame(id: number, videoGame: { title: string; systemId: number; customFieldValues: any[] }): Observable<VideoGame> {
    return this.http.put<{data: VideoGame, errors: any}>(`${this.baseUrl}/videoGames/${id}`, {
      videoGame: videoGame
    })
      .pipe(
        map(response => response.data)
      );
  }

  createVideoGameBox(videoGameBox: { title: string; systemId: number; isPhysical: boolean; isCollection: boolean; existingVideoGameIds?: number[]; newVideoGames?: any[]; customFieldValues: any[] }): Observable<VideoGameBox> {
    return this.http.post<{data: VideoGameBox, errors: any}>(`${this.baseUrl}/videoGameBoxes`, {
      videoGameBox: {
        title: videoGameBox.title,
        systemId: videoGameBox.systemId,
        isPhysical: videoGameBox.isPhysical,
        isCollection: videoGameBox.isCollection,
        existingVideoGameIds: videoGameBox.existingVideoGameIds || [],
        newVideoGames: videoGameBox.newVideoGames || [],
        customFieldValues: videoGameBox.customFieldValues
      }
    })
      .pipe(
        map(response => response.data)
      );
  }

  updateVideoGameBox(id: number, videoGameBox: { title: string; systemId: number; isPhysical: boolean; isCollection: boolean; existingVideoGameIds?: number[]; newVideoGames?: any[]; customFieldValues: any[] }): Observable<VideoGameBox> {
    return this.http.put<{data: VideoGameBox, errors: any}>(`${this.baseUrl}/videoGameBoxes/${id}`, {
      videoGameBox: {
        title: videoGameBox.title,
        systemId: videoGameBox.systemId,
        isPhysical: videoGameBox.isPhysical,
        isCollection: videoGameBox.isCollection,
        existingVideoGameIds: videoGameBox.existingVideoGameIds || [],
        newVideoGames: videoGameBox.newVideoGames || [],
        customFieldValues: videoGameBox.customFieldValues
      }
    })
      .pipe(
        map(response => response.data)
      );
  }

  deleteVideoGameBox(videoGameBoxId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/videoGameBoxes/${videoGameBoxId}`);
  }

  createBoardGameBox(boardGameBox: { title: string; isExpansion: boolean; isStandAlone: boolean; baseSetId?: number | null; boardGameId?: number | null; boardGame?: any; customFieldValues: any[] }): Observable<BoardGameBox> {
    return this.http.post<{data: BoardGameBox, errors: any}>(`${this.baseUrl}/boardGameBoxes`, {
      boardGameBox: {
        title: boardGameBox.title,
        isExpansion: boardGameBox.isExpansion,
        isStandAlone: boardGameBox.isStandAlone,
        baseSetId: boardGameBox.baseSetId ? parseInt(boardGameBox.baseSetId.toString()) : null,
        boardGameId: boardGameBox.boardGameId ? parseInt(boardGameBox.boardGameId.toString()) : null,
        boardGame: boardGameBox.boardGame || null,
        customFieldValues: boardGameBox.customFieldValues
      }
    })
      .pipe(
        map(response => response.data)
      );
  }

  updateBoardGameBox(id: number, boardGameBox: { title: string; isExpansion: boolean; isStandAlone: boolean; baseSetId?: number | null; boardGameId?: number | null; customFieldValues: any[] }): Observable<BoardGameBox> {
    return this.http.put<{data: BoardGameBox, errors: any}>(`${this.baseUrl}/boardGameBoxes/${id}`, {
      boardGameBox: {
        title: boardGameBox.title,
        isExpansion: boardGameBox.isExpansion,
        isStandAlone: boardGameBox.isStandAlone,
        baseSetId: boardGameBox.baseSetId ? parseInt(boardGameBox.baseSetId.toString()) : null,
        boardGameId: boardGameBox.boardGameId ? parseInt(boardGameBox.boardGameId.toString()) : null,
        boardGame: null,
        customFieldValues: boardGameBox.customFieldValues
      }
    })
      .pipe(
        map(response => response.data)
      );
  }

  deleteBoardGameBox(boardGameBoxId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/boardGameBoxes/${boardGameBoxId}`);
  }

  createBoardGame(boardGame: { title: string; customFieldValues: any[] }): Observable<BoardGame> {
    return this.http.post<{data: BoardGame, errors: any}>(`${this.baseUrl}/boardGames`, {
      boardGame: {
        title: boardGame.title,
        customFieldValues: boardGame.customFieldValues
      }
    })
      .pipe(
        map(response => response.data)
      );
  }

  updateBoardGame(id: number, boardGame: { title: string; customFieldValues: any[] }): Observable<BoardGame> {
    return this.http.put<{data: BoardGame, errors: any}>(`${this.baseUrl}/boardGames/${id}`, {
      boardGame: boardGame
    })
      .pipe(
        map(response => response.data)
      );
  }

  getMetadata(key: string): Observable<Metadata> {
    return this.http.get<{data: Metadata, errors: any}>(`${this.baseUrl}/metadata/${key}`)
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError((error: any) => {
          // For metadata 404s, don't show snackbar since we handle this gracefully
          if (error.status === 404) {
            throw error; // Just throw without processing through snackbar service
          }
          // For other errors, use normal error handling
          return this.handleHttpError(error);
        })
      );
  }

  createMetadata(metadata: { key: string; value: string }): Observable<Metadata> {
    return this.http.post<{data: Metadata, errors: any}>(`${this.baseUrl}/metadata`, {
      metadata: metadata
    })
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError(this.handleHttpError)
      );
  }

  updateMetadata(key: string, value: string): Observable<Metadata> {
    return this.http.patch<{data: Metadata, errors: any}>(`${this.baseUrl}/metadata/${key}`, {
      value: value
    })
      .pipe(
        map(response => this.handleApiResponse(response)),
        catchError(this.handleHttpError)
      );
  }

  deleteMetadata(key: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/metadata/${key}`)
      .pipe(
        catchError(this.handleHttpError)
      );
  }
}