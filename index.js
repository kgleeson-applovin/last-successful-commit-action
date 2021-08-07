const core = require('@actions/core');
const github = require('@actions/github');

try {
  // Read GitHub Token.
  const token = process.env.GITHUB_TOKEN || core.getInput('github_token');
  if (!token) {
    throw Error(
      'You must provide a GitHub Token via the action configuration parameter `github_token`'
      + ' or the environment variable `GITHUB_TOKEN`.'
    )
  }

  const octokit = github.getOctokit(token);

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const branch = core.getInput('branch');
  const params = {
    owner,
    repo,
    workflow_id: core.getInput('workflow_id'),
    status: 'success',
    branch,
  }
  const event = core.getInput('workflow_event')
  if (event) {
    params.event = event  // default event type is 'any'
  }

  octokit.actions
    .listWorkflowRuns(params)
    .then((res) => {
      core.debug(`workflow_runs.length: ${res.data.workflow_runs.length}`);
      const lastSuccessCommitHash =
        res.data.workflow_runs.length > 0
          ? res.data.workflow_runs[0].head_commit.id
          : branch;
      core.debug(`lastSuccessCommitHash: ${lastSuccessCommitHash}`);
      core.setOutput('commit_hash', lastSuccessCommitHash);
    })
    .catch((e) => {
      core.setFailed(e.message);
    });
} catch (e) {
  core.setFailed(e.message);
}
