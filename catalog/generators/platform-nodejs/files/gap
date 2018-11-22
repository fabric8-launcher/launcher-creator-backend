#!/usr/bin/env bash

APP_NAME={{.application}}
SERVICE_NAME={{.serviceName}}

SCRIPT_DIR=$(cd "$(dirname "$BASH_SOURCE")" ; pwd -P)

case "$1" in
    "deploy")
        PARAMS=""
        REPO_URL=$(git config --get remote.origin.url || echo "")
        if [[ ! -z "${REPO_URL}" ]]; then
            PARAMS="$PARAMS -p=SOURCE_REPOSITORY_URL=${REPO_URL}"
        fi
        CONSOLE_URL=$(oc status | head -n 1  | grep -Eo 'https?:.*')
        if [[ ! -z "${CONSOLE_URL}" ]]; then
            PARAMS="$PARAMS -p=OPENSHIFT_CONSOLE_URL=${CONSOLE_URL}"
        fi
        oc process -f ${SCRIPT_DIR}/.openshiftio/application.yaml --ignore-unknown-parameters ${PARAMS} | oc apply -f -
        if [[ -f ${SCRIPT_DIR}/.openshiftio/service.welcome.yaml ]]; then
             oc process -f ${SCRIPT_DIR}/.openshiftio/service.welcome.yaml --ignore-unknown-parameters ${PARAMS} | oc apply -f -
        fi
        ;;
    "push")
        shift
        if [[ "$1" == "--source" || "$1" == "-s" ]]; then
            shift
            oc start-build ${SERVICE_NAME} --from-dir ${SCRIPT_DIR} "$@"
        elif [[ "$1" == "--git" || "$1" == "-g" ]]; then
            shift
            oc start-build ${SERVICE_NAME} "$@"
        else
            if [[ -f ${FROM} ]]; then
                oc start-build ${SERVICE_NAME} --from-file ${FROM} "$@"
            else
                oc start-build ${SERVICE_NAME} --from-dir ${SCRIPT_DIR} "$@"
            fi
        fi
        ;;
    "delete")
        oc delete all,secrets -l app=${APP_NAME}
        ;;
    *)
        echo "Usage: gap [deploy|push|delete] ..."
        echo "   deploy  - Deploys the application to OpenShift"
        echo "   push    - Pushes code to the application. By default this will push the local sources"
        echo "             to OpenShift. This can be overridden by using one of the following flags:"
        echo "      -s, --source - Pushes the local sources"
        echo "      -g, --git    - Reverts to using the sources from Git"
        echo "   delete - Deletes the application from OpenShift"
    ;;
esac
