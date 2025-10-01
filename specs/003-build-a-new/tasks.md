# Tasks: Google Cloud SDK Tool

**Input**: Design documents from `/specs/003-build-a-new/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: TypeScript, Zod, React/Ink, child_process, Bun test
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: tool-interface.md → contract test task
   → quickstart.md: Extract scenarios → integration tests
3. Generate tasks by category:
   → Setup: project structure, dependencies, configuration
   → Tests: contract tests, integration tests
   → Core: types, API client, operations, formatters
   → Integration: tool registration, components, prompts
   → Polish: unit tests, documentation, validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. SUCCESS: 28 tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/tools/GCloudTool/` following Kode patterns
- All paths relative to repository root

## Phase 3.1: Setup
- [x] T001 Create GCloudTool directory structure in `src/tools/GCloudTool/`
- [x] T002 Update global configuration types in `src/utils/config.ts` for gcloud settings
- [x] T003 [P] Configure TypeScript and linting for new tool files

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Tool interface contract test in `src/tools/GCloudTool/GCloudTool.simple.test.ts`
- [x] T005 [P] Basic command execution integration test (Scenario 1) in `src/tools/GCloudTool/GCloudTool.simple.test.ts`
- [x] T006 [P] Long-running operations integration test (Scenario 2) in `src/tools/GCloudTool/GCloudTool.simple.test.ts`
- [x] T007 [P] Interactive commands integration test (Scenario 3) in `src/tools/GCloudTool/GCloudTool.simple.test.ts`
- [x] T008 [P] Authentication issues integration test (Scenario 4) in `src/tools/GCloudTool/GCloudTool.simple.test.ts`
- [x] T009 [P] Error handling integration test (Scenario 5) in `src/tools/GCloudTool/GCloudTool.simple.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T010 [P] GCloudCommand entity types in `src/tools/GCloudTool/types.ts`
- [x] T011 [P] CommandExecution entity types in `src/tools/GCloudTool/types.ts`
- [x] T012 [P] OutputLine entity types in `src/tools/GCloudTool/types.ts`
- [x] T013 [P] AuthenticationStatus entity types in `src/tools/GCloudTool/types.ts`
- [x] T014 [P] CommandHistory entity types in `src/tools/GCloudTool/types.ts`
- [x] T015 Shell execution and gcloud interaction in `src/tools/GCloudTool/GCloudApiClient.ts`
- [x] T016 Business operations layer in `src/tools/GCloudTool/operations.ts`
- [x] T017 Output formatting utilities in `src/tools/GCloudTool/formatters.ts`
- [x] T018 React UI components in `src/tools/GCloudTool/components.tsx`
- [x] T019 Tool description and prompts in `src/tools/GCloudTool/prompt.ts`
- [x] T020 Main tool implementation in `src/tools/GCloudTool/GCloudTool.tsx`

## Phase 3.4: Integration
- [x] T021 Register GCloudTool in main tools registry `src/tools.ts`
- [x] T022 Add GCloudTool to test-tool command examples in `src/commands/test-tool.tsx`
- [x] T023 Input validation and schema definition in `src/tools/GCloudTool/GCloudTool.tsx`
- [x] T024 Error handling and authentication guidance in `src/tools/GCloudTool/GCloudTool.tsx`

## Phase 3.5: Polish
- [x] T025 [P] Unit tests for formatters in `src/tools/GCloudTool/GCloudTool.simple.test.ts`
- [x] T026 [P] Unit tests for operations in `src/tools/GCloudTool/GCloudTool.simple.test.ts`
- [x] T027 [P] Tool documentation in `src/tools/GCloudTool/README.md`
- [x] T028 [P] Integration test examples in `src/tools/GCloudTool/integration-test-example.md`

## Dependencies
- Setup (T001-T003) before everything
- Tests (T004-T009) before implementation (T010-T024)
- Types (T010-T014) before services (T015-T020)
- Core implementation (T015-T020) before integration (T021-T024)
- Integration before polish (T025-T028)

## Parallel Example
```bash
# Launch T010-T014 together (all types in same file, but different entities):
Task: "GCloudCommand entity types in src/tools/GCloudTool/types.ts"
Task: "CommandExecution entity types in src/tools/GCloudTool/types.ts"
Task: "OutputLine entity types in src/tools/GCloudTool/types.ts"
Task: "AuthenticationStatus entity types in src/tools/GCloudTool/types.ts"
Task: "CommandHistory entity types in src/tools/GCloudTool/types.ts"

