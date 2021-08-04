#!/usr/bin/env bash

# This script is a wrapper script for the Ansible playbook to deploy the Honda Excide application on a virtual machine. 
# It checks for some prerequisites and installs them if necessary and afterwards executes the Ansible playbook.

set -o errexit
set -o nounset
set -o pipefail

main() {
    local connection_string
    local connection_string_new
    local mongo_host
    local mongo_host_new
    local secrets="cognigy-service-ai cognigy-service-alexa-management cognigy-service-analytics-collector-provider cognigy-service-analytics-conversation-collector-provider cognigy-service-api cognigy-service-custom-modules cognigy-service-function-scheduler cognigy-service-handover cognigy-service-journeys cognigy-service-logs cognigy-service-nlp cognigy-service-profiles cognigy-service-resources cognigy-service-security cognigy-service-task-manager cognigy-service-trainer"

    read -rp "Enter current MongoDB host: " mongo_host
    read -rp "Enter new MongoDB host(s): " mongo_host_new

    echo -n "Checking for active Kubernetes cluster..."
    if ! (kubectl get nodes > /dev/null); then
        echo -n "No active Kubernetes cluster found. Please activate the appropriate kubeconfig. Exiting..."
        exit 1
    fi

    for name in $secrets; do

        mkdir -p new_secrets original_secrets

        filename=$name".yaml"
        kubectl get secret "$name" -oyaml > original_secrets/"$filename"

        connection_string="$(yq e '.data.connection-string' "original_secrets/$filename" | base64 --decode)"
        connection_string_new="$(echo "${connection_string/$mongo_host/$mongo_host_new}" | base64 | tr -d '\n')"

        yq e ".data.connection-string = \"$connection_string_new\"" original_secrets/"$filename" > new_secrets/"$name"_new.yaml

    done; 
}


main "$@"

