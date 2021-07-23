# mongodb-helm

## Initial deployment

```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm -n multi-replica-mongodb install mongodb bitnami/mongodb --values values.yaml
```

## Upgrade deployment

```
helm -n multi-replica-mongodb upgrade mongodb bitnami/mongodb --values values.yaml
```

## Undeploy

```
helm -n multi-replica-mongodb uninstall mongodb
```
