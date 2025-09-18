# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Command Centre is a centralized command and control system for managing operations and workflows. This is a fresh project with initial structure in place but no implementation yet.

## Project Structure

The project follows a standard multi-language structure with separate directories for different concerns:

```
command-centre/
├── src/           # Source code (currently empty - awaiting implementation)
├── docs/          # Documentation (currently empty)
├── config/        # Configuration files (currently empty)  
├── tests/         # Test files (currently empty)
├── README.md      # Project documentation
└── .gitignore     # Configured for multiple languages (Node.js, Python, Java, C#, Go)
```

## Current State

This is a newly initialized project with only the basic structure created. The repository contains:
- Basic README.md with project description
- Comprehensive .gitignore supporting multiple technology stacks
- Empty directory structure ready for development

## Development Setup

Since no specific technology stack has been chosen yet, here are the general development patterns to follow:

### Git Operations
```powershell
# Check project status
git status

# View commit history
git log --oneline

# Check differences
git diff
```

### Directory Navigation
```powershell
# Navigate to source code
cd src/

# Navigate to tests
cd tests/

# Navigate to configuration
cd config/

# Navigate to documentation
cd docs/
```

## Technology Stack Preparation

The .gitignore file is configured to support multiple technology stacks. When implementing the project, consider these patterns:

### For Node.js projects:
- Add `package.json` for dependency management
- Use `npm install` or `yarn install` for dependencies
- Common scripts: `npm run build`, `npm test`, `npm run lint`

### For Python projects:
- Add `requirements.txt` or `pyproject.toml` for dependencies
- Use `pip install -r requirements.txt` for setup
- Common commands: `python -m pytest`, `python -m build`

### For Java projects:
- Add `pom.xml` (Maven) or `build.gradle` (Gradle)
- Use `mvn clean install` or `gradle build`
- Common tasks: `mvn test`, `gradle test`

### For Go projects:
- Add `go.mod` for module management
- Use `go mod tidy` for dependencies
- Common commands: `go build`, `go test`, `go run`

### For C# projects:
- Add `.csproj` or `.sln` files
- Use `dotnet restore` for dependencies
- Common commands: `dotnet build`, `dotnet test`, `dotnet run`

## Architecture Notes

As this is a command and control system, future implementation should consider:

### Core Components (to be implemented)
- **Command Interface**: Entry point for operations and commands
- **Control Layer**: Business logic for managing operations
- **Workflow Engine**: For coordinating complex operations
- **Monitoring**: System status and health checks
- **Configuration Management**: Dynamic configuration handling

### Design Patterns to Consider
- Command pattern for operation execution
- Observer pattern for monitoring and notifications
- Strategy pattern for different workflow types
- Factory pattern for creating different command types

## Development Workflow

When beginning active development:

1. Choose and implement the technology stack
2. Set up build system and dependency management
3. Implement core command interface
4. Add comprehensive testing framework
5. Set up CI/CD pipeline
6. Add monitoring and logging capabilities

## File Organization Recommendations

When adding code:
- Place core interfaces and abstractions in `src/core/`
- Implement command handlers in `src/commands/`
- Add workflow logic in `src/workflows/`
- Store configuration schemas in `config/`
- Maintain API documentation in `docs/api/`
- Add integration tests in `tests/integration/`
- Add unit tests alongside source files or in `tests/unit/`

## Contributing Guidelines

When this project becomes active:
- Follow the established architecture patterns
- Maintain comprehensive test coverage
- Document new commands and workflows
- Update this WARP.md file when adding new build tools or processes