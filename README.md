# Multi-Replica MongoDB Helm Chart
This is the Helm setup for the Multi-Replica MongoDB architecture. It uses the [MongoDB chart by Bitnami](https://github.com/bitnami/charts/tree/master/bitnami/mongodb). MongoDB is set up as a 3 node replica set. The 3 nodes are distributed throughout different availability zones (i.e. eu-central-1a, eu-central-1b and eu-central-1b). To accomplish this, the Kubernetes label `topology.kubernetes.io/zone` is used in `affinity` rules in `values.yaml`, which is one of the [well-known labels](https://kubernetes.io/docs/reference/labels-annotations-taints/#topologykubernetesiozone) and is therefore present in all major installers or managed services. The setup uses an anti-affinity to accomplish this behavior: if the label `uniquezone=set` is found for a pod, there cannot be another MongoDB pod with this label in the same availability zone.

Because Cognigy is using MongoDB v4.2.5, some customizations are done, so the chart is forked and modified in this repository.

## Prerequisites
- Kubernetes 1.19-1.21
- Helm 3.2.0+
- Persistent Volume provisioner in the underlying infrastructure
- `mongodb` StorageClass in the Kubernetes Cluster

## Installation
To deploy the new MongoDB setup adjust the values accordingly in the `values.yaml` file. You can also copy the default `values.yaml` file into another file and name it accordingly. e.g. `my-mongodb-values.yaml`. In this case you need apply all the following configuration to this file the full description of `values.yaml` parameters see [official Bitnami documentation](https://github.com/bitnami/charts/tree/master/bitnami/mongodb) 

### Essential Parameters
You need to set at least following parameters for this Helm release:
1. root user password. Create a secure password and change it in `values.yaml`:
   ```
    auth:
        enabled: true
        rootUser: "root"
        rootPassword: "" # enter password

   ```
   you will also need to **set the same username and password in `metrics` section** for prometheus metrics container to connect to the database, otherwise the deployment will crash. If you migrate to Helm chart from the previous installation, you can get the existing password with:
    ```
    kubectl get secret cognigy-mongo-server -ojsonpath='{.data.mongo-initdb-root-password}' | base64 --decode
    ```
2. Create a secure password and set it for `replicaSetKey` under `auth` section. This password is used to authenticate replicas 
3. Set the `size` of the MongoDB persistent volume under `persistence` according to your requirements. We set it recommended value of `50GB` for Cognigy.AI by default.

Configure other parameters as required. 

### Deployment 
After the parameters are set a new release can be deployed via Helm, use proper values.yaml file if you copied and renamed it before:
```
helm upgrade --install -n mongodb mongodb ./charts/bitnami/mongodb --values values.yaml --create-namespace
```
To verify all pods are in a ready state, you can execute:
```
kubectl get pods -n mongodb
```
You should see 3 replica of `mongodb` pods in a ready state.

## Monitoring
The chart natively supports monitoring of MongoDB with Prometheus metrics. `metrics` container is enabled by default in the corresponding section in `values.yaml`. Prometheus service monitor is disabled by default via `serviceMonitor` parameter. If there is a
Prometheus instance in the cluster, enable it to switch on automatic discovery of `metrics` endpoint by Prometheus. Additionally, Prometheus rules can be enabled for alerting with `prometheusRule` parameter. A matching Grafana dashboard can be found [here](https://grafana.com/grafana/dashboards/7353).

## Migration

For a migration from a previous installation, see this [guide](https://cognigy.visualstudio.com/SRE/_wiki/wikis/SRE.wiki/2780/Connect-single-node-MongoDB-to-multi-node-Helm-chart-deployment)

## Upgrade deployment
```
helm -n mongodb upgrade mongodb bitnami/mongodb --values values.yaml
```

## Uninstall
```
helm -n mongodb uninstall mongodb
```
