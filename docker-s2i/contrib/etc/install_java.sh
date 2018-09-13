#!/usr/bin/env bash

MAVEN_URL=https://archive.apache.org/dist/maven/maven-3/3.5.4/binaries/apache-maven-3.5.4-bin.tar.gz

yum install -y \
       java-1.8.0-openjdk-1.8.0.181-3.b13.el7_5 \
       java-1.8.0-openjdk-devel-1.8.0.181-3.b13.el7_5

curl -sSL ${MAVEN_URL} | tar -xzf - -C /opt
ln -s /opt/apache-maven-3.5.4 /opt/maven
ln -s /opt/maven/bin/mvn /usr/bin/mvn

echo securerandom.source=file:/dev/urandom >> /usr/lib/jvm/java/jre/lib/security/java.security
