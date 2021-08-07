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
    // status: 'success',
    branch,
  }
  const event = core.getInput('workflow_event')
  if (event) {
    params.event = event  // default event type is 'any'
  }
  core.debug(`params: ${JSON.stringify(params, null, 4)}`);

  let lastSuccessCommitHash = branch
  octokit.actions
    .listWorkflowRuns(params)
    .then((res) => {
      core.debug(`Found ${res.data.workflow_runs.length} total workflow runs.`);

      const successfulRuns = res.data.workflow_runs.filter(run => {
        return run.status == 'completed' && run.conclusion == 'success';
      })
      if (successfulRuns.length > 0) {
        lastSuccessCommitHash = successfulRuns[0].head_commit.id;
      } else {
        core.warning('Didn\'t find any successful runs. Using the branch name.');
      }
      core.setOutput('commit_hash', lastSuccessCommitHash);
    })
    .catch((e) => {
      core.setFailed(e.message);
    });
} catch (e) {
  core.setFailed(e.message);
}
