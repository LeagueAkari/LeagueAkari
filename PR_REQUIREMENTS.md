# PR Requirements

We welcome and encourage the use of AI tools to improve development speed and quality. When doing
so, please treat AI output as assisted work that still needs human judgment, ownership, and careful
review. Before preparing or updating a pull request, keep the following expectations in mind:

- Review your own changes before submitting. Make sure any logic you modified or added has gone through your own code review, with special attention to edge cases, regressions, and test coverage.
- Prefer using state-of-the-art AI models whenever possible, such as Claude or GPT. If a weaker or faster model was used for drafting, use a stronger model for review before submitting.
- Keep changes scoped to the intended feature or fix. Avoid affecting existing modules unless it is necessary; if an existing module must be changed, confirm the direction with the maintainer first.
- Rebase on top of the target branch before submitting or updating the PR. Avoid unnecessary merge commits unless there is a clear reason.
- Include enough context in the PR description for reviewers to understand what changed, why it changed, and how it was verified.
