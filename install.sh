#!/bin/bash

[ ! -f "lib/core/maven/maven-model-helper.jar" ] && curl https://oss.sonatype.org/content/repositories/releases/io/fabric8/maven-model-helper/5/maven-model-helper-5-uber.jar -o lib/core/maven/maven-model-helper.jar
exit 0