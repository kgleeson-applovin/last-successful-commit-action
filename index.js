const core = require("@actions/core");
const github = require("@actions/github");

try {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || core.getInput("github_token");
  if (!token) {
    throw Error('You must provide a GitHub Token via the action configuration parameter `github_token` or one of the following environment variables: `GITHUB_TOKEN`, `GH_TOKEN`.')
  }
  const octokit = github.getOctokit(token);
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const branch = core.getInput("branch");
  octokit.actions
    .listWorkflowRuns({
      owner,
      repo,
      workflow_id: core.getInput("workflow_id"),
      status: "success",
      branch,
      event: "push",
    })
    .then((res) => {
      core.debug('workflow_runs.length: ' + res.data.workflow_runs.length);
      const lastSuccessCommitHash =
        res.data.workflow_runs.length > 0
          ? res.data.workflow_runs[0].head_commit.id
          : branch;
      core.debug('lastSuccessCommitHash: ' + lastSuccessCommitHash);
      core.setOutput("commit_hash", lastSuccessCommitHash);
    })
    .catch((e) => {
      core.setFailed(e.message);
    });
} catch (e) {
  core.setFailed(e.message);
}
