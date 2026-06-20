# Contributing

Contributions are always welcome, no matter how large or small. Before contributing,
please read the [code of conduct](CODE_OF_CONDUCT.md).

Some thoughts to help you contribute to this project

## General Recommendations

1. Always discuss your suggested contribution in an issue, so that we agree on the concept and implementation before the actual work.
2. Leave a detailed description in the Pull Request.
3. Screenshots are preferable for visuals changes.
4. Always communicate. Whether it is in the issue or the pull request, keeping the lines of communication helps everyone around you.
5. If you have any questions, feel free to ask in the discussions or issues.

## Rules & Policies

To ensure a smooth collaboration process, please adhere to the following rules:

### 1. Claiming an Issue
*   **First-Come, First-Served**: Issues will be assigned to the first person who comments on the issue expressing interest (e.g., "I would like to work on this").

### 2. Pull Request (PR) Policy
*   **Assignment Required**: A Pull Request will only be merged if the sender was the officially assigned contributor for that specific issue.
*   **Unassigned PRs**: If you submit a PR for an issue that was not assigned to you, it will be automatically closed. We do this to respect the time of the contributor who was officially working on it.
*   **Reference the Issue**: Always include `Closes #IssueNumber` in your PR description so the deployment and tracking tools work correctly.
*   **Add Preview**: Always add a screenshot or video of the changes you made and attach it with the PR.

### 3. Timeline & "Ghosting"
*   **24-Hour Rule**: Once assigned, you have 24 hours to submit a draft PR or show progress.
*   **Reassignment**: If there is no activity after 24 hours, the issue will be unassigned and given to the next person in line to keep the project moving.

## Get Started

1. Fork the repo `https://github.com/sanglaphalder/DSA-Visualizer`
2. Clone

   ```shell
   $ git clone https://github.com/<your-name>/DSA-Visualizer
   $ cd DSA-Visualizer
   ```

3. Install dependencies

   ```shell
   $ npm install
   ```

4. Run the development server

   ```shell
   $ npm run dev
   ```
   Open http://localhost:5173 to view it in the browser.

5. Build for production

   ```shell
   $ npm run build
   ```

6. Run linters

   ```shell
   $ npm run lint
   ```

## Pull Requests

### _We actively welcome your pull requests, however linking your work to an existing issue is preferred._

1. Fork the repo and create your branch from `main` (or `master` depending on the repo default).
2. Name your branch something that is descriptive to the work you are doing. i.e. `feat/add-new-thing` or `fix/mobile-layout`.
3. If you've added code that should be tested, add tests.
4. If you've changed APIs, update the documentation.
5. If you make visual changes, screenshots are required.
6. Make sure you address any lint warnings.
7. If you make the existing code better, please let us know in your PR description.
8. A PR description and title are required.
9. [Link to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) in the project. An issue is required to announce your intentions and discuss decisions.

### Commit Messages

This project encourages the use of [Conventional Commits](https://www.conventionalcommits.org/).

### Work in progress

GitHub has support for draft pull requests, which will disable the merge button until the PR is marked as ready for merge.

## Issues

If you plan to contribute a change based on an open issue, please assign yourself by commenting on the issue. Issues that are not assigned are assumed open, and to avoid conflicts, please assign yourself before beginning work on any issues.

If you would like to contribute to the project for the first time, please consider checking the [good first issue](https://github.com/MohamedAbdElwahabOka/DSA-Visualizer/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) labels.
