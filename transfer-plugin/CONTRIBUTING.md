# Contributing to Transfer

Thank you for considering contributing to the Transfer plugin! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Setting Up Your Environment

```bash
# Install dependencies
npm install

# Start development mode with watch
npm run dev

# In a separate terminal, run tests in watch mode
npm run test:watch
```

### Making Changes

1. Write your code following the existing style
2. Add tests for new functionality
3. Ensure all tests pass: `npm test`
4. Ensure code is properly formatted: `npm run format`
5. Check for linting errors: `npm run lint`
6. Run type checking: `npm run type-check`

### Code Style Guidelines

- Use TypeScript strict mode
- Add JSDoc comments for public functions and interfaces
- Keep functions small and focused (ideally <50 lines)
- Use meaningful variable and function names
- Avoid deep nesting (max 3 levels)
- Prefer functional programming patterns
- Use early returns to reduce nesting

#### Example:

```typescript
/**
 * Validates if a component is from the local file
 * @param component - The component to validate
 * @returns True if the component is local
 */
export function isLocalComponent(component: ComponentNode): boolean {
  const currentFileKey = figma.root.id;
  return component.key.startsWith(currentFileKey);
}
```

### Testing

- Write unit tests for all new utility functions
- Write integration tests for complex workflows
- Aim for >80% test coverage
- Use descriptive test names: `it('should validate local components correctly')`
- Group related tests in `describe` blocks
- Mock external dependencies (Figma API)

#### Test Structure:

```typescript
describe('Utility Module', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('specificFunction', () => {
    it('should handle normal case', () => {
      // Test implementation
    });

    it('should handle edge case', () => {
      // Test implementation
    });
  });
});
```

### Commit Messages

Use conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(analyzer): add support for nested variant sets
fix(validator): correct external component detection
docs(readme): update installation instructions
test(batcher): add tests for cancellation
```

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the CHANGELOG.md with your changes
3. Ensure all tests pass and coverage is maintained
4. Request review from maintainers
5. Address any feedback from reviewers

### PR Checklist

- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] Commit messages follow convention
- [ ] No console.log statements (use proper logging)
- [ ] TypeScript types are properly defined
- [ ] Performance impact considered

## Reporting Bugs

Use the GitHub issue tracker to report bugs. Include:

1. **Description**: Clear description of the bug
2. **Steps to reproduce**: Detailed steps to reproduce the issue
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Environment**: OS, Figma version, plugin version
6. **Screenshots**: If applicable
7. **Error messages**: Full error messages or stack traces

### Bug Report Template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS 12.0]
- Figma Version: [e.g. Desktop 116.0]
- Plugin Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

## Feature Requests

We welcome feature requests! Please:

1. Check existing issues first
2. Clearly describe the feature and use case
3. Explain why it would be useful
4. Consider implementation complexity
5. Be open to discussion and alternatives

### Feature Request Template:

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots.
```

## Code Review

All contributions will be reviewed by maintainers. We look for:

1. **Functionality**: Does it work as intended?
2. **Code Quality**: Is it well-written and maintainable?
3. **Tests**: Are there adequate tests?
4. **Documentation**: Is it documented?
5. **Performance**: Any performance implications?
6. **Security**: Any security concerns?

### Review Process

1. Automated checks run (tests, linting, types)
2. Maintainer reviews code
3. Feedback provided if changes needed
4. Once approved, PR is merged

## Release Process

Maintainers handle releases:

1. Version bump in package.json
2. Update CHANGELOG.md
3. Create Git tag
4. Build production version
5. Create GitHub release
6. Publish to Figma Community

## Community Guidelines

- Be respectful and constructive
- Welcome newcomers
- Help others learn
- Give credit where due
- Follow the code of conduct

## Getting Help

- **Documentation**: Check the README first
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community (link)

## Areas for Contribution

Looking for ideas? Here are areas that need help:

### High Priority
- Performance optimizations for large component sets
- Better error messages and recovery
- Accessibility improvements

### Medium Priority
- Additional layout options
- Export formats (PDF, PNG of Transfer page)
- Component search and filtering enhancements

### Nice to Have
- Automated testing for UI components
- Internationalization (i18n)
- Plugin analytics (privacy-respecting)

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in the plugin UI (for major contributions)

## Questions?

Don't hesitate to ask! Open an issue or start a discussion.

---

Thank you for contributing to Transfer! 🎉
