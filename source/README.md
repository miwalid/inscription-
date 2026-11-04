# منصة تسجيل المتربصين

Application arabe autonome : inscriptions à plusieurs stages, justificatifs privés, validation, paiement intégral, présence, QR code, export Excel et impression PDF.

## Exécution

Node.js 22 ou supérieur. Copier `.env.example` vers `.env` et renseigner l'URL et la clé **publique** Supabase. Puis `npm ci`, `npm run dev`. `npm run build` génère le site statique dans `dist/`. Il peut être publié dans un sous-dossier GitHub Pages.

## Architecture

- Interface React et Supabase Auth : compte organisateur par e-mail et mot de passe ; les candidats n'ont pas de compte.
- Tables `training_admins`, `training_stages`, `training_applicants` protégées par RLS.
- Bucket privé `training-documents` ; accès temporaire aux documents réservé à l'organisateur.
- Fonction `training-registration` : formulaire public, vérification des informations et des justificatifs, absence de frais dans la réponse publique, blocage des doublons et nettoyage des fichiers en cas d'échec.
- La clé privilégiée reste exclusivement dans les variables du serveur Supabase.
- Chaque dossier conserve le montant applicable à son dépôt. Les paiements et la présence sont enregistrés séparément.

Le dossier `database/` décrit le schéma installé. Les migrations du projet Supabase constituent l'historique appliqué. La table `training_bootstrap` réserve l'activation initiale ; son secret n'est pas stocké dans ce dépôt. Aucun compte ChatGPT n'est nécessaire pour utiliser cette application.

## Utilisation

1. L'organisateur active son compte depuis le lien privé qui lui est remis, puis choisit son mot de passe.
2. Créer un stage, sélectionner les pièces et cocher celles qui sont obligatoires.
3. Partager son lien ou QR code avec les candidats.
4. Examiner les dossiers ; accepter ou refuser.
5. Enregistrer le paiement intégral pour confirmer l'inscription, puis la présence au stage.

Les exports respectent les filtres affichés. PDF utilise la fonction « Enregistrer au format PDF » du navigateur. Les justificatifs acceptés sont PDF, PNG, JPEG et WEBP, jusqu'à 5 MB par fichier et 25 MB par dossier.

## Suppression et droits des organisateurs

Chaque organisateur approuvé dispose de toutes les fonctions pour ses propres stages. La propriété est contrôlée par Supabase RLS pour les stages, les inscriptions et les justificatifs. Le stage existant est attribué à son organisateur actuel. Un autre compte organisateur ne voit pas ces dossiers. Les formulaires publics restent accessibles aux candidats par leurs liens de stage.

Le bouton « حذف » déplace une inscription vers « المحذوفة ». « استرجاع » permet de la restaurer. Les dossiers supprimés ne figurent plus dans les listes et totaux courants. Une réinscription active identique empêche la restauration pour éviter les doublons.

Pour une installation neuve, appliquer `database/schema.sql`, puis `database/organizer_scope_and_registration_trash.sql`. Le test SQL `tests/organizer_scope.sql` utilise une transaction annulée : il vérifie l’isolation réciproque de deux organisateurs, l’accès aux justificatifs, les écritures refusées, la suppression et la restauration.

## Présentation

La présentation validée utilise des cartes en nuances de vert, jaune et rouge, avec le logo circulaire fourni par l’organisation. Les cartes et les listes se réorganisent sur téléphone. Les valeurs affichées proviennent des stages et dossiers de l’organisateur connecté.

## Badges des participants

Le formulaire demande le sexe (ذكر / أنثى). Les dossiers antérieurs conservent une valeur non précisée : l’organisateur doit la renseigner et enregistrer le dossier avant de générer son badge. Aucune valeur n’est déduite du nom.