# Launch T004-T009 together (all tests in same file, but different test cases):
Task: "Tool interface contract test in src/tools/GCloudTool/GCloudTool.simple.test.ts"
Task: "Basic command execution integration test in src/tools/GCloudTool/GCloudTool.simple.test.ts"
Task: "Long-running operations integration test in src/tools/GCloudTool/GCloudTool.simple.test.ts"
Task: "Interactive commands integration test in src/tools/GCloudTool/GCloudTool.simple.test.ts"
Task: "Authentication issues integration test in src/tools/GCloudTool/GCloudTool.simple.test.ts"
Task: "Error handling integration test in src/tools/GCloudTool/GCloudTool.simple.test.ts"

# Launch T025-T028 together (different files):
Task: "Unit tests for formatters in src/tools/GCloudTool/GCloudTool.simple.test.ts"
Task: "Unit tests for operations in src/tools/GCloudTool/GCloudTool.simple.test.ts"
Task: "Tool documentation in src/tools/GCloudTool/README.md"
Task: "Integration test examples in src/tools/GCloudTool/integration-test-example.md"
```

## Detailed Task Specifications

### T001: Create GCloudTool directory structure
- Create `src/tools/GCloudTool/` directory
- Initialize basic file structure following JiraTool/ConfluenceTool patterns
- Ensure proper TypeScript module setup

### T002: Update global configuration types
- Add gcloud configuration interface to `GlobalConfig` in `src/utils/config.ts`
- Include timeout, format preferences, command history settings
- Follow existing JIRA/Confluence configuration patterns

### T004-T009: Integration Test Suite
- Test all 5 quickstart scenarios from quickstart.md
- Mock gcloud SDK responses for consistent testing
- Verify tool interface contract compliance
- Ensure tests fail before implementation exists

### T010-T014: Entity Type Definitions
- Implement all entities from data-model.md
- Include validation rules and state transitions
- Use Zod schemas for runtime validation
- Follow TypeScript best practices

### T015: GCloudApiClient Implementation
- Shell execution using Node.js child_process.spawn()
- Real-time output streaming with cancellation support
- Authentication status detection via `gcloud auth list`
- JSON format detection and fallback handling

### T016: Operations Layer
- Command validation and sanitization
- Authentication checking and guidance
- Output processing and formatting coordination
- Error handling with helpful suggestions

### T020: Main Tool Implementation
- Complete Tool interface implementation
- Input schema with Zod validation
- Rendering methods for user and assistant output
- Generator-based call method with streaming support

### T021-T022: Tool Registration
- Add to main tools registry for discovery
- Include in test-tool command with examples
- Follow existing tool integration patterns

## Notes
- [P] tasks can run in parallel when they affect different files
- All tests must fail before implementation begins (TDD)
- Follow JiraTool/ConfluenceTool architectural patterns
- Commit after each completed task
- Verify constitutional compliance throughout

## Task Generation Rules Applied

1. **From Contracts**: tool-interface.md → T004 contract test
2. **From Data Model**: 5 entities → T010-T014 model tasks [P]
3. **From Quickstart**: 5 scenarios → T005-T009 integration tests [P]
4. **From Plan**: Modular architecture → T015-T020 implementation tasks
5. **Ordering**: Setup → Tests → Models → Services → Integration → Polish

## Validation Checklist
- [x] All contracts have corresponding tests (T004)
- [x] All entities have model tasks (T010-T014)
- [x] All tests come before implementation (T004-T009 before T010-T024)
- [x] Parallel tasks are truly independent (different concerns/files)
- [x] Each task specifies exact file path
- [x] Constitutional compliance maintained throughout
