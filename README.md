# Multi-Replica MongoDB Helm Chart for Cognigy.AI
This Helm Chart installs a Multi-Replica MongoDB setup with High Availability (HA) support across three availability zones. It is based on [MongoDB chart by Bitnami](https://github.com/bitnami/charts/tree/master/bitnami/mongodb) and installs MongoDB v4.2.5 compatible with Cognigy.AI

## Prerequisites
- Kubernetes v1.19-1.21 Cluster on AWS or Azure 
- kubectl utility connected to the kubernetes cluster
- Helm 3.2.0+
- Persistent Volume provisioner in the underlying infrastructure

## Configuration 
### Storage Class
Cognigy.AI requires certain performance requirements for MongoDB storage. To meet such requirements and to deploy MongoDB on common public cloud providers you need to create `mongodb` StorageClass accordingly. Manifests for storage classes are located in `cloud-providers` folder. E.g. for AWS create `mongodb` StorageClass with:
   ```
   kubeclt apply -f cloud-providers/aws/mongo-server.yaml
   ```
### Namespace
This Installation guide assumes that MongoDB setup is deployed into `mongodb` namespace. Create `mongodb` namespace with:
```
kubectl create ns mongodb
```
If you need to place a deployment into another namespace, modify following commands accordingly. We suggest not to modify the deployment namespace as you will need to adapt Cognigy.AI installation scripts later in this case.

### High Availability
The chart is configured to install MongoDB replicas across three availability zones (e.g. `eu-central-1a`, `eu-central-1b` and `eu-central-1c`). To accomplish this, `topology.kubernetes.io/zone` Kubernetes label is used in `nodeAffinityPreset` rules and set in `values.yaml` by default. This label is one of [well-known labels](https://kubernetes.io/docs/reference/labels-annotations-taints/#topologykubernetesiozone) and is therefore present in all major cloud providers. The setup uses an anti-affinity to accomplish this behavior: if the label `uniquezone=set` is found for a pod, another MongoDB pod cannot be installed with this label in the same availability zone.

### Essential Parameters
To deploy a new MongoDB setup adjust the values accordingly in the `values.yaml` file. You can also copy the default `values.yaml` file into another file and name it accordingly. e.g. `my-mongodb-values.yaml`. In this case you need to set all the following configuration parameters and apply following commands to this file. For a full description of `values.yaml` parameters see [official Bitnami documentation](https://github.com/bitnami/charts/tree/master/bitnami/mongodb)

You need to set at least following parameters for this Helm release:
1. Set root user password. Create a secure password and set it in `values.yaml` unnder `auth.rootPassword` variable:
   ```
    auth:
        enabled: true
        rootUser: "root"
        rootPassword: "" # enter password

   ```
2. **Set the same root password in `metrics` section via `metrics.password` variable** for prometheus metrics container to be able to connect to the database, otherwise the deployment will crash.
3.f Create another secure password and set it for replica set in `auth.replicaSetKey` variable. This password is used to authenticate replicas in their internal communication.
4. Set the `size` of the MongoDB persistent volume under `persistence` according to your requirements. We set it recommended value of `50GB` for Cognigy.AI installation by default.
5. OPTIONAL: configure other parameters in `values.yaml` as required. 

## Installing the Chart
After the parameters are set a new release can be deployed via Helm into `mongodb` namespace, use proper values.yaml file if you copied and renamed it before:
```
helm upgrade --install -n mongodb mongodb ./charts/bitnami/mongodb --values values.yaml --create-namespace
```
Pods are created one by one, so you need to wait a bit. To verify all pods are in a ready state, you can execute:
```
kubectl get pods -n mongodb
```
You should see 3 replica of `mongodb` pods in a ready state in `mongodb` namespace.

## Monitoring
The chart natively supports monitoring of MongoDB with Prometheus metrics. `metrics` container is enabled by default in the corresponding section in `values.yaml`. Prometheus service monitor is disabled by default via `serviceMonitor` parameter. If there is a Prometheus instance in the cluster, you can enable its automatic discovery by setting `serviceMonitor.enabled` variable to `true`. Additionally, Prometheus rules can be enabled for alerting with `prometheusRule` parameter. A matching Grafana dashboard can be found [here](https://grafana.com/grafana/dashboards/7353).

## Upgrading Helm Release
```
helm -n mongodb upgrade mongodb bitnami/mongodb --values values.yaml
```

## Uninstalling the Chart
```
helm -n mongodb uninstall mongodb
```
Please keep in mind that Persistent Volume Claims (PVC) are not removed when you delete the Helm release. To fully remove them you need to run the following command. **IMPORTANT: If you run this command, all data persisted in MongoDB will be lost!**
```
kubectl delete -n=mongodb pvc --all
```
