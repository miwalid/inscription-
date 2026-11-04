# منصة تسجيل المشاركين

Application arabe autonome : inscriptions à plusieurs stages, justificatifs privés, validation, paiement intégral, QR code, export Excel et impression PDF.

## Exécution

Node.js 22 ou supérieur. Copier `.env.example` vers `.env` et renseigner l'URL et la clé **publique** Supabase. Puis `npm ci`, `npm run dev`. `npm run build` génère le site statique dans `dist/`. Il peut être publié dans un sous-dossier GitHub Pages.

## Architecture

- Interface React et Supabase Auth : compte organisateur par e-mail et mot de passe ; les candidats n'ont pas de compte.
- Tables `training_admins`, `training_stages`, `training_applicants` protégées par RLS.
- Bucket privé `training-documents` ; accès temporaire aux documents réservé à l'organisateur.
- Fonction `training-registration` : formulaire public, vérification des informations et des justificatifs, absence de frais dans la réponse publique, blocage des doublons et nettoyage des fichiers en cas d'échec.
- La clé privilégiée reste exclusivement dans les variables du serveur Supabase.
- Chaque dossier conserve le montant applicable à son dépôt. Les paiements sont enregistrés par l’organisateur.

Le dossier `database/` décrit le schéma installé. Les migrations du projet Supabase constituent l'historique appliqué. La table `training_bootstrap` réserve l'activation initiale ; son secret n'est pas stocké dans ce dépôt. Aucun compte ChatGPT n'est nécessaire pour utiliser cette application.

## Utilisation

1. L'organisateur active son compte depuis le lien privé qui lui est remis, puis choisit son mot de passe.
2. Créer un stage, sélectionner les pièces et cocher celles qui sont obligatoires.
3. Partager son lien ou QR code avec les candidats.
4. Examiner les dossiers ; accepter ou refuser.
5. Enregistrer le paiement intégral pour confirmer l'inscription.

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

## Responsables et ateliers

La rubrique « المسؤولون » permet à l’organisateur de gérer, pour chacun de ses stages, les noms et prénoms, la photo et l’atelier animé des responsables. Les fiches rappellent le titre, la description, le lieu et les dates du stage. Recherche, filtre par stage, modification et suppression réversible sont disponibles. La rubrique ne crée pas de compte de connexion pour les responsables et n’affecte pas les dossiers ou paiements des participants.

Appliquer `database/training_staff.sql` après les migrations précédentes. La table `training_staff` et le bucket privé `training-staff-photos` limitent les lectures et écritures au propriétaire approuvé du stage par RLS. Les photos JPG/PNG/WEBP de 5 MB maximum sont privées ; chaque nouveau fichier reçoit un chemin propre au responsable. Le changement de photo conserve les anciennes images, et la suppression réversible masque leurs téléchargements jusqu’à restauration.

« بطاقات المسؤولين » propose quatre designs exclusifs : الشريط، الإطار، التباين، العمودي. Ils portent la mention « فريق التأطير », la photo, le nom, l’atelier et les informations du stage. Leur préférence est mémorisée séparément de celle des trois modèles des participants. Aperçus individuel/A4 et impression 4 par feuille, 85 × 120 mm, A4 portrait 100 %, une page par feuille, sans en-tête ni pied de page. `tests/staff_scope.sql` vérifie les deux propriétaires, les fichiers privés, les écritures refusées, la suppression/restauration et l’absence d’accès anonyme dans une transaction annulée.

## Terminologie et suivi

L’application utilise « participants » / « المشاركون » dans son titre, ses listes et ses exports. La rubrique, les filtres, les champs et les colonnes de présence au stage sont retirés, y compris des exports PDF et Excel. Les documents scolaires demandés pour une inscription restent configurables par stage.

## Reçu avec QR personnel

Après un dépôt réussi, le participant reçoit son code personnel en texte sélectionnable avec le bouton « نسخ الرمز », ainsi qu’un QR téléchargeable. Les deux représentent la même référence de dossier. Le QR ouvre l’application avec cette référence ; l’organisateur doit se connecter et ne peut ouvrir que les dossiers de ses propres stages. Une fois connecté, le dossier s’ouvre automatiquement pour consultation et validation manuelle. Aucun nom, numéro de téléphone ou justificatif n’est encodé dans le QR ; les droits Supabase restent inchangés. Le QR est généré localement, sans service tiers.

Depuis un dossier existant, « عرض رمز المشارك و QR » retrouve également ces deux formats et permet de télécharger le QR sans refaire l’inscription.
