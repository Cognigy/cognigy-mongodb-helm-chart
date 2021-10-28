# Multi-Replica MongoDB

## General

This is the Helm setup for the Multi-Replica MongoDB architecture. It uses the [MongoDB chart by Bitnami](https://github.com/bitnami/charts/tree/master/bitnami/mongodb). MongoDB is set up as a 3 node replica set. The 3 nodes are distributed throughout different availability zones (i.e. eu-central-1a, eu-central-1b and eu-central-1b). To accomplish this, the Kubernetes label `topology.kubernetes.io/zone` is used, which is one of the [well-known labels](https://kubernetes.io/docs/reference/labels-annotations-taints/#topologykubernetesiozone) and is therefore present in all major installers or managed services. The setup uses an anti-affinity to accomplish this behavior: if the label `uniquezone=set` is found for a pod, there cannot be another MongoDB pod with this label in the same availability zone.

### Monitoring
The chart natively supports monitoring through Prometheus. The service monitor is enabled in the values which allows for an automatic detection of the MongoDB metrics endpoints by Prometheues. Also, Prometheus rules can be enabled for alerting in the values. A matching Grafana dashboard can be found [here](https://grafana.com/grafana/dashboards/7353).

### Backups
Two Kubernetes manifests for backups are provided in this repository. Both do daily dumps of all databases and write the backup to `/data/db/` on the PVC `mongodb-backup`. The backups are gzip-compressed. Make sure to adjust the values in the manifests as needed, i.e. the PVC size, the backup schedule, the connection string etc.
* `backup_cronjob_single_copy.yaml` creates a daily backup with the name `mongodump.gz`. Therefore it is overwritten daily and only the last dump is kept. If a longer retention is needed, snapshots of this volume should be taken with a certain schedule.
* `backup_cronjob_retention.yaml` creates daily backups with the name `mongodump_DATE.gz` and keeps them for a retention period of X days. This value can be adjusted in the script.
All backups are full dumps since MongoDB doesn't support incremental backups.

## Migration
The migration process from a single node setup to a replica one involves several steps. These are described in the following paragraphs. This guide assumes the "old" MongoDB server to be deployed in the `default` namespace and will install the "new" MongoDB ReplicaSet into the namespace `mongodb`.

### Deployment
To deploy the new MongoDB setup adjust the values accordingly in the `values.yaml` file. Most likely you will just have to adjust the root password for the database. Also, the size of the Persistent Volume Claim should be adjusted as needed. In order to have it set to the same one as before you can find out the current one by executing the following on the appropriate Kubernetes cluster:
```
kubectl get secret cognigy-mongo-server -ojsonpath='{.data.mongo-initdb-root-password}' | base64 --decode
```
The `rootPassword` value in the `auth` section should be set to this value. Also a `replicaSetKey` should be set to a secure value.
Afterwards, the new setup can be deployed via Helm:

```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm upgrade --install -n mongodb mongodb bitnami/mongodb --values values.yaml --create-namespace
```

To verify all pods are in a ready state, you can execute:

```
kubectl get pods -n mongodb
```

You should see 3 pods in a ready state, called mongodb-0, mongodb-1 and mongodb-2. These are the 3 nodes of the cluster.

### Data migration
To migrate the actual data you can either use one of the MongoDB pods or run a seperate one. Please, stop the running cognigy installation before start the migration. To do so 

```
for i in $(kubectl get deployment --namespace default --template '{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}'|grep service-)do
    kubectl --namespace default scale --replicas=0 deployment $i
done
```
To use one of the MongoDB pods:
```
kubectl exec -it mongodb-0 -n mongodb -- bash
```
To use a seperate pod:
```
kubectl run -it mongodb --image=bitnami/mongodb:4.4 --rm --restart=never -- bash
```

After attaching to the pod, the following command can be used to take a dump of an existing database and immediatley restoring it in a new setup:
```
mongodump --archive --authenticationDatabase admin -u admin -p <password> --host "mongo-server.default.svc:27017" | mongorestore --host "mongodb-0.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-1.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-2.mongodb-headless.mongodb.svc.cluster.local:27017" --authenticationDatabase admin -u root -p <password> --archive --drop
```
Please be aware that the host addresses might be different depending on the names and namespaces used. Therefore adjust them accordingly, depending on the setup. The syntax for services is as follows `<service>.<namespace>.svc`.
This will use the stdout to dump and restore instead of saving it on disk. Therefore you don't need a volume where you can store the whole backup. But make sure to have enough disk space available on the new setup to restore the dump.
Otherwise you can also remove the pipe in between the two commands and specify a location where to save the dump by adding i.e. `--archive=/tmp/mongodump`. The full command for that case is:
```
mongodump --archive --authenticationDatabase admin -u admin -p <password> --host "mongo-server.default.svc:27017" --archive=/tmp/mongodump
```

### Secrets adjustment
To access the MongoDB setup, several secrets are used which contain a connection string. If the new cluster should be used, these need to be adjusted to point to the new cluster with the same credentials. To automate this process, a script can be found in this repository. After downloading it needs to be made executable by running
```
chmod +x secrets.sh
```
and can thereafter be executed.
```
./secrets.sh
```
It will ask for the old MongoDB host, i.e. `mongo-server:27017` and for a replacement containing the new hosts, i.e. `mongodb-0.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-1.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-2.mongodb-headless.mongodb.svc.cluster.local:27017`.

```bash
./secrets.sh
Enter current MongoDB host: mongo-server:27017
Enter new MongoDB host(s): mongodb-0.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-1.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-2.mongodb-headless.mongodb.svc.cluster.local:27017
```

The script will store all relevant old secrets in a folder called `original_secrets` and the adjusted ones in a folder called `new_secrets`.
After executing the script the new secrets need to be applied to the cluster:
```
kubectl replace -f new_secrets
```
In case of a rollback, the old secrets can be restored by executing:
```
kubectl delete -f new_secrets
kubectl apply -f original_secrets
```
### Restarting services
In order to finish the migration, the relevant pods which use the MongoDB need to be restarted. This can be done by scaling the relevant deployments down and up again i.e.:
```
kubectl scale deploy service-alexa-management --replicas=0
kubectl scale deploy service-alexa-management --replicas=<number of desired replicas>
```

### Check the cluster health
To see the current cluster health, a connection to the cluster has to be established through the Mongo Shell. To do so execute:
```
# Attach to one of the MongoDB instances
kubectl exec -it mongodb-0 -n mongodb -- bash

# Connect to the cluster with the Mongo Shell
mongo --host "mongodb-0.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-1.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-2.mongodb-headless.mongodb.svc.cluster.local:27017" --authenticationDatabase admin -u admin -p <password>

# Inside the Mongo Shell, execute the following
rs.status()
```
One important metric to see if all nodes are in sync is the `opTimeDate`. This value should be the same among all cluster members. For more info on all values, see https://docs.mongodb.com/manual/reference/command/replSetGetStatus/#std-label-rs-status-output.

## Upgrade deployment

```
helm -n mongodb upgrade mongodb bitnami/mongodb --values values.yaml
```

## Uninstall

```
helm -n mongodb uninstall mongodb
```
