## From 10.30.8 to 13.18.5

This version upgrades MongoDB to `v6.0.13`. Follow the steps below to deploy this release.

1. Update the compatibility of MongoDB to `5.0`:

    1. Open a shell to `mongodb-0` replica:
        ```sh
        kubectl exec -i -t -n mongodb mongodb-0 -c mongodb -- sh -c "clear; (bash || ash || sh)"
        ```

    2. Log in into MongoDB:
        ```sh
        mongosh -u $MONGODB_ROOT_USER -p $MONGODB_ROOT_PASSWORD --authenticationDatabase admin
        ```

    3. Find out which replica is primary:
        ```sh
        rs.status()
        ```
        In case if this is not the primary node then repeat step 1.1 and 1.2 and login to the primary node.

    4. Check the current MongoDB compatibility version:
        ```sh
        db.adminCommand( { getParameter: 1, featureCompatibilityVersion: 1 } )
        ```

    5. If the current compatibility is set to any version lower than `5.0`, update the compatibility version of MongoDB to `5.0`:
        ```sh
        db.adminCommand( { setFeatureCompatibilityVersion: "5.0" } )
        ```

    6. Verify that the compatibility version is set to `5.0`:
        ```sh
        db.adminCommand( { getParameter: 1, featureCompatibilityVersion: 1 } )
        ```

2. Run the Helm upgrade command:

    ```sh
    helm upgrade --install --namespace mongodb mongodb oci://cognigy.azurecr.io/helm/mongodb --version 13.18.5 --values YOUR_VALUES_FILE.yaml
    ```

3. Check the status of the MongoDB pods. The last replica should be in unhealthy state due to inability to pull the image. Note down the name of that pod:

    ```sh

    $ kubectl get pods -n mongodb

    NAME          READY   STATUS         RESTARTS   AGE
    mongodb-0     2/2     Running        0          4m19s
    mongodb-1     2/2     Running        0          3m51s
    mongodb-2     0/2     ErrImagePull   0          98s
    ```

4. Add the `imagePullSecrets` by patching the MongoDB StatefulSet. In case if you are using something different as your `imagePullSecrets`, replace `cognigy-registry-token` in the command below :

    ```sh
    kubectl patch statefulset mongodb -n mongodb --type=merge -p='{"spec": {"template": {"spec": {"imagePullSecrets": [{"name": "cognigy-registry-token"}]}}}}'
    ```

5. Delete the unhealthy MongoDB pod:

    ```sh
    kubectl delete pod -n mongodb mongodb-2
    ```
    Once the old pod is deleted, new pod should come up without any issue. At this point all the other replicas will be replaced by new pods.


6. Once all the pods are replaced by new pods and all become healthy, run the upgrade command from step 2 one more time:

    ```sh
    helm upgrade --install --namespace mongodb mongodb oci://cognigy.azurecr.io/helm/mongodb --version 13.18.5 --values YOUR_VALUES_FILE.yaml
    ```


For further details on the Helm chart, check the [MongoDB(R) packaged by Bitnami](/charts/bitnami/mongodb/README.md) documentation.
