# GitHub OAuth / Repository Authorization

BOSSNU uses the GitHub App installation flow when repository-level selection is required.

## Required deploy variable

Set:

`VITE_GITHUB_APP_SLUG=<your-github-app-slug>`

Do not put a GitHub private key, PAT, or client secret in `VITE_*` variables.

## User flow

1. Click **GitHub OAuth • เลือกรีโพ** in the Workspace panel.
2. GitHub shows the authorization/installation confirmation.
3. The GitHub App controls the repository scope and can offer:
   - **All repositories**
   - **Only select repositories**
4. The user confirms the selected access on GitHub.
5. Configure the GitHub App's **Setup URL** to point at this application's server callback if the installation ID must be persisted and linked to the signed-in BOSSNU account.

The existing manual `owner/repository` connector remains available for read/compare operations.

## Security

- Never expose `GITHUB_TOKEN`, GitHub App private keys, or client secrets in browser code.
- `VITE_GITHUB_APP_SLUG` is only a public app identifier.
- Repository access is granted by GitHub's own authorization screen, not by a client-side checkbox.