« البطاقة » ouvre une carte individuelle ; « بطاقات المشاركين » prépare les badges de la liste filtrée. Chaque badge mesure 85 × 120 mm en portrait et contient le prénom, le nom, le titre et les dates du stage ainsi que مدرب ou مدربة. La prévisualisation permet d’imprimer ou de sauvegarder en PDF, avec 4 badges par feuille A4 (2 colonnes et 2 lignes), au format individuel inchangé de 85 × 120 mm. Sélectionner une échelle de 100 %. Appliquer `database/registration_gender.sql` après les schémas précédents pour une installation neuve.

## Référence personnelle et accès direct au dossier

Appliquer `database/registration_personal_code.sql` après les migrations précédentes. Chaque inscription reçoit automatiquement un code unique de 12 caractères, présenté en trois groupes. Les anciens dossiers reçoivent aussi un code. La réponse de dépôt ne renvoie que la confirmation et ce code ; le candidat est invité à le conserver.

L’organisateur connecté saisit ce code dans « فتح ملف بالرمز الشخصي ». La recherche est exacte, tolère les minuscules, les espaces et les tirets, exclut les dossiers supprimés et reste soumise aux règles de propriété Supabase. Le code ne donne aucun accès public et n’accepte pas automatiquement le candidat : le dossier s’ouvre pour examen, décision et enregistrement du paiement selon le fonctionnement existant.

Les documents non obligatoires restent disponibles sans la mention « اختياري ». Les documents obligatoires gardent la mention « إجباري » et la validation de leur présence. Pour les badges, sélectionner A4 portrait, 100 %, sans en-tête ni pied de page ; le dernier feuillet peut contenir moins de 4 badges.

## Trois modèles avec photo

La fenêtre des badges propose 1 · أنيق, 2 · عصري, 3 · بسيط. Le choix, mémorisé sur l’appareil, s’applique à l’aperçu et à toute la série imprimée. Le logo et les informations restent du texte et des éléments HTML/CSS : les maquettes illustrées ne sont pas utilisées comme fonds contenant de fausses données.

La photo récente/personnelle jointe au formulaire est reconnue. Si le stage ne demande aucune photo, un champ séparé permet de joindre une photo pour le badge. L’organisateur peut choisir une image déjà jointe ou ajouter une photo pour un ancien dossier depuis la fenêtre des badges. JPG, PNG et WEBP, 5 MB maximum ; pas de PDF comme portrait. La nouvelle photo est conservée sans supprimer les anciens justificatifs (15 documents maximum).

Les images restent dans le bucket privé. Le chargement utilise l’accès authentifié soumis à RLS, avec des URL blob temporaires révoquées à la fermeture. Le point d’entrée serveur `mode=badge-photo` vérifie le compte approuvé, la propriété du stage et l’absence de suppression avant de choisir ou joindre une photo. Une comparaison des documents empêche de remplacer une modification simultanée. L’impression attend le chargement de toutes les photos ; les cartes sans photo doivent être complétées. Le format reste 85 × 120 mm et 4 badges par feuille A4.

## Placement des badges sur A4

L’aperçu « معاينة ورقة A4 » montre la feuille complète utilisée pour l’impression. Les quatre badges de 85 × 120 mm sont centrés : marges gauche/droite de 15 mm, haut/bas de 23,5 mm, intervalles horizontaux/verticaux de 10 mm. Une feuille incomplète conserve les mêmes emplacements. Cliquer une carte de la feuille sélectionne son participant ; l’aperçu individuel reste disponible.

Pendant l’ouverture de la fenêtre des badges, une règle temporaire définit aussi la page par défaut en A4 portrait sans marges CSS supplémentaires. Cela évite l’interférence de la règle A4 paysage des listes, y compris dans les navigateurs ignorant les pages nommées. La fermeture rétablit les réglages des listes. Les marges de sécurité sont incluses dans la feuille elle-même. Dans le dialogue d’impression : A4 portrait, 100 %, une page par feuille, sans en-tête ni pied de page.

La zone d’impression masque aussi le conteneur complet de l’interface afin de ne pas générer une première page blanche. Les cartes des pages suivantes ne sont pas découpées par un masque de la feuille.
