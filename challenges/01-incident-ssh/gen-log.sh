# Générateur d'auth.log réaliste (format syslog Debian). Fonctions partagées par setup.sh et check.sh.
# gen_auth_log SORTIE IP_ATTAQUANT NB_ECHECS COMPTE IP_ADMIN IP_TYPO GRAINE FICHIER_TSUCC
gen_auth_log() {
  local out="$1" atk="$2" nfail="$3" acct="$4" adm="$5" typo="$6" seed="$7" side="$8" base
  base=$(TZ=UTC date -d '2026-11-15 00:00:00' +%s)
  TZ=UTC LC_ALL=C gawk -v base="$base" -v atk="$atk" -v nfail="$nfail" -v acct="$acct" \
    -v adm="$adm" -v typo="$typo" -v seed="$seed" -v side="$side" '
  function pid(){return 1000+int(rand()*28000)}
  function port(){return 32768+int(rand()*28000)}
  function ev(t,s){printf "%d\t%s\n",t,s}
  function rs(n,  i,s,c){c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";s="";for(i=0;i<n;i++)s=s substr(c,1+int(rand()*64),1);return s}
  function session(t,u,uid,ip,pt,  p,sid){p=pid();sid=10+int(rand()*80)
    ev(t+1,"sshd[" p "]: pam_unix(sshd:session): session opened for user " u "(uid=" uid ") by (uid=0)")
    ev(t+1,"systemd-logind[612]: New session " sid " of user " u ".")
    return p}
  function close_session(t,u,ip,pt,p){
    ev(t,"sshd[" p "]: Received disconnect from " ip " port " pt ":11: disconnected by user")
    ev(t+1,"sshd[" p "]: Disconnected from user " u " " ip " port " pt)
    ev(t+1,"sshd[" p "]: pam_unix(sshd:session): session closed for user " u)}
  BEGIN{srand(seed)
    for(h=0;h<24;h++){p=pid();ev(base+h*3600+1,"CRON[" p "]: pam_unix(cron:session): session opened for user root(uid=0) by (uid=0)");ev(base+h*3600+2,"CRON[" p "]: pam_unix(cron:session): session closed for user root")}
    # admin légitime (clé publique), deux connexions dans la journée
    for(k=0;k<2;k++){t=base+(k?14:8)*3600+int(rand()*1800);p=pid();pt=port()
      ev(t,"sshd[" p "]: Accepted publickey for admin from " adm " port " pt " ssh2: ED25519 SHA256:" rs(43))
      q=session(t,"admin",1000,adm,pt)
      ev(t+120,"sudo:    admin : TTY=pts/0 ; PWD=/home/admin ; USER=root ; COMMAND=/usr/bin/apt update")
      ev(t+120,"sudo: pam_unix(sudo:session): session opened for user root(uid=0) by admin(uid=1000)")
      close_session(t+900+int(rand()*600),"admin",adm,pt,q)}
    # faute de frappe légitime : échecs puis succès, depuis le LAN
    t=base+9*3600+int(rand()*1200);n=3+int(rand()*3)
    for(i=0;i<n;i++){t+=4+int(rand()*6);ev(t,"sshd[" pid() "]: Failed password for admin from " typo " port " port() " ssh2")}
    t+=6;ev(t,"sshd[" pid() "]: Accepted password for admin from " typo " port " port() " ssh2")
    # bruit Internet : scanners (1 à 3 essais chacun)
    split("ubuntu pi test oracle user postgres",su," ")
    for(i=1;i<=8;i++){do{o=2+int(rand()*252)}while("203.0.113." o==atk);ip="203.0.113." o
      t=base+int(rand()*86000);m=1+int(rand()*3);u=su[1+int(rand()*6)]
      for(j=0;j<m;j++){t+=2+int(rand()*5);p=pid();pt=port()
        ev(t,"sshd[" p "]: Invalid user " u " from " ip " port " pt)
        ev(t,"sshd[" p "]: Failed password for invalid user " u " from " ip " port " pt " ssh2")
        ev(t+1,"sshd[" p "]: Connection closed by invalid user " u " " ip " port " pt " [preauth]")}}
    # attaque par dictionnaire
    split("admin root test oracle ubuntu " acct " deploy git postgres ftp",ua," ")
    t=base+3*3600+10*60+int(rand()*300)
    for(i=0;i<nfail;i++){t+=3+int(rand()*7);u=ua[1+(i%10)];p=pid();pt=port()
      valide=(u=="root"||u=="admin"||u==acct)
      if(!valide)ev(t,"sshd[" p "]: Invalid user " u " from " atk " port " pt)
      if(valide)ev(t,"sshd[" p "]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=" atk "  user=" u)
      ev(t,"sshd[" p "]: Failed password for " (valide?"":"invalid user ") u " from " atk " port " pt " ssh2")
      if(i%5==4)ev(t+1,"sshd[" p "]: Connection closed by " (valide?"authenticating":"invalid") " user " u " " atk " port " pt " [preauth]")}
    t+=20+int(rand()*20);p=pid();pt=port();print t > side
    ev(t,"sshd[" p "]: Accepted password for " acct " from " atk " port " pt " ssh2")
    q=session(t,acct,1002,atk,pt);close_session(t+240+int(rand()*200),acct,atk,pt,q)
    # retour par clé publique 40 minutes plus tard (persistance)
    t2=t+2400+int(rand()*600);p=pid();pt=port()
    ev(t2,"sshd[" p "]: Accepted publickey for " acct " from " atk " port " pt " ssh2: ED25519 SHA256:" rs(43))
    q=session(t2,acct,1002,atk,pt);close_session(t2+300,acct,atk,pt,q)
  }' | LC_ALL=C sort -s -n -t "$(printf '\t')" -k1,1 \
     | TZ=UTC LC_ALL=C gawk -F'\t' '{print strftime("%b %e %H:%M:%S",$1,1) " srv01 " $2}' > "$out"
}
