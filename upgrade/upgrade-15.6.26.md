## From 13.18.5 to 15.6.26

This version upgrades MongoDB to `v7.0.14`. Follow the steps below to deploy this release.

1. Update the compatibility of MongoDB to `6.0`:

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

    5. If the current compatibility is set to any version lower than `6.0`, update the compatibility version of MongoDB to `6.0`:
        ```sh
        db.adminCommand( { setFeatureCompatibilityVersion: "6.0" } )
        ```

    6. Verify that the compatibility version is set to `6.0`:
        ```sh
        db.adminCommand( { getParameter: 1, featureCompatibilityVersion: 1 } )
        ```

2. Run the Helm upgrade command:

    ```sh
    helm upgrade --install --namespace mongodb mongodb oci://cognigy.azurecr.io/helm/mongodb --version 15.6.26 --values YOUR_VALUES_FILE.yaml
    ```

3. Check the status of the MongoDB pods.

    ```sh

    $ kubectl get pods -n mongodb

    NAME          READY   STATUS         RESTARTS   AGE
    mongodb-0     2/2     Running        0          4m19s
    mongodb-1     2/2     Running        0          3m51s
    mongodb-2     2/2     Running        0          98s
    ```

For further details on the Helm chart, check the [MongoDB(R) packaged by Bitnami](/charts/bitnami/mongodb/README.md) documentation.