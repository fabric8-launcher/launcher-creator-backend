#!/bin/bash

ARTIFACT_VERSION=7

ARTIFACT_URL="https://oss.sonatype.org/content/repositories/releases/io/fabric8/maven-model-helper/${ARTIFACT_VERSION}/maven-model-helper-${ARTIFACT_VERSION}-uber.jar"
TARGET_DIR="lib/core/maven"
TARGET="${TARGET_DIR}/maven-model-helper.jar"

[ ! -f "${TARGET}" ] && mkdir -p "${TARGET_DIR}" && curl -sSL "${ARTIFACT_URL}" -o "${TARGET}"
exit 0
