// Panneau « Comprendre » et « Journal » : interprétation locale des commandes (aucun serveur).
const DOC = {
  ls: ['Liste le contenu d\'un dossier.', 'Repérez les noms de fichiers utiles (journaux, exports, rapports) avant de les ouvrir.'],
  cat: ['Affiche le contenu complet d\'un fichier.', 'Sur un gros fichier, préférez head, tail ou grep pour ne lire que l\'utile.'],
  head: ['Affiche les premières lignes d\'un fichier.', 'Pratique pour découvrir le format et les colonnes.'],
  tail: ['Affiche les dernières lignes d\'un fichier.', 'Les événements les plus récents d\'un journal sont en bas.'],
  wc: ['Compte lignes, mots ou octets.', 'Avec -l, c\'est le nombre de lignes : souvent le nombre d\'événements.'],
  grep: ['Filtre les lignes qui correspondent à un motif.', 'Une absence de résultat n\'est pas une preuve d\'absence : vérifiez le motif et la casse (-i).'],
  awk: ['Traite un fichier colonne par colonne.', 'Idéal pour extraire un champ ou faire une somme sur un journal structuré.'],
  sed: ['Transforme du texte à la volée (remplacer, supprimer, extraire).', 'Le fichier d\'origine n\'est modifié qu\'avec -i : ici, travaillez sur une copie.'],
  sort: ['Trie les lignes.', 'Avec -n le tri est numérique, avec -r il est inversé, avec -u les doublons disparaissent.'],
  uniq: ['Regroupe les lignes identiques consécutives.', 'Il faut trier avant : uniq -c compte alors les occurrences.'],
  cut: ['Extrait des colonnes d\'un texte.', 'Précisez le séparateur avec -d et le champ avec -f.'],
  tr: ['Remplace ou supprime des caractères.', 'Utile pour normaliser la casse ou les séparateurs.'],
  find: ['Cherche des fichiers selon des critères (nom, taille, date).', 'Les dates de modification (-mtime) aident à reconstituer une chronologie.'],
  diff: ['Compare deux fichiers ligne à ligne.', 'Une différence entre un état attendu et un état réel est un écart à qualifier.'],
  sha256sum: ['Calcule l\'empreinte SHA-256 d\'un fichier.', 'Deux fichiers identiques ont la même empreinte : c\'est la base de l\'intégrité d\'une preuve.'],
  cp: ['Copie un fichier.', 'Travaillez sur une copie pour conserver l\'original intact.'],
  mv: ['Déplace ou renomme.', 'Attention : sur une preuve, cela modifie son historique.'],
  mkdir: ['Crée un dossier.', 'Rangez vos preuves et rapports dans des dossiers dédiés.'],
  echo: ['Affiche un texte.', 'Avec > il écrit dans un fichier (en l\'écrasant), avec >> il ajoute à la fin.'],
  pwd: ['Affiche le dossier courant.', 'Vérifiez toujours où vous êtes avant d\'agir.'],
  cd: ['Change de dossier.', 'Sans argument, retour au dossier personnel.'],
  date: ['Affiche la date et l\'heure.', 'Horodatez vos observations.'],
  nano: ['Ouvre l\'éditeur de texte.', 'Enregistrez vos réponses puis validez le défi.'],
  base64: ['Encode ou décode en base64.', 'Ce n\'est pas du chiffrement : tout le monde peut le décoder.'],
  smbclient: ['Liste ou lit les partages de fichiers SMB (-N : sans mot de passe).', 'ACCESS_DENIED veut dire partage protégé ; un partage lisible sans mot de passe est un constat.'],
  snmpwalk: ['Parcourt les informations SNMP d\'un équipement (nom, modèle, firmware, contact).', 'SNMPv1/v2c : la « communauté » joue le rôle de mot de passe, en clair.'],
  snmpget: ['Lit une valeur SNMP précise (ex : sysContact.0).', 'Pas de réponse = communauté refusée ou service filtré.'],
  ping: ['Teste si un hôte répond (ICMP).', 'Un hôte qui ne répond pas n\'est pas forcément éteint : il peut filtrer le ping.'],
  host: ['Interroge le DNS pour un nom (adresse, messagerie…).', 'Un nom qui existe mais que personne ne gère est un actif oublié.'],
  dig: ['Interroge le DNS en détail (type d\'enregistrement, serveur, durée).', 'Avec +short, seule la valeur est affichée : pratique dans une boucle.'],
  nslookup: ['Interroge le DNS (outil historique).', 'Même information que host et dig, présentation différente.'],
  nmap: ['Sonde des hôtes et des ports du réseau fictif.', 'Un scan est bruyant : le pare-feu et le SOC le voient. -sn découvre les hôtes, -sV les versions, -p- tous les ports.'],
  curl: ['Envoie une requête HTTP et affiche la réponse.', '-I ne montre que les en-têtes ; une version précise ou un en-tête absent sont des constats.'],
  id: ['Affiche l\'identité et les groupes de l\'utilisateur.', 'Base de la lecture des droits.'],
};
const RC = { 0: 'La commande s\'est terminée sans erreur.', 1: 'Code 1 : en général « rien trouvé » (grep) ou échec simple. Ce n\'est pas toujours une erreur.', 2: 'Code 2 : erreur d\'usage (option inconnue, fichier introuvable, syntaxe).', 127: 'Code 127 : commande inconnue dans ce simulateur.' };
const stages = line => line.split(/\|(?!\|)/).map(s => s.trim().split(/\s+/)[0]).filter(Boolean).map(w => w.replace(/^.*\//, ''));
export function explain(line, rc, out) {
  const st = stages(line); const first = st[0] || ''; const lines = out.replace(/\x1b\[[0-9;]*m/g, '').split('\n').filter(l => l.trim()).length;
  const items = st.map(c => DOC[c] ? { cmd: c, what: DOC[c][0], tip: DOC[c][1] } : { cmd: c, what: 'Commande du simulateur ou script de l\'atelier.', tip: 'Lisez son résultat avant de poursuivre.' });
  const synth = st.length > 1 ? `Chaîne de ${st.length} étapes : chaque commande lit la sortie de la précédente (${st.join(' → ')}).` : '';
  const res = `${RC[rc] || `Code de retour ${rc}.`} ${lines ? `${lines} ligne(s) affichée(s).` : 'Aucune sortie.'}`;
  return { first, items, synth, res, rc };
}
export const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
