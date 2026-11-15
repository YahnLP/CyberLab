FROM debian:bookworm-slim
ARG TTYD_VERSION=1.7.7
RUN apt-get update && apt-get install -y --no-install-recommends \
        bash coreutils findutils grep sed gawk \
        nano vim-tiny less tree file bsdmainutils \
        man-db manpages manpages-fr procps \
        openssh-client openssh-server \
        ca-certificates locales curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /run/sshd \
    && sed -i 's/^# *fr_FR.UTF-8/fr_FR.UTF-8/' /etc/locale.gen \
    && locale-gen
RUN ARCH=$(uname -m) \
    && curl -fsSL -o /usr/local/bin/ttyd \
       "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.${ARCH}" \
    && chmod +x /usr/local/bin/ttyd && ttyd --version
ENV LANG=fr_FR.UTF-8 LC_ALL=fr_FR.UTF-8 BASHLAB_HOME=/opt/bashlab
RUN useradd --create-home --shell /bin/bash stagiaire
COPY --chown=root:root engine/     /opt/bashlab/engine/
COPY --chown=root:root challenges/ /opt/bashlab/challenges/
RUN chmod -R a+rX /opt/bashlab \
    && chmod +x /opt/bashlab/engine/defi /opt/bashlab/engine/motd.sh /opt/bashlab/engine/entrypoint.sh \
    && ln -s /opt/bashlab/engine/defi /usr/local/bin/defi \
    && printf '\nexport BASHLAB_HOME=/opt/bashlab\n[ -t 1 ] && /opt/bashlab/engine/motd.sh\n' >> /home/stagiaire/.bashrc
USER stagiaire
WORKDIR /home/stagiaire
EXPOSE 7681
ENTRYPOINT ["/opt/bashlab/engine/entrypoint.sh"]
