This file contains the tasks and plans for the project, from both side Cognigy and CodeCentric

# Tasks
## Cognigy

- [ ] Loadtest the new MongoDB setup
  - AWS/EKS
  - AKS
- [ ] Test the data migration from the old setup to the new one
- [ ] Plan the migration for:
  - New customers
  - Current customers
  - Cognigy's hosted clusters

## CodeCentric
- Answer these questions:
  - Example of a working `values.yaml`. E.g. the current README doesn't say what to set in auth.username, auth.database, auth.password
  - The doc says "You should see 4 pods in a ready state, 3 MongoDB nodes and 1 arbiter.", but there is no "arbiter" pod (probably because arbiter.enabled=false)
  - What is the role of the `arbiter` pod?
  - Do/should we need to stop Cognigy.ai deployment first?
  - More example on migration:
    - Full command on `--archive=/tmp/mongodump`
    - Expected migration speed (e.g. xx MBps)
  - Basic operational activities guideline:
    - Monitor and observe cluster health
    - Management UI (if available)
    - Logging and alerting
      - Slow queries
      - Unavailable nodes
      - Errors
      - Daily report
- Provide a loadtest
- Metric exporter does not work. From Dat's check, the username/password environment variables are not set correctly in the exporter container: even though `metrics.username` and `metrics.password` are set, `MONGODB_METRICS_USERNAME` and `MONGODB_METRICS_PASSWORD` are not set.