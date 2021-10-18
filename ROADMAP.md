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
    - cc: You don't need to set anything there. The only 2 values which should be set are `auth.rootPassword` and `auth.replicaSetKey`. Those I marked with a comment. The full variable list you can find here: https://github.com/bitnami/charts/tree/master/bitnami/mongodb/#parameters
  - The doc says "You should see 4 pods in a ready state, 3 MongoDB nodes and 1 arbiter.", but there is no "arbiter" pod (probably because arbiter.enabled=false)
    - cc: I disabled the arbiter since it's not providing any benefit in this use-case. I updated the readme.
  - What is the role of the `arbiter` pod?
    - cc: MongoDB always needs a majority to vote who should become the leader. In case of an even amount of replicas, an arbiter is needed to form a majority.
  - Do/should we need to stop Cognigy.ai deployment first?
    - cc: I'm not quite sure what you mean by this. If you should stop all pods which require the MongoDB during the migration? If so, it would be best to stop them before (scale down the deployment to 0) or at least restart them after the migration scripts have been executed.
  - More example on migration:
    - Full command on `--archive=/tmp/mongodump`
      - cc: added
    - Expected migration speed (e.g. xx MBps)
      - cc: Together with Chenjun we did measure the times but unfortunately only he wrote them down. If necessary I can measure again.
  - Basic operational activities guideline:
    - Monitor and observe cluster health
      - cc: I added the command to check the cluster health.
    - Management UI (if available)
      - cc: MongoDB does not provide a management UI.
    - Logging and alerting
      - Slow queries
        - cc: slow queries get logged in the normal log stream
      - Unavailable nodes
        - cc: this depends of course on the monitoring system you want to use. For the Prometheus Stack we can just enable the metrics exporter.
      - Errors
        - cc: see above.
      - Daily report
        - cc: what do you mean by that? A summary of the errors that occured during the day? MongoDB doesn't provide any functionality like that natively but probably through a monitoring system you could generate something.
- Provide a loadtest
  - cc: I think the best loadtest would be running a loadtest on the Cognigy platform with the Multi-Replica MongoDB as database. Otherwise you could provide us sample data and frequent load-intensive queries the platform executes.
- Metric exporter does not work. From Dat's check, the username/password environment variables are not set correctly in the exporter container: even though `metrics.username` and `metrics.password` are set, `MONGODB_METRICS_USERNAME` and `MONGODB_METRICS_PASSWORD` are not set.
  - cc: I just checked the setup on the loadtest cluster and the metrics exporter works correctly and is connected to the database. The variables are also set corretly. Why do you think it doesn't work?
