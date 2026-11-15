// Page « Lab complet » : guide d'installation sur une vraie machine (aucun serveur requis pour la lire).
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = (c, label) => `<div class="cb"><button class="btn ghost small copy" data-copy="${esc(c)}" aria-label="Copier ${esc(label || 'la commande')}">Copier</button><pre><code>${esc(c)}</code></pre></div>`;
const REPO = 'https://github.com/YahnLP/CyberLab.git';
export function render() {
  return `<nav class="crumbs" aria-label="Fil d'Ariane"><a href="#/">Parcours</a><span aria-hidden="true">›</span><span aria-current="page">Lab complet</span></nav>
<article class="lesson install"><p class="eyebrow">Laboratoire complet</p><h1>Installer le lab sur une vraie machine</h1>
<p>Le simulateur web réimplémente les commandes en JavaScript. Le <strong>laboratoire complet</strong> offre un vrai Linux (Debian) dans un conteneur : vrai <code>sshd</code>, vraies clés SSH générées par <code>ssh-keygen</code>… C'est le seul moyen de faire le <strong>défi 01 (incident SSH)</strong>. Les 18 défis y sont disponibles, avec la même correction automatique.</p>
<h2>Ce qu'il vous faut</h2>
<ul><li>Un ordinateur ou un serveur Linux, macOS ou Windows (avec WSL 2) pouvant faire tourner <strong>Docker</strong> (Docker Desktop ou Docker Engine) et <strong>Git</strong>.</li><li>Environ 1 Go d'espace disque, et 256 Mo de mémoire par stagiaire connecté (limite fixée dans <code>docker-compose.yml</code>).</li><li>Une connexion Internet pour la première construction (téléchargement de Debian et du terminal web <code>ttyd</code>).</li></ul>
<h2>1. Un seul poste (le plus simple)</h2>
<ol><li>Récupérez le dépôt :${code(`git clone ${REPO}\ncd CyberLab`, 'le clonage')}</li>
<li>Construisez et démarrez :${code('docker compose up --build', 'le démarrage')}</li>
<li>Ouvrez <strong>http://localhost:7681</strong> dans votre navigateur : vous obtenez un terminal Linux. Tapez <code>defi liste</code> puis <code>defi start 02</code>.</li></ol>
<p>Pour arrêter : <code>Ctrl+C</code>, puis <code>docker compose down</code>.</p>
<div class="callout"><strong>Sécurité.</strong> Le fichier fourni publie le port sur toutes les interfaces (<code>0.0.0.0:7681</code>) et le terminal est ouvert sans mot de passe. Pour un usage personnel, remplacez par <code>127.0.0.1:7681:7681</code> dans <code>docker-compose.yml</code>. N'exposez jamais ce port sur Internet sans protection (réseau de la salle, VPN ou proxy avec authentification).</div>
<h2>2. Sans navigateur : directement dans votre terminal</h2>
${code('docker build -t cyberlab:latest .\ndocker run -it --rm -e MODE=tty cyberlab:latest', 'le mode terminal')}
<p>Le mode <code>tty</code> ouvre un shell dans le conteneur, sans serveur web. La progression disparaît à l'arrêt (option <code>--rm</code>).</p>
<h2>3. Une salle de formation (un conteneur par stagiaire)</h2>
<p>Chaque stagiaire a son propre conteneur, donc ses propres données et sa propre progression. Exemple pour 12 stagiaires, ports 7681 à 7692 (à adapter à votre réseau) :</p>
${code('docker build -t cyberlab:latest .\nfor i in $(seq 1 12); do\n  docker run -d --name cyberlab-$i -p $((7680+i)):7681 -e MODE=web \\\n    --memory 256m --cpus 0.5 --pids-limit 256 \\\n    --security-opt no-new-privileges --restart unless-stopped cyberlab:latest\ndone', 'la boucle de conteneurs')}
<p>Chaque stagiaire ouvre <code>http://ADRESSE-DU-SERVEUR:768X</code> (son numéro). Pour tout supprimer : <code>docker rm -f $(docker ps -aq --filter name=cyberlab-)</code>.</p>
<h2>4. Vérifier que tout fonctionne</h2>
${code('bash tests/run-solution.sh        # rejoue tous les corrigés formateur\nbash tests/docker-integration.sh   # construit l\'image et teste dedans', 'les tests')}
<p>Le premier test demande <code>bash</code>, <code>gawk</code> et <code>openssh</code> sur la machine ; le second demande Docker. Le dossier <code>formateur/solutions/</code> (corrigés) n'est jamais copié dans l'image : ne le distribuez pas aux stagiaires.</p>
<h2>5. Mettre à jour</h2>
${code('git pull\ndocker compose up --build -d', 'la mise à jour')}
<h2>Aide-mémoire dans le conteneur</h2>
<ul><li><code>defi liste</code> : tous les défis · <code>defi start 05</code> : commencer · <code>defi enonce</code> : relire</li><li><code>defi indice</code> : un indice (-2 points) · <code>defi valider</code> : vérifier · <code>defi score</code> : progression</li></ul>
<p class="muted small">Tout le contenu est fictif et défensif : aucune cible réelle, aucun accès réseau externe n'est nécessaire pour les défis.</p>
<div class="nav2"><a class="btn" href="#/">Retour au parcours</a><a class="btn ghost" href="https://github.com/YahnLP/CyberLab" target="_blank" rel="noopener">Dépôt GitHub</a></div></article>`;
}
export function wire(root) {
  root.querySelectorAll('.copy').forEach(b => b.onclick = async () => { try { await Promise.race([navigator.clipboard.writeText(b.dataset.copy), new Promise((_, r) => setTimeout(r, 600))]); b.textContent = 'Copié'; } catch { const r = document.createRange(); r.selectNodeContents(b.nextElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Sélectionné'; } setTimeout(() => b.textContent = 'Copier', 1800); });
}
