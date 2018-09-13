FROM bucharestgold/centos7-s2i-nodejs

USER root

COPY ./contrib/ /opt/app-root

RUN /opt/app-root/etc/install_oc.sh && \
    /opt/app-root/etc/install_odo.sh && \
    /opt/app-root/etc/install_java.sh

ENV JAVA_HOME /etc/alternatives/jre

USER 1001
