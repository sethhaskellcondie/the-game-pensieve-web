# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The goal is to create a sleek modern web interface for a program to manage a collection of video games, board games, and toys.
The color scheme is based around blue (#0370ec) and grey (#9e9e9e) but can include other colors.

Documentation of the API can be found in these two files
backend.postman_collection.json
backend_openapi_documentation.yaml

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
- **Routing**: Empty routes array in `src/app/app.routes.ts` - ready for route definitions

### Component Architecture
Components follow Angular 17 patterns:
- Import `CommonModule` for basic directives
- Import other components directly in the `imports` array
- Use `templateUrl` and `styleUrl` (note: singular, not `styleUrls`)
- Example component structure found in `src/app/components/`

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