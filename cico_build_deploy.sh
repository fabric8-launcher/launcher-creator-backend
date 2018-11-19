#!/usr/bin/bash

set -x

GENERATOR_DOCKER_HUB_USERNAME=openshiftioadmin
REGISTRY_URI="quay.io"
REGISTRY_NS="fabric8"
REGISTRY_IMAGE="launcher-creator-backend"
DOCKER_HUB_URL=${REGISTRY_NS}/${REGISTRY_IMAGE}
BUILDER_IMAGE="launcher-creator-backend-builder"
BUILDER_CONT="launcher-creator-backend-builder-container"
DEPLOY_IMAGE="launcher-creator-backend-deploy"

TARGET_DIR="dist"

if [ "$TARGET" = "rhel" ]; then
    REGISTRY_URL=${REGISTRY_URI}/rhel-${REGISTRY_NS}-${REGISTRY_IMAGE}
    DOCKERFILE="Dockerfile.deploy.rhel"
else
    REGISTRY_URL=${REGISTRY_URI}/${REGISTRY_NS}-${REGISTRY_IMAGE}
    DOCKERFILE="Dockerfile.deploy"
fi

function docker_login() {
    local USERNAME=$1
    local PASSWORD=$2
    local REGISTRY=$3

    if [ -n "${USERNAME}" ] && [ -n "${PASSWORD}" ]; then
        docker login -u ${USERNAME} -p ${PASSWORD} ${REGISTRY}
    fi
}

function tag_push() {
    local TARGET_IMAGE=$1

    docker tag ${DEPLOY_IMAGE} ${TARGET_IMAGE}
    docker push ${TARGET_IMAGE}
}

# Exit on error
set -e



if [ -z $CICO_LOCAL ]; then
    [ -f jenkins-env ] && cat jenkins-env | grep -e PASS -e USER -e GIT -e DEVSHIFT > inherit-env
    [ -f inherit-env ] && . inherit-env

    # We need to disable selinux for now, XXX
    /usr/sbin/setenforce 0

    # Get all the deps in
    yum -y install docker make git

    service docker start
fi

#CLEAN
docker ps | grep -q ${BUILDER_CONT} && docker stop ${BUILDER_CONT}
docker ps -a | grep -q ${BUILDER_CONT} && docker rm ${BUILDER_CONT}
rm -rf ${TARGET_DIR}/
rm -rf node_modules/

#BUILD
docker build -t ${BUILDER_IMAGE} -f Dockerfile.build .

mkdir ${TARGET_DIR}/
mkdir node_modules/

docker run --detach=true --name ${BUILDER_CONT} -t -v $(pwd)/${TARGET_DIR}:/${TARGET_DIR}:Z -v $(pwd)/node_modules:/node_modules ${BUILDER_IMAGE} /bin/tail -f /dev/null #FIXME

docker exec ${BUILDER_CONT} yarn install
docker exec -u root ${BUILDER_CONT} cp -r ${TARGET_DIR}/ /
docker exec -u root ${BUILDER_CONT} cp -r node_modules/ /

#LOGIN
docker_login "${QUAY_USERNAME}" "${QUAY_PASSWORD}" "${REGISTRY_URI}"

#BUILD DEPLOY IMAGE
docker build -t ${DEPLOY_IMAGE} -f "${DOCKERFILE}" .

#PUSH
if [ -z $CICO_LOCAL ]; then
    TAG=$(echo $GIT_COMMIT | cut -c1-${DEVSHIFT_TAG_LEN})

    tag_push "${REGISTRY_URL}:${TAG}"
    tag_push "${REGISTRY_URL}:latest"

    if [[ "$TARGET" != "rhel" && -n "${GENERATOR_DOCKER_HUB_PASSWORD}" ]]; then
        docker_login "${GENERATOR_DOCKER_HUB_USERNAME}" "${GENERATOR_DOCKER_HUB_PASSWORD}"
        tag_push "${DOCKER_HUB_URL}:${TAG}"
        tag_push "${DOCKER_HUB_URL}:latest"
    fi
fi
