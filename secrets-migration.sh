#!/usr/bin/env bash

# This script gets a set of defined secrets and replaces the MongoDB hosts in a connection string.

set -o errexit
set -o nounset
set -o pipefail

main() {
    local connection_string
    local connection_string_new
    local mongo_host
    local mongo_host_new
    local secrets="cognigy-service-ai cognigy-service-alexa-management cognigy-service-analytics-collector-provider cognigy-service-analytics-conversation-collector-provider cognigy-service-api cognigy-service-app-session-manager cognigy-service-custom-modules cognigy-service-function-scheduler cognigy-service-handover cognigy-service-journeys cognigy-service-logs cognigy-service-nlp cognigy-service-profiles cognigy-service-resources cognigy-service-security cognigy-service-task-manager cognigy-service-trainer"

    read -rp "Enter current MongoDB host: " mongo_host
    read -rp "Enter new MongoDB host(s): " mongo_host_new

    echo "Checking for YQ ..."
    if ! (yq --version > /dev/null); then
        echo "YQ not found. Please install it through snap or brew. Alternatively it can be downloaded from Github: https://github.com/mikefarah/yq/"
        exit 1
    fi

    echo "Writing secrets..."

    for name in $secrets; do

        mkdir -p new_secrets original_secrets

        filename=$name".yaml"
        cp ./secrets/"$filename" ./original_secrets/"$filename"

        connection_string="$(yq e '.data.connection-string' "original_secrets/$filename" | base64 --decode)"
        connection_string_new="$(echo "${connection_string/$mongo_host/$mongo_host_new}" | base64 | tr -d '\n')"

        yq e ".data.connection-string = \"$connection_string_new\"" original_secrets/"$filename" > new_secrets/"$filename"

    done;

    echo "Done."
    echo "You can now apply these secrets by executing 'kubectl replace -f new_secrets/'"
}


main "$@"

