# Multi-Replica MongoDB

## General

This is the Helm setup for the Multi-Replica MongoDB architecture. It uses the [MongoDB chart by Bitnami](https://github.com/bitnami/charts/tree/master/bitnami/mongodb). MongoDB is set up as a 3 node replica set with an additional arbiter. The 3 nodes are distributed throughout different availability zones (i.e. eu-central-1a, eu-central-1b and eu-central-1b). To accomplish this, the Kubernetes label `topology.kubernetes.io/zone` is used, which is one of the [well-known labels](https://kubernetes.io/docs/reference/labels-annotations-taints/#topologykubernetesiozone) and is therefore present in all major installers or managed services. The setup uses an anti-affinity to accomplish this behavior: if the label `uniquezone=set` is found for a pod, there cannot be another MongoDB pod with this label in the same availability zone.

## Migration
The migration process from a single node setup to a replica one involves several steps. These are described in the following paragraphs. This guide assumes the "old" MongoDB server to be deployed in the `default` namespace and will install the "new" MongoDB ReplicaSet into the namespace `mongodb`.

### Deployment
To deploy the new MongoDB setup adjust the values accordingly in the `values.yaml` file. Most likely you will just have to adjust the root password for the database. In order to have it set to the same one as before you can find out the current one by executing the following on the appropriate Kubernetes cluster:
```
kubectl get secret cognigy-mongo-server -ojsonpath='{.data.mongo-initdb-root-password}' | base64 --decode
```
The `rootPassword` value in the `auth` section should be set to this value. Also a `replicaSetKey` should be set to a secure value.
Afterwards, the new setup can be deployed via Helm:

```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm -n mongodb install mongodb bitnami/mongodb --values values.yaml
```
To verify all pods are in a ready state, you can execute:
```
kubectl get pods -n mongodb
```
You should see 4 pods in a ready state, 3 MongoDB nodes and 1 arbiter.

### Data migration
To migrate the actual data you can either use one of the MongoDB pods or run a seperate one.
To use one of the MongoDB pods:
```
kubectl exec -it mongodb-0 -n mongodb -- bash
```
To use a seperate pod:
```
k run -it mongodb --image=bitnami/mongodb:4.4 --rm --restart=never -- bash
```

After attaching to the pod, the following command can be used to take a dump of an existing database and immediatley restoring it in a new setup:
```
mongodump --archive --authenticationDatabase admin -u admin -p <password> --host "mongo-server.default.svc:27017" | mongorestore --host "mongodb-0.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-1.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-2.mongodb-headless.mongodb.svc.cluster.local:27017" --authenticationDatabase admin -u root -p <password> --archive --drop
```
Please be aware that the host addresses might be different depending on the names and namespaces used. Therefore adjust them accordingly, depending on the setup. The syntax for services is as follows `<service>.<namespace>.svc`. 
This will use the stdout to dump and restore instead of saving it on disk. Therefore you don't need a volume where you can store the whole backup. But make sure to have enough disk space available on the new setup to restore the dump.
Otherwise you can also remove the pipe in between the two commands and specify a location where to save the dump by adding i.e. `--archive=/tmp/mongodump`.

### Secrets adjustment
To access the MongoDB setup, several secrets are used which contain a connection string. If the new cluster should be used, these need to be adjusted to point to the new cluster with the same credentials. To automate this process, a script can be found in this repository. After downloading it needs to be made executable by running
```
chmod +x secrets-sh
```
and can thereafter be executed.
```
./secrets.sh
```
It will ask for the old MongoDB host, i.e. `mongo-server:27017` and for a replacement containing the new hosts, i.e. `mongodb-0.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-1.mongodb-headless.mongodb.svc.cluster.local:27017,mongodb-2.mongodb-headless.mongodb.svc.cluster.local:27017`.
The script will store all relevant old secrets in a folder called `original_secrets` and the adjusted ones in a folder called `new_secrets`.
After executing the script the new secrets need to be applied to the cluster:
```
kubectl replace -f new_secrets
```
In case of a rollback, the old secrets can be restored by executing:
```
kubectl replace -f original_secrets
```
### Restarting services
In order to finish the migration, the relevant pods which use the MongoDB need to be restarted. This can be done by scaling the relevant deployments down and up again i.e.:
```
kubectl scale deploy service-alexa-management --replicas=0
kubectl scale deploy service-alexa-management --replicas=<number of desired replicas>
```

## Upgrade deployment

```
helm -n multi-replica-mongodb upgrade mongodb bitnami/mongodb --values values.yaml
```

## Uninstall

```
helm -n multi-replica-mongodb uninstall mongodb
```
