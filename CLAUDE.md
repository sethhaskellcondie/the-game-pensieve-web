# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The goal is to create a sleek modern web interface for a program to manage a collection of video games, board games, and toys.
The color scheme is based around blue (#0370ec) and grey (#9e9e9e) but can include other colors.

Documentation of the API can be found in these two files:
- `resources/api.openapi.yaml`
- `resources/api.postman_collection.json`

## Common Development Commands

- **Development server**: `npm start` or `ng serve` - starts dev server on http://localhost:4200/
- **Build**: `npm run build` or `ng build` - builds the project to `dist/` directory
- **Watch build**: `npm run watch` or `ng build --watch --configuration development` - builds with file watching
- **Tests**: `npm test` or `ng test` - runs unit tests via Karma/Jasmine
- **Generate components**: `ng generate component component-name` - creates new Angular components

## Project Architecture

This is an Angular 17 application using the new standalone component architecture:

### Key Technologies
- **Angular 17** with standalone components (no modules)
- **TypeScript** with strict compilation settings
- **SCSS** for styling (configured as default)
- **Jasmine/Karma** for testing
- **RxJS** for reactive programming

### Application Structure
- **Standalone Components**: All components use `standalone: true` and explicit imports
- **App Configuration**: Uses `ApplicationConfig` in `src/app/app.config.ts` with `provideRouter`
- **Component Prefix**: `app-` (configured in angular.json)
- **Layout**: Main layout uses `ContainerComponent` with `HeaderComponent`, `FooterComponent`, and `SidebarComponent`
- **Routing**: Full routing implemented in `src/app/app.routes.ts` with pages for games, toys, and management
- **Icons**: Uses Heroicons library for consistent iconography

### Component Architecture
Components follow Angular 17 patterns:
- Import `CommonModule` for basic directives
- Import other components directly in the `imports` array
- Use `templateUrl` and `styleUrl` (note: singular, not `styleUrls`)
- **Pages**: Route components in `src/app/pages/` (home, games, detail views, management)
- **Components**: Reusable UI components in `src/app/components/` (modals, inputs, displays)
- **Services**: Business logic in `src/app/services/` with dependency injection
- **Testing**: Comprehensive test utilities in `src/app/testing/test-utils.ts`

### TypeScript Configuration
- **Strict mode enabled** with comprehensive strict settings
- **ES2022 target** for modern JavaScript features
- **Experimental decorators** enabled for Angular
- **Strict Angular compiler options** for better type safety

### Testing Setup
- **Jasmine** test framework with **Karma** test runner
- Component tests use `TestBed.configureTestingModule` with component imports
- Test files follow `*.spec.ts` naming convention

### Build Configuration
- **Production builds** have bundle budgets (500kb initial, 2kb component styles)
- **Development builds** include source maps and no optimization
- **SCSS preprocessing** configured project-wide

## Domain Architecture

This application manages collections of entertainment items with the following main entities:

### Core Entities
- **Video Games**: Individual games with systems, custom fields, and metadata
- **Video Game Boxes**: Physical packaging/collectibles for games
- **Board Games**: Board game titles with custom metadata
- **Board Game Boxes**: Physical board game packages
- **Toys**: Collectible items with set information
- **Systems**: Gaming platforms (consoles, handhelds) with generation tracking
- **Custom Fields**: User-defined metadata fields for any entity type

### Key Services
- **ApiService**: Central HTTP client for backend communication with comprehensive entity interfaces
- **SettingsService**: UI preferences including dark mode and mass edit modes, persisted via MetadataService
- **FilterService**: Complex filtering system with criteria and shortcuts
- **MetadataService**: Generic key-value storage for application settings
- **ErrorSnackbarService**: Centralized error handling and user notifications
- **GoalService**: User goal tracking and management

### Application Features
- **Mass Edit Mode**: Bulk operations across multiple items
- **Advanced Filtering**: Complex filter criteria with shortcuts
- **Dark Mode**: Full theming support via CSS classes
- **Custom Fields**: Dynamic metadata fields per entity type
- **Goal Tracking**: User-defined collection goals

## Development Patterns

### State Management
- Uses RxJS `BehaviorSubject` for reactive state management
- Services maintain state and provide observable streams
- Components use `takeUntil(destroy$)` pattern for subscription cleanup

### Error Handling
- Centralized error handling via `ErrorSnackbarService`
- API responses follow standard `{data, errors}` format
- Services use RxJS `catchError` operator for graceful error handling

### Custom Components
- Consistent naming: `selectable-text-input`, `filterable-dropdown`, etc.
- Reusable modal components for filtering, goals, and entity management
- Custom form controls follow Angular reactive forms patterns