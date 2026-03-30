module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Formatting (missing semi colons, etc)
        'refactor', // Refactoring code
        'perf', // Performance improvements
        'test', // Adding tests
        'build', // Build system or dependencies
        'ci', // CI configuration
        'chore', // Maintenance
        'revert', // Revert a commit
      ],
    ],
  },
};
