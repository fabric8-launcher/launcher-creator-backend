#!/bin/bash

ARTIFACT_URL="https://oss.sonatype.org/content/repositories/releases/io/fabric8/maven-model-helper/5/maven-model-helper-5-uber.jar"
TARGET_DIR="lib/core/maven"
TARGET="${TARGET_DIR}/maven-model-helper.jar"

[ ! -f "${TARGET}" ] && mkdir -p "${TARGET_DIR}" && curl -sSL "${ARTIFACT_URL}" -o "${TARGET}"
exit 0
