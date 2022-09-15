# Multi-Replica MongoDB Helm Chart for Cognigy.AI
This Helm Chart installs a Multi-Replica MongoDB setup with High Availability (HA) support across three availability zones. It is based on [MongoDB chart by Bitnami](https://github.com/bitnami/charts/tree/master/bitnami/mongodb) and installs MongoDB v4.2.5 compatible with Cognigy.AI

## Prerequisites
- Kubernetes v1.19-1.23 running on either:
   - AWS EKS
   - Azure AKS
   - generic on-premises kubernetes platform. Running MongoDB Helm Chart on-premises will require additional manual configuration, we recommend to use public clouds (AWS or Azure) instead.
- kubectl utility connected to the kubernetes cluster
- **Helm 3.8.0+ (lower versions of Helm do not support OCI registries!)** 
- Persistent Volume provisioner in the underlying infrastructure for MongoDB persistent volumes (for AWS/Azure no further configuration is required)

### Storage Class
Cognigy.AI requires certain performance requirements for MongoDB storage. To meet such requirements and to deploy MongoDB on common public cloud providers you need to create `mongodb` kubernetes `StorageClass` accordingly. Manifests for the `mongodb StorageClass` are located in `cloud-providers` folder. E.g. for AWS create `mongodb StorageClass` with:
   ```
   kubectl apply -f cloud-providers/aws/mongodb.yaml
   ```
For generic (on-premises) kubernetes cloud provider you need to prepare `StorageClass` manifest yourself ensuring the underlying infrastructure can provision the required persistent volume on-demand. `mongodb StorageClass` must support high IO throughput, see [AWS example](cloud-providers/aws/mongodb.yaml) for reference.

## Configuration

### Setting Essential Parameters
To deploy a new MongoDB helm release you need to create a separate file with Helm release values. You can use `values_prod.yaml` as a baseline, we recommend to start with it.
1. Make a copy of `values_prod.yaml` into a new file and name it accordingly, we refer to it as `YOUR_VALUES_FILE.yaml` later in this document.
2. You need to set at least following parameters for this Helm release:
   1. Set MongoDB root user password. Create a secure password and set it in `YOUR_VALUES_FILE.yaml` under `auth.rootPassword` variable
   2. **Set the same root password in `metrics` section in `metrics.password` variable** for prometheus metrics container to be able to connect to the database, otherwise the deployment will crash.
   3. Create another secure key and set it for replica set in `auth.replicaSetKey` variable. This key is used for internal membership authentication for MongoDB replicas, The key must be at least 6 characters long. Do not use special characters in the key!
   4. Set the `size` of the MongoDB persistent volume in `persistence.size` according to your requirements. We set it to a recommended value of `200Gi` for Cognigy.AI production installations by default.
   5. OPTIONAL: configure other parameters by copying them from `charts/bitnami/mongodb/values.yaml` into `YOUR_VALUES_FILE.yaml` if required. For a full description of `charts/bitnami/mongodb/values.yaml` parameters see [official Bitnami documentation](https://github.com/bitnami/charts/tree/master/bitnami/mongodb)

### Development Environment
For testing and development purposes on clusters without availability zones you can install a single replica MongoDB with a smaller persistent volume. For this you need to set following parameters (see `values_dev.yaml` as an example):
* `replicaCount: 1`
* `persistence.size: 50Gi`
You will also need to modify MongoDB connection string in Cognigy.AI Helm chart accordingly.

### High Availability
The chart is configured to install MongoDB replicas across three availability zones (e.g. `eu-central-1a`, `eu-central-1b` and `eu-central-1c` on AWS). To accomplish this, `topology.kubernetes.io/zone` Kubernetes label is used in `nodeAffinityPreset` rules and set in `charts/bitnami/mongodb/values.yaml` by default. This label is one of [well-known labels](https://kubernetes.io/docs/reference/labels-annotations-taints/#topologykubernetesiozone) and is therefore present in all major cloud providers. The setup uses an anti-affinity to accomplish this behavior: if the label `uniquezone=set` is present in the deployment specification, another MongoDB pod cannot be installed with this label in the same availability zone. On clusters with at least 3 nodes provisioned across 3 availability zones no further configuration is required from your side.

## Installing the Chart
### Namespace
This Installation guide assumes that MongoDB setup is deployed into `mongodb` namespace. If you need to place a deployment into another namespace, modify following commands accordingly. We suggest not to modify the deployment namespace as you will need to adapt Cognigy.AI Helm chart later in this case. Create `mongodb` namespace with: 
```
kubectl create namespace mongodb
```

### Installation
After the parameters are set a new release can be deployed via Helm, use proper `YOUR_VALUES_FILE.yaml` file if you copied and renamed it before.

1. Installing from Cognigy Container Registry (recommended):
   * You need to create docker-registry secret and to log in into Cognigy Container Registry to pull the helm chart and related images. For this to work, execute following commands, substitute <your-username> and <your-password> with your credentials to access Cognigy Container Registry: 
    ```
    kubectl create secret docker-registry cognigy-registry-token \
    --docker-server=cognigy.azurecr.io \
    --docker-username=<your-username> \
    --docker-password=<your-password> -n mongodb
  
    helm registry login cognigy.azurecr.io \
    --username <your-username> \
    --password <your-password>
    ```
    * install MongoDB Helm Release
    ```
    helm upgrade --install --namespace mongodb mongodb oci://cognigy.azurecr.io/helm/mongodb --version 10.30.3 --values YOUR_VALUES_FILE.yaml
    ```
2. Alternatively you can install MongoDB Helm release from the local chart (not recommended): 
```
helm upgrade --install -n mongodb mongodb ./charts/bitnami/mongodb --values YOUR_VALUES_FILE.yaml --create-namespace
```
3. Check that MongoDB deployment is up-and-running. Pods are created one by one, so you need to wait a bit. To verify all pods are in a ready state, you can execute:
```
kubectl get pods -n mongodb
```
You should see 3 replica of `mongodb` pods in ready state in `mongodb` namespace.

## Monitoring
The chart natively supports monitoring of MongoDB with Prometheus metrics. `metrics` container is enabled by default in the corresponding section in `YOUR_VALUES_FILE.yaml`. Prometheus service monitor is disabled by default via `serviceMonitor` parameter. If there is a Prometheus instance in the cluster, you can enable its automatic discovery by setting `serviceMonitor.enabled` variable to `true`. Additionally, Prometheus rules can be enabled for alerting with `prometheusRule` parameter. A matching Grafana dashboard can be found [here](https://grafana.com/grafana/dashboards/7353).

## Upgrading Helm Release
To upgrade MongoDB Helm release to a newer `HELM_CHART_VERSION` version, you need to execute following command. Use the same `YOUR_VALUES_FILE.yaml` you have used before!
```
helm -n mongodb upgrade mongodb bitnami/mongodb --version HELM_CHART_VERSION --values YOUR_VALUES_FILE.yaml
```

## Uninstalling the Chart
To uninstall a Helm release execute: 
```
helm -n mongodb uninstall mongodb
```

## Cleaning up
Please keep in mind that Persistent Volume Claims (PVC) and the related data are not removed when you uninstall the Helm release bu default. To fully remove them you need to run the following command. 

**IMPORTANT: If you run this command, all data persisted in MongoDB will be lost!**
```
kubectl delete -n=mongodb pvc --all
```
