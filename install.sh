#!/bin/bash

ARTIFACT_VERSION=10

ARTIFACT_URL="https://oss.sonatype.org/content/repositories/releases/io/fabric8/maven-model-helper/${ARTIFACT_VERSION}/maven-model-helper-${ARTIFACT_VERSION}-uber.jar"
TARGET_DIR="lib/core/maven"
TARGET="${TARGET_DIR}/maven-model-helper.jar"

FORCE=0
if [[ ${npm_config_force} = "true" || ${npm_config_argv} = *"--force"* ]]; then
    FORCE=1
fi

[[ ! -f "${TARGET}" || ${FORCE} -eq 1 ]] && mkdir -p "${TARGET_DIR}" && curl -sSL "${ARTIFACT_URL}" -o "${TARGET}"
exit 0
